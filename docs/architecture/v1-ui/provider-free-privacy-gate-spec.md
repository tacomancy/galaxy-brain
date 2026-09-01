# Provider-free privacy and non-retention packaged-gate specification

Status: implementation and human acceptance complete on
`codex/section-c-privacy-gate` on September 1, 2026. The bounded Section C
privacy/non-retention checklist item is complete for the recorded scope; the
explicit deferrals below remain outside that acceptance.

This brief addresses the remaining unchecked item in Section C of the [V1
victory checklist](v1-victory-checklist.md): confirm, in the exact packaged
Workbench, that paths, credentials, provider payloads, source excerpts, and
sensitive diagnostics are not leaked or retained outside their approved
boundaries. It extends already accepted provider-confirmation,
provider-unavailable, session-state, linked-source, and diagnostic behavior;
it does not reopen those tracer bullets or introduce a new provider workflow.

## Documentation prerequisite

Before writing behavior tests or implementation code, explicitly complete
these tasks:

1. [x] Review the accepted [Product Decisions](product-decisions.md),
       [Architecture](architecture.md), [Repository Format](repository-format.md),
       [Test Strategy](test-strategy.md), [V1 release-readiness specification](v1-release-readiness-spec.md),
       the [provider-free PDF gate](provider-free-pdf-gate-spec.md), the current
       [code map](code-map.md), and the relevant TB7, TB12, TB15, and TB16 delivery
       records.
2. [x] Confirm that this is a release-evidence and boundary-hardening work
       package, not a new Repository Format, provider, diagnostics product, or
       public distribution decision.
3. [ ] Confirm the approved storage/display boundaries, fixture markers,
       vertical path, and acceptance evidence in this brief before the first Red
       cycle.
4. [ ] Create the first behavior test at a confirmed S3, S5, or S1 seam and
       begin implementation only after the owner confirms the bounded plan.

The explicit to-do before implementation is therefore: review the governing
documentation and generate/confirm this guidance-compliant specification;
implementation must not begin from the checklist sentence alone.

## Scope and boundary decision

### Decision 1 — enforce the existing privacy boundary at its observable seams

**Recommended decision:** add focused contract and packaged-workflow evidence
for the boundaries already owned by the existing Modules and Adapters:

- Synthesis and Ask previews may expose an exact payload only on the visible
  confirmation surface while the preview is pending.
- Declining or canceling a request makes no provider call and leaves local
  repository, session, and Working Material state unchanged.
- An unavailable provider produces the existing
  `agent-provider-unavailable` outcome without retaining a request, response,
  prompt, selected context, or hidden payload.
- Explicitly saved results retain only the metadata and content allowed by the
  existing save policy. The default save does not add the human-facing prompt,
  full source excerpts, or hidden request/response payload.
- Approved machine-local state remains outside the Knowledge Repository:
  selected repository paths may exist in the session-state file, and linked
  source paths/hashes may exist in the private source-assets store. Those
  values must not cross into renderer state, repository content, provider
  payloads, ordinary logs, audit records, or support artifacts.
- Retained diagnostics contain sanitized operation metadata and safe domain
  outcomes only. Raw exceptions, absolute private paths, credentials, source
  excerpts, and provider bodies remain inside the main-process boundary and
  are not persisted.

No new privacy Module is selected by this brief. The owning Modules retain
policy authority, the Adapters retain storage/diagnostic responsibility, and
the main process retains privileged path and provider composition. A new
Interface or Module becomes a separate design decision if the focused tests
show that these seams cannot express the boundary without duplication.

### Decision 2 — use deterministic canary markers, never real secrets

Tests use unique, non-secret markers for a prompt, source excerpt, fake
credential, and absolute temporary path. They assert that each marker appears
only where the contract permits it. No test places a real API key or private
user data into the repository, environment, logs, or packaged workflow.

The tests must distinguish an approved path from a leaked path. For example,
the selected repository path is expected in the isolated session-state file,
while the same path is forbidden in the portable repository and in the
confirmation payload unless the user explicitly selected it as context.

