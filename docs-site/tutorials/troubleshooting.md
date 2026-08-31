---
title: Troubleshoot common recovery states
summary: Recover safely from unavailable repositories, missing context, and unavailable Synthesis results.
audience: Knowledge Workbench users recovering from an unexpected state
prerequisites:
  - Access to the repository location or context you are trying to recover.
nav_order: 12
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

# Troubleshoot common recovery states

## Goal

Recognize the Workbench’s recoverable states and choose an explicit next action
without mistaking an unavailable or failed operation for success.

## Prerequisites

- Know whether you are recovering a repository selection, workspace context, or
  saved Synthesis result.
- Keep the original Knowledge Repository location unchanged until you understand
  the outcome; do not overwrite it to make an error disappear.

## Steps

1. If Atlas says that no Knowledge Repository is open after launch, choose
   **Open a Knowledge Repository** or **Create a Knowledge Repository**.
2. If a remembered repository is unavailable or invalid, select a valid location
   explicitly. The Workbench does not scan sibling directories or substitute a
   different repository.
3. If Studio or Paper Desk is unavailable, return to Atlas and select a complete
   topic and Source Record context.
4. If a workspace transition fails, remain on the current workspace and retry
   after checking the selected context.
5. If Synthesis reports that its preview is no longer available, prepare a fresh
   request and inspect its exact payload again.
6. If the Agent Provider is unavailable, continue with local reading and
   Working Material workflows instead of treating the result as generated.
7. If saved Synthesis results cannot be read, keep the visible unavailable state
   and retry later. If a listed restore fails, do not assume history changed.

## Expected result

Recovery is explicit and state-preserving. The Workbench does not silently
select a replacement repository, fabricate missing context, send an outdated
Synthesis request, or present an unavailable saved result as current.

## Troubleshooting

- If an operation continues to fail, record the caller-visible message and the
  operation you attempted without copying prompts, source excerpts, credentials,
  or absolute private paths into public reports.
- If you need to verify repository structure, consult the
  [Repository Format overview](repository-format-overview.md) and its
  [authoritative reference](../../docs/architecture/v1-ui/repository-format.md).
- For boundaries around local operation and provider data, consult
  [Safety and privacy](safety-and-privacy.md).
