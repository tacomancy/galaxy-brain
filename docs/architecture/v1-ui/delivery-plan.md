# Test-driven delivery plan

Status: Tracer Bullets 1 through 6 and TB6.1–TB6.3 complete and accepted on August 27, 2026; S1–S5 Test Seams remain confirmed.

Scope note: the release gate proves the provider-free core V1 workflow. Agentic Capabilities are optional V1 extensions and must degrade clearly when no Agent Provider is configured; post-V1 work remains outside this delivery sequence unless the Product Decisions explicitly promote it.

## Operating rule

This is an ordered sequence of candidate tracer bullets, not a backlog of tests to write in advance. Start a slice only after the preceding cycle is green and its evidence has been reviewed. For each slice:

1. Complete the documentation prerequisite below.
2. Select one behavior at a confirmed seam.
3. Write one behavior-named test with independently known expected values.
4. Run it and observe the expected failure for the missing behavior.
5. Add only enough implementation to make that test pass.
6. Run the relevant suite and observe green.
7. Record what the slice taught and choose or revise the next slice.

Do not refactor during the red-to-green loop. Refactoring belongs to a separate review stage while the suite is green.

## Documentation prerequisite

Before starting implementation of every tracer bullet, explicitly complete this task:

1. Review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md) when the slice touches repository files, [Test Strategy](test-strategy.md), applicable ADRs, and the completed delivery records for preceding tracer bullets.
2. Create or update a guidance-compliant `tracer-bullet-<N>-spec.md` brief for the slice.
3. Record the first Public Behavior, confirmed Test Seam, independently known expected values, required fixtures and External System Seams, minimum vertical path, scope boundaries, deferrals, acceptance evidence, and any decision that requires an ADR or user confirmation.
4. Check the brief against those authorities and obtain any required confirmation before writing implementation code or behavior tests.

Do not begin the Red-to-Green cycle until this documentation review and spec task is complete. Every candidate below carries this prerequisite, including a future implementation cycle for a previously completed tracer bullet.

## Candidate tracer bullets

### 1. Open the real empty Workbench

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S1, prove that a fresh desktop session opens Atlas with the authentic empty-state path and no demonstration data mixed into it. Implement the smallest vertical path from UI adapter through Workbench Session to an in-memory Knowledge Repository adapter.

This slice validates the Electron foundation selected in ADR 0004 and forces the first concrete application composition. If the real S1 path contradicts the stack rationale, stop and revisit the ADR rather than hiding the mismatch behind the test harness.

#### Tracer Bullet 1 completion record — August 27, 2026

- **Public Behavior:** A fresh desktop session opens Atlas with the authentic empty-state path and no demonstration data.
- **Test Seam:** S1 desktop workflow, using the real packaged Electron application, main process, preload bridge, Workbench Session, Atlas UI Adapter, and in-memory Knowledge Repository Adapter.
- **Automated evidence:** With Node.js `24.19.0`, `npm run check` passed formatting, linting, type checking, and the configured Vitest command. `npm run test:workflow` packaged the macOS arm64 application and passed the WebdriverIO scenario: 1 spec passed.
- **Manual evidence:** The developer launched the application with `npm start` and observed the `Galaxy Brain` native window title, the `Atlas` workspace, the plain white empty state, and the exact repository-unselected message.
- **Scope confirmed:** Repository open/create, persistence, resume, file-backed adapters, and later S1–S5 behaviors remain deferred to subsequent tracer bullets.
- **Process note:** The original red-to-green failure was not captured in the repository history; the implementation and behavior test were introduced together in the initial tracer-bullet commit. This record makes no retroactive claim about a red run. A restricted packaging attempt also failed before test execution because the sandbox could not resolve `github.com`; the network-enabled retry passed.
- **Acceptance:** The user reviewed the running application and accepted the first tracer bullet.

### 2. Create or open a local Knowledge Repository

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S1, prove that the user can explicitly open an existing valid repository or create one from the bundled empty skeleton at a new or empty path. Creation writes files and validates the Repository Format but never initializes Git or creates a commit. A nonempty invalid directory is rejected without mutation. The app remains usable without Git, Git LFS, GitHub, credentials, or network connectivity.

Implement this tracer bullet in these behavior-named cycles, stopping to observe a green suite between cycles:

