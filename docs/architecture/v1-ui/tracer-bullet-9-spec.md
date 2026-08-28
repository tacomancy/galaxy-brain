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
  acceptedChangeIds: ["change-tb9-claim-update"]
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
