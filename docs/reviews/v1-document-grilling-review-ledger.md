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

Finding IDs preserve their historical origin. In particular, the `OPEN-*` prefix does not mean a finding is currently open; use the Status column and disposition as the authority.

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
| DOC-009 | An applied guidance proposal retained stale approval instructions. | resolved | The guidance proposal is now a concise applied record with its approval, application date, and commit; the historical diff remains in Git. |
| DOC-010 | Software guidance used present tense for not-yet-existing package scripts. | resolved | The wording is prospective. |
| DOC-011 | Product prose and source metadata used an unclear external-locator concept. | resolved | Product language now uses Source Locator and source metadata uses `logical_locator`; local paths remain machine-local. |
| DOC-012 | Planned source and test roots were written as root-level `src/` and `tests/`. | resolved | The code map now uses `app/src/` and `app/tests/`. |
| DOC-013 | The ledger had an incorrect pending-proposal count. | resolved | The old three-proposal chain was reconciled and applied; future changes use new scoped proposals. |
| DOC-014 | Repeated rules across project documents lacked an explicit authority map. | resolved | `docs/README.md` now assigns each document family a canonical responsibility and directs other documents to summarize and link. |
| DOC-015 | The long-term product vision and the minimum V1 release boundary were not clearly separated. | resolved | Product Decisions now defines the provider-free core gate, optional provider-enabled V1 capabilities, and post-V1 work; architecture and delivery documents point to it. |
| DOC-016 | Historical `OPEN-*` IDs could be mistaken for current unresolved status. | resolved | The ledger now states that the Status column, not the identifier prefix, determines current state. |
| DOC-017 | The Repository Format was described as a contract without saying how much detail was intentionally specified. | resolved | The format now states that its stable boundary is deliberate and that concrete schemas will be introduced with the file-backed Adapter and S5 contract tests. |
| DOC-018 | Future-work inventories were repeated across documents and had drifted apart. | resolved | Product Decisions now owns the canonical post-V1 inventory; related documents link to it instead of maintaining competing lists. |
| DOC-019 | The generic source template silently defaulted every source to `source_type: paper`. | resolved | The starter and fixture now provide `book`, `course`, `paper`, `web`, and `other` templates with explicit source-type metadata. |
| DOC-020 | Historical Git/LFS research in the synthetic fixture could be mistaken for current product direction. | resolved | The source note now has a prominent historical-design notice, labels its product inference and questions as historical, and links to current authority. |
| DOC-021 | Starter documentation described source subdirectories that the starter did not contain. | resolved | The starter now includes empty `books/`, `courses/`, `papers/`, and `web/` directories, matching its source guidance and fixture structure. |
| DOC-022 | Fixture templates had undocumented extensions beyond the starter templates. | resolved | Fixture templates now mirror starter templates exactly; fixture-specific behavior belongs in fixture content or tests. |

## Repository and product findings

