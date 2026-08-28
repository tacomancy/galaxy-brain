# Tracer Bullet 8: Apply one governed change

Status: first S2 implementation cycle complete on August 28, 2026; human acceptance pending.

This brief coordinates the first Governance implementation slice in the [delivery plan](delivery-plan.md#8-apply-one-governed-change). It is an implementation entry point, not a second authority for product behavior, architecture, repository format, testing, or accepted ADR decisions.

## Scope

Using the checked-in Bayesian statistics Knowledge Repository fixture, a person can edit a Governed Knowledge item as Working Material, manually author an exact Proposal from that draft, record an explicit Judgment against the exact reviewed version, and apply the eligible change. Application creates a new governed version, preserves the previous version for retrieval, and records the applied decision without requiring an Agent Provider, Git, a remote, or network access.

The first TB8 cycle proves one literal, single-target change through the S2 Governance seam. It does not yet implement stale or incoherent application rejection, selective decisions across multiple changes, the S1 Proposal Review route, agent-assisted Proposal drafting, or the later TB9/TB10 behavior.

## Documentation prerequisite

Before writing behavior tests or implementation code, and again before each later TB8 cycle, explicitly complete these to-do items:

1. Review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), [Test Strategy](test-strategy.md), applicable ADRs, the completed TB1–TB7 delivery records, and the preceding implementation records.
2. Create or update this guidance-compliant `tracer-bullet-8-spec.md` with the Public Behavior, confirmed Test Seam, literal expected values, fixtures and External System Seams, minimum vertical path, boundaries, deferrals, acceptance evidence, and required confirmation recorded below.
3. Check the proposed behavior against those authorities before the Red test run. If implementation reveals a conflict or an unconfirmed seam, stop, update the owning document and this brief, and obtain the required human confirmation before continuing.

This prerequisite was completed for the first cycle on August 28, 2026. The reviewed authorities are listed below so a future cycle can repeat the check rather than relying on memory. The first S2 Red-to-Green cycle is complete; the user-facing behavior remains pending explicit human acceptance.

## Authoritative decisions

The following documents own the decisions this slice must preserve:

