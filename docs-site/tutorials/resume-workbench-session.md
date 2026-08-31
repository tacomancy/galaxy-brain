---
title: Resume a Workbench session
summary: Understand exact-root resume and recover safely when the remembered repository is unavailable.
audience: Returning Knowledge Workbench users
prerequisites:
  - You previously created or opened a Knowledge Repository through the Workbench.
  - The Workbench has permission to inspect the remembered location.
nav_order: 4
---

# Resume a Workbench session

## Goal

Understand what happens when the Knowledge Workbench reopens after you have
previously selected a repository.

## Prerequisites

- You previously selected a repository using the Workbench’s Create or Open
  workflow.
- If you are testing recovery, use a safe test repository or an intentionally
  unavailable location rather than changing important user content.

An empty starter can be resumed as a repository, but it still has no
content-dependent workflow data. Use a pre-populated conforming repository or
an explicitly identified synthetic fixture when validating reading, context,
or Synthesis behavior.

## Steps

1. Close and relaunch the Knowledge Workbench after selecting a repository.
2. If the remembered repository is still available and valid, inspect Atlas to
   confirm that the same repository is selected.
3. If the remembered location is unavailable or invalid, read the recovery
   message in Atlas.
4. Choose **Open a Knowledge Repository** to select a different valid repository,
   or choose **Create a Knowledge Repository** to start a new one.

## Expected result

The Workbench remembers only the exact repository root that you explicitly
selected. On relaunch it validates that root before restoring the selected
state. With no remembered selection, it starts in the empty Atlas state.

If validation fails, the Workbench leaves the repository unselected and offers
explicit recovery choices. It does not scan sibling directories, guess a
replacement, or claim that an unavailable repository is current.

## Troubleshooting

- If the repository was moved or renamed, use **Open a Knowledge Repository** to
  choose its new location. The Workbench does not discover it automatically.
- If the repository uses a newer compatible format, Atlas may show it as
  read-only. Review the [Repository Format](../../docs/architecture/v1-ui/repository-format.md)
  before considering any separate migration work.
- Resume state is machine-local convenience state, not content in the portable
  Knowledge Repository. See the [V1 architecture](../../docs/architecture/v1-ui/README.md) for
  the boundary between the Workbench and the repository.
