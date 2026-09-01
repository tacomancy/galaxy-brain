# Section E: Post-tracer-bullet hardening and whole-release acceptance

Status: approved implementation specification, drafted and approved September
1, 2026.

Implementation readiness: ready. The human owner approved the proposed Module
Interface changes and portable Synthesis-result history representation for
the incremental slices in this brief. The durable history decision is
recorded in [ADR 0016](../../adr/0016-use-append-only-synthesis-result-versions.md).

This brief governs the remaining implementation work in [Issue #21](https://github.com/tacomancy/galaxy-brain/issues/21), specifically the open
architecture follow-ups [Issue #70](https://github.com/tacomancy/galaxy-brain/issues/70), [Issue #71](https://github.com/tacomancy/galaxy-brain/issues/71), and [Issue #72](https://github.com/tacomancy/galaxy-brain/issues/72). Issue #22 (behavioral and Adapter-contract coverage), Issue #23 (completed-codebase review), and Issue #69 (repository-scoped safe artifact storage) are already closed on `main` and are treated as evidence and constraints, not as new implementation scope.

## 1. Readiness and current baseline

The start condition in Issue #21 is now satisfied:

- TB1–TB16 and the TB12–TB14 scope decision are integrated on `main`.
- PR #139, the changed-decision MC/DC gate, is merged at `8497042`.
- Issue #22 and Issue #23 are closed with their evidence in the delivery plan.
- Issue #69 is closed; its shared repository-scoped Artifact Store is the
  storage foundation for this work.
- Issue #70, Issue #71, and Issue #72 remain open and are the actionable
  Section E implementation work.

Section E is a hardening package, not a new user-facing Tracer Bullet. It may
improve existing behavior and maintainability, but it must not become a broad
rewrite or add unrelated V1 capability.

## 2. Governing authorities

The implementation must remain consistent with:

- [Product Decisions](product-decisions.md), especially local-first use,
  provider optionality, explicit confirmation, provenance, and human-owned
  Judgment.
- [Architecture](architecture.md), especially Module ownership, inward
  dependency direction, and the existing S1–S5 seams.
- [Repository Format](repository-format.md), including VCS neutrality,
  unknown-content preservation, safe writes, and the rule that opening a
  repository does not perform an incidental migration.
- [Test Strategy](test-strategy.md), which permits the existing S1, S3, and S5
  seams and does not authorize a new seam merely because a refactor is easier
  to test that way.
- [Delivery Plan](delivery-plan.md), including the completed Issue #22, #23,
  #69, and C1 records.
- ADRs 0002, 0005, 0006, 0007, 0012, 0013, 0014, and 0015 where their
  governance, portable-file, provider, confirmation, privacy, provenance, and
  PDF boundaries apply.

No new provider, editor, router, database, or external version-control
dependency is selected by this brief.

## 3. Public outcome

After implementation, existing Workbench behavior has the same caller-visible
meaning while its ownership is safer:

1. Workbench Session owns the selected repository, context, workspace,
   reading position, and machine-local active-work state, but does not read
   Working Material artifacts.
2. Source Processing owns source-bound Working Material reads and all existing
   capture, Synthesis, provenance, source-status, and unavailable-provider
   outcomes.
3. One framework-independent Synthesis lifecycle Module owns the transient
   preview, context removal, confirmation, and repository-change invalidation.
   Electron IPC no longer owns that domain state.
4. Saved Synthesis results retain all prior versions through independently
   addressable, append-only version records without recursively embedding the
   full prior lineage.
5. Existing Atlas, Studio, Paper Desk, and packaged S1 recovery workflows
   continue to show the same supported outcomes, including provider-free use,
   external-change preservation, interrupted-write recovery, stale-context
   warnings, and no automatic OpenAI payload retention.

## 4. Explicit design decisions

### D1. Keep the Repository Format at version 1

The Section E changes remain inside `format: galaxy-brain` and
`format_version: 1`. The Synthesis history change is an additive artifact
representation with compatibility behavior; it is not a repository-wide
format renegotiation. Existing unknown files remain untouched.

If implementation discovers that the representation cannot be made
compatible with this boundary, stop and propose a separate Repository Format
revision rather than silently changing `format_version`.

### D2. Give Workbench Session and Source Processing separate ownership

Workbench Session keeps only selection and machine-local session concerns. It
must not import `StructuredAnnotation`, `WorkingMaterialReadOutcome`, or
other Source Processing artifact types merely to restore a workspace.

Source Processing gains one caller-facing read operation for the saved source
annotation associated with a selected Source Record. The operation translates
the Working Material Adapter's result into the existing caller vocabulary:

- `found` with the annotation;
- `not-found` with a safe explanation; or
- `unavailable` with a safe explanation.

The main-process composition root obtains the Workbench Session state and the
Source Processing source-derived state separately, then supplies a composed
Workbench view state to the bridge. This composition is a projection, not a
new state authority.

The Session Interface's saved-reading operation changes to accept a validated
`ReadingPosition` or equivalent source locator supplied by the composition
caller. It no longer discovers that locator by reading Working Material.
When the saved annotation is missing or unavailable, the existing recovery
behavior is preserved: the selected repository and context are not replaced,
and the UI presents an explicit unavailable/context-recovery state.

### D3. Give transient Synthesis state to a framework-independent Module

Add a small application-owned Synthesis lifecycle Interface, located with the
application Modules rather than in Electron `main/index.ts`. Its public
operations are conceptually:

- prepare a preview from a selected repository context and Source Processing
  instance;
- remove one complete context item and return a regenerated preview;
- confirm, decline, or cancel the currently pending preview;
- invalidate the pending preview when the selected repository changes.

The Module stores the pending preview and its repository identity internally.
Confirmation rejects a missing or mismatched pending identity before any
provider call. Successful repository creation/opening explicitly invalidates
the old request. The Module delegates payload, provider, privacy, and result
rules to Source Processing; it does not duplicate them.

The main process remains the composition root and bridge Adapter. It may read
the current Workbench state, construct production Adapters, and call the
lifecycle Interface, but it must not own `pendingSynthesis`, inspect its
private representation, or reconstruct its transitions in IPC handlers.

### D4. Proposed append-only Synthesis-result representation — approval required

The proposed portable representation is:

```text
scratch/
└── synthesis-results/
    ├── <result-id>.json
    ├── <result-id>--version-1.json
    ├── <result-id>--version-2.json
    └── ...
```

`<result-id>.json` becomes a small current pointer:

```json
{
  "schema": "galaxy-brain-synthesis-result-pointer",
  "schema_version": 1,
  "id": "synthesis-result-bayesian-statistics-fixture",
  "current_version": 2
}
```

Each reserved version file contains one complete `SynthesisSavedResult`,
including its provenance and any explicitly saved context snapshot, with a
required positive `resultVersion`. It does not contain `priorResults` or a
recursively embedded history. Result IDs reserve the
`--version-<positive-integer>` suffix. Existing version files are immutable
after successful
creation. A new result version is written first through the shared
repository-scoped Artifact Store, and the current pointer is then replaced
atomically with an expected-current-version check. A conflict or interrupted
write returns an explicit unavailable/operation-failed outcome and preserves
the previously current version. The flat representation lets the existing
Artifact Store enforce root containment, symlink policy, fingerprints, and
atomic writes without adding a generic nested-directory API.

The caller-facing read projection contains the current full result and small
version summaries sufficient to render restore choices:

```ts
interface SynthesisResultVersionSummary {
  version: number;
  generatedAt: string;
  title: string;
  humanAuthorship?: "human-authored";
}
```

Older full versions are retrieved by identity and version only when a restore
is explicitly requested. The UI never receives a recursive `priorResults`
tree.

Legacy `<result-id>.json` files containing a full result and nested
`priorResults` remain readable. Opening or listing them does not write. On the
next explicit save, edit, regeneration, or restore, the Adapter validates and
flattens the legacy chain in memory, writes the independent version files,
and atomically replaces the legacy file with the pointer only after all
required writes succeed. If migration fails, the original legacy file remains
the readable authority and no partial migration is reported as complete.

This representation is a durable Repository Format choice, even though it
remains within `format_version: 1`. The approved decision also covers
replacing `priorResults` in the caller-facing model with version summaries and
an explicit version-read operation; the rationale is recorded in [ADR 0016](../../adr/0016-use-append-only-synthesis-result-versions.md).

### Alternatives considered and discarded

- **Keep `pendingSynthesis` in Electron main:** discarded because the
  composition root would continue to own domain transitions, repository
  invalidation, and privacy-sensitive preview state; those rules belong in a
  framework-independent Module.
- **Keep annotation reads on `KnowledgeRepository`:** discarded because it
  makes repository selection a façade for Source Processing artifacts and
  couples Session restoration to Working Material storage.
- **Add a new Test Seam for each refactored Module:** discarded because the
  existing S1, S3, and S5 seams already observe the required public outcomes;
  testing private lifecycle state would make the architecture less
  replaceable.
- **Bump Repository Format to version 2:** discarded because the proposed
  pointer and version files are additive, preserve unknown content, and can
  read legacy results without changing the repository-wide root contract.
- **Continue writing nested `priorResults`:** discarded because every new
  version duplicates the complete earlier lineage, causing serialized size and
  validation work to grow with history depth.
- **Use one append-only JSONL or monolithic history file:** discarded because
  independently reading and validating one version would require scanning the
  full file and would make partial-write recovery and external-change
  diagnosis less local.
- **Migrate legacy results on open/read:** discarded because opening a
  repository must not mutate user files or report a migration that was not
  explicitly requested by a write operation.
- **Prune or compact old versions automatically:** discarded because history
  is a recovery and provenance record; deletion requires a separate explicit
  human-owned policy and warning.

## 5. Slice order and minimum vertical paths

### Slice E1 — Separate Session and Source Processing ownership (Issue #71)

Public behavior: relaunch and workspace transitions preserve the selected
repository, context, workspace, and reading position while source annotation
content is read through Source Processing rather than the Knowledge Repository
or Session Module.

Minimum path:

1. Add the Source Processing saved-annotation read operation and its explicit
   outcomes.
2. Move the production composition path to read that operation separately.
3. Remove annotation reads and Source Processing artifact types from
   Workbench Session and the Knowledge Repository Interface.
4. Change saved-reading-position input to use the caller-supplied validated
   source locator.
5. Preserve the existing renderer bridge view state and recovery presentation
   through a composed projection.

Test seam: existing S1 packaged workflow for resume, Studio/Paper Desk
continuation, and unavailable artifact recovery; existing S5 Knowledge
Repository contract to prove repository behavior remains unchanged. No new
Test Seam is authorized by this slice.

Independent expected values: the fixture's topic ID, Source Record ID,
annotation ID, page, and character offset are literal test data, not values
derived by calling the implementation.

### Slice E2 — Move transient Synthesis lifecycle ownership (Issue #70)

Public behavior: preparing, editing, confirming, declining, or canceling a
Synthesis preview has the same explicit-confirmation and privacy outcomes, and
opening or creating another repository invalidates the old preview without
allowing its payload to be sent in the new repository.

Minimum path:

1. Add the lifecycle Module and its pending-preview state.
2. Move preparation, context removal, confirmation, and invalidation into the
   Module while retaining Source Processing as the policy owner.
3. Replace main-process `pendingSynthesis` state and transition logic with
   calls to the lifecycle Interface.
4. Clear the lifecycle state on successful repository replacement and preserve
   the existing mismatch guard at confirmation.
5. Keep all request and response bodies transient and preserve the existing
   unavailable-provider behavior.

Test seam: existing S3 Source Processing behavior through the public Module
Interface plus existing S1 packaged confirmation and repository-replacement
workflows. The model remains a narrow external Mock Adapter. No new workflow
framework or generic session manager is authorized.

Independent expected values: selected annotation IDs, exact payload text,
provider destination, pinned fixture model, repository identities, and the
zero-provider-call expectation on decline/cancel/invalidation are written in
the tests independently of preview rendering.

### Slice E3 — Persist append-only Synthesis result history (Issue #72)

Public behavior: regeneration and restore preserve every prior result while
writing only one new full version and one small current pointer; restore makes
no provider request; legacy nested-history results remain readable and migrate
only at an explicit write boundary.

Minimum path:

1. After D4 approval, introduce the pointer/version codecs and repository
   validation without changing the public result semantics.
2. Add S5 contract cases for new writes, current reads, version reads,
   immutable prior files, pointer conflicts, malformed pointers, missing
   versions, interrupted writes, and legacy read compatibility.
3. Change Source Processing regeneration and restore to append a new version
   and read an older version by explicit identity rather than traversing a
   nested object.
4. Change the renderer projection to show version summaries and request
   restore by result ID/version.
5. Add the packaged S1 recovery path for legacy migration failure and
   externally changed history.

Test seams: existing S3 Source Processing behavior, existing S5 file-backed
Synthesis-result Adapter contract, and existing S1 packaged result-history
workflow. The repository-scoped Artifact Store is reused; no broad generic
filesystem API is added.

Independent expected values: version numbers 1, 2, and 3; literal result
texts; exact pointer JSON fields; the absence of `priorResults` in new version
files; unchanged bytes for older version files; and zero Model Adapter calls
for restore.

### Slice E4 — Integrated Section E evidence and Issue #21 reconciliation

After E1–E3 are green, run the complete verification and review the integrated
release candidate. Record each implementation/deferred decision, residual
risk, code-map update, and human acceptance result in the Delivery Plan and
the linked GitHub issues. Close #70–#72 only when their acceptance criteria
and evidence are complete. Close or disposition #21 only after its child
workstreams, related follow-ups, and whole-release acceptance are reconciled.

### 5.1 Implementation evidence — September 1, 2026

E1, E2, and E3 are implemented on the Section E branch. The complete Vitest
suite passes 32 files and 190 tests; strict type checking, formatting, and
linting pass; and the MC/DC gate passes both registered decisions. Focused
tests cover the Source Processing annotation read, lifecycle ownership and
invalidation, immutable pointer/version files, explicit version reads, and
legacy migration on explicit write. With Node.js `24.19.0`, the complete
packaged workflow passes 36 specs with one intentional skip (37 total), and
the Issue #52 recovery matrix passes all five cases. Human acceptance of Gates
0–4 was completed by the user on September 1, 2026. The review included the
ownership boundary, transient preview dismissal and payload presentation,
append-only history and migration, and whole-release artifact and workflow
verification.

## 6. Explicit non-goals and deferred work

The following remain deferred unless a later approved issue changes the scope:

- signed or notarized distribution, GitHub synchronization, remote backup, or
  any Git/Git LFS invocation;
- a production Agent Provider, background requests, remembered consent,
  dynamic model selection, or automatic payload retention;
- pending-preview persistence across application restart;
- a general workflow/session framework shared by unrelated capabilities;
- a new Test Seam for Session, lifecycle, or renderer internals;
- pruning, deletion, or automatic compaction of result history;
- rewriting historical version files in place;
- automatic migration merely on repository open or read;
- migration of arbitrary unknown result files that fail validation;
- a Repository Format version 2 unless D1 proves impossible;
- selective result-history deletion, branching histories, or cross-result
  deduplication; and
- broad renderer redesign or unrelated cleanup discovered during review.

Every deferred item retains its owner and revisit condition: the V1
maintainer owns the follow-up, and the item is revisited only when a concrete
user workflow, recovery risk, storage-size problem, or Repository Format
revision requires it. No deferred item may be described as currently
unsupported without preserving the boundary in Current Capabilities and the
relevant issue.

## 7. Acceptance gates

### Gate 0 — Documentation and design approval

- This brief is linked from the architecture package and Delivery Plan.
- The governing documents and completed Issue #22/#23/#69 records have been
  reviewed.
- D2, D3, and D4 are approved for the incremental implementation slices.
- The durable D4 trade-off is recorded in [ADR 0016](../../adr/0016-use-append-only-synthesis-result-versions.md).

### Gate 1 — Ownership boundaries

- Workbench Session owns no Working Material read or Source Processing artifact
  type.
- The Knowledge Repository Interface is not a façade for annotation reads.
- Studio and Paper Desk still receive the selected context and source-derived
  state through explicit composition.
- S1 resume/continuation and S5 repository contracts pass.

### Gate 2 — Transient lifecycle trust boundary

- Electron main owns no pending Synthesis domain state.
- Repository replacement invalidates the pending preview through the lifecycle
  Interface.
- Decline, cancellation, provider unavailability, and mismatch preserve
  existing local state and make no unauthorized provider request.
- S1 and S3 confirmation/recovery evidence passes, including non-retention.

### Gate 3 — Append-only history and migration

- New result versions are independently addressable and prior bytes remain
  unchanged.
- The current pointer is small, validated, and atomically updated with an
  expected-current-version check.
- Restore creates a new current version without a provider call.
- Legacy nested history is readable, does not migrate on read, and migrates
  recoverably only at an explicit write boundary.
- Malformed, missing, externally changed, and interrupted history returns an
  explicit safe outcome without corrupting a valid prior version.
- S3, S5, and packaged S1 history evidence passes.

### Gate 4 — Whole-release acceptance

Run the repository's complete checks from `app/` using the pinned runtime:

```text
npm run check
npm run test:coverage
npm run lint:complexity
npm run check:changed-coverage -- --lcov coverage/lcov.info --base-ref origin/main --repository-root .. --coverage-root .
npm run test:workflow
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

Also run `npm run check:mcdc -- --base-ref origin/main`, validate public
documentation, and verify the exact packaged artifact through the existing
provider-free S1 gate. The human acceptance record must identify the release
commit, packaged artifact, platform/version, workflows exercised, and any
accepted residual risks.

## 8. Implementation handoff contract

Each slice must report:

- Public Behavior and confirmed Test Seam;
- the Red command and the missing behavior observed;
- the Green command and passing result;
- files changed, code-map updates, and ADR status;
- privacy, recovery, provenance, and compatibility evidence;
- deferred work and discarded alternatives considered in that slice; and
- the next behavior selected from the evidence.

No later Section E slice may be implemented speculatively before its preceding
slice is green and reviewed.