1. Create a repository at a new path.
2. Create a repository in an explicitly empty directory.
3. Open an existing valid V1 repository.
4. Reject unsafe, invalid, or unsupported targets and preserve the current selection.

The [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), and [Test Strategy](test-strategy.md) documents own the behavior, structure, file contract, and verification details for this slice. The [Tracer Bullet 2 brief](tracer-bullet-2-spec.md) coordinates those authorities without restating them.

#### Tracer Bullet 2 completion record — August 27, 2026

- **Public Behavior:** A person can create a Knowledge Repository from the bundled starter skeleton at a new or explicitly empty path, open an existing valid repository, and receive explicit safe outcomes for cancellation, invalid, unsafe, unavailable, unsupported, or newer read-only targets.
- **Test Seams:** S1 desktop workflow through the real packaged Electron application and S5 repository Adapter contracts against isolated temporary roots.
- **Automated evidence:** With Node.js `24.19.0`, `npm run check` passed formatting, linting, type checking, and 12 Vitest tests. `npm run test:workflow` packaged the macOS arm64 application and passed all 11 WebdriverIO workflow specs.
- **Scope confirmed:** The lifecycle remains local and provider-free; Galaxy Brain does not invoke Git, Git LFS, GitHub, credentials, or network services. Session resume, workspace context, and later knowledge workflows remain subsequent slices.
- **Acceptance:** The user directed formal closeout after the implementation and packaged workflow evidence were reviewed.

### 3. Resume meaningful work

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

Status: implementation complete and accepted on August 27, 2026 for exact repository resume and remembered-root recovery.

At S1, prove that reopening a known session validates and resumes the last explicitly selected repository, while a first launch opens without a repository and an unavailable or invalid remembered path presents explicit Open/Create choices. Do not scan for sibling repositories. Add only the machine-local session persistence needed for the worked fixture; active workspace and contextual navigation begin with TB4.

#### Tracer Bullet 3 cycle 1 record — August 27, 2026

- **Public Behavior:** After creating a Knowledge Repository, relaunching the Workbench reopens and visibly selects the exact same validated root.
- **Test Seam:** S1 packaged desktop workflow through the real Electron main process, preload bridge, Workbench Session, Atlas UI Adapter, and file-backed Knowledge Repository and session-state Adapters.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run test:workflow -- --spec ./tests/workflows/resume-selected-knowledge-repository.e2e.ts` failed with `element ("#repository-status-heading") still not displayed after 5000ms` after the restore call was temporarily disabled.
- **Green evidence:** With Node.js `24.19.0`, `npm run check` passed formatting, linting, type checking, and 12 Vitest tests. `npm run test:workflow` packaged the macOS arm64 application and passed all 12 WebdriverIO workflow specs.
- **Scope confirmed:** Only the last explicitly selected repository root is persisted outside the portable Knowledge Repository. Active workspace, Working Set, reading position, and contextual navigation remain subsequent cycles.
- **Next behavior:** First concrete active-work context, selected only when it has an independently observable meaning; no speculative workspace-state persistence.

#### Tracer Bullet 3 recovery completion record — August 27, 2026

- **Public Behavior:** A first launch remains in the authentic Atlas empty state. If the remembered root is unavailable or invalid, the Workbench remains unselected, reports the validation outcome, and offers explicit Open/Create recovery choices without discovery or substitution.
- **Test Seam:** S1 packaged desktop workflow through the real Electron main process, preload bridge, Workbench Session, Atlas UI Adapter, and file-backed repository and session-state Adapters.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run test:workflow -- --spec ./tests/workflows/recover-from-invalid-remembered-repository.e2e.ts` failed with `element ("#repository-error") still not displayed after 5000ms` after the remembered-root failure projection was temporarily disabled.
- **Automated evidence:** With Node.js `24.19.0`, `npm run check` passed formatting, linting, type checking, and 12 Vitest tests. `npm run test:workflow` packaged the macOS arm64 application and passed all 14 WebdriverIO workflow specs, including `open-empty-workbench.e2e.ts`, `recover-from-invalid-remembered-repository.e2e.ts`, and `recover-from-unavailable-remembered-repository.e2e.ts`.
- **Process note:** The first full-suite run exposed shared machine-local test state between parallel WebdriverIO workers. The harness now assigns each worker its own session-state file while preserving reload persistence within that worker; the rerun passed without failures.
- **Scope confirmed:** Recovery preserves the unselected state and does not scan sibling repositories. Active workspace, Working Set, reading position, and contextual navigation remain deferred until a concrete behavior requires them.
- **Failure policy:** If machine-local session state cannot be written after repository creation or opening succeeds, Workbench Session returns `operation-failed` and preserves the prior in-memory selection; the caller surfaces that the new root was not durably remembered.

