# Tracer Bullet 9: Reject stale and incoherent applications

This brief coordinates the first TB9 implementation slice in the [delivery plan](delivery-plan.md#9-reject-stale-and-incoherent-applications). It is an implementation entry point, not a second authority for product behavior, architecture, Repository Format, testing, or accepted ADR decisions.

## Scope

The first TB9 cycle proves that an accepted Judgment cannot apply a Proposal after the governed target has advanced to a different current version. Governance returns a caller-visible `stale-judgment` outcome, leaves the current version and retained history unchanged, and requires a new Proposal and Judgment for the newer version.

This cycle uses the existing S2 Governance Interface and deterministic in-memory Governance version-storage Adapter. It does not add dependency-subset validation, selective decisions across multiple changes, the S1 Proposal Review route, or a new Repository Format representation.

## Documentation prerequisite

Before writing behavior tests or implementation code, explicitly complete these to-do items:

1. Review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Test Strategy](test-strategy.md), applicable ADRs, the completed TB8 delivery records, and the accepted [TB8 persistence brief](tracer-bullet-8-spec.md).
2. Create or update this guidance-compliant `tracer-bullet-9-spec.md` with the Public Behavior, confirmed Test Seam, literal expected values, fixtures and External System Seams, minimum vertical path, boundaries, deferrals, acceptance evidence, and required confirmation recorded below.
3. Check that stale-Judgment behavior remains owned by the Governance Module, that the existing S2 Test Seam is sufficient, and that the proposed outcome does not imply automatic rebasing or hidden approval.
4. Obtain explicit human confirmation of the proposed caller-visible outcome and literal stale-review scenario before writing the Red test or implementation code.

Implementation must not begin until this documentation review and confirmation task is complete. If the first Red test reveals a new durable representation, Test Seam, or policy choice, stop and update this brief before proceeding.

## Governing authorities