## Public behaviors

Given an isolated temporary repository, isolated machine-local state paths,
and deterministic canary values:

1. **Inspectable pending payload.** Preparing Ask or Synthesis renders the
   concise summary and exact payload through the confirmation surface. The
   Model Adapter has not been called, and no repository or machine-local
   persistence contains the prompt, context text, or full payload.
2. **Decline/cancel non-retention.** Declining or canceling returns the
   existing outcome, makes zero provider requests, and leaves repository bytes,
   Working Material, session state, source-assets state, and diagnostics
   unchanged apart from permitted non-content UI/session state.
3. **Unavailable-provider non-retention.** With no provider configured, the
   operation returns `agent-provider-unavailable`; captured annotations and
   other local work remain available, while no request, response, credential,
   prompt, selected context, or hidden payload is written to any persisted
   surface.
4. **Explicit-save boundary.** When a deterministic provider result is
   explicitly saved, the saved artifact contains the result and documented
   agent provenance. Default save excludes the prompt, full source excerpts,
   and hidden full API payload. The optional save-with-prompt/context path,
   where already exposed, stores only its documented human-facing prompt,
   selected references/locators, and concise context summaries.
5. **Path and credential containment.** Portable repository files contain no
   machine-local paths, source-asset paths, credentials, provider payloads, or
   raw sensitive exceptions. Session/source-asset files contain only their
   approved representations and no prompts, source excerpts, or provider
   bodies. Retained diagnostics and renderer-visible outcomes contain no
   forbidden marker or absolute private path.
6. **Confirmation truthfulness.** Removing a whole context item regenerates
   both the summary and exact payload. The final confirmed payload is the only
   payload passed to the Model Adapter; the Adapter cannot append context.
   This behavior remains provider-independent until the confirmation is
   accepted.

## Approved persistence/display matrix

| Surface                      | Allowed                                                                               | Forbidden                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Pending confirmation surface | Exact payload, selected context, prompt, provider/model details needed for review     | Hidden or uninspectable additions after approval; automatic persistence                                  |
| Knowledge Repository         | Explicitly saved Working Material/Proposal/result and its documented provenance       | Credentials, machine-local paths, hidden payloads, unsaved prompts/responses, raw diagnostics            |
| Workbench session state      | Selected repository path, active workspace, selected context, reading position, theme | Provider payloads, prompts, responses, source excerpts, credentials, raw exceptions                      |
| Private source-assets store  | Linked path and validated source/content identities                                   | PDF bytes, page text, prompts, credentials, provider payloads, raw exceptions                            |
| Retained diagnostics         | Sanitized category/operation and safe domain outcome                                  | Absolute paths, credentials, source excerpts, prompts, request/response bodies, raw sensitive exceptions |
| Renderer bridge/state        | Domain outcomes and approved display data                                             | Private filesystem paths, storage records, credentials, raw causes, hidden payloads                      |

## Module ownership and vertical path

- **Discovery and Source Processing Modules** own preview construction,
  whole-item context removal, confirmation, provider-unavailable outcomes,
  explicit save policy, and the no-retention invariant.
- **Workbench Session and file-backed session Adapter** own the narrow
  machine-local session representation and must serialize only its approved
  fields.
- **Source Asset Adapter** owns the private linked-source representation and
  must not retain PDF bytes or page text.
- **Diagnostics sinks** at the existing main-process boundaries own safe
  operation metadata. They must not become a general content or payload log.
- **Main process and preload bridge** own privileged path/provider wiring and
  expose domain outcomes only; the renderer remains a projection and never
  receives raw causes or private storage records.
- **S1 packaged workflow** launches the exact unsigned package in silent mode
  for deterministic evidence and in visible review mode for final human
  acceptance. The workflow supplies isolated temporary paths and scans only
  those known test surfaces.

## Confirmed Test Seams and independent expected values

### S3 — public application behavior