#### Tracer Bullet 3 completion record — August 27, 2026

- **Public Behavior:** After an explicit repository selection, the Workbench resumes the exact validated root on relaunch; first launch remains in Atlas without a repository; unavailable or invalid remembered roots remain unselected and expose Open/Create recovery choices.
- **Test Seam:** S1 packaged desktop workflow through the real Electron main process, preload bridge, Workbench Session, Atlas UI Adapter, and file-backed repository and session-state Adapters.
- **Automated evidence:** With Node.js `24.19.0`, `npm run check` passed formatting, linting, type checking, and 12 Vitest tests. `npm run test:workflow` packaged the macOS arm64 application and passed all 14 WebdriverIO workflow specs, including exact-root resume, first-launch, and unavailable/invalid remembered-root recovery.
- **Scope confirmed:** Only the last explicitly selected repository root is persisted outside the portable Knowledge Repository. Active workspace, Working Set, reading position, and contextual navigation are carried forward to TB4 and later slices rather than being claimed here.
- **Acceptance:** The user reviewed the completed TB3 behavior and accepted the tracer bullet.

### 4. Carry context between workspaces

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

Status: implementation complete and accepted on August 27, 2026.

At S1, prove a contextual transition from an Atlas item to Studio and then to its Source Record in Paper Desk without losing the topic relationship. Add the compact global switcher only to the extent this behavior needs it.

The [Tracer Bullet 4 brief](tracer-bullet-4-spec.md) coordinates this slice against the accepted Product Decisions, Architecture, and Test Strategy documents.

#### Tracer Bullet 4 implementation completion record — August 27, 2026

- **Public Behavior:** A selected fixture topic can move from Atlas into Studio, its associated Source Record can move into Paper Desk, and the compact workspace switcher moves among Atlas, Studio, and Paper Desk without dropping the topic relationship.
- **Test Seam:** S1 packaged desktop workflow through the real Electron main process, preload bridge, Workbench Session, and Atlas, Studio, and Paper Desk UI Adapters.
- **Red evidence:** The focused workflow first failed because `#atlas-topic-open-studio`, then `#studio-source-record-open-paper-desk`, and finally `#workspace-switcher` were absent, with each failure observed before its corresponding implementation.
- **Green evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run test:workflow -- --spec ./tests/workflows/carry-context-between-workspaces.e2e.ts` passed all 3 TB4 behavior cases.
- **Automated evidence:** With Node.js `24.19.0`, `npm run check` passed formatting, linting, type checking, and 13 Vitest tests. The focused packaged workflow passed all 3 TB4 behavior cases, and the full packaged workflow passed all 15 WebdriverIO workflow specs.
- **Review follow-up:** Workflow assertions cover visible workspace names and active switcher state. Context reads distinguish available, absent, and unreadable metadata while retaining an internal diagnostic cause; public Workbench contracts document their invariants and outcomes.
- **Scope confirmed:** Context transfer is in-session only. Active workspace, Working Set, reading position, and contextual navigation are not persisted across relaunch; PDF rendering, capture, Synthesis, authoring, Governance, and Discovery remain deferred.
- **Acceptance:** The user reviewed the running behavior, including Atlas → Studio → Paper Desk, context-preserving workspace switching, and keyboard activation, and accepted TB4.

### 5. Capture one located source claim

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite), including the TB5-specific preparation task below.

#### TB5 preparation task — before implementation

Before starting implementation, review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), [Test Strategy](test-strategy.md), applicable ADRs, and the completed TB1–TB4 delivery records. Then create a guidance-compliant `tracer-bullet-5-spec.md` brief that:

- names the confirmed S3 Source Processing seam and the minimum vertical path;
- states the single first Public Behavior and its independently known expected values;
- identifies the PDF fixture, Source Locator, attribution, and relevant External System Seams;
- preserves the distinction among source material, Structured Annotation, Working Material, and Governed Knowledge; and
- records explicit scope boundaries, deferrals, acceptance evidence, and any decision that requires an ADR or user confirmation.

Do not begin TB5 implementation until the documentation review is complete and the TB5 brief has been checked against those authorities.

The guidance-compliant [Tracer Bullet 5 brief](tracer-bullet-5-spec.md) is now the implementation entry point for this slice.

At S3, prove that capturing the known PDF passage produces a source-claim Structured Annotation with the fixture Source Locator and attribution. Implement the minimum PDF adapter and Working Material persistence needed for that outcome.

#### Tracer Bullet 5 implementation completion record — August 27, 2026

- **Public Behavior:** The Source Processing module captures the literal Bayesian statistics fixture passage as a `source-claim` Structured Annotation with the exact Source Record reference, page 2 locator `page:2#chars=0-54`, captured text, attribution, classification, and `working-material` state.
- **Test Seams:** S3 Source Processing behavior through its public Interface, plus S5 PDF and Working Material Adapter contracts.
- **Red evidence:** The focused S3 test first failed because the Source Processing Interface was absent; the persistence cycle then failed because the file-backed Working Material Adapter was absent. Each missing behavior was observed before its implementation.
- **Green evidence:** With Node.js `24.19.0`, `npm run check` passed formatting, linting, strict type checking, and 19 Vitest tests, including the TB5 S3 behavior and S5 Adapter contract suites.
- **Scope confirmed:** The implementation is provider-free and does not create a Proposal, invoke Synthesis, mutate Governed Knowledge, invoke Git or network services, or select a production PDF engine. PDF import, Paper Desk controls, reopen, relinking, and Synthesis remain deferred.
- **Acceptance:** User reviewed the documented S3 behavior and acceptance checks on August 27, 2026. All five manual checks passed, accepting the S3 behavior at the confirmed Source Processing seam.