- [Product Decisions](product-decisions.md) owns the distinction between Working Material and Governed Knowledge, exact Proposal/Judgment review, immutable applied records, preserved prior versions, and recoverable application.
- [Architecture](architecture.md#governance-module) owns the Governance Module boundary, including Proposal drafting, exact-version binding, eligibility, application, audit, rollback, and filesystem transaction recovery. Governance never delegates authority to an Agent Provider or Git.
- [Repository Format](repository-format.md) owns the portable file boundary, canonical roots, preservation of unknown content, applied audit records under `proposals/applied/`, targeted rollback data, fingerprint rechecks, and local-save semantics.
- [Test Strategy](test-strategy.md#s2--governance-seam) owns the S2 public Governance Interface, caller-visible domain outcomes, literal expected patches and version identifiers, and the prohibition on deriving expected values with implementation helpers or storage side channels.
- [ADR 0002](../../adr/0002-govern-changes-through-proposals.md) owns the Proposal trust boundary for both manual and agent-assisted changes.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md) owns portable files, optional external version control, and the file-backed Adapter's version, audit, rollback, and external-edit responsibilities.
- [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md) owns the separation between the application and portable repository content.
- [ADR 0009](../../adr/0009-keep-governed-knowledge-editable-through-evolution.md) owns editable Working Material drafts, reviewed replacement versions, preserved history, and explicit application.
- The existing [code map](code-map.md) names the planned Governance Module at `app/src/modules/governance/index.ts` and the S2 seam; it must be updated in the same change that creates or moves production Modules or Adapters.

## First Public Behavior

Through the public S2 Governance Interface:

1. Load the literal current version of the fixture topic `bayesian-statistics`.
2. Represent an edit as Working Material without changing the current governed version.
3. Manually create Proposal `proposal-tb8-bayesian-statistics-evidence` containing one exact replacement in `knowledge/bayesian-statistics.md`.
4. Record Judgment `judgment-tb8-bayesian-statistics-evidence` with the explicit decision `accepted`, bound to that exact Proposal and current version.
5. Apply the eligible Proposal.
6. Return the new current version and make the previous version retrievable through the same public Interface.

The independently known literal fixture values are:

- Target identity: `bayesian-statistics` / `Bayesian statistics`.
- Target path: `knowledge/bayesian-statistics.md`.
- Current version identifier before application: `bayesian-statistics-v1`.
- Previous governed paragraph:
  `This fixture topic gives the S1 workflow a stable item to carry between` followed by `workspaces.` on the next line.
- Proposed governed paragraph:
  `Bayesian statistics uses evidence to update prior belief.`
- Exact first-cycle patch:
  ```diff
  -This fixture topic gives the S1 workflow a stable item to carry between
  -workspaces.
  +Bayesian statistics uses evidence to update prior belief.
  ```
- Proposal identity: `proposal-tb8-bayesian-statistics-evidence`.
- Proposal fingerprint: `proposal-fingerprint-tb8-bayesian-statistics-evidence`.
- Judgment identity: `judgment-tb8-bayesian-statistics-evidence`.
- Judgment decision: `accepted`.
- New current version identifier after application: `bayesian-statistics-v2`.
- Preserved prior version identifier after application: `bayesian-statistics-v1`.
- Applied audit identity: `applied-proposal-tb8-bayesian-statistics-evidence`.
- Working Material draft identity: `working-material-tb8-bayesian-statistics-evidence`.
- Working Material draft base version: `bayesian-statistics-v1`.
- Working Material draft content: the complete fixture file, with only the two-line paragraph in the exact patch above replaced by the single proposed line; its frontmatter remains `id: bayesian-statistics`, `title: Bayesian statistics`, `type: topic`, `status: current`, and `source_record: sources/papers/bayesian-statistics.md`.
- Material state before and after the Proposal workflow: the draft is `working-material`; only explicit application changes the target's governed current version.

The `v1` and `v2` identifiers above are opaque Governance domain version identifiers seeded by the deterministic S2 test store, not Repository Format versions and not file-derived hashes. The first cycle deliberately does not freeze a persisted version schema. The Repository Format remains `format: galaxy-brain` and `format_version: 1`.

Decision 1's explicitly deferred work is part of the required later TB8 S5 persistence cycle. That cycle must define and document the persisted version record, the mapping between persisted records and Governance-domain IDs, how the current version is selected, how new IDs and parent lineage are allocated, whether IDs remain stable across reopen, how retained versions are retrieved, and how the representation remains compatible with unknown repository content. It must then add S5 coverage for round-trip history and the version/audit/rollback relationships. Until that cycle is complete, the S2 IDs are test-store fixtures only and must not be presented as durable Repository Format behavior.

The expected result is that the current version remains `bayesian-statistics-v1` while the Proposal is merely drafted or the Judgment is pending; after successful application the current version is exactly `bayesian-statistics-v2`, the new paragraph is present, the prior `bayesian-statistics-v1` remains retrievable, and the applied record binds the exact Proposal, Judgment, target, and resulting version. No Agent Provider request occurs.

## First-cycle Interface contract

The first S2 cycle exposes the following minimal public lifecycle. The eventual concrete TypeScript names may follow the repository's established naming conventions, but the operations and authority boundaries are fixed here:

- `loadCurrentVersion(targetId)` returns the current `GovernedVersion` or an explicit `not-found` outcome.
- `createProposal({ proposalId, proposalFingerprint, target, baseVersionId, workingMaterial, exactChange })` returns the manually authored `Proposal` or an explicit validation outcome. It does not change the current governed version.
- `recordJudgment({ judgmentId, proposalId, proposalFingerprint, decision })` returns the exact-version-bound `Judgment` or an explicit validation outcome. The first cycle accepts the literal decision `accepted`; other decision types remain later-cycle behavior.
- `applyProposal({ proposalId, judgmentId })` returns `applied` with the new current version, preserved prior version, and immutable applied-record identity, or an explicit ineligible/validation outcome. It cannot apply without the matching accepted Judgment.
- `getVersion(targetId, versionId)` returns the requested retained `GovernedVersion` or an explicit `not-found` outcome.

The first-cycle outcome vocabulary must distinguish at least `not-found`, `invalid-proposal`, `invalid-judgment`, `judgment-required`, `not-eligible`, and `applied`. Errors must remain caller-visible domain outcomes; they must not be inferred from thrown storage or provider errors.

For this first deterministic cycle, the caller supplies the literal Proposal identity `proposal-tb8-bayesian-statistics-evidence` and fingerprint `proposal-fingerprint-tb8-bayesian-statistics-evidence`, and the literal Judgment identity `judgment-tb8-bayesian-statistics-evidence`. Governance verifies the Proposal fingerprint and exact-version binding rather than deriving or trusting a replacement identity. The in-memory storage Adapter is seeded with the literal next version ID `bayesian-statistics-v2`; durable ID allocation remains part of the deferred S5 persistence design.

## Test Seam and fixtures

Use the confirmed S2 Governance seam: the public Governance Module Proposal, Judgment, application, and version-retrieval operations plus their caller-visible domain outcomes. Tests must not inspect private module state, renderer state, repository files as a side channel, or a private differ/patch builder.

The first cycle uses the checked-in `app/tests/fixtures/knowledge-repository/knowledge/bayesian-statistics.md` content as the independently known current version and the literal patch above as the expected change. The S2 caller supplies the complete `working-material-tb8-bayesian-statistics-evidence` draft directly to `createProposal`; this is the test seam's representation of a manually edited Working Material draft, not a new Knowledge Authoring implementation. This cycle is explicitly S2-only and uses a deterministic in-memory storage Adapter. It must not introduce or imply a persisted Repository Format schema. A later, required TB8 persistence cycle must add the file-backed Adapter and its S5 contract; the S2 behavior test must continue to observe results through the public Governance Interface rather than reading files directly.

The S2 test must prove all of the following in one narrow vertical behavior:

- Working Material and Proposal creation do not mutate the current governed version.
- The draft is bound to `bayesian-statistics-v1` and is not mistaken for Governed Knowledge.
- A Judgment is explicitly accepted and exact-version bound.
- An eligible application returns the expected new version.
- The prior version remains retrievable after application.
- The applied record preserves the exact Proposal and Judgment identities and decision.
- No Agent Provider or external network seam is invoked.

## Minimum vertical path

1. Complete the documentation prerequisite above and check this brief against the accepted authorities before the Red test run.
2. Define the smallest public Governance types and operations needed to represent the target, exact versions, Proposal, Judgment, application result, and retrievable history; keep provider SDK types and storage layout out of the Interface.
3. Add one S2 behavior test with the literal fixture values and observe the expected failure before implementation.
4. Implement the minimum in-process Governance behavior and deterministic storage seam needed to make that test pass, preserving the current version until explicit application.
5. Keep the first cycle in-memory and do not add file-backed persistence, durable Working Material storage, the Knowledge Authoring module, or a Repository Format schema.
6. Run the focused S2 test and the repository `check` gate. Record Red/Green evidence in the delivery plan before selecting the next TB8 behavior.
7. Complete the required follow-up persistence cycle: define the concrete version, applied-audit, and targeted-rollback representation; implement the file-backed Adapter's fingerprint checks and recoverable filesystem transaction; add S5 contract coverage for round-trip history, immutable audit, rollback, external edits, and interrupted writes; and update the Repository Format and code map at their owning boundaries.
8. Recheck this brief and the owning authorities before every subsequent TB8 cycle.

## External System Seams

- **Agent Provider:** not configured or called in this first cycle. Manual Proposal creation is a required provider-free path; any later agent assistance remains optional and cannot supply Governance authority.
- **Knowledge Repository Adapter:** owns portable persistence, exact target fingerprints, applied audit records, targeted rollback data, and recoverable filesystem transactions when the file-backed path is introduced. It does not decide eligibility or substitute for Judgment.
- **Git, remotes, and network:** outside the product boundary. Application success must not imply commit, push, synchronization, or backup.

## Boundaries and deferrals

This first S2 cycle does not add file-backed version history, persisted version-ID allocation or lineage, persisted applied audit records, persisted targeted rollback data, target fingerprint rechecks, interrupted-transaction recovery, or external-edit detection. Those are explicitly deferred to the required TB8 S5 persistence cycle and must be complete before the broader TB8 work is declared complete.

The first cycle also explicitly defers durable Working Material draft serialization, draft reopening/history, autosave, rich/source editing, and the Knowledge Authoring UI. The S2 literal draft is only a deterministic caller input used to prove the Governance trust boundary; the later authoring tracer bullet owns the user-facing edit path and its persistence.

This tracer bullet also does not add the S1 Proposal Review route, Proposal diff rendering, stale Judgment detection, changed-target rejection, invalid dependency-subset rejection, independent accept/edit/defer/reject decisions, partial-application rules, rollback UI, agent-assisted Proposal drafting, OpenAI requests, automatic Proposal creation, Git operations, remote synchronization, or repository-wide search/discovery.

It also does not silently mutate Governed Knowledge when a draft or Proposal changes, destroy the prior version, treat a saved Working Material artifact as accepted knowledge, infer approval from an agent result, or claim backup/remote durability. Those behaviors remain prohibited by the accepted authorities.

## Acceptance evidence

Implementation completion must record:

- the focused S2 Red run showing the missing governed-application behavior;
- the focused S2 Green run proving the literal Proposal, Judgment, version transition, prior-version retrieval, and immutable applied identity;
- `npm run check` and the relevant test suites passing;
- the code-map update for every new production Module or Adapter location; and
- the user-facing evidence that the current version stayed unchanged until explicit application and that the previous version remained retrievable afterward.

The first-cycle record must also state that persistence is deferred. The later persistence-cycle record must add the S5 Adapter, Repository Format, transaction, audit, rollback, external-edit, and interrupted-write evidence listed in the minimum vertical path before TB8 is complete.

The implementation is not TB8-accepted until the user reviews the resulting Governance behavior and explicitly confirms that the governed current version stayed unchanged until application and that the prior version remained retrievable afterward.

The first TB8 cycle is not accepted until the user reviews the resulting behavior and explicitly confirms it. Later TB8–TB10 cycles require their own documentation check, evidence, and human acceptance.

## Required confirmation

The S2 Governance seam is already confirmed by the accepted Test Strategy and the TB8–TB10 issue scope. If implementation requires a new seam, a different version authority, a Repository Format revision, or a new irreversible architectural decision, pause before writing that test or code, update the owning document and this brief, and obtain explicit human confirmation.