- [Product Decisions](product-decisions.md) owns the human authority boundary: only an eligible explicitly accepted Proposal may change Governed Knowledge, and accepted knowledge remains revisable through new governed versions.
- [Architecture](architecture.md#governance-module) owns the Governance Module, exact-version review, stale-review detection, dependency validation, reversible application, and the inward dependency direction.
- [Test Strategy](test-strategy.md#s2--governance-seam) owns the public S2 Governance Interface, caller-visible outcomes, literal expected values, and behavior tests through the Interface rather than storage side channels.
- [ADR 0002](../../adr/0002-govern-changes-through-proposals.md) requires every change to Governed Knowledge to pass through a Proposal reviewed against an exact version.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md) keeps the repository local-first and VCS-neutral; Git status never determines Governance eligibility.
- [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md) keeps repository state independent of the Workbench implementation.
- [ADR 0009](../../adr/0009-keep-governed-knowledge-editable-through-evolution.md) requires reviewed replacement versions while preserving prior versions.
- [TB8 persistence](tracer-bullet-8-spec.md#required-second-cycle-persist-one-governed-change-through-s5) establishes stable governed version IDs and the file-backed Adapter's current-version authority. TB9 does not revise that representation.

## First Public Behavior

Given the TB8 Bayesian statistics fixture at governed version `bayesian-statistics-v1`:

1. Create Proposal A with an accepted Judgment against `bayesian-statistics-v1`.
2. Create and apply Proposal B, also reviewed against `bayesian-statistics-v1`, so the current governed version advances to `bayesian-statistics-v2`.
3. Attempt to apply Proposal A with its previously accepted Judgment.
4. Governance returns `stale-judgment` and the detail `The Judgment is stale because the current governed version changed after review.`
5. The attempt does not create another version, mutate the current `bayesian-statistics-v2`, alter retained `bayesian-statistics-v1`, or consume the stale Proposal/Judgment. A new Proposal and Judgment are required for any later application.

The stale check is based on the exact reviewed `baseVersionId`, not on whether the stale exact replacement might still be textually applicable. A version identity change is sufficient to make the Judgment stale. Governance must reject the stale application before calling the storage Adapter's mutation operation.

## Literal expected values

Use the independently known TB8 fixture target and current content:

- Target ID: `bayesian-statistics`.
- Target title: `Bayesian statistics`.
- Target path: `knowledge/bayesian-statistics.md`.
- Initial version ID: `bayesian-statistics-v1`.
- Initial content: the checked-in `app/tests/fixtures/knowledge-repository/knowledge/bayesian-statistics.md` content, ending with `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.

Proposal A is the previously reviewed TB8-style evidence change:

- Proposal ID: `proposal-tb9-stale-bayesian-statistics-evidence`.
- Proposal fingerprint: `proposal-fingerprint-tb9-stale-bayesian-statistics-evidence`.
- Working Material ID: `working-material-tb9-stale-bayesian-statistics-evidence`.
- Judgment ID: `judgment-tb9-stale-bayesian-statistics-evidence`.
- Exact `before`: `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.
- Exact `after`: `Bayesian statistics uses evidence to update prior belief.`.
- Base version: `bayesian-statistics-v1`.

Proposal B independently advances the same fixture version without reusing Proposal A's identity:

- Proposal ID: `proposal-tb9-version-advance-bayesian-statistics`.
- Proposal fingerprint: `proposal-fingerprint-tb9-version-advance-bayesian-statistics`.
- Working Material ID: `working-material-tb9-version-advance-bayesian-statistics`.
- Judgment ID: `judgment-tb9-version-advance-bayesian-statistics`.
- Exact `before`: `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.
- Exact `after`: `Bayesian statistics compares prior belief with new evidence.`.
- Base version: `bayesian-statistics-v1`.
- Deterministic next version ID in the in-memory Adapter: `bayesian-statistics-v2`.

The expected stale result is:

```text
{
  outcome: "stale-judgment",
  detail: "The Judgment is stale because the current governed version changed after review."
}
```

After Proposal B is applied, the expected current version is its exact `bayesian-statistics-v2` content, with `parentVersionId: "bayesian-statistics-v1"`. The stale attempt must leave that result unchanged. Proposal A's stale `Judgment` remains an accepted historical decision about `bayesian-statistics-v1`; it is not silently rewritten to refer to `bayesian-statistics-v2`.

## Proposed Interface change

Extend the existing `ApplyProposalOutcome` union with the proposed caller-visible `stale-judgment` outcome. Keep `not-eligible` for other eligibility failures whose policy is not yet separately represented. The first slice does not add a new operation, a new Adapter, or a storage-side stale flag.

The Governance Module owns the ordering and rule:

1. Resolve the Proposal and matching Judgment.
2. Read the current governed version.
3. If the current version ID differs from the Proposal's reviewed `baseVersionId`, return `stale-judgment`.
4. Do not call `applyVersion` or mutate any governed state.

The version-storage Adapter continues to own version retrieval and application mechanics. It does not decide whether the Judgment is stale, and callers do not inspect Adapter state to infer the result.

## Test Seam and fixtures

Use the existing S2 public Governance Interface with the deterministic in-memory Governance version-storage Adapter seeded by the literal TB8 current version and `bayesian-statistics-v2` next version ID. Add a behavior-named test at `app/tests/governance/reject-stale-judgment.test.ts` or the existing S2 Governance test location, depending on the smallest cohesive test change.

The test must:

- create Proposal A and record its accepted Judgment;
- create and apply Proposal B from the same literal `bayesian-statistics-v1` base;
- attempt Proposal A with its accepted Judgment;
- assert the exact `stale-judgment` outcome and detail;
- assert through `loadCurrentVersion` that Proposal B's `bayesian-statistics-v2` remains current;
- assert through `getVersion` that `bayesian-statistics-v1` remains retrievable; and
- prove that the stale path does not invoke the Adapter's mutation operation by using the existing injected storage seam only if that observation is needed to distinguish behavior from an equivalent result.

The test must not derive expected IDs, text, or outcomes from Governance implementation helpers, read private maps, or inspect file-backed artifacts as a side channel. The existing TB8 file-backed contract remains responsible for persistence and does not need a new Repository Format test for this first TB9 slice.

## External System Seams

- **Governance version-storage Adapter:** existing S2 in-memory Adapter supplies deterministic current/history reads and the version advance. No new external seam is needed.
- **File-backed Knowledge Repository Adapter:** not exercised by the first TB9 Red-to-Green test. Its TB8 version authority remains unchanged; a later compatibility check may run the same policy through the file-backed Adapter if the existing Interface supports it without expanding this slice.
- **Agent Provider:** not configured or called. Stale-review policy is provider-free.
- **Git, remotes, credentials, and network:** outside the product boundary and must not affect stale eligibility.
- **Clock and identity sources:** not needed for this first deterministic outcome; no new timestamp or identifier is generated by the rejected application.

## Minimum vertical path

1. Complete the documentation prerequisite and obtain confirmation of the proposed `stale-judgment` outcome and literal scenario.
2. Add the behavior test with the two literal Proposals and observe the expected failure because the current implementation reports a generic eligibility result.
3. Extend the existing `ApplyProposalOutcome` Interface with `stale-judgment` and add the smallest Governance policy check based on the reviewed `baseVersionId`.
4. Prove that the stale path returns before the storage Adapter's mutation operation and preserves current/history behavior.
5. Run the focused S2 Governance test, the full `npm run check` gate, coverage, and complexity checks.
6. Record Red/Green evidence and the human acceptance result in the delivery plan before selecting the dependency-subset slice.

Do not add dependency graph types, multi-change Proposal structures, UI controls, persistence migrations, automatic rebase, or a broad refactor during this cycle.

## Boundaries and explicit deferrals

This first TB9 slice does not implement:

- invalid dependency-subset rejection;
- independently reviewable multi-change decisions or partial application;
- accept, edit, defer, or reject decision vocabulary beyond the existing accepted Judgment path;
- Proposal mutation, in-place Judgment editing, automatic re-review, or automatic rebasing;
- Proposal Review UI, Atlas/Studio routing, or caller-side stale recovery controls;
- file-backed schema changes, version allocation changes, registry changes, or new audit records for rejected attempts;
- agent-assisted Proposal drafting, Agent Provider calls, Git operations, remote synchronization, or network access.

The next TB9 slice owns invalid dependency subsets. The later TB9 slice owns independently reviewable multi-change decisions and their decision vocabulary. TB10 owns the desktop Proposal Review route. These follow-ons require their own documentation prerequisite, exact fixtures, Red/Green cycle, and human acceptance.

## Alternatives considered and deferred

- **Reuse `not-eligible` without a distinct stale outcome:** discarded as insufficient for this slice because a caller must distinguish a recoverable stale review from other eligibility failures and guide the person toward creating a new Proposal/Judgment.
- **Automatically rebase the Proposal onto the new current version:** discarded because it would change the material that the person reviewed and could turn an exact Judgment into hidden approval of a different version.
- **Re-run the same exact change against the new version if the text still matches:** discarded because exact-version review is the trust boundary; textual applicability does not prove that the person reviewed the newer version.
- **Invalidate or delete the stale Proposal/Judgment:** deferred because prior review decisions are provenance and must remain inspectable; rejection should preserve them without making them eligible.
- **Move stale detection into the file-backed Adapter:** discarded because stale-review policy belongs to Governance and must be consistent across the in-memory and file-backed Adapters.
- **Implement dependency validation and multi-change decisions together with stale rejection:** deferred because the delivery plan requires one S2 behavior per cycle and those rules introduce separate Proposal shape, dependency, and decision-vocabulary choices.

## Acceptance evidence and required confirmation

The user confirmed this proposed outcome and literal stale-review scenario before the Red test on August 28, 2026. The first implementation cycle is complete when the delivery record contains:

- the documentation review and explicit confirmation of this proposed first slice;
- the focused Red run showing the missing stale-specific outcome;
- the focused Green run proving exact `stale-judgment` behavior after Proposal B advances the version;
- full `npm run check`, coverage, and complexity evidence;
- proof that the stale attempt did not invoke version mutation and did not alter current/history state; and
- human confirmation that a Judgment accepted for `bayesian-statistics-v1` is visibly rejected after `bayesian-statistics-v2` becomes current, while the newer version remains current and the prior version remains retrievable.

The focused Red run returned the prior generic `not-eligible` outcome as expected. The focused Green run now returns the exact `stale-judgment` result, preserves the current and prior versions, and does not call the storage Adapter's mutation operation. The user accepted this first slice on August 28, 2026. That acceptance is scoped to this first slice; it does not approve dependency subsets, multi-change decisions, or the TB10 review UI.

## Required second cycle: reject an invalid dependency subset

This is the next TB9 implementation cycle identified in the [delivery plan](delivery-plan.md#9-reject-stale-and-incoherent-applications). Its documentation prerequisite was reviewed against the accepted Product Decisions, Architecture, Test Strategy S2 guidance, ADRs 0002, 0005, 0006, and 0009, the accepted TB8 persistence representation, and the accepted first TB9 stale-Judgment slice on August 28, 2026. The concrete multi-change shape and caller-visible outcome below were confirmed for this cycle before implementation.

### Scope

The second TB9 cycle proves that Governance rejects a Judgment whose accepted change subset omits a required dependency. One Proposal contains two exact changes: a prerequisite change and a dependent change. The test supplies a Judgment that accepts only the dependent change. Governance returns a caller-visible `invalid-dependency-subset` outcome before storage mutation, preserving the current governed version and requiring the dependent change's prerequisites to be included in any future accepted subset.

This cycle does not implement successful multi-change application, independently different decisions for each change, dependency editing, dependency inference, the S1 Proposal Review route, or a Repository Format change. It continues to use the existing S2 Governance Interface and deterministic in-memory version-storage Adapter.

### Documentation prerequisite for this cycle

Before writing the Red test or implementation code, explicitly complete these to-do items:

1. Recheck the accepted Product Decisions, Architecture, Test Strategy, applicable ADRs, TB8 persistence decisions, and the accepted first TB9 cycle.
2. Confirm this section's proposed `ProposalChange` shape, `acceptedChangeIds` Judgment field, `invalid-dependency-subset` outcome, and literal two-change fixture.
3. Record any changed public Interface, dependency ownership, or durable representation in this brief and the owning documentation before code changes.
4. Obtain explicit human confirmation that this slice rejects only non-closed accepted subsets and does not silently rebase, drop, or auto-accept dependencies.

Implementation began only after this second-cycle documentation review and confirmation task was complete. A new dependency graph policy, persistent multi-change representation, or Test Seam would require stopping and revising this brief before proceeding.

### Proposed public behavior

Given a current `bayesian-statistics-v1` version, a Proposal with changes `change-tb9-source-evidence` and `change-tb9-claim-update`, and an accepted Judgment containing only `change-tb9-claim-update`:

1. Governance validates the Proposal and records the accepted Judgment without changing Governed Knowledge.
2. `applyProposal` calculates the required dependency closure for the accepted change IDs.
3. Because `change-tb9-claim-update` depends on `change-tb9-source-evidence`, the accepted subset is not closed.
4. Governance returns:

```text
{
  outcome: "invalid-dependency-subset",
  detail: "The accepted change subset omits a required dependency."
}
```

5. Governance does not call the storage Adapter's mutation operation, create a new version, alter the current version, or remove the accepted Judgment. It does not add the omitted prerequisite automatically. A later Judgment must explicitly include the prerequisite before this dependent change can be eligible.

The dependency rule for this fixture is transitive closure: every accepted change must include all of its direct and indirect `dependsOn` change IDs. The check is performed by Governance before any call to `applyVersion`. The first cycle observes only rejection; it does not define the order or mechanics of applying a valid closed subset.

### Proposed Interface shape

The existing single-change Proposal is normalized to a list of change records:

```text
ProposalChange {
  id: string
  exactChange: ExactChange
  dependsOn: string[]
}
```

The proposed `Proposal` Interface exposes `changes: ProposalChange[]` instead of one unlabelled `exactChange`. A one-change Proposal remains valid as a list containing one change with an empty `dependsOn` list. Change IDs are unique within a Proposal; dependencies refer only to changes in that same Proposal. The first fixture uses an acyclic graph with one direct dependency.

The proposed `Judgment` Interface adds `acceptedChangeIds: string[]` alongside its existing exact Proposal fingerprint, base version, and accepted decision. For this cycle, `decision: "accepted"` means the listed subset was the person's explicit accepted selection; it does not make omitted changes accepted and does not introduce `edit`, `defer`, or `reject` statuses. Governance validates that every accepted ID exists and that the selected IDs form a dependency-closed subset before application.

This is an Interface change, not a new Adapter or Test Seam. Governance owns dependency closure and eligibility. The version-storage Adapter continues to own version retrieval and mutation mechanics. The TB8 file-backed applied-record representation remains single-change-compatible; applying a valid multi-change Proposal and persisting its complete change/dependency/decision provenance are deferred until the later multi-change cycle defines that durable representation.

### Literal fixture and expected values

Use the existing TB8 fixture target and `bayesian-statistics-v1` content:

- Target ID: `bayesian-statistics`.
- Target title: `Bayesian statistics`.
- Target path: `knowledge/bayesian-statistics.md`.
- Proposal ID: `proposal-tb9-invalid-dependency-subset-bayesian-statistics`.
- Proposal fingerprint: `proposal-fingerprint-tb9-invalid-dependency-subset-bayesian-statistics`.
- Working Material ID: `working-material-tb9-invalid-dependency-subset-bayesian-statistics`.
- Judgment ID: `judgment-tb9-invalid-dependency-subset-bayesian-statistics`.
- Base version: `bayesian-statistics-v1`.

Change `change-tb9-source-evidence` is the prerequisite:

- `dependsOn: []`.
- Exact `before`: `source_record: sources/papers/bayesian-statistics.md`.
- Exact `after`: `source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence`.

Change `change-tb9-claim-update` is the dependent change:

- `dependsOn: ["change-tb9-source-evidence"]`.
- Exact `before`: `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.
- Exact `after`: `Bayesian statistics uses evidence to update prior belief.`.

The Working Material content contains both exact changes in the target, with the prerequisite line added and the fixture sentence replaced. The invalid Judgment contains:

```text
{
  proposalFingerprint: "proposal-fingerprint-tb9-invalid-dependency-subset-bayesian-statistics",
  baseVersionId: "bayesian-statistics-v1",
  decision: "accepted",
  acceptedChangeIds: ["change-tb9-claim-update"],
  rejectedChangeIds: ["change-tb9-source-evidence"]
}
```

The accepted subset is invalid because it omits `change-tb9-source-evidence`. The current version remains the independently known `bayesian-statistics-v1` content, and no `bayesian-statistics-v2` or applied record is created by this rejected attempt.

### Test Seam and minimum vertical path

Use the existing S2 public Governance Interface with the deterministic in-memory Governance version-storage Adapter. Add a behavior-named test at `app/tests/governance/reject-invalid-dependency-subset.test.ts` or extend the existing Governance behavior test only if that keeps the public behavior clearer.

The test must:

- create the two-change Proposal with the literal IDs, exact replacements, and one dependency;
- record the accepted Judgment containing only the dependent change ID;
- attempt application through Governance;
- assert the exact `invalid-dependency-subset` outcome and detail;
- observe through an injected version-storage Adapter seam that `applyVersion` was not called;
- assert through `loadCurrentVersion` that `bayesian-statistics-v1` remains current; and
- assert through `getVersion` that the original version remains retrievable.

The test must not inspect private Governance maps, calculate expected closure through a helper shared with the implementation, read repository files as a side channel, or test dependency traversal by calling a private function. The expected dependency closure is the literal two-node relationship above.

Minimum path:

1. Confirm the proposed Interface shape, outcome, fixture, and boundaries.
2. Add the one behavior test and observe the expected failure because the current single-change Governance model has no dependency-subset outcome.
3. Add the smallest normalized change/dependency and accepted-ID representation needed to express this fixture.
4. Add the Governance closure check and return before storage mutation.
5. Run the focused S2 test, `npm run check`, coverage, and complexity checks.
6. Record Red/Green evidence and human acceptance before selecting the independently reviewable multi-change decision slice.

### Boundaries, alternatives, and deferrals

This cycle explicitly defers:

- successful application of a valid multi-change Proposal;
- dependency ordering during mutation and rollback of multiple changes;
- independently accepting, editing, deferring, or rejecting each change;
- dependency editing, graph inference, cross-Proposal dependencies, cycles, and missing dependency repair;
- persistent applied-record/schema changes for multi-change provenance;
- Proposal Review UI, Atlas/Studio routing, Agent Provider use, Git, remote synchronization, and network behavior.

The following alternatives are discarded or deferred for this cycle:

- **Silently add omitted dependencies:** discarded because it would manufacture human Judgment for material the person did not explicitly accept.
- **Drop the dependent change and apply the remaining subset:** discarded because the requested application would no longer match the accepted Proposal and could create an incoherent result.
- **Return generic `not-eligible`:** proposed as insufficient because callers need to distinguish an incoherent dependency selection from stale review and other eligibility failures. If a generic outcome is preferred, revise this section before the Red test.
- **Let the storage Adapter enforce dependency closure:** discarded because dependency eligibility is Governance policy and must remain consistent across Adapters.
- **Implement full per-change decision vocabulary now:** deferred because it is the next distinct behavior after proving that dependency closure prevents incoherent application.

### Acceptance evidence and required confirmation

The user confirmed this second-cycle design on August 28, 2026. Completion requires:

- the `ProposalChange` and `acceptedChangeIds` shape;
- the `invalid-dependency-subset` outcome and exact detail;
- the rule that accepted subsets must contain the full direct/transitive dependency closure; and
- the literal two-change fixture and the explicit deferrals above.

After confirmation, completion requires the focused Red/Green evidence, full automated gates, proof that no mutation occurred, and human confirmation that a dependent change cannot be applied without its explicitly accepted prerequisite. Acceptance of this cycle will not approve successful multi-change persistence or the later per-change decision vocabulary.

### Second-cycle implementation evidence

- **Confirmation:** The user confirmed the `ProposalChange` and `acceptedChangeIds` shape, the exact `invalid-dependency-subset` outcome, the transitive dependency-closure rule, the literal two-change fixture, and the explicit deferrals before the Red test on August 28, 2026.
- **Red evidence:** `npm run test -- --run tests/governance/reject-invalid-dependency-subset.test.ts` reached the new behavior and failed because the single-change validator dereferenced the absent `exactChange` field before dependency-subset behavior existed.
- **Green evidence:** The focused dependency-subset test passed. `npm run check` passed formatting, linting, strict type checking, and 67 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 81.03% statements, 72.92% branches, and 97.31% functions. `npm run lint:complexity` passed.
- **Behavior evidence:** Governance records the accepted dependent-only Judgment, returns the exact `invalid-dependency-subset` result before `applyVersion`, preserves `bayesian-statistics-v1` as current, and keeps that prior version retrievable.
- **Compatibility evidence:** Existing single-change Governance behavior and file-backed contract tests pass. The file-backed applied-record representation remains the accepted TB8 single-change `exact_change` shape; multi-change application and persisted multi-change provenance remain deferred.
- **Acceptance:** Accepted by the user on August 28, 2026. The user confirmed that a dependent change cannot be applied without its explicitly accepted prerequisite; the current version and retained history remain unchanged.

## Required third cycle: apply independently judged changes

This is the next TB9 implementation cycle identified in the [delivery plan](delivery-plan.md#9-reject-stale-and-incoherent-applications). Its documentation prerequisite was completed against the accepted Product Decisions, Architecture, Test Strategy S2 guidance, ADRs 0002, 0005, 0006, and 0009, the accepted TB8 persistence representation, and the accepted first and second TB9 cycles. The concrete mixed-decision shape and caller-visible application behavior below were confirmed before implementation.

### Scope

The third TB9 cycle proves that a person can make different explicit decisions for independently reviewable changes in one Proposal. The fixture contains two independent exact changes. The Judgment explicitly accepts one change and rejects the other. Governance applies only the accepted change, leaves the rejected change unapplied, preserves the prior version, and continues to enforce dependency closure for the accepted subset.

This cycle uses the existing S2 Governance Interface and deterministic in-memory version-storage Adapter. It does not implement edit or defer decisions, dependent mixed-decision application, the S1 Proposal Review route, or a multi-change Repository Format representation.

### Documentation prerequisite for this cycle

Before writing the Red test or implementation code, explicitly complete these to-do items:

1. Recheck the accepted Product Decisions, Architecture, Test Strategy, applicable ADRs, TB8 persistence decisions, and the accepted first and second TB9 cycles.
2. Confirm this section's additive `rejectedChangeIds` shape, accepted-only application rule, literal independent two-change fixture, and explicit deferrals.
3. Record any changed public Interface, dependency ownership, or durable representation in this brief and the owning documentation before code changes.
4. Obtain explicit human confirmation that rejected changes are not silently applied, omitted IDs are not inferred as rejection, and accepted changes still require their complete dependency closure.

Implementation began only after this third-cycle documentation review and confirmation task was complete. A new decision representation, dependency policy, persistent multi-change representation, or Test Seam would require stopping and revising this brief before proceeding.

### Public behavior

Given the current `bayesian-statistics-v1` version and a Proposal containing two independent changes:

1. Governance validates the Proposal and records a Judgment with one explicitly accepted change ID and one explicitly rejected change ID without changing Governed Knowledge.
2. `applyProposal` derives the accepted subset from `acceptedChangeIds` and verifies its direct/transitive dependency closure.
3. Because both fixture changes are independent, the accepted subset is closed.
4. Governance applies only the accepted exact change and returns the existing `applied` outcome.
5. The new current version contains the accepted source-evidence change, while the rejected claim-update change is absent.
6. Governance does not reinterpret an omitted ID as rejected, apply the rejected change, or remove the rejected decision from the recorded Judgment. A later Judgment is required to revisit it.

The dependency rule remains the second-cycle rule: every accepted change must include all direct and indirect `dependsOn` IDs. Rejecting a dependent change does not require rejecting its prerequisite; accepting a dependent change without accepting its prerequisite remains `invalid-dependency-subset`. This cycle observes only independent changes so that mixed decisions and dependency closure remain separately observable.

### Interface shape

Keep the accepted dependency-subset representation confirmed in the second cycle and add the explicit rejected set:

```text
Judgment {
  ...existing exact-version binding...
  decision: "accepted"
  acceptedChangeIds: string[]
  rejectedChangeIds: string[]
}
```

For this cycle, every Proposal change ID must appear exactly once across `acceptedChangeIds` and `rejectedChangeIds`. The arrays must not contain duplicates or unknown IDs, and neither array may be inferred from omission. The top-level `decision: "accepted"` continues to mean that this Judgment authorizes the explicitly accepted subset; the per-change arrays carry the mixed decision detail.

Governance owns classification validation, accepted-subset dependency closure, and accepted-only composition. The version-storage Adapter continues to own version retrieval and mutation mechanics. This is an additive S2 Interface change; it does not introduce a new Adapter or Test Seam. The TB8 file-backed applied-record representation remains single-change-compatible, so a valid multi-change application remains an in-memory behavior in this cycle and its durable provenance remains deferred.

This two-array shape is intentionally limited. `edit` and `defer` are not represented yet; a later decision-vocabulary cycle must replace or extend the representation with an explicit design rather than treating either state as rejection.

### Literal fixture and expected values

Use the existing TB8 fixture target and `bayesian-statistics-v1` content:

- Target ID: `bayesian-statistics`.
- Target title: `Bayesian statistics`.
- Target path: `knowledge/bayesian-statistics.md`.
- Proposal ID: `proposal-tb9-independent-change-decisions-bayesian-statistics`.
- Proposal fingerprint: `proposal-fingerprint-tb9-independent-change-decisions-bayesian-statistics`.
- Working Material ID: `working-material-tb9-independent-change-decisions-bayesian-statistics`.
- Judgment ID: `judgment-tb9-independent-change-decisions-bayesian-statistics`.
- Base version: `bayesian-statistics-v1`.
- Deterministic next version ID in the in-memory Adapter: `bayesian-statistics-v2`.

Change `change-tb9-independent-source-evidence` is explicitly accepted:

- `dependsOn: []`.
- Exact `before`: `source_record: sources/papers/bayesian-statistics.md`.
- Exact `after`: `source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence`.

Change `change-tb9-independent-claim-update` is explicitly rejected:

- `dependsOn: []`.
- Exact `before`: `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.
- Exact `after`: `Bayesian statistics uses evidence to update prior belief.`.

The Working Material content contains both exact changes. The Judgment contains:

```text
{
  proposalFingerprint: "proposal-fingerprint-tb9-independent-change-decisions-bayesian-statistics",
  baseVersionId: "bayesian-statistics-v1",
  decision: "accepted",
  acceptedChangeIds: ["change-tb9-independent-source-evidence"],
  rejectedChangeIds: ["change-tb9-independent-claim-update"]
}
```

The expected `bayesian-statistics-v2` content is the current fixture content with the `reviewed_claim: fixture-evidence` line inserted after the `source_record` line. The original fixture sentence remains unchanged because its change was explicitly rejected. The current `bayesian-statistics-v1` remains retrievable.

### Test Seam and minimum vertical path

Use the existing S2 public Governance Interface with the deterministic in-memory Governance version-storage Adapter. Add a behavior-named test at `app/tests/governance/apply-independent-change-decisions.test.ts`.

The test must:

- create the two-change Proposal with the literal IDs, exact replacements, and empty dependency lists;
- record the Judgment with one literal accepted ID and one literal rejected ID;
- assert that Proposal and Judgment creation do not change the current version;
- apply through Governance and assert the existing `applied` outcome and exact accepted-only content;
- assert that the rejected change's content is absent from the new version;
- assert through `loadCurrentVersion` that `bayesian-statistics-v2` is current; and
- assert through `getVersion` that `bayesian-statistics-v1` remains retrievable.

The test must use independently written expected content and must not inspect private Governance maps, derive expected content through an implementation helper, read repository files as a side channel, or call a private dependency function. An injected `applyVersion` observer may verify the public storage mutation boundary, but the behavior is primarily observed through Governance's returned versions.

Minimum path:

1. Complete this documentation review and obtain confirmation before the Red test.
2. Add the one behavior test and observe the expected failure because the current Judgment has no explicit rejected-change representation and Governance applies only its single-change path.
3. Add the smallest rejected-ID representation and mixed-decision validation needed for this independent fixture.
4. Compose and apply only the accepted changes while preserving dependency-closure validation.
5. Run the focused S2 test, `npm run check`, coverage, and complexity checks.
6. Record Red/Green evidence and human acceptance before selecting the edit/defer decision vocabulary or dependent mixed-decision slice.

### Boundaries, alternatives, and deferrals

This cycle explicitly defers:

- `edit` and `defer` per-change decisions and their persisted representation;
- applying an accepted dependent change while its prerequisite is rejected or deferred;
- dependency ordering, rollback, and failure recovery for multiple accepted changes;
- persistent applied-record/schema changes for mixed multi-change provenance;
- Proposal Review UI, Atlas/Studio routing, Agent Provider use, Git, remote synchronization, and network behavior.

The following alternatives are discarded or deferred for this cycle:

- **Treat omitted IDs as rejected:** discarded because omission would make an incomplete Judgment look like an explicit human decision.
- **Replace `acceptedChangeIds` with a generic decision-record list immediately:** deferred because the accepted dependency-closure contract was just confirmed; the additive set keeps this cycle focused while leaving a deliberate follow-on for `edit` and `defer`.
- **Apply every Proposal change and use rejection only as display metadata:** discarded because it would turn an explicit rejection into an unreviewed Governed Knowledge change.
- **Reject the entire Proposal when any change is rejected:** discarded because it would prevent independently reviewable changes from receiving different outcomes.
- **Let the storage Adapter select accepted changes:** discarded because per-change Judgment policy belongs to Governance and must remain Adapter-independent.
- **Persist multi-change mixed decisions now:** deferred because durable change-level audit and rollback provenance need a separate representation decision.

### Acceptance evidence

The user confirmed this third-cycle design on August 28, 2026. Completion requires:

- the additive `rejectedChangeIds` Judgment shape and exact classification rule;
- the accepted-only application behavior;
- the continued direct/transitive dependency-closure rule; and
- the literal independent two-change fixture and explicit deferrals above.

After confirmation, completion requires the focused Red/Green evidence, full automated gates, proof that the rejected change was not applied, and human confirmation that the resulting version contains only the explicitly accepted change while the prior version remains retrievable. Acceptance of this cycle will not approve `edit`/`defer`, dependent mixed decisions, or persistent mixed-decision provenance.

### Third-cycle implementation evidence

- **Confirmation:** The user confirmed the additive `rejectedChangeIds` Judgment shape, explicit classification rule, accepted-only application behavior, dependency-closure rule, literal fixture, and deferrals before the Red test on August 28, 2026.
- **Red evidence:** The focused test first failed because the existing Judgment had no rejected-change representation and dropped the explicit rejection before application.
- **Green evidence:** The focused independent-decision test passed. `npm run check` passed formatting, linting, strict type checking, and 68 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 81.12% statements, 73.01% branches, and 97.31% functions. `npm run lint:complexity` passed.
- **Behavior evidence:** Governance applied only `change-tb9-independent-source-evidence`; the explicitly rejected claim update was absent from `bayesian-statistics-v2`, the storage mutation occurred once, and `bayesian-statistics-v1` remained retrievable.
- **Compatibility evidence:** Existing stale-Judgment, invalid-dependency-subset, single-change, and file-backed contract tests pass. The file-backed applied-record representation remains the accepted TB8 single-change `exact_change` shape; mixed multi-change persistence remains deferred.
- **Acceptance:** Human acceptance of this independently judged-change behavior remains pending. The user has confirmed the implementation specification, not the completed behavior.

## Required fourth cycle: defer an independently reviewable change

This is the next TB9 implementation cycle identified in the [delivery plan](delivery-plan.md#9-reject-stale-and-incoherent-applications). Its documentation prerequisite was completed against the accepted Product Decisions, Architecture, Test Strategy S2 guidance, ADRs 0002, 0005, 0006, and 0009, the accepted TB8 persistence representation, and the completed first three TB9 cycles. The additive deferral shape and caller-visible application behavior below were confirmed before implementation.

### Scope

The fourth TB9 cycle proves that a person can explicitly defer an independently reviewable change without turning that decision into rejection or silently applying it. The fixture contains two independent exact changes. The Judgment explicitly accepts one change and defers the other. Governance applies only the accepted change, leaves the deferred change unapplied, and returns the deferred classification in the Judgment it records.

This cycle uses the existing S2 Governance Interface and deterministic in-memory version-storage Adapter. It does not implement edited decisions, dependent mixed decisions, deferred-change re-review, the S1 Proposal Review route, or a multi-change Repository Format representation.

### Documentation prerequisite for this cycle

Before writing the Red test or implementation code, explicitly complete these to-do items:

1. Recheck the accepted Product Decisions, Architecture, Test Strategy, applicable ADRs, TB8 persistence decisions, and the accepted first three TB9 cycles.
2. Confirm this section's additive `deferredChangeIds` shape, accepted-only application rule, literal independent two-change fixture, and explicit deferrals.
3. Record any changed public Interface, dependency ownership, or durable representation in this brief and the owning documentation before code changes.
4. Obtain explicit human confirmation that a deferred change is neither rejected nor accepted, omitted IDs are not inferred as deferred, and accepted changes still require their complete dependency closure.

Implementation began only after this fourth-cycle documentation review and confirmation task was complete. A new decision representation, dependency policy, persistent multi-change representation, or Test Seam would require stopping and revising this brief before proceeding.

### Public behavior

Given the current `bayesian-statistics-v1` version and a Proposal containing two independent changes:

1. Governance validates the Proposal and records a Judgment with one explicitly accepted change ID and one explicitly deferred change ID without changing Governed Knowledge.
2. `applyProposal` derives the accepted subset from `acceptedChangeIds` and verifies its direct/transitive dependency closure.
3. Because both fixture changes are independent, the accepted subset is closed.
4. Governance applies only the accepted exact change and returns the existing `applied` outcome.
5. The new current version contains the accepted source-evidence change, while the deferred claim-update change is absent.
6. The deferred ID remains distinct from `rejectedChangeIds`; no caller may infer that the deferred change was rejected, and no automatic later Judgment or re-review occurs.

The dependency rule remains unchanged: every accepted change must include all direct and indirect `dependsOn` IDs. This cycle observes independent changes so that explicit deferral is separate from both rejection and dependency invalidity.

### Interface shape

Keep the accepted and rejected classification sets confirmed in the third cycle and add the explicit deferred set:

```text
Judgment {
  ...existing exact-version binding...
  decision: "accepted"
  acceptedChangeIds: string[]
  rejectedChangeIds: string[]
  deferredChangeIds: string[]
}
```

Every Proposal change ID must appear exactly once across all three arrays. The arrays must not contain duplicates or unknown IDs, and no array may be inferred from omission. The top-level `decision: "accepted"` continues to mean that the Judgment authorizes the explicitly accepted subset; the per-change arrays carry the mixed decision detail.

Governance owns classification validation, accepted-subset dependency closure, and accepted-only composition. The version-storage Adapter continues to own version retrieval and mutation mechanics. This is an additive S2 Interface change; it does not introduce a new Adapter or Test Seam. The TB8 file-backed applied-record representation remains single-change-compatible, so durable mixed-decision provenance remains deferred.

This cycle intentionally does not add `edit`. An edited decision needs an explicit representation for the replacement exact change and its provenance; it must be specified separately rather than being encoded as acceptance or deferral.

### Literal fixture and expected values

Use the existing TB8 fixture target and `bayesian-statistics-v1` content:

- Target ID: `bayesian-statistics`.
- Target title: `Bayesian statistics`.
- Target path: `knowledge/bayesian-statistics.md`.
- Proposal ID: `proposal-tb9-deferred-change-bayesian-statistics`.
- Proposal fingerprint: `proposal-fingerprint-tb9-deferred-change-bayesian-statistics`.
- Working Material ID: `working-material-tb9-deferred-change-bayesian-statistics`.
- Judgment ID: `judgment-tb9-deferred-change-bayesian-statistics`.
- Base version: `bayesian-statistics-v1`.
- Deterministic next version ID in the in-memory Adapter: `bayesian-statistics-v2`.

Change `change-tb9-deferred-source-evidence` is explicitly accepted:

- `dependsOn: []`.
- Exact `before`: `source_record: sources/papers/bayesian-statistics.md`.
- Exact `after`: `source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence`.

Change `change-tb9-deferred-claim-update` is explicitly deferred:

- `dependsOn: []`.
- Exact `before`: `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.
- Exact `after`: `Bayesian statistics uses evidence to update prior belief.`.

The Working Material content contains both exact changes. The Judgment contains:

```text
{
  proposalFingerprint: "proposal-fingerprint-tb9-deferred-change-bayesian-statistics",
  baseVersionId: "bayesian-statistics-v1",
  decision: "accepted",
  acceptedChangeIds: ["change-tb9-deferred-source-evidence"],
  rejectedChangeIds: [],
  deferredChangeIds: ["change-tb9-deferred-claim-update"]
}
```

The expected `bayesian-statistics-v2` content is the current fixture content with the `reviewed_claim: fixture-evidence` line inserted after the `source_record` line. The original fixture sentence remains unchanged because its change was explicitly deferred. The current `bayesian-statistics-v1` remains retrievable.

### Test Seam and minimum vertical path

Use the existing S2 public Governance Interface with the deterministic in-memory Governance version-storage Adapter. Add a behavior-named test at `app/tests/governance/apply-deferred-change-decision.test.ts`.

The test must:

- create the two-change Proposal with the literal IDs, exact replacements, and empty dependency lists;
- record the Judgment with one literal accepted ID, an empty rejected set, and one literal deferred ID;
- assert that Proposal and Judgment creation do not change the current version;
- apply through Governance and assert the existing `applied` outcome and exact accepted-only content;
- assert that the deferred change's content is absent from the new version;
- assert through `loadCurrentVersion` that `bayesian-statistics-v2` is current; and
- assert through `getVersion` that `bayesian-statistics-v1` remains retrievable.

The test must use independently written expected content and must not inspect private Governance maps, derive expected content through an implementation helper, read repository files as a side channel, or call a private dependency function. An injected `applyVersion` observer may verify the public storage mutation boundary, but the behavior is primarily observed through Governance's returned versions.

Minimum path:

1. Complete this documentation review and obtain confirmation before the Red test.
2. Add the one behavior test and observe the expected failure because the current Judgment has no explicit deferred-change representation.
3. Add the smallest deferred-ID representation and classification validation needed for this independent fixture.
4. Compose and apply only the accepted changes while preserving dependency-closure validation.
5. Run the focused S2 test, `npm run check`, coverage, and complexity checks.
6. Record Red/Green evidence and human acceptance before selecting edited decisions or deferred-change re-review.

### Boundaries, alternatives, and deferrals

This cycle explicitly defers:

- edited decisions and their exact-change/provenance representation;
- re-reviewing or automatically resuming a deferred change;
- applying an accepted dependent change while its prerequisite is deferred or rejected;
- dependency ordering, rollback, and failure recovery for multiple accepted changes;
- persistent applied-record/schema changes for mixed multi-change provenance;
- Proposal Review UI, Atlas/Studio routing, Agent Provider use, Git, remote synchronization, and network behavior.

The following alternatives are discarded or deferred for this cycle:

- **Treat omitted IDs as deferred:** discarded because omission would make an incomplete Judgment look like an explicit human decision.
- **Collapse deferred into rejected:** discarded because deferral preserves a distinct human decision to postpone rather than decline the proposed change.
- **Apply deferred changes after a timeout or later automatically:** discarded because application requires a fresh explicit Judgment.
- **Block the entire Proposal when one change is deferred:** discarded because it would prevent independent accepted changes from being applied.
- **Let the storage Adapter interpret deferred IDs:** discarded because decision policy belongs to Governance and must remain Adapter-independent.
- **Persist mixed deferred decisions now:** deferred because durable change-level audit and re-review provenance need a separate representation decision.

### Acceptance evidence

The user confirmed this fourth-cycle design on August 28, 2026. Completion requires:

- the additive `deferredChangeIds` Judgment shape and exact three-way classification rule;
- the accepted-only application behavior;
- the continued direct/transitive dependency-closure rule; and
- the literal independent two-change fixture and explicit deferrals above.

After confirmation, completion requires the focused Red/Green evidence, full automated gates, proof that the deferred change was not applied or treated as rejected, and human confirmation that the resulting version contains only the explicitly accepted change while the prior version remains retrievable. Acceptance of this cycle will not approve edited decisions, deferred-change re-review, dependent mixed decisions, or persistent mixed-decision provenance.

### Fourth-cycle implementation evidence

- **Confirmation:** The user confirmed the additive `deferredChangeIds` Judgment shape, exact three-way classification rule, accepted-only application behavior, dependency-closure rule, literal fixture, and explicit deferrals before the Red test on August 28, 2026.
- **Red evidence:** The focused test first failed because the existing Judgment validator rejected the explicit deferred ID as an incomplete classification.
- **Green evidence:** The focused deferred-decision test passed. `npm run check` passed formatting, linting, strict type checking, and 69 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 81.13% statements, 73.06% branches, and 97.31% functions. `npm run lint:complexity` passed.
- **Behavior evidence:** Governance applied only `change-tb9-deferred-source-evidence`; the explicitly deferred claim update was absent from `bayesian-statistics-v2`, the storage mutation occurred once, and `bayesian-statistics-v1` remained retrievable.
- **Compatibility evidence:** Existing single-change, stale-Judgment, invalid-dependency-subset, and independently judged-change tests pass. Multi-change applied-record persistence remains deferred.
- **Acceptance:** Accepted by the user on August 28, 2026. The user confirmed that an explicitly deferred change is neither rejected nor applied, while the accepted change is applied and the prior version remains retrievable.

## Required fifth cycle: apply an edited independently reviewable change

This is the fifth TB9 implementation cycle identified in the [delivery plan](delivery-plan.md#9-reject-stale-and-incoherent-applications). Its documentation prerequisite was completed against the accepted Product Decisions, Architecture, Test Strategy S2 guidance, ADRs 0002, 0005, 0006, and 0009, the accepted TB8 persistence representation, and the completed first four TB9 cycles. The user confirmed the edited-change representation and caller-visible application behavior below before implementation.

### Scope

The fifth TB9 cycle proves that a person can explicitly edit one independently reviewable Proposal change during Judgment while accepting another unchanged change. Governance applies the accepted change and the reviewer-supplied edited exact change, preserves the original Proposal and Judgment bindings, and does not apply the original exact replacement for the edited item.

This cycle uses the existing S2 Governance Interface and deterministic in-memory version-storage Adapter. It does not implement edited dependent changes, re-editing or changing a recorded Judgment, durable mixed-decision provenance, the S1 Proposal Review route, or a multi-change Repository Format representation.

### Documentation prerequisite for this cycle — complete

Before writing the Red test or implementation code, explicitly complete these to-do items:

1. Recheck the accepted Product Decisions, Architecture, Test Strategy, applicable ADRs, TB8 persistence decisions, and the completed first four TB9 cycles.
2. Confirm this section's `editedChanges` Judgment shape, edited-only application rule, literal independent two-change fixture, and explicit deferrals.
3. Record any changed public Interface, dependency ownership, or durable representation in this brief and the owning documentation before code changes.
4. Obtain explicit human confirmation that an edited change replaces only the reviewed Proposal change, remains bound to the same exact base version, and is not silently treated as the Proposal's original replacement.

Implementation began only after this fifth-cycle documentation review and confirmation task was complete. A new decision representation, dependency policy, persistent multi-change representation, or Test Seam would require stopping and revising this brief before proceeding.

### Public behavior

Given the current `bayesian-statistics-v1` version and a Proposal containing two independent changes:

1. Governance validates the Proposal and records a Judgment that accepts the source-evidence change and explicitly edits the claim-update change.
2. The edited Judgment supplies a complete replacement `ExactChange` for the edited change, with the same target path and original `before` text but a reviewer-selected `after` text.
3. `applyProposal` derives the effective accepted subset from `acceptedChangeIds` plus the edited change IDs and verifies its direct/transitive dependency closure.
4. Governance applies the accepted original change and the edited exact change, returning the existing `applied` outcome.
5. The new current version contains the edited claim text, not the original Proposal's claim text.
6. The original Proposal remains the reviewed source of the change identity and the Judgment remains bound to its exact fingerprint and base version. No automatic Proposal mutation, Judgment rewrite, or second review is performed.

An edited change is an explicit accepted decision for the reviewer-supplied exact replacement. Its `before` text must still match the reviewed base content, its path must remain the Proposal target path, and its `after` text must be non-empty and different from `before`. Dependencies continue to refer to Proposal change IDs; an edited dependent change still requires a dependency-closed effective accepted subset.

### Interface shape

Keep the accepted, rejected, and deferred classification sets and add an explicit edited-change record to `Judgment`:

```text
EditedChange {
  changeId: string
  exactChange: ExactChange
}

Judgment {
  ...existing exact-version binding...
  decision: "accepted"
  acceptedChangeIds: string[]
  rejectedChangeIds: string[]
  deferredChangeIds: string[]
  editedChanges: EditedChange[]
}
```

Every Proposal change ID must appear exactly once across `acceptedChangeIds`, `rejectedChangeIds`, `deferredChangeIds`, and the `editedChanges.changeId` values. The arrays and edited records must not contain duplicates or unknown IDs, and no classification may be inferred from omission. `editedChanges` IDs are part of the effective accepted subset for dependency closure and application, but their supplied `exactChange` replaces the corresponding Proposal change only for this Judgment.

Governance owns classification validation, edited exact-change validation, accepted-subset dependency closure, and effective-change composition. The version-storage Adapter continues to own version retrieval and mutation mechanics. This is an additive S2 Interface change; it does not introduce a new Adapter or Test Seam. The TB8 file-backed applied-record representation remains single-change-compatible, so durable edited multi-change provenance remains deferred.

### Literal fixture and expected values

Use the existing TB8 fixture target and `bayesian-statistics-v1` content:

- Target ID: `bayesian-statistics`.
- Target title: `Bayesian statistics`.
- Target path: `knowledge/bayesian-statistics.md`.
- Proposal ID: `proposal-tb9-edited-change-bayesian-statistics`.
- Proposal fingerprint: `proposal-fingerprint-tb9-edited-change-bayesian-statistics`.
- Working Material ID: `working-material-tb9-edited-change-bayesian-statistics`.
- Judgment ID: `judgment-tb9-edited-change-bayesian-statistics`.
- Base version: `bayesian-statistics-v1`.
- Deterministic next version ID in the in-memory Adapter: `bayesian-statistics-v2`.

Change `change-tb9-edited-source-evidence` is accepted unchanged:

- `dependsOn: []`.
- Exact `before`: `source_record: sources/papers/bayesian-statistics.md`.
- Exact `after`: `source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence`.

Change `change-tb9-edited-claim-update` is explicitly edited in the Judgment:

- Proposal `dependsOn: []`.
- Proposal exact `before`: `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.
- Proposal exact `after`: `Bayesian statistics uses evidence to update prior belief.`.
- Judgment exact `before`: `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.
- Judgment exact `after`: `Bayesian statistics updates prior belief with evidence.`.

The Working Material content contains both original Proposal changes. The Judgment contains:

```text
{
  proposalFingerprint: "proposal-fingerprint-tb9-edited-change-bayesian-statistics",
  baseVersionId: "bayesian-statistics-v1",
  decision: "accepted",
  acceptedChangeIds: ["change-tb9-edited-source-evidence"],
  rejectedChangeIds: [],
  deferredChangeIds: [],
  editedChanges: [{
    changeId: "change-tb9-edited-claim-update",
    exactChange: {
      path: "knowledge/bayesian-statistics.md",
      before: "This fixture topic gives the S1 workflow a stable item to carry between\\nworkspaces.",
      after: "Bayesian statistics updates prior belief with evidence."
    }
  }]
}
```

The expected `bayesian-statistics-v2` content contains the `reviewed_claim: fixture-evidence` line and `Bayesian statistics updates prior belief with evidence.`. It must not contain the original Proposal after text `Bayesian statistics uses evidence to update prior belief.`. The current `bayesian-statistics-v1` remains retrievable.

### Test Seam and minimum vertical path

Use the existing S2 public Governance Interface with the deterministic in-memory Governance version-storage Adapter. Add a behavior-named test at `app/tests/governance/apply-edited-change-decision.test.ts`.

The test must:

- create the two-change Proposal with the literal original changes and empty dependency lists;
- record a Judgment with one accepted ID, one edited change record, and empty rejected/deferred sets;
- assert that Proposal and Judgment creation do not change the current version;
- apply through Governance and assert the existing `applied` outcome and exact effective content;
- assert that the original Proposal after text for the edited change is absent from the new version;
- assert through `loadCurrentVersion` that `bayesian-statistics-v2` is current; and
- assert through `getVersion` that `bayesian-statistics-v1` remains retrievable.

The test must use independently written expected content and must not inspect private Governance maps, derive expected content through an implementation helper, read repository files as a side channel, or call a private dependency function. An injected `applyVersion` observer may verify the public storage mutation boundary, but the behavior is primarily observed through Governance's returned versions.

Minimum path:

1. Complete this documentation review and obtain confirmation before the Red test.
2. Add the one behavior test and observe the expected failure because the current Judgment has no edited-change representation.
3. Add the smallest edited-change record and exactly-once classification validation needed for this independent fixture.
4. Validate and compose the reviewer-supplied exact replacement while preserving dependency-closure validation.
5. Run the focused S2 test, `npm run check`, coverage, and complexity checks.
6. Record Red/Green evidence and human acceptance before selecting edited dependent changes or durable edited-decision provenance.

### Boundaries, alternatives, and deferrals

This cycle explicitly defers:

- edited dependent changes and their ordering/rollback behavior;
- re-editing, withdrawing, or automatically reopening a recorded Judgment;
- using an edited change to alter its Proposal dependency graph;
- persistent applied-record/schema changes for edited multi-change provenance;
- Proposal Review UI, Atlas/Studio routing, Agent Provider use, Git, remote synchronization, and network behavior.

The following alternatives are discarded or deferred for this cycle:

- **Mutate the Proposal's original `after` text:** discarded because the original Proposal must remain inspectable and the Judgment must show what the person changed during review.
- **Treat an edited change as ordinary acceptance:** discarded because it would lose the reviewer-supplied replacement and could apply text the person did not approve.
- **Create a new Proposal for every edit:** deferred because this cycle proves one Judgment can retain the relationship between the original Proposal change and its explicit reviewed replacement; broader Proposal revision workflows need their own slice.
- **Infer the edited `before` or path from the Proposal:** discarded because the Judgment must carry a complete exact replacement and Governance must validate its target binding.
- **Let the storage Adapter apply the edited replacement:** discarded because decision semantics and effective-change selection belong to Governance.
- **Persist edited multi-change provenance now:** deferred because the durable audit and rollback representation must preserve both original and edited exact changes.

### Acceptance evidence and required confirmation

The user confirmed these implementation decisions on August 28, 2026:

- the `editedChanges` Judgment shape and exactly-once classification rule;
- the effective accepted-subset and edited-only replacement behavior;
- the continued direct/transitive dependency-closure rule; and
- the literal independent two-change fixture and explicit deferrals above.

Completion requires the focused Red/Green evidence, full automated gates, proof that the original Proposal replacement was not applied for the edited item, and human confirmation that the resulting version contains the explicitly edited change while the prior version remains retrievable. Acceptance of this cycle will not approve edited dependent changes, Proposal revision workflows, or persistent edited-decision provenance.

### Fifth-cycle implementation evidence

- **Confirmation:** The user confirmed the `editedChanges` Judgment shape, exactly-once classification rule, effective accepted-subset behavior, literal fixture, and explicit deferrals before implementation on August 28, 2026.
- **Red evidence:** The focused test first failed because the existing Judgment validator did not classify edited changes and returned `invalid-judgment` with `The Judgment must classify every Proposal change exactly once.`.
- **Green evidence:** `npm run check` passed formatting, linting, strict type checking, and 70 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 81.27% statements, 73.19% branches, and 97.40% functions. `npm run lint:complexity` passed.
- **Behavior evidence:** `apply-edited-change-decision.test.ts` proves that Governance applies the accepted source change and the reviewer-supplied claim replacement, excludes the original Proposal replacement, invokes storage mutation once, and preserves `bayesian-statistics-v1`.
- **Compatibility evidence:** Existing single-change, stale-Judgment, invalid-dependency-subset, independent-decision, deferred-decision, and file-backed contract tests pass. Persistent edited multi-change provenance remains deferred as specified.
- **Acceptance:** Accepted by the user on August 28, 2026. The user confirmed that the resulting version contains `Bayesian statistics updates prior belief with evidence.` rather than the original Proposal text, while the prior version remains retrievable.
- **Status:** This implementation cycle is complete and accepted. Edited dependent changes, Proposal revision workflows, and persistent edited-decision provenance remain deferred.

## Required sixth cycle: apply an edited dependent change

This is the sixth TB9 implementation cycle identified in the [delivery plan](delivery-plan.md#9-reject-stale-and-incoherent-applications). Its documentation prerequisite was completed against the accepted Product Decisions, Architecture, Test Strategy S2 guidance, ADRs 0002, 0005, 0006, and 0009, the accepted TB8 persistence representation, and the completed first five TB9 cycles. The user confirmed the edited-dependent representation and caller-visible behavior below before implementation.

### Scope

The sixth TB9 cycle proves that an edited change may depend on another Proposal change: a Judgment accepts the prerequisite unchanged and explicitly edits the dependent change. Governance applies both changes because the effective accepted subset is dependency-closed, using the reviewer-supplied exact replacement only for the dependent item.

This cycle reuses the fifth-cycle `editedChanges` Judgment representation and the existing dependency-closure rule. It uses a two-change graph whose prerequisite appears before its dependent in Proposal order, and whose dependent `before` text is present in the reviewed base version. It does not add generic dependency reordering, post-prerequisite exact-change matching, multi-level dependency graphs, durable edited-decision provenance, Judgment revision, the S1 Proposal Review route, or a new Repository Format representation.

### Documentation prerequisite for this cycle — complete

Before writing the Red test or implementation code, explicitly complete these to-do items:

1. Recheck the accepted Product Decisions, Architecture, Test Strategy, applicable ADRs, TB8 persistence decisions, and the completed first five TB9 cycles.
2. Confirm that the fifth-cycle `editedChanges` shape remains sufficient, that edited IDs participate in direct/transitive dependency closure, and that the literal dependent fixture and failure outcome below are the intended behavior.
3. Confirm the Proposal-order boundary: this slice applies changes in their authored Proposal order, with the prerequisite before the dependent; it does not silently topologically reorder an out-of-order Proposal.
4. Confirm the atomic mutation and failure boundary: a missing prerequisite returns `invalid-dependency-subset` before the storage Adapter mutates, while a valid dependency-closed application creates one new version and preserves the prior version.
5. Record any changed public Interface, dependency ownership, or durable representation in this brief and the owning documentation before code changes.
6. Obtain explicit human confirmation of the dependency-closed edited application, Proposal-order boundary, literal fixture, failure outcome, and explicit deferrals.

Implementation began only after this sixth-cycle documentation review and confirmation task was complete. A new decision representation, dependency policy, persistent representation, or Test Seam would require stopping and revising this brief before proceeding.

### Public behavior

Given the current `bayesian-statistics-v1` version and a Proposal containing a prerequisite and a dependent change:

1. The Proposal lists `change-tb9-edited-dependent-source-evidence` first and `change-tb9-edited-dependent-claim-update` second; the dependent declares the prerequisite in `dependsOn`.
2. Governance records a Judgment that accepts the prerequisite unchanged and explicitly edits the dependent change.
3. `applyProposal` forms the effective accepted subset from the accepted and edited IDs, verifies its direct/transitive dependency closure, and retains Proposal order for applying the exact changes.
4. Governance applies the original prerequisite exact change and the reviewer-supplied edited exact change, returning the existing `applied` outcome.
5. The new current version contains the prerequisite source metadata and edited claim text, not the original Proposal claim text.
6. If a second Judgment instead edits the dependent while classifying the prerequisite as rejected, Governance returns `invalid-dependency-subset` before storage mutation. The invalid attempt creates no version and leaves the prior version retrievable.

The dependency is a Governance dependency between labeled Proposal changes. This first edited-dependent slice intentionally keeps the dependent `before` text present in `bayesian-statistics-v1`; it does not infer or synthesize a dependent replacement from the content produced by its prerequisite. Proposal order is the application order for this slice, so an out-of-order dependency is outside the confirmed behavior rather than silently reordered.

### Interface and ownership

No new public type is required. Reuse:

- `ProposalChange.dependsOn` for the prerequisite IDs;
- `Judgment.acceptedChangeIds`, `rejectedChangeIds`, and `deferredChangeIds` for complete classification; and
- `Judgment.editedChanges` for the dependent change's reviewer-supplied `ExactChange`.

Governance owns effective accepted-subset composition, direct/transitive closure validation, edited exact-change validation, and application ordering. The version-storage Adapter continues to own one atomic version mutation and retained-version mechanics. The file-backed applied-record representation remains unchanged; persistent edited multi-change provenance remains deferred.

### Literal fixture and expected values

Use the existing TB8 fixture target and `bayesian-statistics-v1` content:

- Target ID: `bayesian-statistics`.
- Target title: `Bayesian statistics`.
- Target path: `knowledge/bayesian-statistics.md`.
- Proposal ID: `proposal-tb9-edited-dependent-change-bayesian-statistics`.
- Proposal fingerprint: `proposal-fingerprint-tb9-edited-dependent-change-bayesian-statistics`.
- Working Material ID: `working-material-tb9-edited-dependent-change-bayesian-statistics`.
- Judgment ID: `judgment-tb9-edited-dependent-change-bayesian-statistics`.
- Invalid Judgment ID: `judgment-tb9-edited-dependent-missing-prerequisite`.
- Base version: `bayesian-statistics-v1`.
- Deterministic next version ID in the in-memory Adapter: `bayesian-statistics-v2`.

Change `change-tb9-edited-dependent-source-evidence` is the prerequisite and is accepted unchanged:

- `dependsOn: []`.
- Exact `before`: `source_record: sources/papers/bayesian-statistics.md`.
- Exact `after`: `source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence`.

Change `change-tb9-edited-dependent-claim-update` is second, depends on the prerequisite, and is edited in the Judgment:

- `dependsOn: ["change-tb9-edited-dependent-source-evidence"]`.
- Proposal exact `before`: `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.
- Proposal exact `after`: `Bayesian statistics uses evidence to update prior belief.`.
- Judgment exact `before`: `This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.`.
- Judgment exact `after`: `Bayesian statistics updates prior belief from evidence.`.

The Working Material content contains both original Proposal changes. The valid Judgment contains:

```text
{
  proposalFingerprint: "proposal-fingerprint-tb9-edited-dependent-change-bayesian-statistics",
  baseVersionId: "bayesian-statistics-v1",
  decision: "accepted",
  acceptedChangeIds: ["change-tb9-edited-dependent-source-evidence"],
  rejectedChangeIds: [],
  deferredChangeIds: [],
  editedChanges: [{
    changeId: "change-tb9-edited-dependent-claim-update",
    exactChange: {
      path: "knowledge/bayesian-statistics.md",
      before: "This fixture topic gives the S1 workflow a stable item to carry between\\nworkspaces.",
      after: "Bayesian statistics updates prior belief from evidence."
    }
  }]
}
```

The expected `bayesian-statistics-v2` content contains `reviewed_claim: fixture-evidence` and `Bayesian statistics updates prior belief from evidence.`. It must not contain the original Proposal after text `Bayesian statistics uses evidence to update prior belief.`. The invalid missing-prerequisite attempt returns:

```text
{
  outcome: "invalid-dependency-subset",
  detail: "The accepted change subset omits a required dependency."
}
```

### Test Seam and minimum vertical path

Use the existing S2 public Governance Interface with the deterministic in-memory Governance version-storage Adapter. Add a behavior-named test at `app/tests/governance/apply-edited-dependent-change-decision.test.ts`.

The test must:

- create the literal two-change Proposal in dependency order;
- record the valid Judgment with one accepted prerequisite and one edited dependent change;
- apply through Governance and assert the exact effective content and existing `applied` outcome;
- assert the original Proposal replacement for the edited dependent is absent;
- record a separate Judgment that edits the dependent while rejecting the prerequisite;
- assert the exact `invalid-dependency-subset` result, one total storage mutation, and no extra version;
- assert through `loadCurrentVersion` that `bayesian-statistics-v2` is current; and
- assert through `getVersion` that `bayesian-statistics-v1` remains retrievable.

The test must use independently written expected content and must not inspect private Governance maps, derive expected content through an implementation helper, read repository files as a side channel, or call a private dependency function. An injected `applyVersion` observer may verify the public storage mutation boundary.

Minimum path:

1. Complete this documentation review and obtain confirmation before the Red test.
2. Add the valid and invalid dependency behavior test and observe the first failure from the missing edited-dependent coverage or unsupported ordering/closure behavior.
3. Add only the smallest Governance changes required for the confirmed dependency-closed edited behavior.
4. Prove the valid path applies one original prerequisite and one edited dependent replacement, while the invalid path returns before mutation.
5. Run the focused S2 tests, `npm run check`, coverage, complexity, and public documentation checks.
6. Record Red/Green evidence and human acceptance before selecting out-of-order dependency handling, multi-level graphs, or durable edited provenance.

### Boundaries, alternatives, and deferrals

This cycle explicitly defers:

- topologically sorting or otherwise reordering Proposal changes when a dependency appears later;
- edited changes whose `before` text is produced only after a prerequisite is applied;
- more than one dependency level or multiple prerequisites;
- edited prerequisites combined with edited dependents in one graph;
- re-editing, withdrawing, or automatically reopening a recorded Judgment;
- persistent applied-record/schema changes for edited multi-change provenance;
- Proposal Review UI, Atlas/Studio routing, Agent Provider use, Git, remote synchronization, and network behavior.

The following alternatives are discarded or deferred for this cycle:

- **Silently topologically reorder Proposal changes:** deferred because ordering changes the authored application sequence and needs an explicit policy for conflicts, repeated exact text, and rollback.
- **Require and validate dependency order now:** deferred beyond the fixture boundary because rejecting or normalizing existing out-of-order Proposals would add a separate Proposal validation outcome not needed to prove this slice.
- **Match the edited dependent against post-prerequisite content automatically:** deferred because it would change the meaning of the reviewer-supplied exact replacement and requires a distinct composed-change model.
- **Treat the dependency as documentation only:** discarded because the accepted subset must be dependency-closed before mutation, and the missing-prerequisite case must remain caller-visible.
- **Expand file-backed audit records now:** deferred because durable provenance must preserve the original and edited exact changes plus dependency context for recovery and rollback.

### Acceptance evidence and required confirmation

The user confirmed these implementation decisions on August 28, 2026:

- reuse of `editedChanges` for a dependent Proposal change;
- effective accepted-subset closure including edited IDs;
- authored Proposal order as the boundary for this fixture, without silent topological reordering;
- the valid and invalid literal outcomes above; and
- the explicit deferrals and discarded alternatives.

Completion requires focused Red/Green evidence, full automated gates, proof that the valid path mutates storage once and the invalid path does not mutate storage, and human confirmation that the edited dependent content is current while the original version remains retrievable. Acceptance will not approve generic dependency ordering, post-prerequisite exact matching, multi-level graphs, or persistent edited-decision provenance.

### Sixth-cycle implementation evidence

- **Confirmation:** The user confirmed reuse of `editedChanges`, effective dependency closure including edited IDs, authored Proposal order, the literal valid and invalid outcomes, and the explicit deferrals before implementation on August 28, 2026.
- **Red evidence:** The focused test first failed because the existing classification validator required a non-empty `acceptedChangeIds` array even when an edited change was the only effective accepted change.
- **Green evidence:** `npm run check` passed formatting, linting, strict type checking, and 71 Vitest tests. `npm run test:coverage` passed both configured coverage runs with 81.27% statements, 73.28% branches, and 97.40% functions. `npm run lint:complexity` passed. `python scripts/test_public_docs.py` passed under the documented Python 3.11 environment.
- **Behavior evidence:** `apply-edited-dependent-change-decision.test.ts` proves the accepted prerequisite and reviewer-edited dependent are applied in Proposal order, the original dependent Proposal replacement is absent, storage mutation occurs once, and the prior version remains retrievable. It also proves a rejected prerequisite produces `invalid-dependency-subset` before mutation.
- **Compatibility evidence:** Existing single-change, stale-Judgment, invalid-dependency-subset, independent-decision, deferred-decision, edited-change, and file-backed contract tests pass. Generic dependency reordering and persistent edited multi-change provenance remain deferred as specified.
- **Acceptance:** Accepted by the user on August 28, 2026. The user confirmed that the edited dependent applies only with its accepted prerequisite, the missing-prerequisite path returns `invalid-dependency-subset` before mutation, and the prior version remains retrievable.
- **Status:** This implementation cycle is complete and accepted. Generic dependency reordering, post-prerequisite exact matching, multi-level graphs, and persistent edited-decision provenance remain deferred.

## Required seventh cycle: persist edited multi-change provenance

This is the next TB9 implementation cycle identified in the [delivery plan](delivery-plan.md#9-reject-stale-and-incoherent-applications). Its documentation prerequisite must be completed against the accepted Product Decisions, Architecture, Test Strategy S2/S5 guidance, ADRs 0002, 0005, 0006, and 0009, the accepted TB8 Repository Format and persistence representation, and the completed first six TB9 cycles. The backward-compatible persisted representation and caller-visible reopen behavior below are proposed for confirmation before implementation.

### Scope

The seventh TB9 cycle closes the durable-provenance gap for the accepted in-memory decision vocabulary. A file-backed application of a multi-change Proposal persists the complete original Proposal change list and the complete Judgment classification, including the exact reviewer-supplied replacement for an edited change. Reopening the repository retains the resulting current version and prior version, and the immutable applied record remains sufficient to explain what was proposed, accepted, rejected, deferred, or edited.

This cycle keeps the existing S2 Governance Interface, S5 file-backed Adapter, one-target version lineage, targeted rollback bytes, and transaction directory. It does not revise the Repository Format version, migrate existing scalar TB8 records in place, add general schema negotiation, support multiple applied records or branching history, or introduce UI behavior.

### Documentation prerequisite for this cycle

Before writing the Red test or implementation code, explicitly complete these to-do items:

1. Recheck the accepted Product Decisions, Architecture, Repository Format, Test Strategy S2/S5 guidance, applicable ADRs, and the completed first six TB9 cycles.
2. Confirm that the persisted multi-change record is an audit/history representation rather than a second current-content authority, and that rollback remains the exact prior target bytes.
3. Confirm the backward-compatibility boundary: legacy scalar `proposal.exact_change` records remain readable, are not silently rewritten, and new multi-change applications use plural change/classification fields.
4. Confirm the exact persisted field names, literal fixture, reopen/history behavior, and file-backed validation boundary below.
5. Record any changed public Interface, Repository Format authority, dependency ownership, or durable representation in this brief and the owning documentation before code changes.
6. Obtain explicit human confirmation of the persisted shape, compatibility behavior, exact audit values, and explicit deferrals.

Implementation must not begin until this seventh-cycle documentation review and confirmation task is complete. A Repository Format revision, migration policy, new Test Seam, or change to current-content authority requires stopping and revising this brief before proceeding.

### Proposed public behavior

Given the file-backed TB8 fixture repository and a Proposal containing an accepted prerequisite and an edited dependent change:

1. Governance records the same dependency-closed Judgment already accepted in the sixth cycle.
2. The file-backed Adapter applies the resulting content as one recoverable target transaction and writes one immutable applied record under `proposals/applied/<applied-record-id>.json`.
3. The record preserves the Proposal's ordered `changes` array, each change ID, each original exact replacement, and each `depends_on` list.
4. The record preserves the Judgment's exact accepted, rejected, and deferred ID arrays and the edited change's `change_id`, path, `before`, and reviewer-selected `after` text.
5. Reopening the repository through a new file-backed Governance instance returns `bayesian-statistics-v2` as current and `bayesian-statistics-v1` with its original bytes as retrievable history.
6. The rollback file remains the exact original target bytes, and the persisted record's fingerprints and rollback path remain internally consistent.
7. Existing legacy TB8 single-change records continue to reopen successfully without migration or shape rewriting.

The persisted record is provenance and recovery data. The ordinary target file remains the current-content authority; the applied record and rollback bytes do not become alternate current versions.

### Proposed persisted representation

Keep `format: galaxy-brain` and `format_version: 1`. Do not add an in-record schema version in this slice. The Adapter accepts both the existing legacy shape and the new multi-change shape:

Legacy records remain readable with:

```json
{
  "proposal": {
    "exact_change": {
      "path": "knowledge/bayesian-statistics.md",
      "before": "...",
      "after": "..."
    }
  },
  "judgment": {
    "decision": "accepted"
  }
}
```

New multi-change records use:

```json
{
  "proposal": {
    "id": "proposal-tb9-persisted-edited-provenance-bayesian-statistics",
    "fingerprint": "proposal-fingerprint-tb9-persisted-edited-provenance-bayesian-statistics",
    "target": {
      "id": "bayesian-statistics",
      "title": "Bayesian statistics",
      "path": "knowledge/bayesian-statistics.md"
    },
    "base_version_id": "bayesian-statistics-v1",
    "working_material_id": "working-material-tb9-persisted-edited-provenance-bayesian-statistics",
    "changes": [
      {
        "id": "change-tb9-persisted-edited-source-evidence",
        "exact_change": {
          "path": "knowledge/bayesian-statistics.md",
          "before": "source_record: sources/papers/bayesian-statistics.md",
          "after": "source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence"
        },
        "depends_on": []
      },
      {
        "id": "change-tb9-persisted-edited-claim-update",
        "exact_change": {
          "path": "knowledge/bayesian-statistics.md",
          "before": "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
          "after": "Bayesian statistics uses evidence to update prior belief."
        },
        "depends_on": ["change-tb9-persisted-edited-source-evidence"]
      }
    ]
  },
  "judgment": {
    "id": "judgment-tb9-persisted-edited-provenance-bayesian-statistics",
    "proposal_id": "proposal-tb9-persisted-edited-provenance-bayesian-statistics",
    "proposal_fingerprint": "proposal-fingerprint-tb9-persisted-edited-provenance-bayesian-statistics",
    "base_version_id": "bayesian-statistics-v1",
    "decision": "accepted",
    "accepted_change_ids": ["change-tb9-persisted-edited-source-evidence"],
    "rejected_change_ids": [],
    "deferred_change_ids": [],
    "edited_changes": [
      {
        "change_id": "change-tb9-persisted-edited-claim-update",
        "exact_change": {
          "path": "knowledge/bayesian-statistics.md",
          "before": "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
          "after": "Bayesian statistics updates prior belief from evidence."
        }
      }
    ]
  }
}
```

The outer applied-record fields remain the accepted TB8 fields: `id`, `target`, `previous_version`, `new_version`, and `rollback_path`. The new multi-change record keeps Proposal order and stores original Proposal exact changes separately from the Judgment's edited exact change; it never overwrites the original `after` text.

### Literal fixture and expected values

Use the existing TB8 file-backed fixture repository and target:

- Target ID: `bayesian-statistics`.
- Target title: `Bayesian statistics`.
- Target path: `knowledge/bayesian-statistics.md`.
- Proposal ID: `proposal-tb9-persisted-edited-provenance-bayesian-statistics`.
- Proposal fingerprint: `proposal-fingerprint-tb9-persisted-edited-provenance-bayesian-statistics`.
- Working Material ID: `working-material-tb9-persisted-edited-provenance-bayesian-statistics`.
- Judgment ID: `judgment-tb9-persisted-edited-provenance-bayesian-statistics`.
- Applied record ID: `applied-proposal-tb9-persisted-edited-provenance-bayesian-statistics`.
- Base version: `bayesian-statistics-v1`.
- New version: `bayesian-statistics-v2`.

The Proposal has these two changes in order:

1. `change-tb9-persisted-edited-source-evidence`, accepted unchanged, with the source-record replacement and `depends_on: []` shown above.
2. `change-tb9-persisted-edited-claim-update`, dependent on the source change, with the original Proposal replacement shown above.

The Judgment accepts the source change and edits the claim change to `Bayesian statistics updates prior belief from evidence.`. The expected current file contains `reviewed_claim: fixture-evidence` and that edited sentence, but not the original Proposal sentence `Bayesian statistics uses evidence to update prior belief.`. The expected rollback file contains the complete original `bayesian-statistics-v1` bytes.

### Test Seam and minimum vertical path

Use the existing S5 file-backed Governance contract at `app/tests/contracts/governance-version-store.test.ts`, exercised through the public Governance Interface. Add a behavior-named test or cohesive contract case for the persisted multi-change record; do not inspect Adapter-private state.

The test must:

- create the file-backed fixture repository and record the literal two-change Proposal and Judgment;
- apply through Governance and assert the exact `applied` outcome and resulting content;
- assert the exact plural applied-record JSON, including original Proposal changes, dependency IDs, Judgment classifications, and edited exact change;
- assert the exact rollback bytes;
- reopen with a new file-backed Governance instance and assert current `bayesian-statistics-v2` plus retrievable `bayesian-statistics-v1`;
- retain the existing legacy single-change contract proving the scalar TB8 record remains readable; and
- assert that unrelated repository content remains unchanged.

The test must use independently written expected JSON/content and must not call `persistedProposal`, `persistedJudgment`, `onlyProposalChange`, or another implementation helper to derive expectations. Existing filesystem injection may be used only for the established transaction/recovery contract; no new seam is needed for this slice.

Minimum path:

1. Complete this documentation review and obtain confirmation before the Red test.
2. Add the file-backed multi-change contract and observe the expected failure because the Adapter currently rejects multi-change persistence through `onlyProposalChange` and omits Judgment classifications.
3. Add the smallest backward-compatible persisted unions, validators, writers, and multi-change content-integrity check required for the literal case.
4. Prove new multi-change records reopen correctly while legacy scalar records remain readable and no migration occurs.
5. Run the focused contract test, `npm run check`, coverage, complexity, and public documentation checks.
6. Record Red/Green evidence and human acceptance before selecting schema migration, multiple applied records, or broader history.

### Boundaries, alternatives, and deferrals

This cycle explicitly defers:

- Repository Format version 2 or an in-record schema-version field;
- migration or rewriting of existing scalar TB8 applied records;
- multiple applied records, branching lineage, or general version allocation;
- audit records for rejected or deferred applications that never mutate a target;
- new transaction-failure permutations specific to the plural record shape;
- Judgment revision, proposal history, UI rendering, Agent Provider use, Git, remote synchronization, and network behavior.

The following alternatives are discarded or deferred for this cycle:

- **Rewrite all legacy scalar records into the plural shape:** discarded because opening a repository must not perform incidental mutation and existing accepted audit artifacts must remain byte-stable.
- **Bump `format_version` to 2:** deferred because this slice adds a backward-compatible applied-record representation without changing the repository-wide interoperability contract; a future schema revision needs migration and negotiation policy.
- **Store only the effective edited changes:** discarded because durable provenance must show what the Proposal originally requested and what the Judgment changed.
- **Store only the Judgment and derive Proposal changes from current content:** discarded because current content is mutable and cannot reconstruct reviewed identity, dependency context, or original exact replacements.
- **Move provenance into a sidecar database or application cache:** discarded because the Repository Format is portable, application-independent, and file-backed; audit history must travel with the repository.
- **Persist every accepted/rejected/deferred Judgment before application:** deferred because this slice persists the successful applied record only; non-applied review history needs a separate retention and identity policy.

### Acceptance evidence and required confirmation

This seventh cycle is not implementation-ready until the user confirms:

- the legacy scalar-read/new plural-write compatibility boundary;
- the exact `changes`, `depends_on`, classification-array, and `edited_changes` fields;
- preservation of original Proposal exact changes alongside reviewer-edited replacements;
- reopen/current-history and rollback expectations; and
- the explicit deferrals and discarded alternatives.

After confirmation, completion requires focused Red/Green evidence, full automated gates, exact persisted JSON and rollback evidence, legacy-record compatibility evidence, and human confirmation that reopening preserves the edited application and prior version. Acceptance will not approve format migration, multi-record history, branching lineage, or UI behavior.
