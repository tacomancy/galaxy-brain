---
title: V1 document grilling review ledger
type: project
status: active
created: 2026-08-26
reviewed: 2026-08-26
tags: []
candidate_tags: []
aliases:
  - Grill with docs review ledger
  - V1 document review findings
---

# V1 document grilling review ledger

## Outcome

Preserve one durable, navigable record of concerns, decisions, and deferred questions raised while grilling the V1 project documents for clarity, consistency, and design completeness.

This ledger is an index and audit trail. The linked architecture, ADRs, proposals, source notes, and guidance remain authoritative for their contents. The user's explicit decisions in the grilling review authorize the applied documentation changes recorded here.

## Status vocabulary

- `resolved`: the finding requires no further change, or its authorized resolution has been applied.
- `deferred`: intentionally postponed with its present boundary recorded.
- `superseded`: replaced by a later finding or framing without erasing the history.

No current finding remains open, decision-needed, or pending a proposal.

## Document findings

| ID | Finding | Status | Disposition |
| --- | --- | --- | --- |
| DOC-001 | Product decisions and test strategy used different direct Synthesis outcomes. | resolved | Direct outcomes are a draft Proposal, a source link without a knowledge change, or explicit no action; an open question may appear inside a draft Proposal. |
| DOC-002 | The delivery plan permitted an unconfirmed Learning observation point. | resolved | Learning is observed at S1; a new seam requires an amended, confirmed test strategy. |
| DOC-003 | PDF Adapter wording appeared to own Source Record preservation. | resolved | PDF availability belongs to the PDF Adapter; Source Processing and repository behavior preserve Source Records and annotations. |
| DOC-004 | Governance wording blurred autosave ownership. | resolved | Governance cannot promote Working Material without an eligible Proposal. |
| DOC-005 | `_Avoid_` vocabulary could be read as global word prohibition. | resolved | `_Avoid_` entries reject synonyms only for their accompanying term. |
| DOC-006 | The advisory memo's target metadata omitted discussed documents. | resolved | Corrected before conversion into the exact proposal. |
| DOC-007 | Several documents repeat seam and completion guidance. | deferred | Editorial pruning can occur later if each document's distinct authority remains clear. |
| DOC-008 | The stack brief repeats some ADR and guidance material. | deferred | Editorial pruning remains a later opportunity, not an architectural defect. |
| DOC-009 | An applied guidance proposal retained stale approval instructions. | resolved | The historical approval and application record is now explicit in the applied proposal. |
| DOC-010 | Software guidance used present tense for not-yet-existing package scripts. | resolved | The wording is prospective. |
| DOC-011 | Product prose and source metadata used an unclear external-locator concept. | resolved | Product language now uses Source Locator and source metadata uses `logical_locator`; local paths remain machine-local. |
| DOC-012 | Planned source and test roots were written as root-level `src/` and `tests/`. | resolved | The code map now uses `app/src/` and `app/tests/`. |
| DOC-013 | The ledger had an incorrect pending-proposal count. | resolved | The old three-proposal chain was reconciled and applied; future changes use new scoped proposals. |

## Repository and product findings

| ID | Finding | Status | Disposition |
| --- | --- | --- | --- |
| DES-001 | The intended product form needed confirmation. | resolved | V1 is a macOS desktop Workbench built on Electron with a cross-platform-capable foundation. |
| DES-002 | Git had not been explicitly chosen as the production backend. | superseded | The later decision is VCS-neutral portable files with optional external Git; see [ADR 0005](../adr/0005-use-portable-files-with-optional-external-version-control.md). |
| DES-003 | Large-file handling was framed around GitHub-compatible LFS. | superseded | Managed assets are ordinary repository files to Galaxy Brain; users may configure Git LFS externally. |
| DES-004 | Knowledge files lacked an explicit independent application boundary. | resolved | The VCS-neutral Repository Format, separate lifecycle, and compatibility rules are documented in the [Repository Format](../architecture/v1-ui/repository-format.md). |
| DES-005 | PDF import did not offer managed versus external storage. | resolved | Add PDF creates a Source Record and offers `managed` or `linked-local`. |
| DES-006 | A remote could be mistaken for a complete backup. | resolved | Galaxy Brain makes no commit, synchronization, or backup claim; backup remains external user responsibility. |
| DES-007 | Application and knowledge-base namespaces could be confused. | resolved | Application docs remain under `app/docs/`; public fixtures and starter files are under `app/`; private knowledge is external. |
| DES-008 | The mixed checkout could be mistaken for the user's production repository. | resolved | The current generic tree is a synthetic fixture; the actual private repository is an independent sibling or otherwise explicitly selected root. |
| DES-009 | Public release could expose private content or history. | resolved | The public project is MIT-licensed and contains only synthetic fixtures and a starter skeleton; private content is never synchronized into it. |
| DES-010 | A separate template repository would burden ordinary app users. | resolved | The app bundles an empty skeleton and can scaffold it without initializing Git; a standalone template remains optional future work. |
| DES-011 | V1 needed an explicit local-first capability boundary. | resolved | Local use requires no Git, Git LFS, GitHub, credentials, remotes, or network. GitHub-dependent capabilities are optional and non-blocking. |
| DES-012 | The app needed a safe policy for externally changed governed files. | resolved | Targeted fingerprints detect changes; external edits are preserved and require explicit review before adoption. |
| DES-013 | Missing Agent Provider configuration could accidentally become an application prerequisite. | resolved | API keys and provider configuration are optional machine-local capabilities; local Workbench workflows remain usable, while Agentic Capabilities report a clear unavailable state. |

