# Test strategy

Status: **accepted on August 26, 2026**. Coverage enforcement requirements for [Issue #47](https://github.com/tacomancy/galaxy-brain/issues/47) were documented on August 28, 2026; numeric thresholds remain pending baseline measurement.

Tests should describe behavior through public interfaces and survive changes to framework, editor engine, route implementation, persistence layout, and internal module composition. The following seams intentionally cover the highest-risk behavior without testing every internal module.

## Selection rationale

S1 through S5 were selected to balance three goals:

1. **Observe meaningful behavior.** Every test result should matter to a Workbench user, a Module caller, or the correctness of a production Adapter.
2. **Concentrate integrity risk.** Governance, provenance, discovery authority, and Adapter fidelity deserve focused tests because defects there could make the Workbench confidently misrepresent knowledge.
3. **Preserve implementation freedom.** UI frameworks, storage layouts, editor engines, PDF engines, and internal Module composition should be replaceable without rewriting behavior tests.

The seams form a layered test surface:

```text
                    S1 Desktop workflow
                  /          |           \
       S3 Source Processing  S2 Governance  S4 Discovery
                  \          |           /
                   S5 Adapter contracts
```

S1 proves that the assembled product works. S2 through S4 provide economical, precise coverage of the highest-risk application rules. S5 proves that production and test infrastructure mean the same thing. The layers overlap deliberately at a small number of critical workflows; they do not duplicate every assertion at every seam.

## Coverage enforcement

[Issue #47](https://github.com/tacomancy/galaxy-brain/issues/47) defines the coverage gate that complements these Test Seams. The gate is a verification obligation, not a new Test Seam and not evidence that behavior is correct by itself.

The measured production surface is the TypeScript and TSX source under `app/src/`. Coverage configuration must select that surface explicitly rather than measuring only files imported by the current tests. TypeScript declaration files (`*.d.ts`), generated output, dependencies, test files, and workflow artifacts are outside the measured surface. The exact include and exclude patterns belong to the Vitest configuration once the gate is implemented.

The gate measures Vitest's four supported dimensions:

- lines;
- functions;
- branches; and
- statements.

Vitest does not expose a separate `conditions` dimension. Branch coverage is therefore the initial proxy for condition coverage; documentation and CI must not describe the two as identical. Exact condition coverage would require a separately justified post-processing or tooling decision.

Before selecting numeric floors, the implementation must record a baseline for the explicitly selected production surface and inspect the uncovered files and locations. Global thresholds and per-file floors are then chosen from that evidence and the importance of the covered surface. The issue's initial candidates—80% lines, 80% functions, 70% branches, and 80% statements—are calibration inputs, not an accepted policy. Thresholds should ratchet upward deliberately rather than being lowered merely to make the current branch pass.

The implementation will expose `npm run test:coverage` from `app/`. That command must emit text for local feedback, HTML for human inspection, LCOV for tooling, and a machine-readable report. Failures must identify the breached dimension and the uncovered files or locations clearly. The command must retain the existing `npm test` behavior and remain part of the broader verification story rather than replacing behavioral, contract, accessibility, security, packaging, or human review.

GitHub Actions will run a clearly named `Coverage limits` job for pull requests targeting `main`. The job must be unconditional for applicable pull requests, preserve the existing verification and desktop workflow jobs, and become a required status check through branch protection or a repository ruleset. Desktop Electron/WebdriverIO coverage remains a separate concern because the current Vitest command does not automatically instrument those workflows.

Issue #47 is not complete until the measured baseline, final global and per-file floors, local command, reports, pull-request job, required-check configuration, and green existing verification gate are all recorded. Broad exclusion lists, thresholds chosen without a baseline, and claims that coverage proves correctness are outside this policy.

## S1 — Desktop workflow seam

- Opening a saved context snapshot whose current source cannot be checked or lacks a comparable identity shows `source status unavailable`, preserves the snapshot, and does not claim that it is current.
- Explicitly refreshing a saved context snapshot creates a new snapshot/version and preserves the original; no silent in-place replacement occurs.
- Refreshing a snapshot updates only its saved context representation; regenerating the agent result is a separate action, and any resulting OpenAI request requires fresh confirmation.
- Explicitly regenerating an agent result creates a new result version and preserves the previous result; it does not silently overwrite earlier output.
- The Workbench presents the newest result as current and exposes prior result versions through ordinary artifact history without creating separate top-level items for each regeneration.
- Explicitly restoring an older result creates a new current version, preserves all intervening versions, and makes no OpenAI request.
- Prior agent-result versions are retained by default with no automatic cleanup; any future deletion or history-pruning action requires explicit approval and explains the lost recovery and provenance.

**Public interface:** the rendered desktop Knowledge Workbench operated through accessible user actions and observed through visible content, focus, navigation state, and durable outcomes returned by the Workbench.

**Decision rationale:** this is the only seam that proves Atlas, Studio, Paper Desk, and Proposal Review form one coherent product. It covers the composition of UI adapters and real in-process application Modules through the Interface closest to the person using the Workbench.

Lower seams can prove that a Proposal is eligible or that a Structured Annotation retains its Source Locator. They cannot prove that a person can find the Proposal, understand its evidence, complete Judgment with a keyboard, or observe the resulting version. S1 therefore owns cross-workspace continuity, accessibility, and the visible completion of critical workflows.

Critical behaviors:

- A fresh Workbench opens Atlas; a meaningful prior activity resumes with its context.
- An explicitly selected repository may resume from machine-local session state; an unavailable or invalid remembered path does not trigger repository discovery and instead presents explicit recovery choices.
- Global switching and contextual transitions preserve the relevant topic, Source Record, annotations, or Proposal.
- Atlas separates continuation from pending Judgment and links every metric to the items it counts.
- Studio preserves supported meaning across rich and source editing.
- Paper Desk captures a located Structured Annotation without automatically creating a Proposal.
- Proposal review shows exact changes and applies only eligible decisions.
- Search, Ask, and Jump visibly execute the selected mode.
- Keyboard-only operation, focus behavior, semantic structure, theme selection, and reduced motion are observable desktop behaviors.
- Local repository creation and editing remain usable without Git, Git LFS, GitHub, credentials, or network connectivity, and saved-local status never claims commit or backup.
- The Workbench remains usable without Agent Provider configuration or an API key; Agentic Capabilities show a clear unavailable outcome rather than blocking startup or local workflows.
- Every OpenAI request from an Agentic Capability, including a user-only prompt, presents a concise summary and an inspectable exact payload for explicit confirmation; users may remove whole context items and observe the regenerated payload, but arbitrary inline redaction is not available. Small requests may expand by default, but no content is hidden or silently added after approval. Cancellation makes no request and leaves local state unchanged.
- OpenAI request and response payloads are not retained in automatic history, caches, logs, audit records, or support files; a result persists only when the user explicitly saves it as a repository artifact.
- An explicitly saved OpenAI result is labeled agent-generated and preserves provider, pinned model, generation timestamp, operation, and applicable Source Record or Source Locator references; the metadata does not make it Governed Knowledge.
- The default save omits the human-facing prompt and context; a separate explicit save-with-prompt/context action includes the human-facing prompt, selected source references or locators, and concise context summaries as a point-in-time snapshot, but not full source excerpts or the hidden full API payload. A mismatch in saved versus current source identity or content identity may affect navigation targets but does not rewrite the saved snapshot; the Workbench shows a non-blocking warning that the source changed.

Tests at this seam use real application Modules and locally substitutable Adapters. In-memory Adapters remain appropriate for behaviors that do not require durable files; a behavior that explicitly proves the local file lifecycle, such as Tracer Bullet 2, uses the production file-backed Adapter against isolated temporary roots. These tests assert the stable Workbench outcome through the rendered `data-workbench-outcome` marker and visible state rather than parsing explanatory error strings. They do not mock workspace Modules, inspect UI implementation state, select editor-engine nodes, or query storage as a UI side channel.

Tracer Bullet 2 S1 coverage proves the fresh Open/Create actions; creation at new and explicitly empty paths; opening a valid repository without rewriting existing content; rejection of nonempty invalid directories without mutation; cancellation and failed replacement preserving selection; visible recovery for invalid, unsafe, unavailable, and unsupported targets; and usability without Git, Git LFS, GitHub credentials, an Agent Provider, or network access. The workflow uses isolated temporary roots and the production file-backed Adapter. Its expected manifest values, canonical directory names, sentinel contents, and absence of fixture subject matter are written independently of the implementation and follow the checked-in [starter inventory](starter-inventory.md).

Supporting S5 contract coverage runs with the same required manifest, canonical roots, unknown-content preservation, safe writes, symlink rejection, failure cleanup, and format compatibility rules. The checked-in starter inventory records starter-relative paths and content categories, including README files, registry seeds, templates, `.gitattributes`, and `.gitkeep` entries; intentional skeleton changes update that inventory in the same reviewed change. The automated environment denies Git process execution and outbound sockets so unexpected boundary calls fail deterministically. Manual acceptance additionally records native chooser behavior, accessibility and focus, local-only status language, and the selected paths used.

**Why S1 is not the only Test Seam:** expressing every version, dependency, provenance, and authority edge case through the UI would make the suite slow, repetitive, and sensitive to harmless presentation changes. S1 proves representative end-to-end paths; S2 through S4 exhaustively protect the dense rules behind those paths.

## S2 — Governance seam

**Public interface:** the Governance module's Proposal, Judgment, and application operations and their returned domain outcomes.

**Decision rationale:** exact-version approval, selective Judgment, dependencies, auditability, and reversibility carry the highest integrity risk in the Workbench. An error could silently turn Working Material into Governed Knowledge or apply a decision to material the user never reviewed. Those rules need precise tests independently of any UI adapter.

Governance also has enough depth to justify its own Test Seam: a small Interface hides Proposal eligibility, version comparison, dependency validation, stale-review detection, reversible application, and audit behavior. If the Governance Module were removed, those rules would spread across Studio, Proposal Review, persistence, and agent workflows.

Critical behaviors:

- Governance cannot promote Working Material without an eligible Proposal.
- An unapplied or partially ineligible Proposal cannot alter Governed Knowledge.
- Judgment can accept, edit, defer, or reject independently reviewable changes.
- A user can manually create a Proposal from Working Material without an Agent Provider; agent assistance is optional.
- A user can edit an existing Governed Knowledge item through a Working Material draft, apply a reviewed Proposal, observe the new version, and retrieve the prior version.
- Dependencies prevent an incoherent subset from being applied.
- A changed Proposal or target makes prior Judgment stale.
- Applying an eligible Proposal creates the specified new version, preserves the prior version, and records the exact decision.

Expected changes are known literal patches and version identifiers from fixtures. A test must not derive its expected diff by calling the same renderer or differ used by the implementation.

**Why not verify through S1 or storage alone:** S1 would make combinatorial eligibility cases expensive to express. Reading repository files afterward would verify through a side channel and couple tests to persistence layout. S2 asks Governance directly for its domain outcome and retrieves resulting versions through the same Interface used by its callers.

## S3 — Source Processing seam

**Public interface:** the Source Processing module's capture, availability, relinking, and Synthesis operations and returned domain outcomes.

**Decision rationale:** source provenance must survive replacement of both the PDF engine and the Paper Desk UI. This seam concentrates the distinction among source text, personal interpretation, agent inference, and proposed knowledge changes, rather than distributing those rules across highlight controls, view state, and repository code.

Source Processing is deep enough to warrant direct behavior tests: its small Interface hides locator integrity, attribution, classification, incomplete-capture state, source availability, relinking, target suggestions, and the rule that capture never implies Synthesis.

Critical behaviors:

- Capture preserves a known source identity and Source Locator.
- Classification and attribution remain visible after autosave and reopen.
- Synthesis considers only the selected Structured Annotations.
- Agent-assisted Synthesis previews its selected annotations and target context, lets the user remove whole context items, regenerates the exact outbound payload, and sends nothing before explicit confirmation. It preserves captures when the user declines. The same confirmation rule applies when an Agentic Capability has no repository-derived context.
- Agent-assisted Synthesis does not persist the request or response automatically; only an explicitly saved draft Proposal or Working Material retains the result.
- Explicitly saved agent results retain agent provenance through later human edits and remain Working Material until governed.
- Synthesis may produce a draft Proposal, a source link without a knowledge change, or an explicit no-action result. An open question may be proposed inside a draft Proposal; it is not a separate direct outcome.
- Agent-assisted Synthesis returns `agent-provider-unavailable` without a configured provider and preserves the captured annotations; provider-independent source review remains usable.
- Finishing a source never triggers Synthesis automatically.
- When a PDF is unavailable, existing annotations remain usable and relinking preserves their logical locators.

PDF fixtures provide independently known page text and locator values. Tests assert those literals rather than reproducing locator computation.

**Why not test only through Paper Desk or the PDF Adapter:** Paper Desk tests would entangle provenance rules with presentation, while the PDF Adapter can only promise that source material was resolved. Neither alone can prove that a capture remains correctly attributed, that Synthesis uses only selected annotations, or that relinking preserves logical Source Locators.

## S4 — Discovery seam

**Public interface:** the Discovery module's explicit Search, Ask, and Jump intentions and their mode-specific results.

**Decision rationale:** Search, Ask, and Jump share one visual input but carry materially different trust semantics. Search retrieves, Ask synthesizes a cited response, and Jump invokes navigation or a command. A generic input pipeline could blur those intentions and cause an Ask response to look like retrieved knowledge or a command to be interpreted as a question.

S4 gives those intentions one explicit caller Interface with mode-specific outcomes while hiding indexing, context assembly, model prompting, command lookup, authority classification, and unsupported-answer logic.

Critical behaviors:

- Search returns matching repository items with their authority class.
- Ask cites the exact fixture notes and Source Locators it used.
- Ask distinguishes Core Knowledge from Working Material, surfaces fixture conflicts, and returns an unsupported outcome when evidence is insufficient.
- Jump returns only known navigation or command targets and never interprets a command as an Ask request.
- No Discovery operation changes Working Material or Governed Knowledge.
- Ask reports an unavailable-provider outcome without an API key or configured Agent Provider, while Search and Jump remain usable.
- Ask presents its concise request summary, exact expandable payload, and OpenAI destination for explicit confirmation before sending; removing a context item regenerates both views, and declining makes no request and changes no knowledge, including when the prompt contains no repository context.
- Ask displays a successful response transiently and does not retain its prompt, context, or response unless the user explicitly saves it.
- When Ask output is explicitly saved, the saved artifact carries agent-generated attribution and its provider, model, timestamp, operation, and applicable source-context metadata.
- Ask's default save excludes the prompt and context, while the explicit save-with-prompt/context choice preserves the human-facing prompt, selected source references or locators, and concise context summaries as a point-in-time snapshot, but not full source excerpts. A mismatch in saved versus current source identity or content identity does not rewrite that saved snapshot; opening it shows a non-blocking stale-context warning.
- Generated Relationship and learning-progress suggestions report `agent-provider-unavailable` without mutating repository content or learning state.

The model is mocked only at its true external seam with a narrow Ask response. Repository search and authority rules remain real.

**Why not test only through S1 or a model mock:** S1 proves that the selected mode is visible and usable, but it is an inefficient place to enumerate authority and conflict cases. A model mock alone would only prove that an external response was returned. S4 proves the Workbench's own citation, authority, conflict, insufficiency, and non-mutation rules around that response.

## S5 — Adapter contracts

**Public interfaces:** the Knowledge Repository and PDF adapter interfaces.

**Decision rationale:** the Knowledge Repository and PDF seams each have at least two justified Adapters: a production Adapter and a deterministic test Adapter. They are therefore real seams rather than speculative abstractions. A defect or semantic mismatch could invalidate every higher-level test while still allowing the suite to pass against an unrealistic test implementation.

Contract behaviors:

- Each Knowledge Repository adapter preserves attribution, Source Records, Source Locators, the distinction between Working Material and Governed Knowledge, repository-held audit records, and targeted rollback data.
- The file-backed Adapter preserves unknown content, rejects unsafe writes to unsupported formats, detects external changes, and recovers interrupted transactions without requiring Git.
- The in-memory and file-backed Adapters expose the same repository behavior; neither invokes Git or Git LFS.
- Each PDF adapter resolves the same fixture page and locator semantics or reports unavailability without discarding the Source Record.

Contract tests are shared across adapters. They do not assert filenames, SQL, parser calls, cache keys, or other implementation details unless such a detail is explicitly part of the adapter interface.

## V1 release criteria

Before V1 is considered complete, the assembled packaged application must prove through the public desktop workflow that it can open an existing repository or create one from the bundled skeleton, operate without Git, GitHub credentials, or Agent Provider configuration, and persist critical workflows through the file-backed Adapter. The release suite must cover an externally modified target, an interrupted file transaction, rollback, an unavailable or changed linked PDF, the unavailable-provider outcome, and the local-save notice that does not claim commit or backup status.

**Why S5 is separate from application behavior:** S1 through S4 legitimately use deterministic Adapters for speed and control. Shared contract tests provide the missing evidence that those Adapters and production Adapters preserve the same observable semantics. S5 tests conformance, not application rules.

The model provider is not included in S5. It is a true external dependency whose generative behavior cannot be made equivalent to a local test Adapter. The Workbench instead mocks the narrow external model Interface and verifies its own trust behavior at S4; provider-specific integration checks may be added later without becoming an application Test Seam.

## Why there are no additional Test Seams

The accepted architecture contains more Module Interfaces than confirmed Test Seams. This is deliberate.

- **Atlas, Studio, Paper Desk, and Proposal Review are not separate Test Seams.** Their meaningful behavior is visible through S1. Testing each UI adapter in isolation would encourage mocks of Workbench-owned Modules and couple tests to the initial presentation structure.
- **Workbench Session, Knowledge Authoring, and Learning are not separate Test Seams in V1.** Their critical behavior is currently economical to observe through S1. If a tracer bullet exposes dense rules that S1 cannot express without excessive setup, a new seam may be proposed rather than assumed.
- **Editor parsers, reducers, view models, caches, and routing helpers are Implementation details.** Tests reach them through the Module that owns their behavior.
- **The model provider is an External System Seam, not an application Test Seam.** A narrow Mock Adapter controls its responses while S4 verifies Galaxy Brain's behavior.

Adding tests at every Interface would reduce locality and bind the suite to the first decomposition. The accepted seams instead test where behavior is consequential and permit internal Modules to be combined, divided, or deepened without renegotiating tests unless their public observation point changes.

## Test data and mocks

Use a small, fixed example corpus whose expected outcomes are written independently of implementation:

- a reviewed “Bayesian statistics” topic with a known version;
- a Working Material draft that differs by a literal sentence;
- a PDF fixture with a known source identity, page number, passage, and equation;
- one supporting source and one conflicting source;
- a Proposal containing two changes with one explicit dependency; and
- a stale-target variant with a different literal version identifier.

Mocks are allowed only for true external dependencies such as a model provider. Prefer in-memory Adapters for local-substitutable dependencies unless the behavior under test explicitly requires durable file semantics; those cases use the production file-backed Adapter with isolated temporary roots and share the S5 contract. The TB2 harness denies Git process execution and outbound sockets so unexpected boundary calls fail deterministically. Inject clocks and identity sources when their outputs affect observable behavior.

## Prohibited test shapes

- Tests of private methods, reducers, view-model fields, component state, parser phases, or call ordering.
- Mocks of Workbench-owned modules merely to isolate a workspace.
- Assertions made by reading repository storage instead of using the public interface that retrieves the saved artifact.
- Snapshots whose expected output is produced by the same serializer under test.
- One bulk test suite written before any implementation.
- Refactoring mixed into a red-to-green cycle.

## Decision and change policy

S1 through S5 were explicitly confirmed as the V1 Test Seams on August 26, 2026. This decision establishes where tests may observe behavior; it does not freeze method names, type shapes, framework choices, or internal Module design.

If a tracer bullet reveals a missing or misplaced seam, implementation pauses before testing at the new location. Update this document with the proposed Interface, the critical behavior it protects, why an existing seam is insufficient, and the implementation freedom it preserves. Obtain explicit confirmation of that change before writing the test.
