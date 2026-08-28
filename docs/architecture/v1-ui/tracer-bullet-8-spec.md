# Tracer Bullet 8: Apply one governed change

Status: first S2 implementation cycle complete and merged on August 28, 2026; S5 implementation complete on August 28, 2026, with packaged-runtime verification and human acceptance pending.

This brief coordinates the first Governance implementation slice in the [delivery plan](delivery-plan.md#8-apply-one-governed-change). It is an implementation entry point, not a second authority for product behavior, architecture, repository format, testing, or accepted ADR decisions.

## Scope

Using the checked-in Bayesian statistics Knowledge Repository fixture, a person can edit a Governed Knowledge item as Working Material, manually author an exact Proposal from that draft, record an explicit Judgment against the exact reviewed version, and apply the eligible change. Application creates a new governed version, preserves the previous version for retrieval, and records the applied decision without requiring an Agent Provider, Git, a remote, or network access.

The first TB8 cycle proves one literal, single-target change through the S2 Governance seam. It does not yet implement stale or incoherent application rejection, selective decisions across multiple changes, the S1 Proposal Review route, agent-assisted Proposal drafting, or the later TB9/TB10 behavior.

## Documentation prerequisite

Before writing behavior tests or implementation code, and again before each later TB8 cycle, explicitly complete these to-do items:

1. Review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), [Test Strategy](test-strategy.md), applicable ADRs, the completed TB1–TB7 delivery records, and the preceding implementation records.
2. Create or update this guidance-compliant `tracer-bullet-8-spec.md` with the Public Behavior, confirmed Test Seam, literal expected values, fixtures and External System Seams, minimum vertical path, boundaries, deferrals, acceptance evidence, and required confirmation recorded below.
3. Check the proposed behavior against those authorities before the Red test run. If implementation reveals a conflict or an unconfirmed seam, stop, update the owning document and this brief, and obtain the required human confirmation before continuing.

This prerequisite was completed for the first cycle and repeated for the S5 persistence cycle on August 28, 2026. The reviewed authorities are listed below so a future cycle can repeat the check rather than relying on memory. The S2 and S5 Red-to-Green implementation cycles are complete; the resulting behavior remains pending explicit human acceptance and compatible-runtime packaged verification.

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

## Required second cycle: persist one governed change through S5

This is the next TB8 implementation cycle identified by the delivery plan. Its documentation prerequisite was reviewed against the accepted Product Decisions, Architecture, Repository Format, Test Strategy S2/S5 guidance, ADRs 0002, 0005, 0006, and 0009, the merged TB8 S2 implementation, and the existing atomic-write Adapter on August 28, 2026. The concrete Repository Format schema below was explicitly confirmed as an addition to V1 on August 28, 2026.

### Public Behavior

Using a copy of the checked-in fixture repository and the same literal Proposal/Judgment from the S2 cycle, the file-backed Governance storage Adapter must:

1. Load the initial `bayesian-statistics-v1` version from the existing `knowledge/bayesian-statistics.md` target without incidental mutation.
2. Apply the accepted Proposal through the public Governance Interface.
3. Write the approved `knowledge/bayesian-statistics.md` content, an immutable applied audit record, and targeted rollback data as one recoverable local transaction.
4. Reopen the same repository through a new Governance instance.
5. Return `bayesian-statistics-v2` as current and retrieve `bayesian-statistics-v1` with its original bytes through the same public Interface.

The independently known S5 values are:

- Target: `bayesian-statistics`, path `knowledge/bayesian-statistics.md`.
- Initial version: `bayesian-statistics-v1`.
- New version: `bayesian-statistics-v2`.
- Previous target SHA-256: `5fb3de504a1d39faaa32c199f9b8209dabb9abb4deb419633b2679de242c41df`.
- New target SHA-256: `e2f8bbc083c57de5e4c01ad7c92fc965cc54d05061b0b85b06fa8b8e3ec504d1`.
- Applied record path: `proposals/applied/applied-proposal-tb8-bayesian-statistics-evidence.json`.
- Rollback path: `proposals/applied/applied-proposal-tb8-bayesian-statistics-evidence/rollback/knowledge/bayesian-statistics.md`.
- Transaction staging path: `proposals/applied/.transactions/applied-proposal-tb8-bayesian-statistics-evidence/`.
- Applied record identity: `applied-proposal-tb8-bayesian-statistics-evidence`.
- The audit binds Proposal `proposal-tb8-bayesian-statistics-evidence`, fingerprint `proposal-fingerprint-tb8-bayesian-statistics-evidence`, Judgment `judgment-tb8-bayesian-statistics-evidence`, decision `accepted`, target path, previous/new version IDs, and previous/new fingerprints.

