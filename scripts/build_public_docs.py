#!/usr/bin/env python3
"""Build and validate the curated MkDocs site artifact."""

from __future__ import annotations

import argparse
import json
import os
import posixpath
import re
import shutil
import subprocess
from pathlib import Path, PurePosixPath
from urllib.parse import urldefrag, urlparse


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPOSITORY_ROOT / "docs-site" / "site-manifest.json"
MKDOCS_CONFIG = REPOSITORY_ROOT / "docs-site" / "mkdocs.yml"
STAGING_ROOT = REPOSITORY_ROOT / ".generated" / "public-docs"

FORBIDDEN_PATH_PARTS = {
    ".git",
    "agents",
    "coverage",
    "fixtures",
    "node_modules",
    "out",
    "proposals",
    "reviews",
    "tests",
}
FORBIDDEN_TEXT = (
    "docs/agents/",
    "docs/proposals/",
    "docs/reviews/",
    "tests/fixtures/",
    "node_modules/",
)
SECRET_PATTERNS = (
    re.compile(r"(?:sk|rk)-[A-Za-z0-9_-]{20,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
)
MARKDOWN_LINK_PATTERN = re.compile(r"(!?)\[([^\]]*)\]\(([^)]+)\)")
HTML_LINK_PATTERN = re.compile(r"(?:href|src)=\"([^\"]+)\"")


def load_manifest() -> list[dict[str, str]]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    pages = manifest.get("pages")
    if not isinstance(pages, list) or not pages:
        raise ValueError("The public documentation manifest must contain pages.")

    normalized: list[dict[str, str]] = []
    destinations: set[str] = set()
    for page in pages:
        if not isinstance(page, dict):
            raise ValueError("Each public documentation page must be an object.")
        source = page.get("source")
        destination = page.get("destination")
        if not isinstance(source, str) or not isinstance(destination, str):
            raise ValueError("Each public page needs string source and destination.")
        if destination in destinations:
            raise ValueError(f"Duplicate public documentation destination: {destination}")
        destinations.add(destination)
        source_path = REPOSITORY_ROOT / source
        if not source_path.is_file():
            raise ValueError(f"Public documentation source does not exist: {source}")
        normalized.append({"source": source, "destination": destination})
    return normalized


def rewrite_links(
    content: str,
    source: str,
    destination: str,
    source_to_destination: dict[str, str],
) -> str:
    source_path = PurePosixPath(source)
    destination_path = PurePosixPath(destination)

    def replace(match: re.Match[str]) -> str:
        marker, label, target = match.groups()
        target_without_fragment, fragment = urldefrag(target)
        parsed = urlparse(target_without_fragment)
        if (
            not target_without_fragment
            or parsed.scheme
            or target_without_fragment.startswith(("#", "/"))
        ):
            return match.group(0)

        resolved_source = PurePosixPath(
            posixpath.normpath(
                posixpath.join(source_path.parent.as_posix(), target_without_fragment)
            )
        )
        mapped_destination = source_to_destination.get(resolved_source.as_posix())
        if mapped_destination is None:
            return label

        rewritten = posixpath.relpath(
            mapped_destination,
            start=destination_path.parent.as_posix(),
        )
        return (
            f"{marker}[{label}]({rewritten}#{fragment})"
            if fragment
            else f"{marker}[{label}]({rewritten})"
        )

    return MARKDOWN_LINK_PATTERN.sub(replace, content)


def stage_sources(pages: list[dict[str, str]]) -> None:
    shutil.rmtree(STAGING_ROOT, ignore_errors=True)
    STAGING_ROOT.mkdir(parents=True)
    source_to_destination = {page["source"]: page["destination"] for page in pages}

    for page in pages:
        source = page["source"]
        destination = page["destination"]
        content = (REPOSITORY_ROOT / source).read_text(encoding="utf-8")
        rewritten = rewrite_links(
            content,
            source,
            destination,
            source_to_destination,
        )
        destination_path = STAGING_ROOT / destination
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        destination_path.write_text(rewritten, encoding="utf-8")


def build_site(output: Path) -> None:
    output = output.resolve()
    if output == REPOSITORY_ROOT or output == REPOSITORY_ROOT / ".generated":
        raise ValueError("The public site output must be an artifact directory.")
    shutil.rmtree(output, ignore_errors=True)
    output.parent.mkdir(parents=True, exist_ok=True)
    environment = os.environ.copy()
    environment["NO_MKDOCS_2_WARNING"] = "1"
    subprocess.run(
        [
            "mkdocs",
            "build",
            "--strict",
            "--config-file",
            str(MKDOCS_CONFIG),
            "--site-dir",
            str(output),
        ],
        cwd=REPOSITORY_ROOT,
        env=environment,
        check=True,
    )


def strip_source_maps(output: Path) -> None:
    for source_map in output.rglob("*.map"):
        source_map.unlink()
    source_map_reference = re.compile(
        r"(?:\n?//# sourceMappingURL=.*|/\*# sourceMappingURL=.*\*/)$"
    )
    for asset in output.rglob("*"):
        if asset.suffix not in {".css", ".js"}:
            continue
        content = asset.read_text(encoding="utf-8")
        asset.write_text(source_map_reference.sub("", content), encoding="utf-8")


def output_path_for_page(destination: str) -> Path:
    destination_path = Path(destination)
    if destination_path.name == "index.md":
        return Path("index.html")
    return destination_path.with_suffix("") / "index.html"


def validate_site(output: Path, pages: list[dict[str, str]]) -> None:
    files = [path for path in output.rglob("*") if path.is_file()]
    if not files:
        raise ValueError("The public documentation build produced no files.")

    for path in files:
        if path.is_symlink():
            raise ValueError(f"The public documentation site contains a symlink: {path}")
        if FORBIDDEN_PATH_PARTS.intersection(path.relative_to(output).parts):
            raise ValueError(f"Forbidden content was emitted: {path.relative_to(output)}")
        if path.suffix in {".map", ".pyc"}:
            raise ValueError(f"Generated artifact was emitted: {path.relative_to(output)}")

        try:
            text = path.read_text(encoding="utf-8", errors="strict")
        except UnicodeDecodeError:
            continue
        emitted_links = HTML_LINK_PATTERN.findall(text)
        if any(
            marker in target
            for target in emitted_links
            for marker in FORBIDDEN_TEXT
        ):
            raise ValueError(f"Forbidden repository link was emitted: {path.relative_to(output)}")
        if any(pattern.search(text) for pattern in SECRET_PATTERNS):
            raise ValueError(f"Possible secret was emitted: {path.relative_to(output)}")

    expected_pages = {output_path_for_page(page["destination"]) for page in pages}
    actual_pages = {path.relative_to(output) for path in files if path.suffix == ".html"}
    missing = expected_pages - actual_pages
    if missing:
        raise ValueError(f"Required public pages are missing: {sorted(map(str, missing))}")

    index = (output / "index.html").read_text(encoding="utf-8")
    if "Galaxy Brain" not in index or "Knowledge Workbench" not in index:
        raise ValueError("The public site index is missing required headings.")
    rendered_html = "\n".join(
        path.read_text(encoding="utf-8") for path in files if path.suffix == ".html"
    )
    if 'class="mermaid"' not in rendered_html:
        raise ValueError("The public site contains no rendered Mermaid diagram.")

    for page in files:
        if page.suffix != ".html":
            continue
        page_text = page.read_text(encoding="utf-8")
        for link in HTML_LINK_PATTERN.findall(page_text):
            target, _fragment = urldefrag(link)
            parsed = urlparse(target)
            if not target or parsed.scheme or target.startswith(("/", "#")):
                continue
            resolved = (page.parent / target).resolve()
            if target in {".", "./"}:
                resolved = output / "index.html"
            elif target.endswith("/"):
                resolved = resolved / "index.html"
            elif resolved.is_dir():
                resolved = resolved / "index.html"
            if not resolved.is_file() or output not in resolved.parents:
                raise ValueError(f"Broken public link in {page.relative_to(output)}: {link}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Validate an existing site artifact without rebuilding it.",
    )
    args = parser.parse_args()

    pages = load_manifest()
    if not args.validate_only:
        stage_sources(pages)
        build_site(args.output)
        strip_source_maps(args.output.resolve())
    validate_site(args.output.resolve(), pages)
    action = "Validated" if args.validate_only else "Built and validated"
    print(f"{action} public documentation at {args.output.resolve()}")


if __name__ == "__main__":
    main()
