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
RELEASE_VERSION_PATTERN = r"\d+\.\d+\.\d+"
CHANGELOG_VERSION_PATTERN = re.compile(
    rf"^##\s+\[(?P<version>{RELEASE_VERSION_PATTERN})\]",
    re.MULTILINE,
)
SECURITY_VERSION_PATTERN = re.compile(
    rf"^\|\s*Latest published release\s+\(`(?P<version>{RELEASE_VERSION_PATTERN})`\)\s*\|\s*Yes\s*\|\s*(?:<!--\s*x-release-please-version\s*-->)?\s*$",
    re.MULTILINE,
)
CURRENT_CAPABILITIES_SOURCE = "docs-site/current-capabilities.md"
CURRENT_CAPABILITIES_SUPPORT_CLASSES = (
    "Desktop-supported",
    "Module-only",
    "Planned",
)
TUTORIAL_RELEASE_VERSION_PATTERN = re.compile(rf"^{RELEASE_VERSION_PATTERN}$")
TUTORIAL_COMMIT_PATTERN = re.compile(r"^[0-9a-f]{7,40}$")
TUTORIAL_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TUTORIAL_REPOSITORY_STATES = {
    "empty_starter",
    "prepopulated_repository",
    "synthetic_fixture",
}
TUTORIAL_ADAPTER_BOUNDARY_KEYS = {"production", "fixture"}
TUTORIAL_ADAPTER_BOUNDARY_STATES = {
    "not_applicable",
    "not_composed",
    "not_used",
    "used",
    "unavailable",
}
TUTORIAL_EVIDENCE_PATH = REPOSITORY_ROOT / "docs-site" / "tutorial-evidence.json"
TUTORIAL_EVIDENCE_KINDS = {
    "packaged_workflow",
    "module_contract",
    "manual_acceptance",
}
TUTORIAL_SUPPORT_CLASSES = set(CURRENT_CAPABILITIES_SUPPORT_CLASSES)


def validate_release_alignment(
    package_content: str,
    changelog_content: str,
    security_content: str,
) -> str:
    try:
        package_document = json.loads(package_content)
    except json.JSONDecodeError as error:
        raise ValueError("app/package.json is not valid JSON") from error
    package_version = package_document.get("version")
    if not isinstance(package_version, str) or not package_version:
        raise ValueError("app/package.json does not declare a version")

    changelog_match = CHANGELOG_VERSION_PATTERN.search(changelog_content)
    if changelog_match is None:
        raise ValueError("app/CHANGELOG.md does not declare a latest release")
    # The changelog keeps the newest published entry first; the pattern skips
    # an optional Unreleased heading because it requires a semantic version.
    changelog_version = changelog_match.group("version")

    security_matches = list(SECURITY_VERSION_PATTERN.finditer(security_content))
    if len(security_matches) != 1:
        raise ValueError(
            "SECURITY.md must identify the supported latest published release"
        )
    security_version = security_matches[0].group("version")

    if package_version != changelog_version:
        raise ValueError(
            "Release version mismatch: app/package.json reports "
            f"{package_version}, but app/CHANGELOG.md reports {changelog_version}"
        )
    if security_version != changelog_version:
        raise ValueError(
            "Release version mismatch: SECURITY.md reports "
            f"{security_version}, but app/CHANGELOG.md reports {changelog_version}"
        )

    return changelog_version