### Proposed persisted representation

The first file-backed Adapter stores one immutable JSON audit record at the applied record path above. It contains the applied identity, the exact Proposal metadata and patch, the exact Judgment metadata and decision, target identity/path, previous and new Governance-domain version IDs, and previous/new target fingerprints. Its rollback field points to the repository-relative rollback file containing the original UTF-8 target bytes. The current target remains at its ordinary `knowledge/` path; history is reconstructed from the applied record and rollback bytes, so no duplicate governed copy is introduced under a new top-level knowledge path.

#### Decision 1 — applied audit location and immutability: accepted

The user explicitly accepted this location and immutability rule on August 28, 2026. A successful application therefore creates exactly one immutable record at `proposals/applied/<applied-record-id>.json`. Existing records are never overwritten. Reusing an applied identity with different content is an explicit failure, not an implicit update or repair. The record is self-contained enough to explain what was approved and applied without consulting UI state, Git, or an external service.

The following alternatives were considered and discarded for this cycle:

- **Store the audit record beside the target under `knowledge/`:** discarded because it would mix governance history with the current knowledge namespace, make portable repository discovery less predictable, and conflict with the accepted Repository Format location for applied audit records.
- **Store only a Git commit, tag, or external database reference:** discarded because Git and external services are outside the product boundary, are optional under ADR 0005, and cannot provide the portable application-readable audit required by the Repository Format.
- **Use a mutable single `proposals/applied/latest.json` record:** discarded because overwriting would destroy provenance, make duplicate application identity ambiguous, and prevent reliable audit/recovery after a partial or repeated operation.
- **Store only a compact summary and recover Proposal/Judgment details elsewhere:** discarded because reopening must not depend on UI state or transient Working Material; the applied record must preserve the exact approved inputs and resulting fingerprints.
- **Write a second full current-version copy under a new top-level history directory:** discarded because the ordinary `knowledge/` target remains the source of current content, while the targeted rollback file is sufficient for this narrow retained-history path and avoids introducing duplicate authorities.

Deferred from this decision are broad audit indexing/search, schema migration from any pre-existing applied-record format, compaction or archival of immutable records, and multi-target audit bundles. Those behaviors require additional product and Repository Format decisions and are not needed to establish the first portable one-target application contract.

#### Decision 2 — targeted rollback representation: accepted

The user explicitly confirmed this rollback representation on August 28, 2026. The first file-backed Adapter preserves the exact original bytes of each targeted file at `proposals/applied/<applied-record-id>/rollback/<target-relative-path>`. The applied audit record points to that repository-relative path. The rollback artifact becomes immutable after successful application and serves retained history, interrupted-transaction recovery, and a future rollback operation; it is not a competing source of current content. This cycle preserves only files targeted by the Proposal.

The following alternatives were considered and discarded for this cycle:

- **Store a reverse patch instead of original bytes:** discarded because patch application can depend on surrounding content and newline interpretation, while exact original bytes make restoration and retained-version retrieval deterministic.
- **Delegate rollback to Git:** discarded because Git is optional and outside the product boundary; a portable repository must retain its own application-readable recovery data.
- **Snapshot the entire repository:** discarded because it has poor locality, increases transaction scope, and is unnecessary for the one-target Proposal that defines this cycle.
- **Write a second full versioned copy under `knowledge/`:** discarded because it would create competing content authorities; the current target remains authoritative and the targeted rollback artifact supplies the prior bytes.

Deferred from this decision are multi-file rollback bundles beyond the targeted files, repository-wide snapshots, user-facing rollback controls, and rollback retention/garbage-collection policy. These require separate scope and lifecycle decisions; they must not be inferred from this first targeted artifact.

#### Decision 3 — transaction staging and recovery: accepted

