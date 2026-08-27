# Tracer Bullet 5: Capture one located source claim

Status: implementation in progress.

This brief coordinates Tracer Bullet 5 in the [delivery plan](delivery-plan.md#5-capture-one-located-source-claim). It is an implementation entry point, not a second authority for product behavior, architecture, repository format, or testing.

## Scope

Using the checked-in Bayesian statistics source fixture, the Source Processing module can capture one known PDF passage as a source-claim Structured Annotation. The capture preserves the Source Record identity, the logical page locator, the captured source text, and source attribution. It persists the result as Working Material under the selected Knowledge Repository.

This slice proves the source-processing boundary and the first file-backed Working Material artifact. It does not implement the Paper Desk UI, PDF import or asset-mode selection, arbitrary text selection, capture classification controls, reading-position persistence, Synthesis, Proposal creation, Governance, linked-file verification, relinking, or automatic processing. Capture does not create a Proposal or change Governed Knowledge.

## Documentation prerequisite

Before implementation, review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), [Test Strategy](test-strategy.md), applicable ADRs, the completed TB1–TB4 delivery records, and the [TB5 preparation task](delivery-plan.md#tb5-preparation-task--before-implementation). This brief is the resulting guidance-compliant implementation spec. Its behavior, seams, expected values, vertical path, boundaries, deferrals, and acceptance evidence must remain checked against those authorities before each implementation cycle.

## Authoritative decisions

The following documents own the behavior and must be updated at their owning boundary if this slice reveals a new requirement:

- [Product Decisions](product-decisions.md) owns Paper Desk behavior, source identity, Source Asset policy, capture classification, provenance, and the rule that capture never implies Synthesis.
- [Architecture](architecture.md#source-processing-module) owns the Source Processing module, locator integrity, attribution, capture classification, and dependency direction.
- [Repository Format](repository-format.md) owns portable source content and the boundary between repository-managed Working Material and machine-local source configuration.
- [Test Strategy](test-strategy.md#s3--source-processing-seam) owns S3 behavior observation, literal PDF fixture values, and S5 PDF adapter contract coverage.
- [Delivery Plan](delivery-plan.md#5-capture-one-located-source-claim) owns implementation order and delivery sequencing.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md) owns portable files and VCS-neutral repository behavior.

The existing [code map](code-map.md) remains the source for live and planned production locations.

## First Public Behavior

Given the fixture Source Record `bayesian-statistics-fixture-source`, capturing the known passage on page 2 produces one persisted Structured Annotation with:

- **Source Record:** `bayesian-statistics-fixture-source` / `Bayesian statistics fixture source`.
- **Source Locator:** page `2`, character range `0..58`, with logical locator `page:2#chars=0-58`.
- **Captured source text:** `Bayesian inference updates prior belief with evidence.`
- **Attribution and classification:** `source-claim`.
- **Material state:** `working-material`; it is not Governed Knowledge and does not create a Proposal.

The expected values above are written independently of the implementation and must be asserted literally in behavior tests.

## Test Seams and fixtures

### S3 Source Processing seam

Test the framework-independent Source Processing module through its public capture operation. Supply a deterministic PDF Adapter for the fixture and a repository-backed Working Material Adapter. Assert the returned domain outcome and the persisted annotation through the repository Adapter interface; do not inspect parser internals, UI state, or storage as a side channel.

### S5 Adapter contract seam

The deterministic PDF Adapter exposes the same fixture page and locator semantics required by the S3 behavior. The file-backed Working Material Adapter writes portable UTF-8 Markdown under the selected repository and preserves the Source Record, locator, captured text, attribution, and Working Material state. The contract must remain provider-free and must not invoke Git, network, or a PDF engine that has not been selected for this slice.

### Fixture

The fixture PDF identity is `bayesian-statistics-fixture-source`. Its deterministic page 2 contains the exact expected passage named above. The fixture Source Record remains the checked-in `sources/papers/bayesian-statistics.md`; the test must not derive expected text or locators by calling the Adapter used to produce them.

## Implementation plan

Run one Red-to-Green cycle per behavior, stopping at Green before refactoring or selecting the next cycle:

1. Define the Source Processing capture Interface, Structured Annotation outcome, Source Locator value, and PDF Adapter seam around the single literal fixture passage.
2. Add the deterministic fixture PDF Adapter and prove the S3 capture outcome with literal expected values.
3. Add the file-backed Working Material Adapter and persist the annotation as a portable source annotation without mutating the Source Record or Governed Knowledge.
4. Add the shared S5 contract coverage needed to prove the deterministic and file-backed Adapters preserve the same capture semantics and remain provider-free.

Keep PDF parsing mechanics behind the PDF Adapter. Do not select or add a production PDF engine until a later behavior demonstrates that it is necessary. Keep file naming, serialization, and directory traversal inside the repository Adapter; the Source Processing module must depend only on its public Interface.

## Acceptance gate

Tracer Bullet 5 is complete only when:

- the S3 behavior test captures the literal fixture passage and returns the exact Source Record, Source Locator, text, attribution, classification, and Working Material state;
- the persisted annotation can be reopened through the Working Material Adapter without losing provenance or changing the Source Record;
- no Proposal, Synthesis result, Governed Knowledge mutation, Git operation, network request, or Agent Provider is involved;
- the relevant S3 and S5 suites are green, `npm run check` passes, and the code map names every production Module and Adapter location; and
- the user reviews the evidence and accepts the running behavior or the agreed caller-visible result at the confirmed seam.

The implementation completion record belongs in the [delivery plan](delivery-plan.md). Later PDF import, Paper Desk capture controls, reopen, and Synthesis behaviors remain separate tracer bullets.