Extend existing Discovery and Source Processing Interface tests to observe
zero request calls, unchanged local state, permitted saved metadata, and
forbidden marker absence. Tests must use in-memory or narrow request-observation
Adapters only at the external Model seam; they must not inspect renderer
reducers, private payload helpers, or storage layout as a substitute for a
public behavior assertion.

### S5 — file-backed persistence and diagnostics contracts

Use isolated temporary paths to round-trip session state, source-assets state,
saved results, and sanitized diagnostic records. Independently authored
expected values must enumerate the allowed keys and assert byte/content
absence for each canary marker. Tests must cover malformed state and failure
paths without making raw exception text caller-visible.

### S1 — packaged workflow

Add a silent packaged privacy workflow to the named provider-free gate (or a
clearly named companion invoked by that gate) that:

1. packages with the pinned Node.js runtime;
2. creates/opens an isolated real file-backed repository;
3. exercises pending preview, decline/cancel, and unavailable-provider paths;
4. exercises explicit save only with deterministic fixture output where the
   existing fixture mode exposes that behavior;
5. reads the isolated repository, session-state file, source-assets file, and
   diagnostics output after each operation; and
6. asserts the matrix above using expected values authored independently of
   the implementation.

The visible human gate repeats the same flow against the exact package tested
by the silent workflow. It must inspect the confirmation surface and then use
safe explicit searches such as:

```sh
grep -R -n -E "GB_PRIVACY_PROMPT|GB_PRIVACY_SOURCE|GB_PRIVACY_CREDENTIAL|OPENAI_API_KEY|sk-[A-Za-z0-9]" <isolated-root>
```

No real credential is entered. The search is evidence for absence in the
isolated repository and application-state roots, not a claim about unrelated
files elsewhere on the machine.

## Incremental implementation slices

1. **Boundary inventory and Red tests.** Reconcile the current S3/S5
   contracts, identify every retained output used by the packaged workflow,
   and add one failing public test for each missing non-retention assertion.
2. **Request lifecycle hardening.** Make decline, cancellation, unavailable
   provider, and context-removal tests prove zero request/response retention
   and unchanged local state. Preserve existing explicit-save behavior.
3. **Persistence and diagnostics hardening.** Add file-backed contract tests
   for the approved key sets and sanitized diagnostic records. Correct only
   the owning Adapter or main-process diagnostic sink when a test demonstrates
   a leak.
4. **Silent packaged evidence.** Add or extend the named provider-free
   packaged workflow with isolated roots, canary scans, and artifact output
   that reports pass/fail without printing sensitive canary content.
5. **Documentation and human acceptance.** Record commands, results, package
   identity, and remaining deferrals here and in the delivery plan. Only after
   the owner completes the visible packaged inspection may the Section C
   privacy checklist item be marked complete.

Each slice follows one Red-to-Green cycle at its confirmed seam. No later
slice is implemented speculatively, and no checklist status is promoted from
automated output alone.

## Implementation record — September 1, 2026

The bounded implementation is complete on this branch:

- S3 Source Processing now records only fixed operation metadata when PDF,
  model, source-context, or result operations fail; provider errors and
  payloads never enter the caller-facing outcome or diagnostic record.
- S5 Working Material and Synthesis Result Adapters now translate filesystem
  failures into fixed category/operation metadata; raw paths, errno text, and
  exception messages are not retained by their diagnostic sinks.
- Public S3/S5 regression tests use independently authored path and provider
  canaries and passed 30/30 focused tests. The initial Red runs captured the
  raw path/provider exceptions; the Green runs captured only the approved
  metadata.
- The S1 `provider-free-privacy.e2e.ts` workflow runs in the existing silent
  packaged harness. It displays a deterministic Ask payload, declines it, and
  scans isolated repository, session-state, and source-asset roots for prompt,
  credential, and API-key canaries without printing the canary content.
- `npm run test:provider-free` passes all three named workflows, including the
  unavailable-provider baseline, linked-PDF status workflow, and privacy
  workflow. `npm run test:workflow` passes 33 packaged specs with one expected
  skip, followed by all five Issue #52 recovery runs.
