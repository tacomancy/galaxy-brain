---
title: Open a Knowledge Repository
summary: Select and validate an existing portable repository.
audience: Knowledge Workbench users with an existing repository
prerequisites:
  - An existing Knowledge Repository you are authorized to open.
  - The repository follows the documented Repository Format.
nav_order: 3
---

# Open a Knowledge Repository

## Goal

Open an existing Knowledge Repository without changing its files or silently
substituting a different location.

## Prerequisites

- The Knowledge Workbench is open in Atlas.
- You have the repository’s location available through the directory chooser.
- Review the [Repository Format](../../docs/architecture/v1-ui/repository-format.md) if you
  need to check its required format declaration and roots.

## Steps

1. In Atlas, choose **Open a Knowledge Repository**.
2. Select the existing repository directory.
3. Confirm the selection when the Workbench asks which repository to open.
4. Wait for validation to finish.
5. If the repository is valid, review the Atlas status card and its selected
   repository location.

## Expected result

The Workbench validates the selected directory before treating it as active.
When it is supported, Atlas shows the repository as opened and selected. A
compatible newer format may open read-only so its meaning and files remain
safe.

The Workbench does not scan neighboring directories, rewrite the repository as
part of opening it, or use Git as a prerequisite.

## Troubleshooting

- An unavailable location remains unselected; choose **Open a Knowledge
  Repository** again after making the location available.
- An invalid or unsafe repository remains unselected. Do not work around the
  validation by renaming files or copying private content into the public
  project.
- An unsupported or newer format may require read-only access or a separately
  planned migration. Opening alone does not silently migrate it; see the
  [Repository Format compatibility rules](../../docs/architecture/v1-ui/repository-format.md).
