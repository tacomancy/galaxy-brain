# Test-driven delivery plan

Status: Tracer Bullets 1 through 6 and TB6.1–TB6.3 complete and accepted on August 27, 2026; TB7 implementation and human acceptance complete on August 28, 2026; TB8 S2 and S5 implementation cycles complete on August 28, 2026 with human acceptance pending; TB9 stale-Judgment, invalid dependency-subset, and deferred-change slices are implemented and accepted on August 28, 2026, while the independently judged changes slice is implemented with human acceptance pending; S1–S5 Test Seams remain confirmed.

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

#### Issue 51 explicit-context selection completion record — August 28, 2026

- **Public Behavior:** A valid Knowledge Repository with multiple complete topic contexts presents deterministic candidates in Atlas and requires an explicit choice; the selected topic and Source Record restore on relaunch while remaining machine-local. Multiple annotations for one Source Record are read in deterministic ID order.
- **Test Seam:** S1 packaged desktop workflow and S5 Knowledge Repository, Workbench Session, session-state, and Working Material Adapter contracts.
- **Red evidence:** The initial S5 repository test returned the first available context instead of an ambiguity outcome; the Session test lacked `selectWorkbenchContext`; the S1 workflow lacked the selection surface; the annotation contract initially returned the later-saved annotation. Each failure was observed before its corresponding implementation.
- **Green evidence:** The focused packaged workflow passed with explicit focus transfer and relaunch restoration; `npm run check` passed formatting, linting, strict type checking, and 49 Vitest tests; focused S5 contracts passed with 23 tests.
- **Scope confirmed:** The slice does not add repository discovery, automatic defaults, Git/GitHub behavior, network access, or new Test Seams. Incomplete extra candidates are ignored when complete candidates remain; a sole unreadable context remains an explicit unavailable outcome.
- **Review:** Standards and spec reviews found and prompted fixes for focus transfer, stale-selection substitution, context persistence across later writes, and incomplete-candidate handling. No ADR was required; existing S1/S5 seams remain sufficient.
- **Acceptance:** The implementation is ready for user review on the Issue 51 branch.

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

#### TB7 stale-context warning cycle — August 27, 2026

- **Public Behavior:** When a saved opt-in Synthesis context snapshot's Source Record identity or content identity differs from the current source, the S3 Interface returns a non-blocking stale-context warning and the unchanged saved result remains available.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface and a Source Identity Adapter at the external source-status seam.
- **Red evidence:** No separate red command output was captured for this cycle; the stale-context behavior test was written against the missing `checkSynthesisContext` capability before its implementation.
- **Green evidence:** The focused Synthesis tests passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 31 Vitest tests.
- **Scope confirmed:** The cycle does not rewrite the saved snapshot, block access, refresh the snapshot, regenerate the result, or implement source-status-unavailable handling.
- **Next behavior:** Preserve access and report `source status unavailable` when the current Source Record identity cannot be checked or lacks a comparable identity.

#### TB7 unavailable-source-status cycle — August 27, 2026

- **Public Behavior:** When a saved context snapshot cannot be checked or lacks a comparable current identity, the S3 Interface preserves the saved result and reports `source status unavailable` without claiming that the snapshot is current.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface and a Source Identity Adapter returning an unavailable outcome.
- **Red evidence:** No separate red command output was captured; the test was written against the required unavailable-source-status outcome after the stale-context path was implemented.
- **Green evidence:** The focused Synthesis tests passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 32 Vitest tests.
- **Scope confirmed:** The cycle does not refresh or replace the historical snapshot, regenerate the result, or add source relinking or file-backed result persistence.
- **Next behavior:** Add explicit snapshot refresh as a new version while preserving the original context snapshot.

#### TB7 explicit snapshot refresh cycle — August 27, 2026