| ID | Finding | Status | Disposition |
| --- | --- | --- | --- |
| DES-001 | The intended product form needed confirmation. | resolved | V1 is a macOS desktop Workbench built on Electron with a cross-platform-capable foundation. |
| DES-002 | Git had not been explicitly chosen as the production backend. | superseded | The later decision is VCS-neutral portable files with optional external Git; see [ADR 0005](../adr/0005-use-portable-files-with-optional-external-version-control.md). |
| DES-003 | Large-file handling was framed around GitHub-compatible LFS. | superseded | Managed assets are ordinary repository files to Galaxy Brain; users may configure Git LFS externally. |
| DES-004 | Knowledge files lacked an explicit independent application boundary. | resolved | The VCS-neutral Repository Format, separate lifecycle, and compatibility rules are documented in the [Repository Format](../architecture/v1-ui/repository-format.md). |
| DES-005 | PDF import did not offer managed versus external storage. | resolved | Add PDF creates a Source Record and offers `managed` or `linked-local`. |
| DES-006 | A remote could be mistaken for a complete backup. | resolved | Galaxy Brain makes no commit, synchronization, or backup claim; backup remains external user responsibility. |
| DES-007 | Application and knowledge-base namespaces could be confused. | resolved | Application docs remain under `docs/`; public fixtures and starter files are under `app/`; private knowledge is external. |
| DES-008 | The mixed checkout could be mistaken for the user's production repository. | resolved | The current generic tree is a synthetic fixture; the actual private repository is an independent sibling or otherwise explicitly selected root. |
| DES-009 | Public release could expose private content or history. | resolved | The public project is MIT-licensed and contains only synthetic fixtures and a starter skeleton; private content is never synchronized into it. |
| DES-010 | A separate template repository would burden ordinary app users. | resolved | The app bundles an empty skeleton and can scaffold it without initializing Git; a standalone template remains optional future work. |
| DES-011 | V1 needed an explicit local-first capability boundary. | resolved | Local use requires no Git, Git LFS, GitHub, credentials, remotes, or network. GitHub-dependent capabilities are optional and non-blocking. |
| DES-012 | The app needed a safe policy for externally changed governed files. | resolved | Targeted fingerprints detect changes; external edits are preserved and require explicit review before adoption. |
| DES-013 | Missing Agent Provider configuration could accidentally become an application prerequisite. | resolved | API keys and provider configuration are optional machine-local capabilities; local Workbench workflows remain usable, while Agentic Capabilities report a clear unavailable state. |
| DES-014 | It was unclear whether provider-dependent behavior was V1 scope or future scope. | resolved | Agentic Capabilities remain optional V1 behavior; provider-free local use is the minimum V1 release gate, and provider selection may remain deferred until its slice. |
| DES-015 | Repository resume behavior was ambiguous alongside the explicit-selection rule. | resolved | The Workbench may resume the exact previously selected root after validation; unavailable or invalid paths produce explicit Open/Create recovery choices without discovery or substitution. |
| DES-016 | Provider-unavailable behavior was explicit for Ask but not consistently defined for every Agentic Capability. | resolved | Provider-dependent operations share `agent-provider-unavailable`; provider-independent work and captured material remain usable and unchanged. |
| DES-017 | Provider-free users needed a clear path from Working Material to Governed Knowledge. | resolved | Users may manually create and apply exact-diff Proposals without an Agent Provider; agent assistance is optional and Governance remains authoritative. |
| DES-018 | It was unclear whether promoted knowledge remained editable. | resolved | Governed Knowledge is authoritative but not immutable; users edit Working Material drafts and apply reviewed replacement versions, preserving prior versions and audit history. See [ADR 0009](../adr/0009-keep-governed-knowledge-editable-through-evolution.md). |
| DES-019 | The initial Agent Provider credential mechanism was undecided. | resolved | V1 uses a machine-local application `.env` file, excluded from version control and documented by [`app/.env.example`](../../app/.env.example); absence remains non-blocking, while OS-backed storage and provider-native OAuth are deferred. See [ADR 0010](../adr/0010-use-machine-local-env-for-v1-provider-configuration.md). |
| DES-020 | The V1 Agent Provider and model ecosystem boundary was undecided. | resolved | V1 focuses on the OpenAI API through `OPENAI_API_KEY`; other providers and model ecosystems are deferred. This does not require ChatGPT consumer-account login or OAuth. See [ADR 0010](../adr/0010-use-machine-local-env-for-v1-provider-configuration.md). |
| DES-021 | The boundary for sending private repository material to OpenAI was undecided. | resolved | Every outbound Agentic Capability request requires explicit per-operation confirmation with a visible scope; declining makes no request and preserves local state. V1 has no blanket consent, silent request, or whole-repository upload. See [ADR 0012](../adr/0012-require-explicit-confirmation-before-agent-transmission.md). |
| DES-022 | It was unclear whether confirmation covered user-only OpenAI prompts or only repository-derived material. | resolved | V1 requires explicit confirmation for every OpenAI request, including user-only prompts; configurable confirmation policies are deferred. See [ADR 0012](../adr/0012-require-explicit-confirmation-before-agent-transmission.md). |
| DES-023 | The amount of outbound request detail shown before OpenAI confirmation was unspecified. | resolved | V1 shows a concise summary plus an inspectable exact payload, expanding small requests by default when practical; large requests may collapse the payload without hiding it. The confirmed payload is final. See [ADR 0012](../adr/0012-require-explicit-confirmation-before-agent-transmission.md). |
| DES-024 | It was unclear whether users could minimize a pending outbound request before confirmation. | resolved | V1 permits removing whole context items, regenerates the summary and exact payload, and defers arbitrary inline redaction or payload editing. See [ADR 0012](../adr/0012-require-explicit-confirmation-before-agent-transmission.md). |
| DES-025 | The retention policy for OpenAI prompts, context, and responses was undecided. | resolved | V1 treats payloads as transient and does not retain them in automatic history, caches, logs, audit records, or support files; only explicit user saves persist results. See [ADR 0013](../adr/0013-do-not-retain-openai-payloads-by-default.md). |
| DES-026 | The provenance metadata for explicitly saved OpenAI results was unspecified. | resolved | Saved results are labeled agent-generated and retain provider, pinned model, timestamp, operation, and applicable source-context references; provenance survives human edits without granting Governance authority. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-027 | The retention choice for the prompt and context when saving an OpenAI result was unspecified. | resolved | The default save retains result and provenance only; a separate explicit save-with-prompt/context choice retains the human-facing material without automatically retaining the hidden full API payload. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-028 | The meaning of saved context representation in the explicit prompt/context save path was unspecified. | resolved | The optional path retains the human-facing prompt, selected source references or locators, and concise context summaries, but not full source excerpts or the hidden full API payload. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-029 | It was unclear whether saved source references and summaries should change when their sources change. | resolved | The optional saved prompt/context is a point-in-time snapshot. It may link to the current source for navigation, but later source changes must not silently rewrite the saved artifact. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-030 | It was unclear how the Workbench should communicate that a saved context snapshot is stale. | resolved | Opening a saved artifact whose referenced source has changed shows a non-blocking warning distinguishing the saved snapshot from the current source; the artifact remains accessible and is not silently refreshed. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-031 | The identity used to detect a changed referenced source was unspecified. | resolved | On opening a saved artifact, compare the saved source identity and content identity with the current source when available; a mismatch triggers the non-blocking stale-context warning. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-032 | The behavior when a referenced source could not be verified was unspecified. | resolved | Preserve the saved snapshot and show `source status unavailable` without claiming that the snapshot is current when the source cannot be checked or lacks a comparable identity. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-033 | The behavior of an explicit refresh for a saved context snapshot was unspecified. | resolved | An explicit refresh creates a new snapshot/version and preserves the original; it never silently replaces the historical context in place. Result regeneration is handled separately by DES-034. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-034 | It was unclear whether refreshing a context snapshot should also regenerate the agent result. | resolved | Refresh updates only the saved context representation; result regeneration is a separate explicit action requiring fresh confirmation before any new OpenAI request. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-035 | It was unclear whether explicit result regeneration should overwrite or version the previous agent output. | resolved | Regeneration creates a new result version and preserves the previous result; earlier agent output is never silently overwritten. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-036 | It was unclear how multiple result versions should appear in the user's collection. | resolved | Present the newest result as current and expose prior versions through ordinary artifact history rather than separate top-level items. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-037 | It was unclear whether restoring an older result should overwrite later versions or create a new version. | resolved | Explicit restore creates a new current version derived from the selected older result, preserves all intervening versions, and makes no OpenAI request. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |
| DES-038 | The retention policy for prior agent-result versions was unspecified. | resolved | Retain prior versions by default with no automatic cleanup; future deletion or history pruning requires explicit approval and a warning about lost recovery and provenance. See [ADR 0014](../adr/0014-preserve-agent-provenance-on-explicit-save.md). |

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
| OPEN-017 | Future learning support could benefit from provider-enabled tutoring around a topic. | deferred | Consider topic-grounded tutoring sessions with explanations, questions, practice, and feedback when an Agent Provider is configured; tutoring must not mutate Governed Knowledge or advance user-owned progress automatically. |
| OPEN-018 | Support for providers and model ecosystems beyond the V1 OpenAI API. | deferred | V1 focuses on the OpenAI API through `OPENAI_API_KEY`; additional providers and model ecosystems require a future scoped design and external Adapter decisions. |
| OPEN-019 | Dynamic model discovery or user-facing model selection. | deferred | V1 uses one internally selected, pinned OpenAI model version; dynamic discovery, switching, and user-facing selection require future capability, cost, fallback, and reproducibility design. See [ADR 0011](../adr/0011-use-one-pinned-openai-model-for-v1.md). |
| OPEN-020 | Configurable Agent confirmation policies. | deferred | V1 always confirms every OpenAI request; future settings may consider remembered consent or trusted-operation exemptions only through a separate privacy and UX decision. |