The user explicitly confirmed this staging, fingerprint, interruption-recovery, and cleanup rule on August 28, 2026. The first file-backed Adapter stages the journal, replacement target, targeted rollback bytes, and applied audit record under `proposals/applied/.transactions/<applied-record-id>/` before mutating the live target. It rechecks the live target fingerprint immediately before replacement. On the next open, an interrupted transaction is resolved deterministically from its journal and staged artifacts: the Adapter either completes a fully staged application or restores the prior target, returns an explicit recovery outcome (`completed`, `restored`, or `discarded`), and removes the transaction directory only after the repository is coherent. An external target edit is never silently overwritten; Governance returns the explicit `external-change` outcome.

The following alternatives were considered and discarded for this cycle:

- **Mutate the target first and write audit/rollback afterward:** discarded because a failure between those operations could destroy the prior bytes or leave an applied change without provenance.
- **Rely on filesystem rename alone:** discarded because rename can protect an individual file but does not define recovery across the target, rollback, audit, and journal artifacts as one operation.
- **Leave staging directories for manual cleanup:** discarded because an ambiguous transaction would make reopen behavior nondeterministic and could expose stale or misleading governance state.
- **Always choose finish or always choose restore after interruption:** discarded because the correct outcome depends on the journal and complete staged artifacts; an unconditional policy could either lose an approved application or overwrite evidence of an incomplete one.

Deferred from this decision are concurrent applications, cross-repository transactions, automatic cleanup of unknown or orphaned transaction directories, durability guarantees stronger than the local filesystem contract, and a user-facing recovery UI. These are separate concurrency, storage, or product decisions and are not implied by the first recoverable local transaction.

#### Decision 4 — persisted version mapping and reopen behavior: accepted

The user explicitly confirmed this version-mapping and reopen rule on August 28, 2026. For the literal fixture, an existing target with no applied record seeds `bayesian-statistics-v1`. A successful applied record establishes `bayesian-statistics-v2` and names `bayesian-statistics-v1` as its parent. Reopening derives the current version from the valid applied record and retrieves the prior version from its targeted rollback bytes. These stable Governance-domain IDs are persisted as explicit record fields; they are not Repository Format versions and are not derived from content, timestamps, or filesystem metadata. This first cycle supports only the literal one-target `v1` → `v2` lineage.

The following alternatives were considered and discarded for this cycle:

- **Derive version IDs from content hashes:** discarded because identity would become coupled to byte representation or normalization and would change when content representation changes.
- **Derive version IDs from timestamps or filesystem metadata:** discarded because those values are unstable, environment-dependent, and not portable repository lineage.
- **Use Git commits or tags as version IDs:** discarded because Git is optional and outside the product boundary; governance history must remain application-readable without Git.
- **Treat the latest file modification as the current version:** discarded because it loses explicit governance lineage and cannot prove which Proposal and Judgment produced the content.

Deferred from this decision are general version-ID allocation, multi-application lineage, branching histories, multi-target lineage, migration of repositories that already contain applied records, and broad history indexing. The first S5 contract intentionally establishes only a deterministic one-target reopen path; these later behaviors require their own schema and policy decisions.

#### Decision 5 — Repository Format boundary: accepted

The user explicitly confirmed this Repository Format boundary and documentation rule on August 28, 2026. The accepted S5 representation remains inside `format: galaxy-brain`, `format_version: 1`. The concrete applied-record JSON, relative rollback paths, transaction staging layout, fingerprint rules, preservation rules, and recovery outcomes are application-readable contract and must be documented in [Repository Format](repository-format.md) before the S5 Red test. The file-backed Adapter owns serialization, fingerprints, staging, and filesystem failure translation; the Governance Module owns Proposal/Judgment validation and eligibility. Unknown repository files, frontmatter, and Markdown extensions remain preserved unless the exact Proposal targets them.

The following alternatives were considered and discarded for this cycle:

- **Bump `format_version` for this additive schema:** discarded because the existing root structure remains valid and repositories without applied records remain readable without migration.
- **Leave the schema implicit in production code:** discarded because portable repository behavior must be inspectable and independently implementable by conforming tools.
- **Store governance metadata in an application-private database:** discarded because it would violate the application-independent repository boundary and make the repository incomplete when moved between Workbench installations.
- **Put approval and eligibility policy in the file format:** discarded because the format records approved facts; Governance remains responsible for deciding whether a Proposal/Judgment may be applied.

