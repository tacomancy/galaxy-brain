#!/usr/bin/env python3
"""Behavior checks for the curated public documentation build."""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[1]
BUILD_SCRIPT = REPOSITORY_ROOT / "scripts" / "build_public_docs.py"
sys.path.insert(0, str(REPOSITORY_ROOT))

from scripts.build_public_docs import (  # noqa: E402
    validate_tutorial_content,
    validate_tutorial_evidence,
    validate_tutorial_index,
    validate_current_capabilities,
    validate_release_alignment,
)


class PublicDocumentationBuildTest(unittest.TestCase):
    def test_current_capabilities_requires_version_markers_and_support_classes(self) -> None:
        content = """---
title: Current capabilities
summary: Versioned capability status.
applies_to_release: "0.9.0"
tracks_main: true
verified_commit: "5aeb14980b1ea407bc6fbb6fa19db27143cdfd38"
reviewed_on: "2026-08-28"
---

## Latest published release: 0.9.0

Desktop-supported
Module-only
Planned

## Current `main` snapshot

## Planned capabilities and known limits
"""

        validate_current_capabilities(content, "0.9.0")

        with self.assertRaisesRegex(ValueError, "applies_to_release"):
            validate_current_capabilities(
                content.replace('applies_to_release: "0.9.0"', 'applies_to_release: "0.8.0"'),
                "0.9.0",
            )

        with self.assertRaisesRegex(ValueError, "support classes"):
            validate_current_capabilities(
                content.replace("\nDesktop-supported\n", "\nDeferred\n"), "0.9.0"
            )

    def test_security_policy_matches_current_release_sources(self) -> None:
        package_content = '{"version": "0.8.0"}'
        changelog_content = (
            "# Changelog\n\n"
            "## [Unreleased]\n\n"
            "## [0.8.0](release-url) (2026-08-28)\n\n"
            "## [0.7.0](release-url) (2026-08-27)\n"
        )
        security_content = "| Latest published release (`0.8.0`) | Yes |\n"

        validate_release_alignment(
            package_content,
            changelog_content,
            security_content,
        )

        with self.assertRaisesRegex(ValueError, "SECURITY.md reports 0.7.0.*0.8.0"):
            validate_release_alignment(
                package_content,
                changelog_content,
                security_content.replace("0.8.0", "0.7.0"),
            )

        with self.assertRaisesRegex(
            ValueError,
            "app/package.json reports 0.7.0.*app/CHANGELOG.md reports 0.8.0",
        ):
            validate_release_alignment(
                package_content.replace("0.8.0", "0.7.0"),
                changelog_content,
                security_content,
            )

    def test_tutorial_validation_requires_metadata_and_headings(self) -> None:
        page = {"source": "docs-site/tutorials/example.md", "kind": "tutorial"}
        content = """---
title: Example
summary: An example tutorial.
audience: Readers
prerequisites: []
nav_order: 1
tracks_main: true
verified_commit: "59f4cc102f03d3f13406ac4d8a2ab31bcb757d55"
reviewed_on: "2026-08-31"
supported_platforms:
  - macOS arm64
supported_packages:
  - source checkout
  - unsigned local macOS arm64 package
repository_states:
  - empty_starter
adapter_boundary:
  production: not_composed
  fixture: not_used
---

# Example

## Goal
Goal.

## Prerequisites
Prerequisites.

## Steps
Steps.

## Expected result
Result.

## Troubleshooting
Troubleshooting.
"""

        validate_tutorial_content(page, content)

        with self.assertRaisesRegex(ValueError, "metadata is missing summary"):
            validate_tutorial_content(page, content.replace("summary: An example tutorial.\n", ""))
        with self.assertRaisesRegex(ValueError, "one '## Steps' heading"):
            validate_tutorial_content(page, content.replace("## Steps\n", ""))

        with self.assertRaisesRegex(ValueError, "tracks_main or applies_to_release"):
            validate_tutorial_content(
                page,
                content.replace("tracks_main: true\n", ""),
            )

        with self.assertRaisesRegex(ValueError, "repository_states"):
            validate_tutorial_content(
                page,
                content.replace("repository_states:\n  - empty_starter\n", ""),
            )

    def test_tutorial_index_must_link_to_every_task_page(self) -> None:
        tutorials = [
            {"source": "docs-site/tutorials/first-run.md"},
            {"source": "docs-site/tutorials/open-knowledge-repository.md"},
        ]

        with self.assertRaisesRegex(ValueError, "open-knowledge-repository.md"):
            validate_tutorial_index("- [First run](first-run.md)\n", tutorials)

    def test_tutorial_evidence_requires_grounded_mapping_and_labels(self) -> None:
        source = "docs-site/tutorials/example.md"
        page = {"source": source, "kind": "tutorial"}
        content = "Choose **Atlas**."
        evidence = {
            "schema_version": 1,
            "tutorials": {
                source: {
                    "evidence": [
                        {
                            "kind": "packaged_workflow",
                            "source": "app/tests/workflows/open-empty-workbench.e2e.ts",
                            "story": "Open the real empty Workbench",
                            "support_class": "Desktop-supported",
                        }
                    ],
                    "visible_labels": ["Atlas"],
                }
            },
        }

        validate_tutorial_evidence([page], {source: content}, evidence)

        with self.assertRaisesRegex(ValueError, "evidence mapping is missing"):
            validate_tutorial_evidence(
                [page],
                {source: content},
                {"schema_version": 1, "tutorials": {}},
            )

        with self.assertRaisesRegex(ValueError, "stale visible label Atlas"):
            validate_tutorial_evidence(
                [page],
                {source: content.replace("Atlas", "Workbench")},
                evidence,
            )

        with self.assertRaisesRegex(ValueError, "Module-only evidence"):
            validate_tutorial_evidence(
                [page],
                {source: content},
                {
                    **evidence,
                    "tutorials": {
                        source: {
                            **evidence["tutorials"][source],
                            "evidence": [
                                {
                                    "kind": "module_contract",
                                    "source": "docs/architecture/v1-ui/repository-format.md",
                                    "story": "Repository Format contract",
                                    "support_class": "Desktop-supported",
                                }
                            ],
                        }
                    },
                },
            )

    def test_build_emits_only_curated_validated_pages(self) -> None:
        with tempfile.TemporaryDirectory(prefix="galaxy-brain-docs-test-") as temporary:
            output = Path(temporary) / "site"
            subprocess.run(
                [sys.executable, str(BUILD_SCRIPT), "--output", str(output)],
                cwd=REPOSITORY_ROOT,
                check=True,
            )

            expected_pages = {
                "index.html",
                "security/index.html",
                "application/index.html",
                "project-documentation/index.html",
                "current-capabilities/index.html",
                "release-notes/index.html",
                "architecture/index.html",
                "architecture/architecture/index.html",
                "architecture/product-decisions/index.html",
                "architecture/repository-format/index.html",
                "architecture/test-strategy/index.html",
                "engineering-glossary/index.html",
                "domain-glossary/index.html",
                "tutorials/index.html",
                "tutorials/first-run/index.html",
                "tutorials/create-knowledge-repository/index.html",
                "tutorials/open-knowledge-repository/index.html",
                "tutorials/resume-workbench-session/index.html",
                "tutorials/navigate-workspaces/index.html",
                "tutorials/read-source-record/index.html",
                "tutorials/prepare-synthesis-request/index.html",
                "tutorials/confirm-synthesis-request/index.html",
                "tutorials/understand-synthesis-results/index.html",
                "tutorials/repository-format-overview/index.html",
                "tutorials/safety-and-privacy/index.html",
                "tutorials/troubleshooting/index.html",
            }
            actual_pages = {
                path.relative_to(output).as_posix()
                for path in output.rglob("*.html")
            }
            self.assertTrue(expected_pages <= actual_pages)

            rendered_text = "\n".join(
                path.read_text(encoding="utf-8") for path in output.rglob("*.html")
            )
            self.assertNotRegex(rendered_text, r"(?:sk|rk)-[A-Za-z0-9_-]{20,}")
            self.assertIn('class="mermaid"', rendered_text)

            generated_names = {
                path.name for path in output.rglob("*") if path.is_file()
            }
            self.assertFalse(
                any(
                    name.endswith(('.map', '.pyc'))
                    or name in {"package-lock.json", "coverage"}
                    for name in generated_names
                )
            )

    def test_validation_rejects_broken_local_links(self) -> None:
        with tempfile.TemporaryDirectory(prefix="galaxy-brain-docs-test-") as temporary:
            output = Path(temporary) / "site"
            subprocess.run(
                [sys.executable, str(BUILD_SCRIPT), "--output", str(output)],
                cwd=REPOSITORY_ROOT,
                check=True,
            )
            invalid_output = Path(temporary) / "invalid-site"
            shutil.copytree(output, invalid_output)
            index = invalid_output / "index.html"
            index.write_text(
                index.read_text(encoding="utf-8")
                + '<a href="missing-page/">broken link</a>',
                encoding="utf-8",
            )

            result = subprocess.run(
                [
                    sys.executable,
                    str(BUILD_SCRIPT),
                    "--output",
                    str(invalid_output),
                    "--validate-only",
                ],
                cwd=REPOSITORY_ROOT,
                capture_output=True,
                text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Broken public link", result.stderr)


if __name__ == "__main__":
    unittest.main()