## Proposal reconciliation

The original three pending proposals were revised and applied after the grilling decisions:

- [Document review concerns](../proposals/2026-08-26-document-review-concerns.md)
- [Application-independent local-first Repository Format](../proposals/2026-08-26-git-backed-knowledge-repository.md)
- [PDF import with managed or linked assets](../proposals/2026-08-26-pdf-import-with-managed-or-linked-assets.md)

The proposals now agree on the VCS-neutral, local-first design. Their `Applied commit` fields identify commit `d6a403c`.

The separately applied [software design and human-agent collaboration guidance proposal](../proposals/2026-08-26-software-design-and-collaboration-guidance.md) now uses the same concise applied-record format.

## Working decisions

- Keep the private Knowledge Repository independent and conventionally sibling to the public application project.
- Publish only MIT-licensed app/infrastructure, synthetic fixtures, and an empty starter skeleton.
- Keep repository files portable and VCS-neutral; users manage Git externally if desired.
- Keep local Workbench use independent of Git, Git LFS, GitHub, credentials, remotes, and network connectivity.
- Keep local Workbench use independent of Agent Provider configuration and API keys; make Agentic Capabilities explicitly unavailable rather than blocking the app.
- Treat Agentic Capabilities as optional V1 behavior layered over a complete provider-free local Workbench.
- Preserve local rollback and audit history in the repository, with explicit transaction and external-edit safeguards.
- Keep multi-repository support, GitHub capabilities, demo mode, and Repository Housekeeping deferred.

## Open work

- Revisit deferred findings only through a scoped proposal and explicit review.