### 6. Reopen the capture

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite), including the TB6-specific preparation task below.

#### TB6 preparation task — before implementation

Before starting implementation, review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), [Test Strategy](test-strategy.md), applicable ADRs, and the completed TB1–TB5 delivery records. Then create a guidance-compliant `tracer-bullet-6-spec.md` brief that:

- names the confirmed S1 packaged desktop seam and the minimum vertical path from the accepted TB5 annotation to Paper Desk;
- states the first Public Behavior and the literal Source Record, annotation, Source Locator, captured text, provenance, material state, workspace, and reading-position values;
- identifies the fixture, the machine-local session-state boundary, and the repository/Working Material Adapter boundaries;
- preserves the distinction among Source Records, Structured Annotations, Working Material, Governed Knowledge, and machine-local convenience state; and
- records explicit scope boundaries, deferrals, acceptance evidence, and any decision that requires an ADR or user confirmation.

Do not begin TB6 implementation until the documentation review is complete and the TB6 brief has been checked against those authorities.

The guidance-compliant [Tracer Bullet 6 brief](tracer-bullet-6-spec.md) is now the implementation entry point for this slice.

At S1, prove that the saved annotation and reading position are restored through the public desktop workflow. This joins the source-processing behavior to real session and repository behavior without querying storage from the test.

#### Tracer Bullet 6 implementation completion record — August 27, 2026

- **Public Behavior:** The packaged Workbench opens the fixture Source Record, presents the saved TB5 source claim, moves Paper Desk to page 2 character 0, and restores Paper Desk, the annotation, and the reading position after relaunch.
- **Test Seam:** S1 packaged desktop workflow through the real Electron main process, preload bridge, Workbench Session, Paper Desk UI Adapter, file-backed Knowledge Repository and Working Material Adapters, and machine-local session-state Adapter; S5 coverage includes saved annotation lookup and session snapshots.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run test:workflow -- --spec ./tests/workflows/reopen-captured-source.e2e.ts` first failed at the missing `#paper-desk-saved-annotation` behavior after the packaged app launched successfully.
- **Green evidence:** With Node.js `24.19.0`, `npm run check` passed formatting, linting, strict type checking, and 22 Vitest tests. The focused TB6 packaged workflow passed, the corrected TB4 workflow passed all 3 cases, and the full packaged workflow passed all 16 WebdriverIO specs.
- **Scope confirmed:** The implementation restores machine-local active Paper Desk state and reading position while preserving the portable TB5 annotation. It does not select a production PDF engine, add Git/network/provider behavior, create a Proposal, invoke Synthesis, mutate Governed Knowledge, or implement import, arbitrary reading, relinking, or broader Working Set restoration.
- **Acceptance:** User reviewed the running TB6 behavior and accepted the restoration result on August 27, 2026.