- **Public Behavior:** An explicit refresh reads the current Source Record and content identities, saves the refreshed context as a new version, preserves the prior snapshot in version history, and leaves the generated result text, provenance, and prompt unchanged without contacting the Model Adapter.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface, a Source Identity Adapter at the external source-status seam, and a narrow result Repository Adapter.
- **Red evidence:** No separate red command output was captured; the test was written against the required refresh/version outcome before the refresh capability was implemented.
- **Green evidence:** The focused Synthesis tests passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 33 Vitest tests.
- **Scope confirmed:** The cycle adds explicit context refresh and prior-snapshot retention only. It does not regenerate the result, contact the Model Adapter, mutate source files, auto-refresh, add file-backed result serialization, or implement S1 refresh UI.
- **Next behavior:** Add result regeneration as a separate new result version that preserves the prior generated result and requires fresh confirmation before a new provider request.

#### TB7 confirmed result-regeneration cycle — August 27, 2026

- **Public Behavior:** A regeneration request requires a fresh explicit confirmation. Declining or canceling makes no Model Adapter request and does not save anything; confirmation sends the exact prepared payload, then saves the returned draft as a new result version while preserving the prior generated result and keeping the result as Working Material.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface, a narrow request-observation Model Adapter, and a result Repository Adapter.
- **Red evidence:** No separate red command output was captured; the focused regeneration tests were added against the required public outcome and then run through the implementation.
- **Green evidence:** The focused Synthesis tests passed. `npm run check` passed formatting, linting, strict type checking, and 35 Vitest tests.
- **Scope confirmed:** The cycle adds fresh confirmation, one confirmed regeneration request, new result-version metadata, and prior-result preservation. It does not implement restore, automatic regeneration, S1 controls, file-backed result serialization, or result cleanup.
- **Next behavior:** Add explicit restore of an older result as a new current version without making a Model Adapter request.

#### TB7 result-restore cycle — August 27, 2026

- **Public Behavior:** An explicit restore selects a retained older result, saves it as a new current version, preserves the current and all intervening versions, and makes no Model Adapter request.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface and a result Repository Adapter; the Model Adapter is present only as a request-observation guard.
- **Red evidence:** No separate red command output was captured; the restore test was added against the required public outcome before running the implementation.
- **Green evidence:** The focused Synthesis tests passed. `npm run check` passed formatting, linting, strict type checking, and 36 Vitest tests.
- **Scope confirmed:** The cycle adds explicit restore and version-history preservation only. It does not add automatic restore, result cleanup, file-backed serialization, or S1 history controls.
- **Next behavior:** Preserve `agent-generated` provenance when a saved result receives a later human edit while remaining Working Material.

#### TB7 human-authorship preservation cycle — August 27, 2026

- **Public Behavior:** An explicit human edit saves updated Working Material with `human-authored` metadata and an edit record while preserving the original `agent-generated` provider, model, operation, timestamp, and source-context provenance.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface and a narrow result Repository Adapter; no Model Adapter is involved.
- **Red evidence:** No separate red command output was captured; the human-edit test was added against the required provenance outcome before running the implementation.
- **Green evidence:** The focused Synthesis tests passed. `npm run check` passed formatting, linting, strict type checking, and 37 Vitest tests.
- **Scope confirmed:** The cycle records human authorship without promoting the result to Governed Knowledge, contacting a provider, changing result versions, or adding file-backed serialization or S1 editing controls.
- **Next behavior:** Add durable file-backed persistence for saved Synthesis results and their provenance/version history.

#### TB7 file-backed result-persistence cycle — August 27, 2026

