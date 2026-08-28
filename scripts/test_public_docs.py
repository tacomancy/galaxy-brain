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
    validate_tutorial_index,
)


class PublicDocumentationBuildTest(unittest.TestCase):
    def test_tutorial_validation_requires_metadata_and_headings(self) -> None:
        page = {"source": "docs-site/tutorials/example.md", "kind": "tutorial"}
        content = """---
title: Example
summary: An example tutorial.
audience: Readers
prerequisites: []
nav_order: 1
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

    def test_tutorial_index_must_link_to_every_task_page(self) -> None:
        tutorials = [
            {"source": "docs-site/tutorials/first-run.md"},
            {"source": "docs-site/tutorials/open-knowledge-repository.md"},
        ]

        with self.assertRaisesRegex(ValueError, "open-knowledge-repository.md"):
            validate_tutorial_index("- [First run](first-run.md)\n", tutorials)

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