def validate_current_capabilities(content: str, latest_release: str) -> None:
    frontmatter = re.match(r"\A---\n(.*?)\n---\n", content, re.DOTALL)
    if frontmatter is None:
        raise ValueError(
            "Current capabilities page is missing YAML frontmatter: "
            f"{CURRENT_CAPABILITIES_SOURCE}"
        )

    metadata = yaml.safe_load(frontmatter.group(1))
    if not isinstance(metadata, dict):
        raise ValueError(
            "Current capabilities frontmatter must be a mapping: "
            f"{CURRENT_CAPABILITIES_SOURCE}"
        )

    required = (
        "title",
        "summary",
        "applies_to_release",
        "tracks_main",
        "verified_commit",
        "reviewed_on",
    )
    missing = [field for field in required if field not in metadata]
    if missing:
        raise ValueError(
            "Current capabilities metadata is missing "
            f"{', '.join(missing)}: {CURRENT_CAPABILITIES_SOURCE}"
        )

    for field in ("title", "summary"):
        if not isinstance(metadata[field], str) or not metadata[field].strip():
            raise ValueError(
                "Current capabilities metadata field "
                f"{field} must be non-empty: {CURRENT_CAPABILITIES_SOURCE}"
            )

    if metadata["applies_to_release"] != latest_release:
        raise ValueError(
            "Current capabilities applies_to_release must match the latest "
            f"published release {latest_release}: {CURRENT_CAPABILITIES_SOURCE}"
        )
    if metadata["tracks_main"] is not True:
        raise ValueError(
            "Current capabilities tracks_main must be true: "
            f"{CURRENT_CAPABILITIES_SOURCE}"
        )

    verified_commit = metadata["verified_commit"]
    if not isinstance(verified_commit, str) or not re.fullmatch(
        r"[0-9a-f]{7,40}", verified_commit
    ):
        raise ValueError(
            "Current capabilities verified_commit must be a hexadecimal Git "
            f"commit: {CURRENT_CAPABILITIES_SOURCE}"
        )

    reviewed_on = metadata["reviewed_on"]
    if not isinstance(reviewed_on, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}", reviewed_on
    ):
        raise ValueError(
            "Current capabilities reviewed_on must be an ISO date: "
            f"{CURRENT_CAPABILITIES_SOURCE}"
        )

    required_headings = (
        f"## Latest published release: {latest_release}",
        "## Current `main` snapshot",
        "## Planned capabilities and known limits",
    )
    missing_headings = [heading for heading in required_headings if heading not in content]
    if missing_headings:
        raise ValueError(
            "Current capabilities page is missing required sections "
            f"{', '.join(missing_headings)}: {CURRENT_CAPABILITIES_SOURCE}"
        )

    missing_classes = [
        support_class
        for support_class in CURRENT_CAPABILITIES_SUPPORT_CLASSES
        if not re.search(rf"\b{re.escape(support_class)}\b", content)
    ]
    if missing_classes:
        raise ValueError(
            "Current capabilities page must name all support classes "
            f"{', '.join(missing_classes)}: {CURRENT_CAPABILITIES_SOURCE}"
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


def validate_task_tutorial_metadata(
    metadata: dict[str, object], source: str, latest_release: str | None = None
) -> None:
    applies_to_release = metadata.get("applies_to_release")
    tracks_main = metadata.get("tracks_main")
    if applies_to_release is None and tracks_main is not True:
        raise ValueError(
            "Tutorial metadata must declare tracks_main or applies_to_release: "
            f"{source}"
        )
    if applies_to_release is not None and (
        not isinstance(applies_to_release, str)
        or not TUTORIAL_RELEASE_VERSION_PATTERN.fullmatch(applies_to_release)
    ):
        raise ValueError(
            "Tutorial metadata field applies_to_release must be a semantic "
            f"version: {source}"
        )
    if latest_release is not None and applies_to_release not in {
        None,
        latest_release,
    }:
        raise ValueError(
            "Tutorial applies_to_release must match the latest published "
            f"release {latest_release}: {source}"
        )
    if tracks_main is not None and not isinstance(tracks_main, bool):
        raise ValueError(
            f"Tutorial metadata field tracks_main must be boolean: {source}"
        )

    verified_commit = metadata.get("verified_commit")
    reviewed_on = metadata.get("reviewed_on")
    if verified_commit is None and reviewed_on is None:
        raise ValueError(
            "Tutorial metadata must include verified_commit and/or reviewed_on: "
            f"{source}"
        )
    if verified_commit is not None and (
        not isinstance(verified_commit, str)
        or not TUTORIAL_COMMIT_PATTERN.fullmatch(verified_commit)
    ):
        raise ValueError(
            "Tutorial metadata field verified_commit must be a hexadecimal Git "
            f"commit: {source}"
        )
    if reviewed_on is not None and (
        not isinstance(reviewed_on, str)
        or not TUTORIAL_DATE_PATTERN.fullmatch(reviewed_on)
    ):
        raise ValueError(
            f"Tutorial metadata field reviewed_on must be an ISO date: {source}"
        )

    for field in ("supported_platforms", "supported_packages"):
        values = metadata.get(field)
        if not isinstance(values, list) or not values or not all(
            isinstance(item, str) and item.strip() for item in values
        ):
            raise ValueError(
                f"Tutorial metadata field {field} must be a non-empty list of "
                f"strings: {source}"
            )

    repository_states = metadata.get("repository_states")
    if not isinstance(repository_states, list) or not repository_states or not all(
        isinstance(item, str) and item in TUTORIAL_REPOSITORY_STATES
        for item in repository_states
    ):
        allowed = ", ".join(sorted(TUTORIAL_REPOSITORY_STATES))
        raise ValueError(
            "Tutorial metadata field repository_states must be a non-empty list "
            f"using {allowed}: {source}"
        )

    adapter_boundary = metadata.get("adapter_boundary")
    if not isinstance(adapter_boundary, dict) or set(adapter_boundary) != (
        TUTORIAL_ADAPTER_BOUNDARY_KEYS
    ):
        raise ValueError(
            "Tutorial metadata field adapter_boundary must classify production "
            f"and fixture adapters: {source}"
        )
    if not all(
        isinstance(value, str) and value in TUTORIAL_ADAPTER_BOUNDARY_STATES
        for value in adapter_boundary.values()
    ):
        allowed = ", ".join(sorted(TUTORIAL_ADAPTER_BOUNDARY_STATES))
        raise ValueError(
            "Tutorial adapter_boundary values must use "
            f"{allowed}: {source}"
        )


def validate_tutorial_content(
    page: dict[str, object], content: str, latest_release: str | None = None
) -> None:
    source = str(page["source"])
    metadata = read_tutorial_metadata(content, source)
    if page["kind"] != "tutorial":
        return
    validate_task_tutorial_metadata(metadata, source, latest_release)

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


def validate_tutorial_evidence(
    tutorials: list[dict[str, object]],
    tutorial_contents: dict[str, str],
    evidence_document: object,
) -> None:
    if not isinstance(evidence_document, dict):
        raise ValueError("Tutorial evidence must be a JSON object.")
    if evidence_document.get("schema_version") != 1:
        raise ValueError("Tutorial evidence schema_version must be 1.")

    mappings = evidence_document.get("tutorials")
    if not isinstance(mappings, dict):
        raise ValueError("Tutorial evidence must contain a tutorials object.")

    tutorial_sources = {str(tutorial["source"]) for tutorial in tutorials}
    mapping_sources = set(mappings)
    missing = sorted(tutorial_sources - mapping_sources)
    if missing:
        raise ValueError(
            "Tutorial evidence mapping is missing " + ", ".join(missing)
        )
    unexpected = sorted(mapping_sources - tutorial_sources)
    if unexpected:
        raise ValueError(
            "Tutorial evidence mapping contains unexpected "
            + ", ".join(unexpected)
        )

    for source in sorted(tutorial_sources):
        mapping = mappings[source]
        if not isinstance(mapping, dict):
            raise ValueError(f"Tutorial evidence mapping must be an object: {source}")
        evidence = mapping.get("evidence")
        if not isinstance(evidence, list) or not evidence:
            raise ValueError(f"Tutorial evidence is empty: {source}")

        evidence_texts: list[str] = []
        evidence_sources: list[str] = []
        for item in evidence:
            if not isinstance(item, dict):
                raise ValueError(f"Tutorial evidence entry must be an object: {source}")
            kind = item.get("kind")
            evidence_source = item.get("source")
            story = item.get("story")
            support_class = item.get("support_class")
            if kind not in TUTORIAL_EVIDENCE_KINDS:
                allowed = ", ".join(sorted(TUTORIAL_EVIDENCE_KINDS))
                raise ValueError(
                    f"Tutorial evidence kind must use {allowed}: {source}"
                )
            if not isinstance(evidence_source, str):
                raise ValueError(
                    f"Tutorial evidence source must be a string: {source}"
                )
            if not isinstance(story, str) or not story.strip():
                raise ValueError(
                    f"Tutorial evidence story must be non-empty: {source}"
                )
            if support_class not in TUTORIAL_SUPPORT_CLASSES:
                raise ValueError(
                    "Tutorial evidence support_class must be one of "
                    f"{', '.join(sorted(TUTORIAL_SUPPORT_CLASSES))}: {source}"
                )
            if kind == "packaged_workflow" and not (
                evidence_source.startswith("app/tests/workflows/")
                and evidence_source.endswith(".e2e.ts")
            ):
                raise ValueError(
                    "Packaged workflow evidence must come from app/tests/workflows: "
                    f"{source}"
                )
            if kind == "module_contract" and support_class == "Desktop-supported":
                raise ValueError(
                    "Module-only evidence cannot be classified desktop-supported: "
                    f"{source}"
                )
            if kind == "module_contract" and not (
                evidence_source.startswith("app/src/modules/")
                or evidence_source.startswith("app/src/adapters/")
                or evidence_source.startswith("docs/architecture/")
            ):
                raise ValueError(
                    "Module contract evidence must come from an application "
                    f"Module/Adapter or architecture contract: {source}"
                )
            evidence_path = manifest_path(evidence_source, "tutorial evidence")
            if not evidence_path.is_file():
                raise ValueError(
                    f"Tutorial evidence source does not exist: {evidence_source}"
                )
            evidence_texts.append(evidence_path.read_text(encoding="utf-8"))
            evidence_sources.append(evidence_source)

        visible_labels = mapping.get("visible_labels", [])
        if not isinstance(visible_labels, list) or not all(
            isinstance(label, str) and label.strip() for label in visible_labels
        ):
            raise ValueError(
                f"Tutorial visible_labels must be a list of strings: {source}"
            )
        tutorial_content = tutorial_contents.get(source)
        if tutorial_content is None:
            raise ValueError(f"Tutorial content is missing for evidence: {source}")
        combined_evidence = "\n".join(evidence_texts)
        for label in visible_labels:
            if label not in tutorial_content:
                raise ValueError(
                    f"Tutorial has stale visible label {label}: {source}; "
                    f"evidence: {', '.join(evidence_sources)}"
                )
            if label not in combined_evidence:
                raise ValueError(
                    f"Tutorial visible label {label} is not grounded in its "
                    f"evidence: {source}; evidence sources: "
                    f"{', '.join(evidence_sources)}"
                )


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
    latest_release = validate_release_alignment(
        (REPOSITORY_ROOT / "app/package.json").read_text(encoding="utf-8"),
        (REPOSITORY_ROOT / "app/CHANGELOG.md").read_text(encoding="utf-8"),
        (REPOSITORY_ROOT / "SECURITY.md").read_text(encoding="utf-8"),
    )
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    pages = validate_manifest_entries(manifest.get("pages"), "page")
    tutorials = validate_manifest_entries(manifest.get("tutorials"), "tutorial")
    current_capabilities_pages = [
        page for page in pages if page["source"] == CURRENT_CAPABILITIES_SOURCE
    ]
    if len(current_capabilities_pages) != 1:
        raise ValueError(
            "The public documentation manifest must contain exactly one "
            f"{CURRENT_CAPABILITIES_SOURCE} page."
        )
    current_capabilities_content = (
        REPOSITORY_ROOT / CURRENT_CAPABILITIES_SOURCE
    ).read_text(encoding="utf-8")
    validate_current_capabilities(current_capabilities_content, latest_release)
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
        validate_tutorial_content(tutorial, content, latest_release)
        metadata = read_tutorial_metadata(content, source)
        tutorial_orders.append(int(metadata["nav_order"]))

    tutorial_contents = {
        str(tutorial["source"]): (REPOSITORY_ROOT / str(tutorial["source"])).read_text(
            encoding="utf-8"
        )
        for tutorial in task_tutorials
    }
    evidence_document = json.loads(TUTORIAL_EVIDENCE_PATH.read_text(encoding="utf-8"))
    validate_tutorial_evidence(task_tutorials, tutorial_contents, evidence_document)

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