#### TB6 UI follow-up implementation records

#### TB6.1 implementation completion record — August 27, 2026

- **Public Behavior:** The packaged Atlas presents a real Continue working surface for the Bayesian statistics topic and its associated Source Record, with an accessible action that opens Studio.
- **Test Seam:** S1 packaged desktop workflow through the real Workbench Session, repository Adapter, preload bridge, and Atlas UI Adapter.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run test:workflow -- --spec ./tests/workflows/promote-atlas-view.e2e.ts` first failed because the promoted `#atlas-continue-surface` was absent.
- **Green evidence:** The focused packaged TB6.1 workflow passed; the complete packaged workflow later passed all 19 WebdriverIO specs.
- **Scope confirmed:** The slice promotes presentation only. It does not add metrics, learning progress, proposal queues, Search, Ask, Jump, generated dashboard data, or new Atlas domain rules.
- **Acceptance:** User reviewed the promoted Atlas behavior and accepted TB6.1 on August 27, 2026.

#### TB6.2 implementation completion record — August 27, 2026

- **Public Behavior:** The packaged Studio presents the Bayesian statistics topic, its associated Source Record, and the saved source claim as supporting Working Material with a keyboard-operable Paper Desk action.
- **Test Seam:** S1 packaged desktop workflow through Workbench Session, Source Processing state, the preload bridge, and Studio UI Adapter.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run test:workflow -- --spec ./tests/workflows/promote-studio-view.e2e.ts` first failed because the promoted `#studio-topic-surface` was absent.
- **Green evidence:** The focused packaged TB6.2 workflow passed; `npm run check` passed formatting, linting, strict type checking, and 22 Vitest tests; the complete packaged workflow passed all 19 WebdriverIO specs.
- **Scope confirmed:** The slice promotes presentation and loads existing source-claim state for display. It does not implement authoring, autosave, Synthesis, Proposal creation, Governance, agent-generated content, or invented metrics and relationships.
- **Acceptance:** User reviewed the promoted Studio behavior and accepted TB6.2 on August 27, 2026.

#### TB6.3 implementation completion record — August 27, 2026

- **Public Behavior:** The packaged Paper Desk presents a source-first fixture preview, Source Record identity, saved annotation provenance, and the TB6 reading-position action while preserving relaunch behavior.
- **Test Seam:** S1 packaged desktop workflow through Workbench Session, Source Processing state, Working Material Adapter, preload bridge, and Paper Desk UI Adapter.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run test:workflow -- --spec ./tests/workflows/promote-paper-desk-view.e2e.ts` first failed because the promoted `#paper-desk-reading-surface` was absent.
- **Green evidence:** The focused packaged TB6.3 workflow passed; the existing TB6 relaunch workflow passed; the complete packaged workflow passed all 19 WebdriverIO specs.
- **Scope confirmed:** The slice promotes presentation only. It does not select a production PDF engine, implement arbitrary text selection, import PDFs, choose Source Asset modes, relink sources, add capture controls, or invoke Synthesis, Proposal, Governance, Git, network, or Agent Provider behavior.
- **Acceptance:** User reviewed the promoted Paper Desk behavior and accepted TB6.3 on August 27, 2026.

#### TB6 UI follow-up slices

