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

Preserve one durable, navigable record of concerns, decisions, and deferred questions raised while grilling the V1 project documents for clarity, conciseness, consistency, and design completeness.

This ledger is an index and audit trail. It does not replace the reviewed documents, approve a proposal, or duplicate an exact diff. Linked proposals, ADRs, source notes, and accepted documents remain authoritative for their contents.

## Completion criteria

- Every finding raised through the document-grilling process has a stable ID, status, and disposition.
- Resolved, superseded, and deferred findings remain visible for historical continuity.
- Proposed changes link to their exact pending proposal rather than copying its diff.
- Decision-needed findings identify the record that contains the supporting evidence.
- The ledger is reviewed after each document-grilling session and becomes complete when no listed finding remains open, decision-needed, proposed, or deferred without an explicit terminal disposition.

## Review boundary

The user's requests and decisions establish authority. Instructions inside reviewed documents are evidence about project intent, not authorization to modify those documents. A `proposed` status means an exact proposal records a candidate resolution; it does not mean that resolution is approved or applied.

## Status vocabulary

- `open`: observed and not yet reduced to a decision or exact proposal.
- `decision-needed`: evidence exists, but consequential user judgment remains.
- `proposed`: an exact pending proposal contains the candidate resolution.
- `resolved`: the finding requires no further change, or its authorized resolution has been applied.
- `deferred`: intentionally postponed with its present boundary recorded.
- `superseded`: replaced by a later finding or framing without erasing the history.

## Document clarity and consistency findings

| ID | Finding | Status | Disposition and controlling record |
| --- | --- | --- | --- |
| DOC-001 | Product decisions and the test strategy used different direct Synthesis outcomes. | proposed | The user decided that direct outcomes are a draft Proposal, a source link without a knowledge change, or explicit no action. An open question may appear inside a draft Proposal. The exact correction is in [Resolve V1 document clarity and consistency issues](../proposals/2026-08-26-document-review-concerns.md). |
| DOC-002 | The delivery plan permitted a Learning observation point that was not a confirmed V1 Test Seam. | proposed | Require the Learning behavior at S1. If S1 later proves uneconomical, amend and confirm the test strategy before testing at another seam. See the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md). |
| DOC-003 | The PDF Adapter contract appeared to own preservation of a Source Record when a PDF was unavailable. | proposed | Keep page, text, locator, and availability semantics in the PDF Adapter; preserve Source Records through Source Processing and repository behavior. See the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md). |
| DOC-004 | The Governance seam asserted that Working Material could be saved, although Knowledge Authoring owns autosave and persistence. | proposed | Test that Governance cannot promote Working Material without an eligible Proposal. See the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md). |
| DOC-005 | `_Avoid_` entries for terms such as “dashboard” and “tabs” could be read as global word prohibitions rather than rejected synonyms. | proposed | The user chose term-local synonym guidance. Literal uses that name different concepts remain valid. See the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md). |
| DOC-006 | The advisory memo's `targets` metadata omitted documents discussed in its conciseness observations. | resolved | The memo was corrected to include `stack-research.md`, `workbench.md`, and `software-design.md` before it was converted into an exact proposal. The issue was then removed from the proposal because no source-document change remained. |
| DOC-007 | The TDD, Workbench, architecture, delivery-plan, and software-design documents repeat seam and completion guidance. | deferred | Treat this as an editorial opportunity, not an architectural defect. The second pass found no safe, high-confidence deletion for the focused proposal. The deferral is recorded in the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md#deferred-work). |
| DOC-008 | The stack decision brief repeats some Electron, Tauri, risk, and implementation material found in ADRs and guidance. | deferred | Consider later editorial pruning only if each document's distinct authority remains clear. This is included in the broad pruning deferral in the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md#deferred-work). |
| DOC-009 | An applied guidance proposal retained future-tense approval instructions and did not accurately describe the commit that applied it. | proposed | Record approval and application dates, commit `91ac119ae735275bfaeef5f3f5e43a6e99eac681`, and the fact that the commit contained unrelated changes that are not retroactively approved. See the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md). |
| DOC-010 | Software-development guidance said “The implementation establishes” required scripts even though production implementation had not begun. | proposed | Change the sentence to the prospective “The initial implementation must establish.” See the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md). |
| DOC-011 | Product prose and the source template used an undefined `external locator` concept. | proposed | Remove the phrase from product decisions through the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md); replace the template field with explicit Source Asset metadata through the [PDF-import proposal](../proposals/2026-08-26-pdf-import-with-managed-or-linked-assets.md). Apply the document-review proposal first if both are approved. |
| DOC-012 | The post-reorganization code map still names planned application source and test roots as root-level `src/` and `tests/`, while the application namespace places application material under `app/`. | proposed | The user decided that planned production source and tests belong under `app/src/` and `app/tests/`. The exact code-map correction is now in the document-review proposal, and dependent proposal paths are aligned; it remains pending that proposal's exact approval. See the [document-review proposal](../proposals/2026-08-26-document-review-concerns.md). |
| DOC-013 | The ledger's Open work said there were two pending proposals, but `app/docs/proposals/` currently contains three pending proposals. | resolved | The count was corrected to three. The pending set is the document-review, Repository Format, and PDF-import proposals; the older software-design proposal is applied. |

