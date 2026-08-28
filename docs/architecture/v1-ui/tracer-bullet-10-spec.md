# Tracer Bullet 10: Review and apply one Proposal through the desktop

This brief coordinates the first TB10 implementation slice in the [delivery plan](delivery-plan.md#10-review-through-the-desktop-interface). It is an implementation entry point, not a second authority for product behavior, architecture, Repository Format, testing, or accepted ADR decisions.

## Scope

The first TB10 slice proves the minimum desktop Proposal Review path: Atlas exposes one pending fixture Proposal, the dedicated review route presents the exact change and its fixture evidence, an explicit human action records an accepted Judgment, and the real Governance Module applies the Proposal through the file-backed version-storage Adapter. The route then presents the new governed version and the preserved prior version.

The pending Proposal is supplied by a bounded fixture source at the main-process composition boundary for the packaged S1 workflow. It is not created merely by opening a repository, written into a user's repository before review, or persisted as a new pending-Proposal format in this slice. The application must render an empty or unavailable review queue when no Proposal source supplies an item. This keeps the first UI slice focused while preserving the Repository Format and the authority boundary for later pending-Proposal persistence.

This slice adds one accepted, one-change Proposal only. It does not implement selective accept/edit/defer/reject controls, pending-Proposal discovery, Proposal authoring, durable pending Judgment, stale-review recovery controls, or a fourth primary workspace.

## Documentation prerequisite

Before writing behavior tests or implementation code, explicitly complete these to-do items:

1. Review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), [Test Strategy](test-strategy.md), applicable ADRs, the completed TB1–TB9 delivery records, and the accepted [TB9 implementation brief](tracer-bullet-9-spec.md).
2. Create or update this guidance-compliant `tracer-bullet-10-spec.md` with the Public Behavior, confirmed Test Seam, literal expected values, fixture and External System Seams, minimum vertical path, boundaries, discarded alternatives, deferrals, acceptance evidence, and required confirmation recorded below.
3. Check that Proposal Review remains a UI Adapter over the Workbench Session and Governance Module, that the real Governance Interface—not renderer state—owns Judgment and application, and that the fixture source cannot mutate a repository before explicit acceptance.
4. Check that the file-backed Governance Adapter is used for the S1 application's actual write, while the fixture source is the only test-only substitution and is isolated from user repository discovery.
5. Obtain explicit human confirmation of the bounded fixture source, the exact review presentation, the explicit accept-and-apply action, and the visible post-application result before writing the Red workflow or implementation code.

Implementation must not begin until this documentation review and confirmation task is complete. If the first Red test reveals a new pending-Proposal representation, Governance operation, or state-ownership choice, stop and update this brief before proceeding.

## Governing authorities

