---
title: Create a Knowledge Repository
summary: Create a new repository from the bundled starter skeleton.
audience: Knowledge Workbench users starting a new repository
prerequisites:
  - A new or explicitly empty directory where the empty starter can be created.
nav_order: 2
---

# Create a Knowledge Repository

## Goal

Create a portable Knowledge Repository from the bundled starter skeleton and
open it in the Workbench.

## Prerequisites

- The Knowledge Workbench is open in Atlas.
- You have identified a new or explicitly empty directory.
- You understand that the repository is independent of the Workbench
  application; see the [Repository Format](../../docs/architecture/v1-ui/repository-format.md).

This creates the empty starter only. It does not provide the pre-populated
knowledge, Source Records, annotations, or saved Synthesis results required by
the later content-dependent tutorials.

## Steps

1. In Atlas, choose **Create a Knowledge Repository**.
2. In the directory chooser, select the location for the new repository.
3. Confirm the selection when the Workbench asks where to create the repository.
4. Wait for the creation operation to finish.
5. Check the Atlas status card. The new repository should be shown as created and
   selected.

## Expected result

The Workbench copies the empty starter skeleton into the selected location,
validates it, and selects that repository for local work. The repository
contains the portable roots and format declaration described by the
[Repository Format](../../docs/architecture/v1-ui/repository-format.md).

The starter is intentionally empty of subject-matter knowledge. To follow the
reading or Synthesis tutorials after creation, open a separate pre-populated
conforming repository or the explicitly identified public synthetic fixture;
do not treat the fixture as production knowledge.

Creation does not initialize Git, contact GitHub, create a backup, or imply
that the repository has been synchronized. Git and other external tooling
remain optional user-managed choices.

## Troubleshooting

- Do not select a non-empty directory. The Workbench must not overwrite existing
  user content.
- If creation fails, do not treat a partial directory as a successfully selected
  repository. Return to Atlas and choose another empty location or retry after
  resolving the reported problem.
- If you meant to use an existing repository, use
  [Open a Knowledge Repository](open-knowledge-repository.md) instead.