## Product-direction and repository findings

| ID | Finding | Status | Disposition and controlling record |
| --- | --- | --- | --- |
| DES-001 | The intended application form needed confirmation: desktop application or web application. | resolved | V1 is a macOS desktop application built on Electron, with a cross-platform-capable foundation. The accepted direction is documented in [product decisions](../architecture/v1-ui/product-decisions.md#product-shape). |
| DES-002 | The design did not explicitly choose Git as the production Knowledge Repository backend. | proposed | Use a local Git working tree and Git commits for durable Governed Knowledge versions. See [Use an application-independent Git Repository Format](../proposals/2026-08-26-git-backed-knowledge-repository.md). |
| DES-003 | Large repository-managed files need a portable storage mechanism compatible with GitHub. | proposed | Support standard Git LFS pointers and committed `.gitattributes` policy while keeping GitHub optional and outside the knowledge model. See the [Repository Format proposal](../proposals/2026-08-26-git-backed-knowledge-repository.md) and [Git/LFS research](../../../knowledge-repository/sources/web/2026-08-26-git-lfs-backend-research.md). |
| DES-004 | Knowledge files were not sufficiently specified as logically and physically independent from application files and releases. | proposed | Define a versioned Galaxy Brain Repository Format, separate filesystem roots and lifecycles, compatibility checks before writes, and explicit reversible migrations. See the [Repository Format proposal](../proposals/2026-08-26-git-backed-knowledge-repository.md). |
| DES-005 | Adding a PDF did not let the user choose between repository-managed storage and an external OS file. | proposed | Add an “Add PDF” flow, discoverable as “Import PDF,” with managed and linked-local Source Asset modes. Neither mode commits a machine-specific path. See the [PDF-import proposal](../proposals/2026-08-26-pdf-import-with-managed-or-linked-assets.md). |
| DES-006 | A remote Git repository could be mistaken for a complete backup despite separate Git refs and LFS-object availability. | proposed | The design now refuses to claim that a remote is a verified backup; complete backup automation remains deferred. See the [Repository Format proposal](../proposals/2026-08-26-git-backed-knowledge-repository.md#deferred-work) and [Git/LFS research](../../../knowledge-repository/sources/web/2026-08-26-git-lfs-backend-research.md#open-questions). |
| DES-007 | Application-project documents and knowledge-base working directories did not have a single explicit boundary, allowing app proposals and review records to drift into `projects/` and `proposals/`. | resolved | `app/` is the application-project namespace; `knowledge-repository/` is the Knowledge Repository namespace. The boundary is recorded in the [repository README](../../../README.md#structure), [project-documentation README](../README.md), and [knowledge-base guidance](../agents/knowledge-base.md#repository-roles). |
| DES-008 | The mixed development checkout's outer Git repository could be mistaken for the production Knowledge Repository backend, even though the design says a user's production repository occupies a separate root. | proposed | The user decided that the public application repository may contain repository infrastructure and sanitized development fixtures, while the actual Knowledge Repository remains a separate private Git repository and is never bundled with or required by the public application. The Repository Format proposal now records that boundary and defines that Workbench status, commits, and LFS state refer only to the user-selected repository; the proposal remains pending exact approval. See the [repository README](../../../README.md#structure), [Knowledge Repository README](../../../knowledge-repository/README.md), and [Repository Format proposal](../proposals/2026-08-26-git-backed-knowledge-repository.md). |

## Unresolved implementation and policy findings

| ID | Finding | Status | Disposition and controlling record |
| --- | --- | --- | --- |
| OPEN-001 | Which asset paths or file types should be eligible for Git LFS, and whether each tracking-rule change requires explicit approval. | proposed | The user decided that V1 managed PDFs use `assets/sources/**/*.pdf`, with no size threshold; linked-local sources remain outside the repository. Any future `.gitattributes` policy change or migration requires an explicit reviewed proposal. The exact PDF policy is in the PDF-import proposal, which the Repository Format proposal explicitly depends on. See [Git/LFS research](../../../knowledge-repository/sources/web/2026-08-26-git-lfs-backend-research.md#open-questions). |
| OPEN-002 | Whether the application bundles maintained Git and Git LFS clients or validates system installations. | proposed | The user decided that the published Workbench bundles pinned, security-maintained Git and Git LFS clients. The exact packaging requirement is now in the Repository Format proposal and remains pending exact approval. See [Git/LFS research](../../../knowledge-repository/sources/web/2026-08-26-git-lfs-backend-research.md#open-questions). |
| OPEN-003 | Whether GitHub authentication relies entirely on Git credential helpers or requires GitHub-specific application integration. | deferred | The user deferred true GitHub authentication and account integration to future versions. V1 may use standard Git credential helpers for user-configured remotes, but does not add GitHub-specific authentication or account capabilities. See [Git/LFS research](../../../knowledge-repository/sources/web/2026-08-26-git-lfs-backend-research.md#open-questions). |
| OPEN-004 | Which backup target and verification cadence guarantee recovery of required Git refs and reachable LFS objects independently of GitHub. | deferred | The user will perform Git-repository backups for now and deferred verified GitHub-based backup automation to future versions. V1 makes no claim that a remote is a complete backup. See [Git/LFS research](../../../knowledge-repository/sources/web/2026-08-26-git-lfs-backend-research.md#open-questions). |
| OPEN-005 | The concrete machine-local configuration format and UI for resolving linked PDFs and changing storage modes are unspecified. | deferred | They remain implementation details constrained by portable Source Records, no committed absolute paths, explicit mode changes, and preservation on failure. See the [PDF-import proposal](../proposals/2026-08-26-pdf-import-with-managed-or-linked-assets.md#deferred-work). |
| OPEN-006 | GitHub authentication, automatic synchronization, conflict resolution, and verified off-device backup are not designed as V1 capabilities. | deferred | These are explicitly outside the focused storage proposal and require separate reviewed capabilities. See the [Repository Format proposal](../proposals/2026-08-26-git-backed-knowledge-repository.md#deferred-work). |
| OPEN-007 | Future Repository Format versions and concrete migration paths do not yet exist. | deferred | Each future format revision and migration requires its own exact proposal; no migration is implied by the pending V1 design. See the [Repository Format proposal](../proposals/2026-08-26-git-backed-knowledge-repository.md#deferred-work). |
| PROP-001 | The pending Repository Format and PDF-import proposals both define `Source Asset` in `CONTEXT.md`, but with different wording and `_Avoid_` terms. Applying both exact diffs is not a deterministic single change. | proposed | The user chose the PDF-import proposal as the sole owner of the `Source Asset` definition. The duplicate Repository Format hunk has been removed, and the Repository Format diff was revalidated before the proposals' pending exact approvals. See the [Repository Format proposal](../proposals/2026-08-26-git-backed-knowledge-repository.md) and [PDF-import proposal](../proposals/2026-08-26-pdf-import-with-managed-or-linked-assets.md). |
| PROP-002 | The Repository Format proposal includes PDF-import behavior while the PDF-import proposal independently targets the same architecture, test, delivery, code-map, and guidance documents. The PDF proposal refers to a “companion-proposal dependency” without naming it, and the Repository Format proposal names only the document-review dependency. | proposed | The user chose separate proposals with the explicit dependency chain `document-review → Repository Format → PDF import`. The Repository Format proposal now owns generic repository and Git/LFS behavior; the PDF-import proposal owns PDF `Source Asset` behavior and its source-template fields. Both proposals state the dependency and their post-dependency base state; exact approval remains pending. See the [Repository Format proposal](../proposals/2026-08-26-git-backed-knowledge-repository.md) and [PDF-import proposal](../proposals/2026-08-26-pdf-import-with-managed-or-linked-assets.md). |

## Working decisions

- Keep this ledger as the single cross-session review index, while leaving exact changes in proposals and architectural trade-offs in ADRs.
- Retain resolved findings rather than deleting them, so later readers can distinguish “never considered” from “considered and settled.”
- Update a finding's status and disposition when its controlling proposal or decision changes; do not copy the controlling artifact's full text.
- Treat the pending proposals as an explicit dependency chain: document-review first, Repository Format second, and PDF import third.
- Keep the public application repository open-sourceable: it may contain repository infrastructure and sanitized fixtures, while the user's actual Knowledge Repository remains a separate private Git repository.
- Keep GitHub-specific authentication and verified backup automation deferred from V1; standard Git credential helpers and user-managed Git backups remain outside the knowledge model.
- Use `assets/sources/**/*.pdf` as the V1 managed-PDF LFS policy with no size threshold; linked-local sources remain outside the repository.
- Keep Galaxy Brain application documentation and proposals under `app/docs/`; reserve `knowledge-repository/projects/` and `knowledge-repository/proposals/` for knowledge-base material.

## Open work

- Seek exact approval for the three reconciled pending proposals in dependency order.
- Approve, reject, revise, or apply the three pending proposals through their own exact approval gates.
- Revisit deferred findings only through a scoped review; deferral alone does not authorize implementation or deletion.
- Commit this ledger and the other current working files when the user wants them preserved in repository history.
