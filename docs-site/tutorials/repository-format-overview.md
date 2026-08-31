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
5. During a Proposal application, recognize the transient transaction journal
   and staged files under `proposals/applied/.transactions/`, which support
   recovery from an interrupted application. After a successful application,
   recognize the portable artifacts under `proposals/applied/`: immutable
   applied-audit JSON and exact targeted rollback bytes.
6. Remember that the starter skeleton is empty of subject-matter knowledge and
   that the synthetic fixture in the public project is not a private repository.

## Expected result

You can explain which files and roots are portable, which state is machine-local,
and why opening or creating a repository does not require Git. The Workbench
preserves the repository’s application-independent boundary while applying its
own local safety checks. Applied audit and rollback files are portable,
application-readable history and recovery data: the ordinary target file
remains the current-content authority, and these artifacts are not casual
cleanup targets. Transaction staging is cleaned only after the target, rollback,
and audit record are coherent. The Repository Format does not imply a desktop
Proposal Review or rollback UI; TB8 is currently module-only in the public
capability status.

## Troubleshooting

- If a repository is newer, malformed, or unsafe, follow the Workbench’s
  recovery outcome rather than editing the format declaration casually.
- Git and Git LFS may be used externally, but Galaxy Brain does not initialize,
  commit, synchronize, or back up a repository for you.
- For the complete compatibility and safe-write rules, use the
  [Repository Format reference](../../docs/architecture/v1-ui/repository-format.md).