After TB6 was accepted, the prototype-informed UI promotion was split into three independently reviewable S1 slices. Before each implementation slice, the [documentation prerequisite](#documentation-prerequisite), applicable accepted authorities, preceding delivery evidence, and corresponding guidance-compliant brief were reviewed before behavior tests and implementation code were written.

1. [TB6.1 — Promote the Atlas view](tracer-bullet-6-1-atlas-ui-spec.md): replace the minimal Atlas selected-repository presentation with a real continuation surface while preserving repository recovery and Atlas → Studio behavior.
2. [TB6.2 — Promote the Studio view](tracer-bullet-6-2-studio-ui-spec.md): replace the minimal Studio contextual presentation with a real topic/source-claim surface while preserving Studio → Paper Desk behavior and Working Material labeling.
3. [TB6.3 — Promote the Paper Desk view](tracer-bullet-6-3-paper-desk-ui-spec.md): replace the minimal Paper Desk presentation with a source-first reading surface while preserving TB6 provenance, reading-position restoration, keyboard operation, and relaunch behavior.

These are presentation slices over existing Workbench Modules and Adapters. Do not promote the standalone prototype as a selectable production mode, introduce mock repository data, or implement later authoring, Synthesis, Governance, Discovery, or production PDF behavior speculatively.

### 7. Synthesize selected evidence explicitly

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

The [Tracer Bullet 7 brief](tracer-bullet-7-spec.md) coordinates this slice against the accepted Product Decisions, Architecture, Test Strategy, and applicable Agent Provider ADRs.

At S3, prove that **Synthesize into topic** shows a concise summary and inspectable exact payload for the selected annotations and target context, allows removal of whole context items with regenerated previews, requires explicit confirmation before sending that final payload to OpenAI, and returns the literal draft Proposal fixture when the confirmed request succeeds. Add separate cycles proving that capture or source completion alone produces no Proposal, that declining makes no request and preserves the annotations, that arbitrary inline redaction is unavailable, that the Model Adapter cannot add context after confirmation, that request and response payloads are not retained unless explicitly saved, that the default save retains the result plus agent provenance but not the prompt/context, that an explicit save-with-prompt/context choice retains the human-facing prompt, selected source references or locators, and concise context summaries as a point-in-time snapshot but not full source excerpts or the hidden full payload, that a mismatch in saved versus current source identity or content identity does not rewrite the saved snapshot and produces a non-blocking stale-context warning, that the saved result remains Working Material, and that agent-assisted Synthesis returns `agent-provider-unavailable` without one while preserving the annotations.

#### TB7 first preview cycle — August 27, 2026

- **Public Behavior:** The S3 Source Processing Interface prepares an exact, inspectable Synthesis preview for the selected Bayesian statistics source claim and target topic without contacting an Agent Provider or changing Working Material.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface with the deterministic fixture PDF and in-memory Working Material Adapters.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm test -- --run tests/source-processing/prepare-synthesis-preview.test.ts` first failed because `prepareSynthesis` was not implemented.
- **Green evidence:** The focused preview test passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 23 Vitest tests.
- **Scope confirmed:** This cycle only establishes the provider-independent preview contract. It does not contact a Model Adapter, confirm or decline a request, remove context items, persist payloads or results, or create a Proposal.
- **Next behavior:** Add whole-context-item removal and regenerated preview coverage before adding the confirmation boundary.

#### TB7 second preview cycle — August 27, 2026

- **Public Behavior:** The S3 Source Processing Interface removes one complete selected context item and regenerates the concise summary and exact payload from the remaining evidence.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface with fixed selected annotations and no provider call.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm test -- --run tests/source-processing/prepare-synthesis-preview.test.ts` first failed because `removeSynthesisContextItem` was not implemented.
- **Green evidence:** The focused preview/removal test passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 24 Vitest tests.
- **Scope confirmed:** The cycle supports whole-item removal only and does not add arbitrary inline redaction, provider transmission, confirmation, persistence, or Proposal creation.
- **Next behavior:** Add explicit decline/cancel coverage and prove that no Model Adapter request occurs without confirmation.

#### TB7 confirmed handoff cycle — August 27, 2026

- **Public Behavior:** The S3 Source Processing Interface sends the final exact Synthesis payload to the operation-specific Model Adapter only after explicit confirmation and returns its fixed draft result.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface and a narrow Model Adapter at the external system seam.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm test -- --run tests/source-processing/prepare-synthesis-preview.test.ts` first failed because `confirmSynthesis` was not implemented.
- **Green evidence:** The focused preview, removal, and confirmed-handoff tests passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 25 Vitest tests.
- **Scope confirmed:** The cycle adds only the explicit confirmed handoff and fixed draft-result contract. It does not add a real network provider, S1 confirmation UI, automatic retention, explicit save, or Governance application.
- **Next behavior:** Add explicit decline/cancel coverage and prove that no Model Adapter request occurs without confirmation.

#### TB7 decline/cancel cycle — August 27, 2026

- **Public Behavior:** Declining or canceling a pending Synthesis operation makes no Model Adapter request and preserves the exact preview and selected Working Material.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface and a narrow request-observation Model Adapter.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm test -- --run tests/source-processing/prepare-synthesis-preview.test.ts` first exposed that cancellation was incorrectly returned as `declined`.
- **Green evidence:** The focused preview, removal, confirmed-handoff, and decline/cancel tests passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 26 Vitest tests.
- **Scope confirmed:** The cycle adds no network request, provider configuration, payload persistence, result save, Proposal application, or S1 confirmation presentation.
- **Next behavior:** Prove the shared `agent-provider-unavailable` outcome when no Model Adapter is configured, while preserving selected Working Material.

#### TB7 provider-unavailable cycle — August 27, 2026

- **Public Behavior:** Confirmed Synthesis without a configured Model Adapter returns the shared `agent-provider-unavailable` outcome and preserves the selected evidence and prepared payload.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface with no Model Adapter configured.
- **Green evidence:** The focused preview, removal, confirmed-handoff, decline/cancel, and provider-unavailable tests passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 27 Vitest tests.
- **Scope confirmed:** This cycle proves graceful unavailability only. It does not add provider configuration loading, a real network Adapter, automatic payload/result retention, explicit save, Proposal application, or S1 presentation.
- **Next behavior:** Prove that confirmed result and request bodies are not retained automatically, while explicit save remains a separate user action.

#### TB7 transient result cycle — August 27, 2026

- **Public Behavior:** A confirmed draft result is returned to the S3 caller transiently, without invoking Working Material persistence; explicit save remains a separate operation.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface with a persistence-observing Working Material Adapter and an operation-specific Model Adapter.
- **Red evidence:** No separate red run was captured for this boundary; the existing confirmed-handoff behavior already returned the result without persistence, and this cycle added a focused regression test to make that privacy rule explicit.
- **Green evidence:** The focused Synthesis tests passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 28 Vitest tests.
- **Scope confirmed:** The cycle does not add automatic history, caches, logs, audit retention, explicit result save, prompt/context save, provenance metadata, or Proposal application.
- **Next behavior:** Add an explicit save operation that preserves agent provenance while keeping the result Working Material.

#### TB7 default explicit-save cycle — August 27, 2026

- **Public Behavior:** An explicit save stores the confirmed draft as Working Material with agent-generated attribution, provider/model/timestamp/operation metadata, and Source Record/Source Locator references, while omitting the prompt, full context excerpts, and hidden request/response payload.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface and a narrow result Repository Adapter.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm test -- --run tests/source-processing/prepare-synthesis-preview.test.ts` first failed because `saveSynthesisResult` was not implemented.
- **Green evidence:** The focused Synthesis tests passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 29 Vitest tests.
- **Scope confirmed:** The cycle adds only the default explicit-save contract and preserves Working Material status. It does not add file-backed result serialization, prompt/context retention, result versioning, source-change warnings, S1 save UI, or Governance application.
- **Next behavior:** Add the separately explicit save-with-prompt/context option with concise context snapshots and no full source excerpts or hidden payload retention.

#### TB7 opt-in prompt/context snapshot cycle — August 27, 2026

- **Public Behavior:** A separate explicit save choice retains the human-facing prompt, selected Source Record/Source Locator references, and concise context summaries as a point-in-time snapshot, without retaining full source excerpts or the hidden payload.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface and a narrow result Repository Adapter.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm test -- --run tests/source-processing/prepare-synthesis-preview.test.ts` first showed that the opt-in prompt and context snapshot were omitted from the saved result.
- **Green evidence:** The focused Synthesis tests passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 30 Vitest tests.
- **Scope confirmed:** The cycle adds only the explicit opt-in snapshot fields. It does not add full source excerpts, hidden payload retention, file-backed serialization, source-change warnings, result versioning, or S1 save UI.
- **Next behavior:** Preserve the saved context snapshot and show a non-blocking warning when the current Source Record identity or content identity differs.

### 8. Apply one governed change

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S2, start with a literal existing governed version and a manually authored Proposal from an edited Working Material draft. Prove that explicit acceptance and application create the expected new version while the current version remains unchanged until application and the previous version remains retrievable, all without an Agent Provider. Agent-assisted Proposal drafting can be added at the model seam without changing Governance authority.

### 9. Reject stale and incoherent applications

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

Continue at S2 one behavior per cycle: first prove stale Judgment is rejected, then prove an invalid dependency subset is rejected, and then prove independently reviewable changes can receive different decisions. Do not prebuild all dependency behavior in the first governance cycle.

### 10. Review through the desktop interface

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S1, prove that Atlas opens the dedicated review route, displays the fixture change and evidence, records Judgment, and shows the applied version. Use the real Governance module; do not mock it to make the UI test convenient.

### 11. Preserve meaning across editing views

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S1, prove one worked extended-Markdown construct can be edited in rich view, inspected in source view, reopened, and observed with the same meaning. Expand one construct per later cycle—link, embed, callout, equation, citation—letting each reveal the next necessary editor behavior.

### 12. Separate Search, Ask, and Jump

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S4, prove one mode at a time. Start with a literal Search result, add a cited Ask answer from the known corpus after explicit confirmation of its concise summary and inspectable exact OpenAI payload, including removing a whole context item and observing the regenerated payload, then prove the default save excludes the prompt/context while the explicit save-with-prompt/context choice retains the human-facing prompt, selected source references or locators, and concise context summaries as a point-in-time snapshot—but not full source excerpts—and preserves agent provenance without becoming Governed Knowledge. Change a referenced source afterward so its identity or content identity differs, and verify that the saved snapshot is not silently rewritten, that navigation may resolve the current source, and that opening the saved artifact shows a non-blocking stale-context warning. Add an unsupported Ask outcome, an unavailable-provider Ask outcome without an API key, and finally a known Jump command. Follow with one S1 cycle proving the selected mode and outbound payload are visible before execution, that declining makes no request, and that local workflows remain usable without Agent Provider configuration.

### 13. Make Atlas actionable

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S1, prove the fixture session appears under Continue working and the fixture Proposal under Needs your judgment. Add individual cycles for a traceable metric, a human-authored Learning Route, and a visually distinct Generated Relationship.

### 14. Keep learning progress human-owned

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S1, prove that a suggestion explains its fixture evidence but does not advance the learning stage until confirmed. If S1 cannot express the critical behavior economically, pause and propose a new Test Seam in the test strategy before writing the test.

### 15. Survive a missing or changed PDF

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S3, prove that an unavailable or hash-changed linked PDF preserves the Source Record and annotations. In the next cycle, prove relinking makes the known page available without silently accepting changed bytes or changing its logical Source Locator.

### 16. Complete the desktop quality contract

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

At S1, add one behavior per cycle for keyboard-only completion of a critical workflow, visible focus, semantic landmarks and names, reduced motion, scalable text, theme persistence, undo, and version-history recovery. Use automated accessibility tooling as supporting evidence, never as a substitute for observable workflow assertions and manual review.

Saved agent context must retain its point-in-time snapshot when the current source cannot be checked or lacks a comparable identity. The Workbench reports `source status unavailable` without blocking access or claiming that the snapshot is current. An explicit refresh must create a new snapshot/version while preserving the original and must never silently replace it in place. Refresh updates only the saved context representation; a separate result-regeneration action requires fresh confirmation before any new OpenAI request.

Result regeneration must create a new result version and preserve the previous result rather than silently overwriting it.

The Workbench should present the newest result as current and make prior versions retrievable through ordinary artifact history without creating separate top-level items for each regeneration.

An explicit restore of an older result must create a new current version derived from that result, preserve all intervening versions, and make no OpenAI request.

Prior result versions remain retained by default. Automatic cleanup is prohibited; future deletion or history pruning requires explicit approval and a warning about lost recovery and provenance.

## Review checkpoints

Pause after slices 4, 10, 13, and 16 for a green-suite review. At each checkpoint:

- assess whether module interfaces remain deep;
- remove duplication through refactoring only after the red-to-green cycle is complete;
- verify tests still observe public behavior rather than implementation structure;
- reconsider the next tracer bullet using the working product; and
- record any new hard-to-reverse architectural decision as an ADR.

The plan is complete when the accepted V1 behaviors in [Product decisions](product-decisions.md) are observable through the confirmed seams, not when every listed file, screen, or internal module has a corresponding test.

The V1 release gate also requires a packaged workflow against a real file-backed repository. It must prove repository creation/opening, local-only use without Git, external-edit detection, interrupted-transaction recovery, rollback, and transparent local-save status before release.