- **Public Behavior:** The S5 Synthesis result Repository Adapter saves and reopens explicitly saved Working Material as portable JSON, including agent provenance, human-authorship records, context snapshots, result versions, and retained prior results; missing results remain an explicit `not-found` outcome.
- **Test Seam:** S5 file-backed result Repository Adapter contract in an isolated temporary Knowledge Repository.
- **Red evidence:** No separate red command output was captured; the S5 contract was added against the required round-trip and missing-result outcomes before running the implementation.
- **Green evidence:** `npm run check` passed formatting, linting, strict type checking, and 38 Vitest tests.
- **Scope confirmed:** The Adapter stores only explicitly saved result metadata and history. It does not store hidden request/response payloads, initialize Git, contact a provider, or add S1 presentation.
- **Next behavior:** Expose the saved-result confirmation, provenance, version, and restore controls through the packaged S1 Workbench surface.

#### TB7 user-only no-context confirmation cycle — August 27, 2026

- **Public Behavior:** A Synthesis request with no repository-derived context is valid only with a non-empty user prompt, produces an inspectable zero-context payload, and retains the same explicit confirmation boundary; declining makes no provider request.
- **Test Seam:** S3 Source Processing behavior through the public Module Interface and a narrow request-observation Model Adapter.
- **Red evidence:** No separate red command output was captured; the user-only test was added against the required no-context confirmation outcome before running the implementation.
- **Green evidence:** The focused Synthesis tests passed. `npm run check` passed formatting, linting, strict type checking, and 39 Vitest tests.
- **Scope confirmed:** The cycle does not add repository-wide context, automatic requests, hidden payload retention, provider configuration, or a new user consent mechanism.
- **Next behavior:** Expose the completed confirmation and saved-result history behaviors through the packaged S1 Workbench surface.

#### TB7 packaged S1 review surface cycle — August 27, 2026

- **Public Behavior:** Studio presents an explicit Synthesis review action, concise summary, destination/model, selected context with whole-item removal and regenerated preview, exact payload disclosure, confirm/decline/cancel controls, provider-unavailable feedback, and saved-result provenance/version/restore controls through the real Electron main process and preload bridge. Confirmation sends the exact preview retained by the main process, and saved-result reads preserve explicit availability outcomes.
- **Test Seam:** S1 packaged Electron workflow through the real main process, preload bridge, Studio UI Adapter, file-backed Knowledge Repository, file-backed Working Material Adapters, and the S3 Source Processing Module.
- **Red evidence:** The first packaged run exposed that the exact payload disclosure was collapsed when asserted; the workflow was corrected to expand the disclosure before checking its contents.
- **Green evidence:** The focused packaged workflow passed. The local full packaged workflow suite passed all 21 WebdriverIO specs, including renderer styling, whole-context-item removal, and regenerated preview assertions. `npm run check` passed formatting, linting, strict type checking, and 42 Vitest tests.
- **Scope confirmed:** The surface does not call a production provider, fabricate a successful draft, apply Governed Knowledge changes, or add a fourth primary workspace. Provider-unavailable behavior remains visible and local workflows remain usable.
- **Human acceptance:** On August 28, 2026, the user completed and accepted all five manual checks: packaged layout; initial Synthesis preview and exact payload; whole-context-item removal and regenerated preview; decline/cancel/provider-unavailable outcomes; and saved-result provenance/version/restore behavior. The review confirmed the states were legible and operable in the packaged app.
- **CI follow-up:** PR #24 merged successfully after its required checks completed. The packaged desktop workflow and full validation gate are passing; the earlier timing failure at `review-synthesis-confirmation.e2e.ts:83` is historical and no longer a merge blocker.
- **Next behavior:** Production provider integration and later Proposal/Governance work remain outside TB7.

### 8. Apply one governed change

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

The [Tracer Bullet 8 brief](tracer-bullet-8-spec.md) records the reviewed authorities, first literal behavior, confirmed S2 seam, expected values, vertical path, boundaries, deferrals, and acceptance evidence for this slice.

At S2, start with a literal existing governed version and a manually authored Proposal from an edited Working Material draft. Prove that explicit acceptance and application create the expected new version while the current version remains unchanged until application and the previous version remains retrievable, all without an Agent Provider. Agent-assisted Proposal drafting can be added at the model seam without changing Governance authority.

