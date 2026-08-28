# Tracer Bullet 15: Survive a missing or changed PDF

Status: implementation complete; human acceptance pending as of August 28, 2026.

This brief coordinates the TB15 implementation described in the [delivery plan](delivery-plan.md#15-survive-a-missing-or-changed-pdf). It is an implementation entry point, not a second authority for Product Decisions, Architecture, the Repository Format, testing, or accepted ADR decisions.

## Scope

TB15 extends the accepted Source Processing path so that a linked PDF can become unavailable or fail an identity check without destroying portable source provenance. It has two bounded S3 slices:

1. **Detect unavailable or changed bytes.** A Source Processing caller checks the linked asset. If the file is missing, unreadable, or cannot provide a comparable identity, the caller receives `source status unavailable`. If the file is readable but its identity or content identity differs from the identity recorded for the link, the caller receives `source status changed`. In either case the Source Record reference and every existing Structured Annotation remain unchanged and readable.
2. **Explicitly relink.** The caller supplies a replacement linked file through an explicit relink operation. The Source Asset Adapter must verify the replacement's identity/content and known page/range before committing its machine-local link. A successful relink makes the known fixture page available again while preserving the Source Record ID, annotation ID, source text, and logical Source Locator. A mismatch remains a changed/unavailable result; it is never silently accepted.

The first slice proves the domain behavior through the S3 Source Processing Interface. The second slice uses the same Interface and a deterministic file-identity Adapter. No new repository-format schema is required for this brief: linked-local paths and their SHA-256 identities remain machine-local, while Source Records, annotations, citations, and logical locators remain portable repository content.

This brief does not make a changed PDF authoritative merely because a user can reach it. Only the explicit relink action may accept a replacement, and relinking does not rewrite historical annotations or their logical locations.

## Documentation prerequisite

Before writing behavior tests or implementation code, explicitly complete these to-do items:

1. Review the accepted [Product Decisions](product-decisions.md#paper-desk), [Architecture](architecture.md#paper-desk), [Repository Format](repository-format.md#portable-content), [Test Strategy](test-strategy.md#s3--source-processing-seam), applicable ADRs, the completed TB1–TB11 delivery records, and the current TB12–TB14 delivery/specification records if present.
2. Create or update this guidance-compliant `tracer-bullet-15-spec.md` with the Public Behavior, confirmed Test Seam, literal expected values, fixture and External System Seams, minimum vertical path, boundaries, discarded alternatives, deferrals, acceptance evidence, and required confirmation recorded below.
3. Check that source availability and relinking remain Source Processing behavior behind external PDF and Source Asset Adapters; the Source Asset Adapter owns machine-local replacement verification and commit, while Paper Desk and any future UI are callers and projections, not owners of source identity, annotation preservation, or relink policy.
4. Check that machine-local linked-file paths and identities never enter Repository Format content, that no source record or annotation is deleted when an asset cannot be checked, and that no changed bytes are accepted without the explicit relink operation.
5. Obtain explicit human confirmation of the exact status vocabulary, fixture identities, replacement behavior, public Interface shape, and deferred work below before writing the Red workflow or implementation code.

The user explicitly confirmed all documented TB15 slices and choices before implementation began. If a future change reveals a new Source Record persistence representation, a new Repository Format field, or a UI seam required to prove the behavior, stop and update this brief and the governing documentation before proceeding.

## Governing authorities

- [Product Decisions](product-decisions.md#paper-desk) owns the Source Asset modes, preservation rule for changed or unavailable bytes, and explicit relinking boundary.
- [Architecture](architecture.md#paper-desk) owns Source Processing state ownership, the replaceable PDF seam, and the rule that Source Records and logical locators remain portable while external source state varies.
- [Repository Format](repository-format.md#portable-content) owns the boundary between portable repository content and machine-local linked-file paths and SHA-256 identities. TB15 must not add machine-specific paths to repository files.
- [Test Strategy](test-strategy.md#s3--source-processing-seam) owns the S3 public Interface test seam and the requirement that fixtures assert independently known page text and locator literals.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md) keeps the application local-first and VCS-neutral.
- [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md) keeps repository content independent of Workbench installation and machine-local session state.
- [ADR 0009](../../adr/0009-keep-governed-knowledge-editable-through-evolution.md) remains applicable to any later proposal or governed change derived from source material; TB15 itself does not edit Governed Knowledge.

## Public Behavior

Given the checked-in Bayesian fixture Source Record and one captured source-claim annotation:

1. A baseline availability check returns `available` and the recorded source and content identities. Reading the existing annotation still returns the exact source reference, text, attribution, classification, and locator.
2. When the linked PDF is missing or unreadable, the availability check returns `source-status-unavailable` with the literal warning `source status unavailable`. The Source Record remains present, and reading annotations for that Source Record returns the same annotation rather than an empty or deleted result.
3. When the linked PDF is readable but either recorded identity differs from the current identity, the availability check returns `source-changed` with the literal warning `source status changed`. The result identifies that the saved linked asset and current bytes differ without replacing the saved link, changing the Source Record ID, changing annotation text, or changing the logical locator.
4. A capture request made while a composed Source Asset Adapter reports a changed identity returns `source-unavailable` with the detail `The source status changed; relink is required before capture.` It does not resolve or save new text from the changed bytes.
5. An explicit relink request supplies a replacement linked asset, expected replacement identities, and a known page/range to verify. The Source Processing module asks the Source Asset Adapter to verify the replacement. The Adapter commits the machine-local replacement only after all checks succeed. The successful outcome is `relinked` and includes the now-available current identities; the existing annotation remains byte-for-byte equivalent at the domain level.
6. A relink request whose replacement identity cannot be read, is unavailable, does not satisfy the requested expected identity, or cannot resolve the requested page/range returns `source-status-unavailable` or `source-changed` as appropriate. The Adapter does not mutate the stored link, and Source Processing does not mutate the Source Record reference, annotations, citations, or logical locators.
7. Relinking does not remap an annotation to a different page or character range. If a replacement does not contain the known page/range, the source remains unavailable for that capture; the module does not guess a new range or silently rewrite the annotation.
8. No availability check, failed relink, or successful relink creates a Proposal, invokes Synthesis, changes Governed Knowledge, or requires Git, a remote, credentials, or an Agent Provider.

The caller-visible outcomes must distinguish a current source, an unavailable source, a changed source, and an explicitly verified relink. Infrastructure causes may be recorded through the existing diagnostics seam, but implementation-specific exception text is not a UI or domain contract.

## Proposed public Interface

The existing `PdfAdapter.readSelection` seam remains responsible for resolving a requested page/range. TB15 adds the smallest Source Processing seam needed for linked-asset state; it must not reuse the Synthesis-only identity check as a relink policy.

The proposed shapes are:

```ts
export type SourceAssetIdentityOutcome =
  | {
      outcome: "available";
      sourceIdentity: string;
      contentIdentity: string;
    }
  | { outcome: "unavailable"; detail: string };

export type SourceAssetRelinkOutcome =
  | SourceAssetIdentityOutcome
  | {
      outcome: "changed";
      sourceIdentity: string;
      contentIdentity: string;
    };

export interface SourceAssetAdapter {
  readIdentity(sourceRecordId: string): Promise<SourceAssetIdentityOutcome>;
  relink(input: RelinkSourceInput): Promise<SourceAssetRelinkOutcome>;
}

export interface CheckSourceAvailabilityInput {
  sourceRecord: SourceRecordReference;
  expectedSourceIdentity: string;
  expectedContentIdentity: string;
}

export type CheckSourceAvailabilityOutcome =
  | {
      outcome: "available";
      sourceRecord: SourceRecordReference;
      sourceIdentity: string;
      contentIdentity: string;
    }
  | {
      outcome: "source-status-unavailable";
      sourceRecord: SourceRecordReference;
      warning: "source status unavailable";
      detail: string;
    }
  | {
      outcome: "source-changed";
      sourceRecord: SourceRecordReference;
      warning: "source status changed";
      expectedSourceIdentity: string;
      expectedContentIdentity: string;
      actualSourceIdentity: string;
      actualContentIdentity: string;
    };

export interface RelinkSourceInput {
  sourceRecord: SourceRecordReference;
  replacementReference: string;
  expectedReplacementSourceIdentity: string;
  expectedReplacementContentIdentity: string;
  verificationLocator: Pick<CaptureSourceClaimInput, "page" | "start" | "end">;
}

export type RelinkSourceOutcome =
  | {
      outcome: "relinked";
      sourceRecord: SourceRecordReference;
      sourceIdentity: string;
      contentIdentity: string;
    }
  | Extract<
      CheckSourceAvailabilityOutcome,
      { outcome: "source-status-unavailable" | "source-changed" }
    >;
```

The exact TypeScript names may change during implementation if the public behavior and ownership remain identical. The following are not negotiable: identity comparison is explicit, `source status unavailable` and `source status changed` remain distinguishable, relink is caller-authorized, and the module returns the original Source Record and annotations unchanged on every failure path.

When a Source Asset Adapter is composed, `CaptureSourceClaimInput.expectedSourceIdentity` and `expectedContentIdentity` are required by the capture operation. A capture without them returns unavailable rather than bypassing the linked-asset check. Existing provider-free capture callers without a Source Asset Adapter retain the TB5 behavior.

The `replacementReference` is an Adapter-facing machine-local value and must never cross into Repository Format content, renderer state, logs, or caller-visible portable artifacts. The module may pass it to the Adapter, but it must not expose an absolute path to the renderer or persist it in a Markdown annotation.

## Literal expected values

The fixture uses the existing TB5/TB6/TB7 source values:

- Source Record ID: `bayesian-statistics-fixture-source`.
- Source Record title: `Bayesian statistics fixture source`.
- Structured Annotation ID: `annotation-bayesian-statistics-fixture-source-page-2-0-54`.
- Annotation text: `Bayesian inference updates prior belief with evidence.`
- Source Locator: page `2`, start `0`, exclusive end `54`, logical `page:2#chars=0-54`.
- Attribution: `source-claim`.
- Classification: `source-claim`.
- Material state: `working-material`.

The deterministic identity fixture reuses the identity literals already established by Source Processing tests:

- Original source identity: `source-identity-bayesian-statistics-v1`.
- Original content identity: `content-identity-bayesian-statistics-v1`.
- Changed source identity: `source-identity-bayesian-statistics-v2`.
- Changed content identity: `content-identity-bayesian-statistics-v2`.

The changed fixture may return the same known passage for the relink proof so that the test isolates identity acceptance from locator remapping. The expected post-relink annotation remains exactly the values above; only the explicitly accepted current identities become the `v2` values. The implementation must not derive the expected text, range, or logical locator by calling its own PDF renderer or locator builder.

## Confirmed Test Seam

Use the existing S3 Source Processing seam through the public Source Processing Interface. The focused tests should compose:

- the real Source Processing module;
- an in-memory Working Material Adapter containing the literal fixture annotation;
- a deterministic `SourceAssetAdapter` whose state can represent available, unavailable, changed, and verified-replacement outcomes; and
- the existing fixture PDF Adapter for the final known-page read.

The tests must assert caller-visible outcomes and reread the annotation through the public Working Material contract after each failure and after relinking. The relink Adapter must assert the independently known verification locator and must not commit its replacement on an unavailable, mismatched, or locator-invalid result. Tests must not inspect private module state, mutate an implementation map directly, derive expected identities from the Adapter under test, or use repository files as a side channel.

Add an S5 Adapter contract only if the production machine-local linked-file Adapter is introduced in this TB. That contract must verify real SHA-256 identity comparison and the requested known page/range against a temporary fixture file, commit the machine-local link only after verification, never write its absolute path into repository content, and report an unavailable result when the path is missing. S5 is supporting evidence; it does not replace the S3 proof that annotations survive the state transition.

No S1 UI work is required to make the S3 contract true. A later Paper Desk presentation may expose the status and relink control, but adding a UI route here would be a scope expansion and requires a separate confirmed S1 brief.

## Minimum vertical path

1. Complete the documentation prerequisite and obtain confirmation of this exact fixture, vocabulary, Interface boundary, and explicit relink rule.
2. Add one focused S3 test for an unavailable linked PDF. Observe the expected Red failure because Source Processing has no availability operation.
3. Add the availability outcome and Adapter seam, then implement only the unavailable path. Assert the unchanged Source Record and annotation through public reads.
4. Add one focused S3 test for a readable identity/content mismatch. Assert `source-changed`, the exact warning, and no mutation of the saved link or annotation.
5. Add one focused S3 test for explicit relink to the known replacement. Assert `relinked`, the `v2` identities, the known page/range, and exact preservation of `page:2#chars=0-54`.
6. Add failed-relink tests for an unavailable, mismatched, or locator-invalid replacement. Assert that the Adapter does not commit the prior link and the annotation remains unchanged.
7. Add the changed-capture test and assert that Source Processing refuses to resolve changed bytes until relink succeeds.
8. If a production linked-file Adapter is added, add its narrow S5 contract for SHA-256 comparison, missing paths, and machine-local path isolation.
9. Run the focused S3/S5 tests, `npm run check`, `npm run test:coverage`, `npm run lint:complexity`, and public documentation validation. Record Red/Green evidence and defer any UI/manual acceptance to a confirmed S1 slice.

## External System Seams

- **Source Processing Module:** owns outcome vocabulary, identity comparison policy, explicit relink authorization, and preservation of Source Records and annotations.
- **Source Asset Adapter:** reads the machine-local linked asset identity and verifies the replacement's identity, content, and known page/range before committing the machine-local link. It owns path resolution and SHA-256 calculation; it does not own annotation or Proposal policy.
- **PDF Adapter:** resolves the known page/range after the source is available. It does not decide whether changed bytes are accepted and cannot delete or rewrite annotations.
- **Working Material Adapter:** preserves and rereads Structured Annotations. It is not a source-availability oracle and must not be bypassed by a UI test.
- **Repository Format:** stores portable Source Records, citations, annotations, and logical locators. Machine-local linked paths and identities remain outside it.
- **Agent Provider, Git, remotes, credentials, and network:** not configured, called, or required.

## Boundaries and explicit deferrals

TB15 does not implement:

- a production PDF engine, arbitrary text selection, OCR, PDF import, or PDF rendering improvements;
- a new portable Source Asset schema or a new repository field for absolute paths;
- automatic relinking, path search, file watching, background hashing, or source synchronization;
- silent acceptance of changed bytes, automatic annotation migration, fuzzy text matching, page/range remapping, or conflict resolution;
- “accept new bytes” as an implicit consequence of opening a file. In this brief, an explicit successful relink is the only acceptance action, and it preserves the old logical locators;
- deletion, invalidation, or hiding of Source Records, citations, or Structured Annotations because a linked asset is unavailable;
- S1 Paper Desk status/relink controls, Atlas changes, or a new desktop route;
- Synthesis, stale saved-result refresh, Proposal creation, Governance, Search, Ask, Jump, Agent Provider behavior, Git, or network services.

If implementation requires persisting a new machine-local link record, changing the Repository Format, or presenting a new UI control to make the behavior observable, pause and update the relevant governing document and this brief before continuing.

## Discarded alternatives and rationale

- **Trust the path and skip identity comparison:** discarded because a changed linked PDF would be silently treated as the same source, violating Product Decision 14 and the source-provenance boundary.
- **Delete or hide annotations when the PDF is unavailable:** discarded because the annotations are portable Working Material and must remain usable while the external source is inaccessible.
- **Rewrite locators to fit the replacement:** discarded because relinking must preserve the logical Source Locator; guessing a new range would silently alter evidence.
- **Use the existing Synthesis identity Adapter as the relink policy:** discarded because Synthesis identity checks are read-only snapshot checks, while TB15 needs explicit replacement verification and mutation of machine-local link state.
- **Test only through Paper Desk:** discarded because it would couple provenance preservation to presentation and would not prove that Source Processing keeps the annotation stable across failed relinks.
- **Add a production PDF engine first:** discarded because the behavior can be proved with the existing deterministic fixture seam; engine selection is unrelated to the preservation contract.
- **Store linked paths and hashes in repository Markdown:** discarded because the Repository Format explicitly keeps machine-local paths and identities outside portable content.

## Acceptance evidence

Implementation evidence is complete only when the S3 tests show all of the following with independently asserted literals:

- unavailable source returns `source-status-unavailable` and `source status unavailable`;
- changed source returns `source-changed` and `source status changed` with both expected and actual identities;
- capture refuses changed bytes until explicit relink and preserves the existing annotation;
- Source Record ID/title and the full Structured Annotation remain unchanged after both failure states;
- explicit relink returns `relinked` only after replacement verification succeeds;
- the known page is readable after relink and the logical locator remains `page:2#chars=0-54`;
- failed relink does not mutate the prior link or annotation;
- no Proposal, Synthesis request, repository-format mutation, or machine-local path leakage occurs.

If an S1 presentation is later added, it requires its own brief and manual review of visible status, explicit relink confirmation, keyboard/focus behavior, and non-mutation on failure. TB15 S3 acceptance does not imply S1 acceptance.

## Required confirmation

The user confirmed the following before implementation:

1. The exact warnings `source status unavailable` and `source status changed` and the corresponding outcomes `source-status-unavailable` and `source-changed`.
2. Reuse of the existing `source-identity-bayesian-statistics-v1/v2` and `content-identity-bayesian-statistics-v1/v2` fixture literals.
3. That explicit relink is the only TB15 action allowed to accept a replacement linked PDF, while preserving the existing Source Record and logical locator.
4. The proposed Source Asset Adapter plus S3 Source Processing seam, with no S1 UI work in this TB unless a later brief is confirmed.
5. The explicit deferrals and discarded alternatives above, including no automatic locator remapping, no portable absolute paths, no production PDF engine, and no silent acceptance of changed bytes.

Any new choice discovered during implementation must be recorded here, with its rationale and deferred alternatives, before implementation continues.