- [Product Decisions](product-decisions.md#proposal-review) owns the dedicated-route boundary, the evidence and exact-diff review surface, independent change decisions, and the rule that Proposal application is explicit and reversible.
- [Architecture](architecture.md#governance-module) owns the Governance Module, exact-version Judgment, application eligibility, immutable applied records, and the inward dependency direction.
- [Test Strategy](test-strategy.md#s1--desktop-workflow-seam) owns the packaged desktop S1 seam, visible outcomes, accessibility expectations, and use of real application Modules with locally substitutable Adapters.
- [Repository Format](repository-format.md#applied-proposal-persistence) owns the file-backed applied record, rollback bytes, and recoverable transaction behavior. This slice does not add a pending-Proposal format.
- [ADR 0002](../../adr/0002-govern-changes-through-proposals.md) requires every Governed Knowledge change to pass through a Proposal and exact review.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md) keeps application local-first and VCS-neutral; Git status does not determine eligibility.
- [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md) keeps repository state independent of Workbench installation and session state.
- [ADR 0009](../../adr/0009-keep-governed-knowledge-editable-through-evolution.md) requires a new reviewed version while retaining the prior version.

## Public Behavior

Given an isolated copy of the checked-in synthetic Knowledge Repository:

1. Open the repository through the existing Atlas flow.
2. Atlas presents a distinct **Needs your judgment** card for the supplied fixture Proposal.
3. Selecting **Review Proposal** opens the dedicated Proposal Review route without changing the active primary workspace selection.
4. The route presents the Proposal identity, target, base version, exact `before` and `after` text, and the fixture evidence source. The exact change is inspectable as text; the UI does not reconstruct expected text from its own renderer or differ.
5. Selecting **Accept and apply** is the explicit confirmation boundary. The main process records an accepted Judgment through the real Governance Interface and immediately requests application through that same Interface. No application occurs before this action.
6. On success, the route presents the applied outcome, new version `bayesian-statistics-v2`, prior version `bayesian-statistics-v1`, and the local-save status. The current governed file and immutable applied record are written by the file-backed Governance Adapter; the previous version remains retrievable through Governance.
7. Canceling or navigating back before acceptance leaves the target, pending fixture item, and repository artifacts unchanged.

The route is not a fourth primary workspace. Atlas, Studio, and Paper Desk remain the global workspaces; Proposal Review is a contextual route entered from Atlas and later reachable from Studio.

## Literal expected values

The independently known fixture uses the current checked-in target:

- Target ID: `bayesian-statistics`.
- Target title: `Bayesian statistics`.
- Target path: `knowledge/bayesian-statistics.md`.
- Base version ID: `bayesian-statistics-v1`.
- Proposal ID: `proposal-tb10-bayesian-statistics-evidence`.
- Proposal fingerprint: `proposal-fingerprint-tb10-bayesian-statistics-evidence`.
- Working Material ID: `working-material-tb10-bayesian-statistics-evidence`.
- Judgment ID: `judgment-tb10-bayesian-statistics-evidence`.
- Applied record ID: `applied-proposal-tb10-bayesian-statistics-evidence`.
- New version ID: `bayesian-statistics-v2`.
- Evidence source: `sources/papers/bayesian-statistics.md`.
- Evidence text: `This fixture Source Record is associated with the Bayesian statistics topic.`.

The exact replacement is:

```text
before: This fixture topic gives the S1 workflow a stable item to carry between
        workspaces.
after:  Bayesian statistics uses evidence to update prior belief.
```

The expected accepted Judgment has `acceptedChangeIds: ["change-tb10-bayesian-statistics-evidence"]`, with empty rejected, deferred, and edited classifications. Its `proposalId`, `proposalFingerprint`, and `baseVersionId` match the displayed Proposal and `bayesian-statistics-v1`.

The successful application must expose the caller-visible `applied` outcome and preserve the prior version. The exact detail text of infrastructure failures is not a UI contract; the route must show an explicit failure state and must not claim application when Governance returns any non-`applied` outcome.

## Confirmed Test Seam

Use the existing S1 packaged Electron/WebdriverIO workflow seam. The workflow opens an isolated temporary copy of the synthetic repository and interacts only with accessible desktop controls and visible content. The harness continues to pass `--galaxy-brain-test-mode=silent`; the native window remains hidden while the real packaged renderer and main process execute.

The main-process composition root supplies a deterministic fixture Proposal source only for this test path. That source creates the Proposal through the real Governance Interface from the literal current target and Working Material values. The application then composes `createGovernance` with `createFileBackedGovernanceStore` for the isolated repository. The renderer receives operation-specific serializable review data through preload; it never receives filesystem access, the Governance implementation, or an arbitrary IPC channel.

The workflow must assert the visible review route, exact target/change/evidence values, explicit pre-acceptance non-mutation, accepted Judgment/application outcome, new version, prior version, and local-save wording. It must not inspect React state, private Governance maps, or repository files as a substitute for the UI outcome. A focused S2 Governance test may reuse the same fixture constants only to protect the existing policy separately; it is not a replacement for the S1 workflow.

## Proposed application seam

Add the smallest operation-specific review capability needed by the route:

- a framework-independent review-session contract that returns the current pending fixture item, records the accepted Judgment, and applies it through the injected Governance Interface;
- a test-only fixture Proposal source at the composition boundary; and
- typed preload operations for reading the review item, entering the route, and accepting/applying it.

The review-session contract may keep the pending item transient for this slice. It must not expose `GovernanceVersionStore`, filesystem paths beyond display-safe repository-relative values, or a renderer-controlled `ApplyVersionInput`. The session owns orchestration and translates Governance outcomes into caller-visible review outcomes; Governance remains the owner of eligibility, exact-version binding, dependency closure, and application policy.

The review route should use a dedicated renderer component under `app/src/renderer/proposal-review/`. It may reuse the existing card, diff, button, status, focus, and reduced-motion styles. It must not add a new global workspace name or duplicate Governance rules in React.

## Minimum vertical path

1. Complete the documentation prerequisite and obtain confirmation of this exact fixture and seam.
2. Add `app/tests/workflows/review-proposal.e2e.ts` with an isolated repository copy and observe the expected Red failure because Atlas has no review route or operation.
3. Add the narrow review-session types and fixture composition source, then expose typed main/preload operations with sender validation.
4. Add the Atlas pending-Judgment card and contextual Proposal Review route with keyboard-reachable controls and exact visible values.
5. Record the accepted Judgment and apply it through the real Governance Module and file-backed Adapter only after the explicit action.
6. Assert the applied version, prior-version presentation, local-save wording, and cancellation/non-mutation path through the packaged workflow.
7. Run the focused workflow, `npm run check`, `npm run test:coverage`, `npm run lint:complexity`, and public documentation validation. Record Red/Green evidence and manual acceptance before selecting the next TB10 slice.

## External System Seams

- **Governance Module:** production policy owner, called through its public Interface; it is not mocked in the S1 workflow.
- **File-backed Governance version store:** production Adapter against an isolated temporary repository; it performs the actual target replacement, applied audit persistence, rollback capture, and transaction recovery already established by TB8/TB9.
- **Fixture Proposal source:** test-only composition Adapter that supplies one deterministic pending item without writing to the repository or discovering proposals from user content.
- **Knowledge Repository Adapter:** existing production Adapter opens the isolated repository; no repository creation or pending-Proposal persistence is added here.
- **Agent Provider:** not configured or called. The fixture is provider-free.
- **Git, remotes, credentials, and network:** outside the product boundary and must not affect review or application.

## Boundaries and explicit deferrals

This first TB10 slice does not implement:

- persisted pending Proposals or a new Repository Format schema for them;
- Proposal authoring from Studio or Working Material;
- automatic Proposal discovery, indexing, queue ordering, or multiple pending items;
- independent accept/edit/defer/reject controls beyond the single accepted fixture change;
- Judgment revision, stale-review recovery, automatic rebasing, or concurrent review handling;
- UI rollback, applied-history browsing, or transaction-recovery controls;
- evidence/epistemic/uncertainty/dependency editing or rich Proposal metadata beyond the fixture projection;
- Studio entry, Atlas metrics, Learning Routes, Generated Relationships, Agent Provider use, Git, or network behavior.

Deferred pending-Proposal persistence is intentional. The next slice must first repeat the documentation prerequisite and define whether a portable pending artifact or another repository-independent queue is warranted. It must not infer a format from this test fixture.

## Alternatives considered and discarded

- **Seed the fixture Proposal whenever any repository opens:** discarded because opening is read/selection behavior and must not create Working Material, Judgment, or hidden review state in a user repository.
- **Hard-code the Proposal and application result in React:** discarded because it would bypass the Governance Module, hide the real application boundary, and make the UI appear successful without durable governed state.
- **Mock Governance in the packaged workflow:** discarded because S1 must prove the desktop composition reaches the real exact-version Judgment and file-backed application path.
- **Add pending-Proposal persistence before the first review route:** deferred because no pending representation is currently governed by Repository Format v1, and doing so would combine a format decision with the first UI vertical path.
- **Make Proposal Review a fourth primary workspace:** discarded because Product Decisions define it as a contextual route reachable from Atlas and Studio; a fourth global workspace would blur navigation and ownership.

## Acceptance evidence

Automated acceptance requires the focused packaged workflow and all repository gates to pass. Human acceptance must observe:

1. Atlas distinguishes **Needs your judgment** from ordinary continuation.
2. The review route exposes the exact target, version, replacement, and evidence before any mutation.
3. Cancel/back leaves the target and review state unchanged.
4. **Accept and apply** is the only action that records Judgment and changes Governed Knowledge.
5. The route shows `bayesian-statistics-v2`, retains `bayesian-statistics-v1`, and communicates local-save status without claiming Git commit, synchronization, or backup.

Record the human confirmation, Red/Green evidence, changed files, and any newly discovered deferral in the TB10 section of the delivery plan before starting another slice.

## Required confirmation

Implementation is blocked until the user confirms all of the following proposed decisions:

- the first slice uses one test-supplied transient Proposal rather than inventing pending-Proposal persistence;
- the fixture values and exact replacement above are the review content;
- the explicit action is **Accept and apply**, with cancel/back preserving state;
- the S1 workflow uses real Governance plus the file-backed version store against an isolated repository; and
- selective decisions, pending persistence, and richer metadata remain deferred to later slices.
