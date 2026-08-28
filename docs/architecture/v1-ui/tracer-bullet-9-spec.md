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

- **Reuse `not-eligible` without a distinct stale outcome:** proposed as insufficient for this slice because a caller must distinguish a recoverable stale review from other eligibility failures and guide the person toward creating a new Proposal/Judgment. If the user prefers one generic outcome, update this brief before the Red test.
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

The focused Red run returned the prior generic `not-eligible` outcome as expected. The focused Green run now returns the exact `stale-judgment` result, preserves the current and prior versions, and does not call the storage Adapter's mutation operation. Confirmation is scoped to this first slice; it does not approve dependency subsets, multi-change decisions, or the TB10 review UI.
