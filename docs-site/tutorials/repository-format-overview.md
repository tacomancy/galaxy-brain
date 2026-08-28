---
title: Repository Format overview
summary: Understand the portable files and boundaries of a Knowledge Repository.
audience: Knowledge Workbench users managing repository content
prerequisites:
  - A basic understanding of the distinction between the Workbench and a Knowledge Repository.
nav_order: 10
---

# Repository Format overview

## Goal

Understand what belongs in a portable Knowledge Repository and how it relates
to the Knowledge Workbench application.

## Prerequisites

- Read [First launch](first-run.md) if you have not opened the Workbench yet.
- Keep the [Repository Format reference](../../docs/architecture/v1-ui/repository-format.md)
  available for the complete contract.

## Steps

1. Treat the Knowledge Repository as an application-independent collection of
   portable files, not as the Workbench’s private database.
2. Identify the root `galaxy-brain.yaml` declaration with `format:
   galaxy-brain` and `format_version: 1`.
3. Recognize the canonical roots: `knowledge/`, `sources/`, `projects/`,
   `scratch/`, `proposals/`, `templates/`, and `assets/`.
4. Keep Governed Knowledge distinct from Working Material. Saved source claims,
   drafts, and saved agent results remain Working Material until normal human
   Governance applies them.
5. Remember that the starter skeleton is empty of subject-matter knowledge and
   that the synthetic fixture in the public project is not a private repository.

## Expected result

You can explain which files and roots are portable, which state is machine-local,
and why opening or creating a repository does not require Git. The Workbench
preserves the repository’s application-independent boundary while applying its
own local safety checks.

## Troubleshooting

- If a repository is newer, malformed, or unsafe, follow the Workbench’s
  recovery outcome rather than editing the format declaration casually.
- Git and Git LFS may be used externally, but Galaxy Brain does not initialize,
  commit, synchronize, or back up a repository for you.
- For the complete compatibility and safe-write rules, use the
  [Repository Format reference](../../docs/architecture/v1-ui/repository-format.md).