Deferred from this decision are formal schema migration/version negotiation, criteria for a future format-version bump, standalone validation tooling for later schemas, and cross-application compatibility testing. These require additional format evolution work and are not needed to establish the first V1 applied-record contract.

### S5 Test Seam and minimum vertical path

Use the confirmed S5 file-backed Governance storage Adapter contract plus the public S2 Governance Interface. The contract may inspect portable files to verify the Repository Format; the S2 behavior test must continue to observe current/history and applied outcomes through Governance rather than reading files as a side channel.

The first S5 behavior test copies `app/tests/fixtures/knowledge-repository/` into an isolated temporary repository, uses the literal S2 Proposal/Judgment, applies through Governance, creates a new Governance instance over the same root, and asserts the literal current/prior versions and applied identity. It must also assert that the original fixture's unrelated files remain present and that the applied audit and rollback paths contain the expected exact values.

The storage seam extends the existing Governance version-store contract with one application operation that receives the already-validated Proposal/Judgment, the Proposal's captured base content for the final external-edit check, and the approved application identity. It writes the target, rollback bytes, and audit record as one recoverable unit. Governance retains policy ownership; the Adapter owns serialization, fingerprints, staging, recovery, and filesystem failure translation. The in-memory Adapter remains deterministic and continues to satisfy the S2 behavior test.

Minimum path:

1. Obtain explicit confirmation for the proposed persisted representation and update the Repository Format at its owning boundary.
2. Add the S5 contract test and observe its expected failure before implementation.
3. Extend the public storage seam only as needed for the application bundle, retaining the existing S2 public Interface.
4. Implement successful file-backed round-trip history, immutable applied audit, targeted rollback, and reopen recovery for the literal fixture.
5. Add focused failure cycles for external target edits, interrupted target/audit writes, recovery cleanup, and rollback restoration; each must preserve or recover the prior governed version and return an explicit outcome.
6. Run the focused S2/S5 suites, `npm run check`, coverage, public documentation validation, and the packaged workflow suite. Record each Red/Green result before selecting the next behavior.

### Explicit deferrals

This second cycle does not add the S1 Proposal Review route, stale Judgment rejection, changed dependency subsets, selective decisions across multiple changes, agent-assisted Proposal drafting, Knowledge Authoring UI, or OpenAI requests. TB9 owns stale and incoherent application policy; TB10 owns desktop Proposal Review.

Within persistence, the first success path defers multi-target transactions, general version-ID allocation beyond the literal seeded `v1` → `v2` case, branching lineage, migration from pre-existing applied schemas, automatic cleanup of unknown staging directories, and broad repository history indexing. These are follow-up behaviors only after the literal round-trip contract is green.

The failure cycles for external edits, interrupted writes, recovery cleanup, and rollback restoration are required before broader TB8 completion but are separate Red-to-Green cycles; they must not be silently omitted because the initial success path passes.

### Acceptance evidence and confirmation

The S5 implementation now has literal round-trip evidence, applied-record and rollback contract evidence, preservation of unrelated repository content, focused and full automated gates, public documentation validation, packaged workflow evidence, and the required external-edit, interrupted-target, interrupted-audit, cleanup, and rollback-restoration evidence. The public Governance result reports `external-change` for an edit detected before application, and reports the recovery action when reopening resolves an interrupted transaction. Explicit human confirmation that reopening returns `bayesian-statistics-v2` while `bayesian-statistics-v1` remains retrievable is still required before TB8 acceptance.

The concrete Repository Format representation above was confirmed by the user before implementation. If implementation exposes a contradiction with the accepted applied-record, rollback, version-mapping, or transaction layout, stop, update this brief and `repository-format.md`, and obtain renewed confirmation before changing the S5 test or code.

## Required confirmation

The S2 Governance seam is already confirmed by the accepted Test Strategy and the TB8–TB10 issue scope. If implementation requires a new seam, a different version authority, a Repository Format revision, or a new irreversible architectural decision, pause before writing that test or code, update the owning document and this brief, and obtain explicit human confirmation.