## Implementation and future-work findings

| ID | Finding | Status | Disposition |
| --- | --- | --- | --- |
| OPEN-001 | Which paths should receive LFS tracking? | superseded | Galaxy Brain does not manage LFS. The optional skeleton hint covers `assets/sources/**/*.pdf`; users own any external tracking policy. |
| OPEN-002 | Whether to bundle or validate Git/Git LFS. | superseded | Neither is required or invoked by V1. |
| OPEN-003 | GitHub authentication model. | deferred | True GitHub authentication and account integration remain future work. |
| OPEN-004 | Verified off-device backup target and cadence. | deferred | The user manages backups externally for now; Galaxy Brain makes no complete-backup promise. |
| OPEN-005 | Machine-local linked-file configuration format. | deferred | The format remains an implementation detail constrained by portable Source Records, local paths, and SHA-256 identity. |
| OPEN-006 | Remote synchronization and conflict resolution. | deferred | These remain future capabilities and are not required for local use. |
| OPEN-007 | Future Repository Format migrations. | deferred | Each format revision requires its own explicit, previewed, recoverable proposal. |
| OPEN-008 | Multi-Knowledge-Repository support. | deferred | Future support means explicit switching, isolated state and indexes, and no implicit cross-repository Search or Ask. |
| OPEN-009 | Demo mode could confuse synthetic and authentic data. | deferred | V1 keeps demo mode out of the packaged workflow; the authentic empty state is the default. |
| OPEN-010 | Repository support files and rollback data may accumulate. | deferred | Future Repository Housekeeping reports candidates and storage cost; cleanup requires explicit approval and never automatically removes audit records. |
| OPEN-011 | Applying files without Git needed transaction guarantees. | resolved | Targeted writes, audit records, and rollback data use a recoverable filesystem transaction with crash detection. |
| OPEN-012 | Dirty or concurrently changed files could be overwritten. | resolved | Fingerprints are rechecked immediately before mutation; stale operations abort without overwriting external edits. |
| OPEN-013 | Proposal application needed a durable audit location. | resolved | Immutable applied-Proposal records live under `proposals/applied/` in the selected repository. |
| OPEN-014 | Rollback history needed a retention rule. | resolved | Rollback data is retained indefinitely by default; purging requires explicit acknowledgement of lost recovery capability. |
| OPEN-015 | Skeleton updates could mutate existing private repositories. | resolved | Skeletons are for new repositories; existing repositories require explicit migration or Proposal. |
| OPEN-016 | Commit identity and Git state rules were underspecified. | superseded | Galaxy Brain performs no Git operations in V1; external Git identity, branches, hooks, and commit states are outside the app boundary. |

## Proposal reconciliation

The original three pending proposals were revised and applied after the grilling decisions:

- [Document review concerns](../proposals/2026-08-26-document-review-concerns.md)
- [Application-independent local-first Repository Format](../proposals/2026-08-26-git-backed-knowledge-repository.md)
- [PDF import with managed or linked assets](../proposals/2026-08-26-pdf-import-with-managed-or-linked-assets.md)

The proposals now agree on the VCS-neutral, local-first design. Their `Applied commit` fields remain `pending repository commit` until these working-tree changes are committed.

## Working decisions

- Keep the private Knowledge Repository independent and conventionally sibling to the public application project.
- Publish only MIT-licensed app/infrastructure, synthetic fixtures, and an empty starter skeleton.
- Keep repository files portable and VCS-neutral; users manage Git externally if desired.
- Keep local Workbench use independent of Git, Git LFS, GitHub, credentials, remotes, and network connectivity.
- Keep local Workbench use independent of Agent Provider configuration and API keys; make Agentic Capabilities explicitly unavailable rather than blocking the app.
- Preserve local rollback and audit history in the repository, with explicit transaction and external-edit safeguards.
- Keep multi-repository support, GitHub capabilities, demo mode, and Repository Housekeeping deferred.

## Open work

- Commit the reconciled documentation and fixture/skeleton changes when desired.
- Revisit deferred findings only through a scoped proposal and explicit review.
