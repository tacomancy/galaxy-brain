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

import yaml


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
TUTORIAL_HEADINGS = (
    "Goal",
    "Prerequisites",
    "Steps",
    "Expected result",
    "Troubleshooting",
)


def read_tutorial_metadata(content: str, source: str) -> dict[str, object]:
    frontmatter = re.match(r"\A---\n(.*?)\n---\n", content, re.DOTALL)
    if frontmatter is None:
        raise ValueError(f"Tutorial is missing YAML frontmatter: {source}")

    metadata = yaml.safe_load(frontmatter.group(1))
    if not isinstance(metadata, dict):
        raise ValueError(f"Tutorial frontmatter must be a mapping: {source}")

    required = ("title", "summary", "audience", "prerequisites", "nav_order")
    missing = [field for field in required if field not in metadata]
    if missing:
        raise ValueError(
            f"Tutorial metadata is missing {', '.join(missing)}: {source}"
        )

    for field in ("title", "summary", "audience"):
        if not isinstance(metadata[field], str) or not metadata[field].strip():
            raise ValueError(f"Tutorial metadata field {field} must be non-empty: {source}")

    prerequisites = metadata["prerequisites"]
    if not isinstance(prerequisites, list) or not all(
        isinstance(item, str) and item.strip() for item in prerequisites
    ):
        raise ValueError(
            f"Tutorial metadata field prerequisites must be a list of strings: {source}"
        )

    nav_order = metadata["nav_order"]
    if isinstance(nav_order, bool) or not isinstance(nav_order, int) or nav_order < 0:
        raise ValueError(
            f"Tutorial metadata field nav_order must be a non-negative integer: {source}"
        )

    return metadata


def validate_tutorial_content(page: dict[str, object], content: str) -> None:
    source = str(page["source"])
    metadata = read_tutorial_metadata(content, source)
    if page["kind"] != "tutorial":
        return

    headings = re.findall(r"^##\s+(.+?)\s*$", content, re.MULTILINE)
    positions: list[int] = []
    for heading in TUTORIAL_HEADINGS:
        if headings.count(heading) != 1:
            raise ValueError(
                f"Tutorial must contain one '## {heading}' heading: {source}"
            )
        positions.append(headings.index(heading))
    if positions != sorted(positions):
        raise ValueError(
            "Tutorial headings must appear in the order Goal, Prerequisites, "
            f"Steps, Expected result, Troubleshooting: {source}"
        )

    if metadata["nav_order"] == 0:
        raise ValueError(f"Task tutorial nav_order must be greater than zero: {source}")


def validate_tutorial_index(
    index_content: str, tutorials: list[dict[str, object]]
) -> None:
    for tutorial in tutorials:
        source = str(tutorial["source"])
        filename = PurePosixPath(source).name
        if f"]({filename})" not in index_content:
            raise ValueError(f"Tutorial index does not link to {source}")


def validate_manifest_entries(
    entries: object, kind: str
) -> list[dict[str, object]]:
    if not isinstance(entries, list) or not entries:
        raise ValueError(f"The public documentation manifest must contain {kind}.")

    normalized: list[dict[str, object]] = []
    for page in entries:
        if not isinstance(page, dict):
            raise ValueError(f"Each public {kind} must be an object.")
        source = page.get("source")
        destination = page.get("destination")
        if not isinstance(source, str) or not isinstance(destination, str):
            raise ValueError(f"Each public {kind} needs string source and destination.")
        entry_kind = kind
        if kind == "tutorial":
            entry_kind = page.get("kind")
            if entry_kind not in {"index", "tutorial"}:
                raise ValueError(
                    "Each tutorial must declare kind 'index' or 'tutorial'."
                )
        manifest_path(destination, "destination")
        source_path = manifest_path(source, "source")
        if not source_path.is_file():
            raise ValueError(f"Public documentation source does not exist: {source}")
        normalized.append(
            {"source": source, "destination": destination, "kind": entry_kind}
        )
    return normalized


def load_manifest() -> list[dict[str, object]]:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    pages = validate_manifest_entries(manifest.get("pages"), "page")
    tutorials = validate_manifest_entries(manifest.get("tutorials"), "tutorial")
    destinations: set[str] = set()
    for page in [*pages, *tutorials]:
        destination = str(page["destination"])
        if destination in destinations:
            raise ValueError(f"Duplicate public documentation destination: {destination}")
        destinations.add(destination)

    index_pages = [
        page for page in tutorials if page["destination"] == "tutorials/index.md"
    ]
    if len(index_pages) != 1:
        raise ValueError("The tutorial manifest must contain exactly one tutorials/index.md.")

    task_tutorials = [page for page in tutorials if page["kind"] == "tutorial"]
    tutorial_orders: list[int] = []
    index_source = REPOSITORY_ROOT / str(index_pages[0]["source"])
    index_content = index_source.read_text(encoding="utf-8")
    validate_tutorial_index(index_content, task_tutorials)
    for tutorial in task_tutorials:
        source = str(tutorial["source"])
        content = (REPOSITORY_ROOT / source).read_text(encoding="utf-8")
        validate_tutorial_content(tutorial, content)
        metadata = read_tutorial_metadata(content, source)
        tutorial_orders.append(int(metadata["nav_order"]))

    index_content_metadata = index_source.read_text(encoding="utf-8")
    validate_tutorial_content(index_pages[0], index_content_metadata)
    if tutorial_orders != list(range(1, len(task_tutorials) + 1)):
        raise ValueError("Tutorial nav_order values must be consecutive starting at 1.")

    normalized = [*pages, *tutorials]
    return normalized


def manifest_path(value: str, kind: str) -> Path:
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise ValueError(f"Public documentation {kind} must be a relative path: {value}")
    resolved = (REPOSITORY_ROOT / Path(*path.parts)).resolve()
    if REPOSITORY_ROOT not in resolved.parents:
        raise ValueError(f"Public documentation {kind} escapes the repository: {value}")
    if kind == "source" and (REPOSITORY_ROOT / Path(*path.parts)).is_symlink():
        raise ValueError(f"Public documentation source must not be a symlink: {value}")
    return REPOSITORY_ROOT / Path(*path.parts)


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
            linked_path = manifest_path(resolved_source.as_posix(), "link target")
            if not linked_path.is_file():
                raise ValueError(
                    f"Unresolved relative public documentation link in {source}: {target}"
                )
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


def stage_sources(pages: list[dict[str, object]]) -> None:
    shutil.rmtree(STAGING_ROOT, ignore_errors=True)
    STAGING_ROOT.mkdir(parents=True)
    source_to_destination = {
        str(page["source"]): str(page["destination"]) for page in pages
    }

    for page in pages:
        source = str(page["source"])
        destination = str(page["destination"])
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
    generated_root = (REPOSITORY_ROOT / ".generated").resolve()
    expected_output = generated_root / "public-site"
    if output == REPOSITORY_ROOT or output == generated_root:
        raise ValueError("The public site output must be an artifact directory.")
    if output.exists() and output != expected_output:
        raise ValueError(
            "Refusing to replace an existing output outside .generated/public-site."
        )
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


def validate_site(output: Path, pages: list[dict[str, object]]) -> None:
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

    expected_pages = {
        output_path_for_page(str(page["destination"])) for page in pages
    }
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
