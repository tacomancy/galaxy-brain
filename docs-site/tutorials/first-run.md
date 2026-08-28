---
title: First launch
summary: Understand the empty Atlas state and choose how to begin working.
audience: New Knowledge Workbench users
prerequisites:
  - A supported Galaxy Brain build is installed or available for local development.
nav_order: 1
---

# First launch

## Goal

Recognize the first-launch state and choose whether to create a new Knowledge
Repository or open one that already exists.

## Prerequisites

- A supported Galaxy Brain build is installed or available for local development.
- If you plan to create a repository, identify a new or explicitly empty directory.
- If you plan to open one, have access to an existing repository that follows the
  [Repository Format](../../docs/architecture/v1-ui/repository-format.md).

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