The first S2 cycle uses opaque test-store version identifiers only. A required later S5 persistence cycle must define persisted version records, stable ID mapping across reopen, current-version selection, ID allocation and lineage, retained-version retrieval, and compatibility before TB8 is considered complete.

The first S2 cycle also supplies a literal in-memory Working Material draft to Governance. Durable draft serialization, draft reopening/history, autosave, rich/source editing, and the Knowledge Authoring UI remain deferred to the authoring tracer bullet.

The required next TB8 cycle is the S5 file-backed persistence path. Its applied-record JSON, targeted rollback, stable version mapping, transaction staging, fingerprint checks, and recovery behavior are documented in the [TB8 brief](tracer-bullet-8-spec.md#required-second-cycle-persist-one-governed-change-through-s5) and were explicitly confirmed before implementation because they establish the first concrete applied-version schema within Repository Format v1.

#### TB8 first S2 application cycle — August 28, 2026

- **Public Behavior:** The S2 Governance Interface accepts the literal `working-material-tb8-bayesian-statistics-evidence` draft, creates `proposal-tb8-bayesian-statistics-evidence`, records the accepted exact-version Judgment `judgment-tb8-bayesian-statistics-evidence`, and applies it as `bayesian-statistics-v2` while preserving `bayesian-statistics-v1`.
- **Test Seam:** S2 Governance behavior through the public Governance Interface, with the deterministic in-memory Governance version-storage Adapter seeded by the literal current and next version IDs.
- **Red evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm test -- --run tests/governance/apply-governed-change.test.ts` first failed because the Governance Module and in-memory version-storage Adapter did not exist; after the initial implementation it exposed the missing literal next-version seed before reaching Green.
- **Green evidence:** The focused S2 test passed. `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run check` passed formatting, linting, strict type checking, and 55 Vitest tests.
- **Scope confirmed:** The cycle is S2-only and in-memory. It proves that Working Material and Proposal creation do not mutate the current governed version, accepted Judgment is exact-version bound, application returns the expected new version, the prior version remains retrievable, and the applied identity preserves Proposal/Judgment provenance. No Agent Provider, network, UI, file-backed Repository Format schema, durable draft, or Knowledge Authoring behavior was added.
- **Deferred work:** The required later S5 cycle still owns persisted version records and ID mapping/allocation/lineage across reopen, applied audit records, targeted rollback data, fingerprint checks, recoverable filesystem transactions, external-edit detection, and Repository Format/code-map updates for those Adapters. Durable Working Material drafts, autosave, reopening/history, rich/source editing, and the Knowledge Authoring UI remain deferred to the authoring tracer bullet.
- **Acceptance:** Human review is pending. The user must confirm the current version stayed unchanged until explicit application and the prior version remained retrievable afterward before this first cycle is accepted.
- **Next behavior:** Before adding the next TB8 behavior, repeat the documentation prerequisite. The next planned TB8 cycle is the required file-backed persistence/S5 contract work; TB9 owns stale and incoherent application rejection.

#### TB8 required S5 file-backed persistence cycle — August 28, 2026

- **Public Behavior:** The file-backed Governance Adapter loads the fixture as `bayesian-statistics-v1`, applies the accepted exact-version Proposal, writes the approved target, immutable applied audit JSON, and exact-byte targeted rollback through a recoverable local transaction, then reopens with `bayesian-statistics-v2` current and `bayesian-statistics-v1` retrievable.
- **Test Seam:** S5 file-backed Governance version-storage Adapter contract plus the existing public S2 Governance Interface. The contract inspects portable repository artifacts; Governance assertions observe current/history and application outcomes through the public Interface.
- **Red evidence:** `npm test -- --run tests/contracts/governance-version-store.test.ts` first failed because `file-backed-governance-store` did not exist.
- **Green evidence:** The focused S5/S2 suite passed 5 persistence tests. `npm run check` passed formatting, linting, strict type checking, and 65 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 80.68% statements, 72.89% branches, and 97.15% functions. `PATH=/Users/slehr/.pyenv/versions/3.11.13/bin:$PATH python scripts/test_public_docs.py` passed both public documentation tests.
- **Failure/recovery evidence:** The contract covers external target-edit rejection without overwrite, with the public `external-change` outcome, recovery after target replacement interruption, recovery after audit-install interruption with transaction cleanup, and exact prior-target restoration when interrupted audit content is invalid, with the public `completed` or `restored` recovery outcome. It also asserts exact persisted audit JSON, exact rollback bytes, stable reopen history, and preservation of unrelated repository content.
- **Scope confirmed:** The cycle adds only the confirmed one-target `v1` → `v2` file-backed persistence path. General version allocation, branching/multi-target lineage, schema migration, broad indexing, unknown-staging cleanup, UI rollback/recovery, stale/incoherent Judgment policy, Proposal Review, authoring, Agent Provider use, Git, and network behavior remain deferred as documented in the TB8 brief.
- **Packaged evidence:** `PATH=/Users/slehr/.nvm/versions/node/v24.19.0/bin:$PATH npm run test:workflow` packaged the macOS arm64 application and passed all 22 WebdriverIO workflow specs, including packaged renderer layout and the existing repository/workbench flows.
- **Acceptance:** Human review of the persisted artifacts, reopen behavior, external-edit handling, interruption recovery, and rollback restoration remains pending. TB8 is not accepted until that review is complete.
- **Next behavior:** Complete human S5 review, then select the next TB8/TB9 behavior only after the documentation prerequisite is repeated.

### 9. Reject stale and incoherent applications

Before implementation, complete the [documentation prerequisite](#documentation-prerequisite).

Continue at S2 one behavior per cycle, following the [TB9 implementation brief](tracer-bullet-9-spec.md): first prove stale Judgment is rejected, then prove an invalid dependency subset is rejected, and then prove independently reviewable changes can receive different decisions. Do not prebuild all dependency behavior in the first governance cycle.

#### TB9 stale Judgment cycle — August 28, 2026

- **Public Behavior:** An accepted Judgment bound to `bayesian-statistics-v1` returns the explicit `stale-judgment` outcome after another accepted Proposal advances the current version to `bayesian-statistics-v2`. The stale attempt does not invoke version mutation, replace current knowledge, or discard the prior version.
- **Test Seam:** The existing S2 Governance public Interface with the deterministic in-memory Governance version-storage Adapter; no new Seam or Repository Format change was introduced.
- **Red evidence:** `npm run test -- --run tests/governance/reject-stale-judgment.test.ts` first failed because the existing implementation returned `not-eligible` with `The Proposal is not based on the current governed version.` instead of the specified `stale-judgment` outcome.
- **Green evidence:** The focused stale-Judgment test passed. `npm run check` passed formatting, linting, strict type checking, and 66 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 80.70% statements, 72.89% branches, and 97.15% functions. `npm run lint:complexity` passed.
- **Scope confirmed:** This cycle adds only stale-Judgment rejection based on the exact reviewed `baseVersionId` and preserves the existing `not-eligible` outcome for other eligibility failures. It does not add dependency-subset validation, multi-change decisions, automatic rebasing, Proposal Review UI, persistence changes, Agent Provider use, Git, or network behavior.
- **Deferred work:** Invalid dependency-subset rejection is the next TB9 slice. Independently reviewable multi-change decisions and their decision vocabulary remain a later TB9 slice; Proposal Review remains TB10. Each follow-on requires its own documentation review, guidance-compliant spec, Red/Green evidence, and human acceptance.
- **Acceptance:** Accepted by the user on August 28, 2026. The user confirmed that a Judgment reviewed for `bayesian-statistics-v1` is rejected with `stale-judgment` after `bayesian-statistics-v2` becomes current, while `v2` remains current and `v1` remains retrievable.
- **Next behavior:** Repeat the documentation prerequisite and specify the invalid dependency-subset slice before writing its behavior test.

#### TB9 invalid dependency-subset cycle — implementation complete and accepted August 28, 2026

- **Public Behavior:** Governance rejects an accepted subset containing a dependent change without its prerequisite, returning `invalid-dependency-subset` before storage mutation.
- **Test Seam:** The existing S2 Governance public Interface with the deterministic in-memory Governance version-storage Adapter.
- **Shape confirmed:** A Proposal exposes labeled exact changes with `dependsOn` IDs, and a Judgment exposes explicit `acceptedChangeIds`; the accepted subset must contain the direct and transitive dependency closure.
- **Scope:** This planned cycle proves rejection only. Valid multi-change application, persistent multi-change provenance, and independently different per-change decisions remain deferred.
- **Red evidence:** The focused test first failed because the existing single-change validator dereferenced `exactChange` and had no dependency-subset behavior.
- **Green evidence:** `npm run check` passed formatting, linting, strict type checking, and 67 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 81.03% statements, 72.92% branches, and 97.31% functions. `npm run lint:complexity` passed. The focused test proves no storage mutation and preserves current/history state.
- **Status:** Implementation is complete, the specification was confirmed before code changes, and the behavior was accepted by the user on August 28, 2026.
- **Next behavior:** Repeat the documentation prerequisite and specify independently reviewable multi-change decisions before implementation.

#### TB9 independently judged changes cycle — implementation complete, human acceptance pending August 28, 2026

- **Public Behavior:** A Judgment explicitly accepts one independent Proposal change and rejects another; Governance applies only the accepted change and preserves the rejected change as unapplied.
- **Test Seam:** The existing S2 Governance public Interface with the deterministic in-memory Governance version-storage Adapter.
- **Shape confirmed:** Preserve `acceptedChangeIds` and add explicit `rejectedChangeIds`; every Proposal change ID must appear exactly once across the two arrays, and accepted IDs must remain dependency-closed.
- **Scope:** This cycle proves mixed accepted/rejected decisions for independent changes. Edit/defer decisions, dependent mixed decisions, durable mixed-decision provenance, and UI behavior remain deferred.
- **Red evidence:** The focused test first failed because the existing Judgment had no rejected-change representation and dropped the explicit rejection before application.
- **Green evidence:** `npm run check` passed formatting, linting, strict type checking, and 68 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 81.12% statements, 73.01% branches, and 97.31% functions. `npm run lint:complexity` passed. The focused test proves only the accepted change is applied and the prior version remains retrievable.
- **Status:** Implementation is complete, the specification was confirmed before code changes, and human acceptance remains pending.
- **Next behavior:** Complete human acceptance for this independent-decision behavior, then complete human acceptance for explicit per-change deferral before repeating the documentation prerequisite for edited decisions or dependent mixed-decision behavior.

#### TB9 deferred change cycle — implementation complete and accepted August 28, 2026

- **Public Behavior:** A Judgment explicitly accepts one independent Proposal change and defers another; Governance applies only the accepted change and preserves the deferred classification without treating it as rejection.
- **Test Seam:** The existing S2 Governance public Interface with the deterministic in-memory Governance version-storage Adapter.
- **Shape confirmed:** Preserve `acceptedChangeIds` and `rejectedChangeIds`, add explicit `deferredChangeIds`, and require every Proposal change ID to appear exactly once across the three arrays.
- **Scope:** This cycle proves explicit deferral for an independent change. Edited decisions, deferred-change re-review, dependent mixed decisions, durable mixed-decision provenance, and UI behavior remain deferred.
- **Red evidence:** The focused test first failed because the existing Judgment validator rejected the explicit deferred ID as an incomplete classification.
- **Green evidence:** `npm run check` passed formatting, linting, strict type checking, and 69 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 81.13% statements, 73.06% branches, and 97.31% functions. `npm run lint:complexity` passed. The focused test proves only the accepted change is applied and the prior version remains retrievable.
- **Status:** Implementation is complete, the specification was confirmed before code changes, and the behavior was accepted by the user on August 28, 2026.
- **Next behavior:** Repeat the documentation prerequisite and specify edited decisions or dependent mixed-decision behavior before implementation.

#### TB9 edited change cycle — implementation complete, human acceptance pending August 28, 2026

- **Public Behavior:** A Judgment explicitly accepts one independent Proposal change and edits another; Governance applies the accepted change and the reviewer-supplied edited exact change.
- **Test Seam:** The existing S2 Governance public Interface with the deterministic in-memory Governance version-storage Adapter.
- **Shape confirmed:** Add `editedChanges` records containing a Proposal `changeId` and a complete reviewer-supplied `ExactChange`; every Proposal change ID must be classified exactly once across accepted, rejected, deferred, or edited decisions. Edited IDs join the effective accepted subset, while the supplied exact change replaces only the corresponding Proposal change for that Judgment.
- **Scope:** This cycle proves edited independent changes. Edited dependent changes, Judgment revision, durable edited-decision provenance, and UI behavior remain deferred.
- **Red evidence:** The focused test first failed because the existing Judgment validator did not classify edited changes and returned the generic incomplete-classification result.
- **Green evidence:** `npm run check` passed formatting, linting, strict type checking, and 70 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 81.27% statements, 73.19% branches, and 97.40% functions. `npm run lint:complexity` passed. The focused test proves the reviewer-edited exact replacement is applied, the original Proposal replacement is not applied, and the prior version remains retrievable.
- **Status:** Implementation is complete, the specification and deferrals were confirmed before code changes, and the behavior was accepted by the user on August 28, 2026.
- **Acceptance:** The user confirmed that the reviewer-supplied edited exact replacement is applied instead of the original Proposal replacement, while the prior governed version remains retrievable.
- **Deferred work:** Edited dependent changes, Judgment revision, dependency-graph mutation, persistent edited multi-change provenance, UI behavior, Agent Provider use, Git, and network behavior remain explicitly deferred. Durable provenance must preserve both original and edited exact changes before the file-backed representation is expanded.
- **Next behavior:** Repeat the documentation prerequisite and specify the edited dependent-change behavior before implementation.

#### TB9 edited dependent change cycle — specification drafted August 28, 2026

- **Public Behavior:** A Judgment accepts one Proposal prerequisite unchanged and edits a dependent Proposal change. Governance applies both because the effective accepted subset is dependency-closed, using the reviewer-supplied exact replacement for the dependent change.
- **Test Seam:** The existing S2 Governance public Interface with the deterministic in-memory Governance version-storage Adapter.
- **Shape confirmed from the prior slice:** Reuse `editedChanges`; no new Judgment representation is proposed. The dependent edited ID joins the effective accepted subset, while `dependsOn` continues to reference Proposal change IDs.
- **Scope:** This cycle proves one edited dependent change with a two-change graph. The fixture keeps the prerequisite before the dependent in Proposal order and keeps the dependent `before` text present in the reviewed base version. Generic dependency reordering, post-prerequisite exact replacements, multi-level graphs, persistent edited provenance, and UI behavior remain deferred.
- **Failure behavior:** If the Judgment edits the dependent change but rejects its prerequisite, Governance returns `invalid-dependency-subset` before storage mutation.
- **Status:** The implementation specification is drafted and requires explicit human confirmation of the dependency-closure behavior, Proposal-order constraint, literal fixture, and deferrals before the Red test or implementation begins.
- **Next behavior:** Confirm this specification, then run the focused Red-to-Green cycle for edited dependent changes.

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
