---
title: Add PDF import with managed or linked source assets
type: proposal
status: applied
created: 2026-08-26
reviewed: 2026-08-26
approved: 2026-08-26
applied: 2026-08-26
tags: []
aliases:
  - Add PDF
  - Import PDF
targets:
  - CONTEXT.md
  - app/docs/architecture/v1-ui/product-decisions.md
  - app/docs/architecture/v1-ui/architecture.md
  - app/docs/architecture/v1-ui/test-strategy.md
  - app/docs/architecture/v1-ui/delivery-plan.md
  - app/docs/architecture/v1-ui/code-map.md
  - app/docs/agents/knowledge-base.md
  - app/docs/agents/software-development.md
  - app/templates/knowledge-repository/templates/source.md
  - app/tests/fixtures/knowledge-repository/templates/source.md
---

# Add PDF import with managed or linked source assets

## Decision

**Add PDF**—also discoverable as “Import PDF”—creates a portable Source Record before asking how to retain its Source Asset:

1. **Manage** copies and verifies the PDF under `assets/sources/` and records a repository-relative reference. Git LFS may be configured externally, but is not required by Galaxy Brain.
2. **Link local file** leaves the PDF in place and stores its absolute path and SHA-256 identity only in machine-local configuration keyed by the Source Record. No machine-specific path enters repository content, proposals, logs, or audit records.

Changed or unavailable linked bytes preserve the Source Record, Source Locators, Structured Annotations, and citations until the user explicitly relinks or accepts the new bytes. The source metadata uses `asset_mode: managed` or `linked-local`, `repository_asset` only for managed assets, and `logical_locator` for durable source location information.

## Safety and scope

The Workbench verifies managed bytes before writing, does not claim LFS tracking or hydration, and never displays an LFS pointer as source content. Mode changes are explicit. Migration of existing external PDFs remains outside the first import slice.

## Approval record

- Decision: approved by the user in the grilling review
- Approved on: 2026-08-26
- Applied on: 2026-08-26
- Applied commit: pending repository commit
