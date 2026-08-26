---
title: Define an application-independent, local-first Knowledge Repository
type: proposal
status: applied
created: 2026-08-26
reviewed: 2026-08-26
approved: 2026-08-26
applied: 2026-08-26
tags: []
aliases:
  - Use portable files with optional external version control
  - Define the Repository Format
targets:
  - app/docs/adr/0005-use-portable-files-with-optional-external-version-control.md
  - app/docs/adr/0006-keep-knowledge-repositories-application-independent.md
  - app/docs/architecture/v1-ui/repository-format.md
  - CONTEXT.md
  - app/docs/architecture/v1-ui/README.md
  - app/docs/architecture/v1-ui/product-decisions.md
  - app/docs/architecture/v1-ui/architecture.md
  - app/docs/architecture/v1-ui/test-strategy.md
  - app/docs/architecture/v1-ui/delivery-plan.md
  - app/docs/architecture/v1-ui/code-map.md
  - app/docs/agents/knowledge-base.md
  - app/docs/agents/software-development.md
  - app/docs/agents/workbench.md
  - README.md
  - app/README.md
  - app/templates/knowledge-repository/
  - app/tests/fixtures/knowledge-repository/
---

# Define an application-independent, local-first Knowledge Repository

## Decision

The Workbench uses a VCS-neutral, application-independent Repository Format. Galaxy Brain is fully usable without Git, Git LFS, GitHub, remotes, credentials, or network connectivity. Users may manage Git initialization, commits, branches, synchronization, and backups externally, but Galaxy Brain never invokes those operations in V1.

Agent Provider configuration is likewise optional and machine-local. The Workbench remains usable without an API key or configured provider; Agentic Capabilities return a clear unavailable outcome until configuration exists, without blocking startup or local repository workflows.

The public application project is separate from the user's independent private Knowledge Repository. It contains a synthetic fixture and an empty starter skeleton, both safe to publish under MIT. The Workbench starts without a selected repository, permits explicit opening or scaffolding, never scans for a sibling repository, and never treats a fixture as user data.

## Durable behavior

The Repository Format declares `galaxy-brain.yaml` with `format_version: 1` and preserves unknown content. The app writes approved files, immutable audit snapshots under `proposals/applied/`, and targeted rollback data through recoverable filesystem transactions. It checks targeted-file fingerprints before writes, preserves external edits, detects interrupted transactions, and reports local saves without claiming commits or backups. Provider credentials, prompts, and machine-local provider configuration are never Repository Format content.

Repository creation copies the bundled skeleton into a new or explicitly empty directory without running `git init` or committing. Existing valid repositories can be opened; nonempty invalid directories are never overwritten.

## Future work

Multi-repository switching, GitHub authentication, remote synchronization, verified off-device backup, demo mode, Repository Housekeeping, and irreversible Git/LFS history reclamation remain deferred.

## Approval record

- Decision: approved by the user in the grilling review
- Approved on: 2026-08-26
- Applied on: 2026-08-26
- Applied commit: pending repository commit