- `npm run check` passes formatting, lint, typecheck, 150 unit tests, MC/DC,
  documentation tests, and documentation checks. `npm run test:coverage`
  passes at 83.93% statements, 74.43% branches, 97.23% functions, and 83.77%
  lines; `npm run lint:complexity` also passes.
- The exact automated package is the unsigned macOS arm64 package produced by
  `npm run package` under Node.js `24.19.0` for application version `0.16.0`.
  Human review must launch that package (or the package rebuilt by the named
  gate from the same branch) with no real credentials configured.

The packaged baseline workflow supplies unavailable-provider evidence, while
the new privacy workflow supplies canary-based post-decline evidence. The
human owner completed all seven visible acceptance gates on September 1, 2026
and explicitly accepted the Section C privacy/non-retention gate. The
acceptance covered the exact pending payload, decline, cancellation,
unavailable-provider handling, isolated persistence scans, relaunch behavior,
and documented deferrals.

## Explicit deferrals

- Signed/notarized distribution, public installers, and clean-machine
  Gatekeeper behavior remain Section D work.
- OS keychain integration, encrypted diagnostic storage, configurable
  retention policies, remembered consent, blanket consent, and provider
  switching remain deferred V1 behavior.
- A general-purpose telemetry, support-bundle, crash-upload, or automatic
  repository housekeeping system is not introduced by this gate.
- Exhaustive inspection of unrelated user directories, OS crash reports, or
  third-party dependency caches is outside the deterministic repository-owned
  evidence surface; any future support process needs its own privacy decision.
- Real provider transmission and production provider configuration remain
  outside this provider-free gate.

## Discarded alternatives and rationale

- **Scan the entire machine after every test:** discarded because it is
  invasive, non-deterministic, and cannot attribute a finding to the
  Workbench. The gate scans isolated roots plus known application diagnostics.
- **Add one central redaction layer to every write:** discarded because it
  could hide ownership defects and silently alter legitimate repository
  content. Boundary owners must prevent persistence and tests must observe
  their public contracts.
- **Use a real API key or realistic private source in fixtures:** discarded
  because it creates unnecessary exposure. Deterministic non-secret canaries
  prove retention behavior without handling sensitive data.
- **Treat the visible confirmation payload as the only evidence:** discarded
  because a correct preview does not prove non-retention after decline or an
  unavailable provider. The gate requires post-operation inspection of each
  approved persistence surface.
- **Create a new cross-cutting Privacy Module now:** deferred because the
  existing ownership and S1–S5 seams already express the current policy. A
  new Interface would be justified only by a concrete failing contract and
  would require a separate design decision.

## Acceptance evidence

The Section C privacy item is ready to mark complete only when all are true:

- focused S3 and S5 tests pass with independently authored expected values;
- the silent packaged workflow passes against the exact artifact used for
  human review;
- repository, session, source-assets, diagnostics, and renderer-boundary
  scans show no forbidden canary or sensitive marker outside its approved
  surface;
- the visible confirmation surface shows the exact pending payload and
  decline/unavailable behavior leaves local state unchanged;
- the human owner records each manual step as passed and explicitly accepts
  the privacy boundary; and
- this spec, the delivery plan, code map, and victory checklist record the
  package identity, commands, evidence, accepted scope, and any remaining
  deferrals.

This specification does not authorize a provider request. Its bounded
implementation and human acceptance record are complete; real provider
transmission remains outside this gate.

## Human acceptance record — September 1, 2026

The human owner passed Gates 1–7 against the unsigned macOS arm64 package
generated from this branch and explicitly accepted the Section C
privacy/non-retention gate. The review confirmed the visible exact Ask
payload, declined and canceled no-request outcomes, unavailable-provider
behavior, unchanged isolated repository state, canary absence from repository,
session, and source-assets roots, relaunch behavior, and the documented
deferrals. The victory-checklist privacy item is therefore complete for this
bounded scope.
