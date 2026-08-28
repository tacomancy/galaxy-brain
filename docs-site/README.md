# Public documentation site

The public documentation site is a curated projection of the project
documentation. It is built with [MkDocs](https://www.mkdocs.org/) and the
[Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) theme,
then published to GitHub Pages.

## Public boundary

The allowlist in [site-manifest.json](site-manifest.json) is the mechanical
source of truth. The current navigation publishes:

- the project overview, application README, project documentation overview,
  and security policy;
- the V1 architecture overview, architecture, product decisions, repository
  format, and test strategy; and
- the human-agent collaboration guide; and
- the engineering and domain glossaries; and
- the first-release Tutorials section.

The `tutorials` section of the manifest separately lists user-facing tutorial
pages. Tutorial sources use YAML frontmatter with `title`, `summary`,
`audience`, `prerequisites`, and `nav_order`, followed by the standard task
headings: Goal, Prerequisites, Steps, Expected result, and Troubleshooting.
The tutorial index is the only exception because it is an orientation page.

The build copies only those sources into a generated staging tree. It rewrites
links to allowlisted pages and turns links to excluded repository material
into plain text. It never publishes docs/agents/, docs/reviews/,
docs/proposals/, application tests or fixtures, generated output, dependencies,
or user Knowledge Repository content.

The standalone build and test tools use Python's conventional `snake_case`
filenames and identifiers. The repository's `kebab-case`/`camelCase` naming
guidance continues to apply to the TypeScript application and its modules; this
small Python tooling boundary follows the language ecosystem's standard naming
convention.

Mermaid fences are rendered by Material for MkDocs using
pymdownx.superfences. The generated artifact is checked for required pages,
expected index headings, local link resolution, Mermaid output, excluded
paths, likely secrets, symlinks, and source maps before it can be uploaded.

## Local build and preview

Use Python 3.11 or newer, install the exact dependency lockfile, and run:

    python -m pip install --requirement requirements-docs.txt
    python scripts/test_public_docs.py
    python scripts/build_public_docs.py --output .generated/public-site
    mkdocs serve --config-file docs-site/mkdocs.yml

The test command builds and validates the same static artifact used by CI. The
last command starts MkDocs' local preview against the generated, curated
source tree.

## Workflow and version policy

Pull requests targeting main run the build and validation test without
deploying. A push to main runs the same build and deploys the resulting
artifact through the protected github-pages environment. Manual
workflow_dispatch runs the deployment workflow again from the selected
revision.

Python packages are exact-pinned in
[requirements-docs.txt](../requirements-docs.txt). GitHub Actions use
explicit maintained major-version tags consistent with the rest of this
repository; Dependabot checks the Pages actions and Python lockfile weekly.
