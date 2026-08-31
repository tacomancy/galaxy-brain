---
title: First launch
summary: Understand the empty Atlas state and choose how to begin working.
audience: New Knowledge Workbench users
prerequisites:
  - A Galaxy Brain source checkout or unsigned local macOS arm64 package is available.
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
  - prepopulated_repository
  - synthetic_fixture
adapter_boundary:
  production: not_composed
  fixture: not_used
---

# First launch

## Goal

Recognize the first-launch state and choose whether to create a new Knowledge
Repository or open one that already exists.

## Prerequisites

- Use either a source checkout or the unsigned local package produced by the
  [application build instructions](../../app/README.md#build-and-run). The
  current build uses Node.js `24.19.0`; from the repository root, `cd app`, run
  `nvm use`, `npm ci`, and then either `npm start` or `npm run package`.
- `npm run package` writes an unsigned local `.app` under `app/out/`. The
  packaged workflow is currently verified on macOS arm64.
- If you plan to create a repository, identify a new or explicitly empty directory.
- If you plan to open one, have access to an existing repository that follows the
  [Repository Format](../../docs/architecture/v1-ui/repository-format.md).

This is a source/development and unsigned-package path, not end-user
distribution. Signing, notarization, DMG or ZIP installers, auto-update, and
downloadable release artifacts are not available here; those release-work
boundaries belong to [Issue #25](https://github.com/tacomancy/galaxy-brain/issues/25)
and [Issue #34](https://github.com/tacomancy/galaxy-brain/issues/34). See also
[Current capabilities](../current-capabilities.md).

## Steps

1. Launch the Knowledge Workbench.
2. If no repository has been selected, confirm that the Workbench opens **Atlas**.
3. Read the empty state. It should say that no Knowledge Repository is open and
   offer **Open a Knowledge Repository** and **Create a Knowledge Repository**.
4. Choose the next tutorial based on your goal:
   - [Create a Knowledge Repository](create-knowledge-repository.md) for a new repository.
   - [Open a Knowledge Repository](open-knowledge-repository.md) for an existing repository.

## Expected result

The Workbench starts in Atlas without inventing demonstration content, scanning
for sibling repositories, or selecting a repository on your behalf. The empty
state gives you explicit Open and Create choices.

## Troubleshooting

- If the Workbench cannot show a usable window, the problem is outside this
  first-launch workflow; consult the project’s
  [application documentation](../../app/README.md).
- If a repository was remembered from an earlier session, follow
  [Resume a Workbench session](resume-workbench-session.md) instead. The
  Workbench validates that exact remembered location rather than discovering a
  replacement.
