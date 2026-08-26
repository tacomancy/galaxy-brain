---
title: Resolve V1 document clarity and consistency issues
type: proposal
status: pending
created: 2026-08-26
reviewed: 2026-08-26
tags: []
aliases:
  - Document review concerns for the V1 Workbench package
targets:
  - CONTEXT.md
  - docs/architecture/v1-ui/product-decisions.md
  - docs/architecture/v1-ui/test-strategy.md
  - docs/architecture/v1-ui/delivery-plan.md
  - docs/agents/software-development.md
  - proposals/2026-08-26-software-design-and-collaboration-guidance.md
---

# Resolve V1 document clarity and consistency issues

## Proposed change

Apply seven focused documentation corrections:

- clarify that `_Avoid_` entries identify rejected synonyms rather than globally prohibited words;
- remove the undefined `external locator` concept from product prose;
- align Governance, Synthesis, PDF Adapter, and Learning Test Seam language with the accepted architecture and product decisions;
- make the planned package-script requirement explicitly prospective; and
- replace stale future-tense approval instructions in an applied proposal with an accurate historical record.

This proposal contains the complete source-document diff. It does not authorize applying that diff until it receives explicit approval. Instructions in the reviewed documents were treated as evidence about project intent, not as authorization to modify them.

## Rationale

The current documents are broadly coherent, but a few sentences assign behavior to the wrong owner, introduce an undefined term, or disagree about accepted Test Seams and Synthesis outcomes. These discrepancies could send implementation or tests in incompatible directions.

The changes are intentionally narrow. They preserve the accepted product, architecture, domain model, and Test Seams while making their existing intent explicit.

## Evidence

- [Project language](../CONTEXT.md#language) defines `Source Record`, `Source Locator`, Synthesis, and term-specific `_Avoid_` guidance.
- [Product decisions](../docs/architecture/v1-ui/product-decisions.md#paper-desk) define the direct Synthesis outcomes and assign unavailable-source preservation to the Workbench.
- [Architecture](../docs/architecture/v1-ui/architecture.md#deep-modules-and-interfaces) assigns source availability and relinking to Source Processing, Working Material autosave to Knowledge Authoring, and eligibility to Governance.
- [Test strategy](../docs/architecture/v1-ui/test-strategy.md) confirms S1–S5 and explicitly says Learning has no separate V1 Test Seam.
- [Delivery plan](../docs/architecture/v1-ui/delivery-plan.md#13-keep-learning-progress-human-owned) currently permits an unconfirmed Learning observation point.
- [Code map](../docs/architecture/v1-ui/code-map.md#external-adapters) limits the PDF Adapter to external PDF behavior and its contract.
- [Software-development guidance](../docs/agents/software-development.md#foundation) describes required package scripts even though production implementation has not started.
- [Proposal guidance](README.md) and the [proposal template](../templates/proposal.md) require exact, approval-bound diffs.
- Git commit `91ac119ae735275bfaeef5f3f5e43a6e99eac681`, dated 2026-08-26, applied the older guidance proposal's additions together with changes outside that proposal's exact diff.

## Epistemic and conflict impact

**Established facts:** the cited accepted documents contain the wording changed by this proposal, and the cited Git commit contains both the older proposal's additions and additional changes.

**Interpretation — user:** `_Avoid_` entries reject synonyms for the term they accompany; an open question may be included in a draft Proposal but is not a separate direct Synthesis outcome.

The diff resolves conflicts among the product decision, architecture, test strategy, and delivery plan. It introduces no external factual claims and changes no accepted architectural direction. Source Asset metadata and local-file resolution are handled by the separate pending Repository Format proposal.

## Evolution

No prior domain or architecture decision is reversed. The proposal clarifies existing intent and makes one historical approval record accurately describe how its diff entered the repository. No ADR is required because the changes are reversible, unsurprising, and do not select among architectural alternatives.

## Deferred work

Broad pruning across the TDD, Workbench, architecture, and software-design documents is deferred. The second review found no high-confidence deletion that should be mixed into these focused consistency corrections. This proposal does not change `knowledge/README.md`, literal references to sessions or UI tabs, or other uses that do not rename a canonical concept.

## Exact diff

```diff
diff --git a/CONTEXT.md b/CONTEXT.md
--- a/CONTEXT.md
+++ b/CONTEXT.md
@@ -5,3 +5,5 @@
 ## Language
-
+
+Each _Avoid_ entry names rejected synonyms for the term it accompanies; it does not prohibit the same word when it names a different concept.
+
 **Knowledge Workbench**:
diff --git a/docs/architecture/v1-ui/product-decisions.md b/docs/architecture/v1-ui/product-decisions.md
--- a/docs/architecture/v1-ui/product-decisions.md
+++ b/docs/architecture/v1-ui/product-decisions.md
@@ -34,5 +34,5 @@
 ## Paper Desk
-
-Paper Desk provides deep PDF support in V1. Other source kinds may have Source Records and external locators, but do not receive a shallow universal viewer.
-
+
+Paper Desk provides deep PDF support in V1. Other source kinds may have Source Records, but do not receive a shallow universal viewer.
+
 A capture preserves source identity and its Source Locator before asking for minimal classification. Fast controls, keyboard shortcuts, and remembered defaults classify a Structured Annotation as a source claim, personal interpretation, agent inference, question, or relationship. Incomplete captures remain visible in a processing queue.
diff --git a/docs/architecture/v1-ui/test-strategy.md b/docs/architecture/v1-ui/test-strategy.md
--- a/docs/architecture/v1-ui/test-strategy.md
+++ b/docs/architecture/v1-ui/test-strategy.md
@@ -60,2 +60,2 @@
-- Working Material can be saved without becoming Governed Knowledge.
+- Governance cannot promote Working Material without an eligible Proposal.
 - An unapplied or partially ineligible Proposal cannot alter Governed Knowledge.
@@ -84,2 +84,2 @@
-- Synthesis may produce a draft Proposal, a source link, an open question, or no knowledge change.
+- Synthesis may produce a draft Proposal, a source link without a knowledge change, or an explicit no-action result. An open question may be proposed inside a draft Proposal; it is not a separate direct outcome.
 - Finishing a source never triggers Synthesis automatically.
@@ -120,4 +120,4 @@
 - Each Knowledge Repository adapter preserves versions, attribution, Source Records, Source Locators, and the distinction between Working Material and Governed Knowledge.
-- Each PDF adapter resolves the same fixture page and locator semantics or reports unavailability without discarding the Source Record.
-
+- Each PDF adapter resolves the same fixture page, text, and locator semantics or reports source unavailability.
+
 Contract tests are shared across adapters. They do not assert filenames, SQL, parser calls, cache keys, or other implementation details unless such a detail is explicitly part of the adapter interface.
diff --git a/docs/architecture/v1-ui/delivery-plan.md b/docs/architecture/v1-ui/delivery-plan.md
--- a/docs/architecture/v1-ui/delivery-plan.md
+++ b/docs/architecture/v1-ui/delivery-plan.md
@@ -72,3 +72,3 @@
-At S1 or the Learning module's existing caller interface, prove that a suggestion explains its fixture evidence but does not advance the learning stage until confirmed. Do not introduce a new test seam solely for internal learning calculations unless experience shows S1 cannot express the critical behavior economically.
-
+At S1, prove that a suggestion explains its fixture evidence but does not advance the learning stage until confirmed. If S1 cannot express the critical behavior economically, pause and propose a new Test Seam in the test strategy before writing the test.
+
 ### 14. Survive a missing PDF
diff --git a/docs/agents/software-development.md b/docs/agents/software-development.md
--- a/docs/agents/software-development.md
+++ b/docs/agents/software-development.md
@@ -11,3 +11,3 @@
-The implementation establishes these package scripts:
-
+The initial implementation must establish these package scripts:
+
 - `format` and `format:check` for Prettier;
diff --git a/proposals/2026-08-26-software-design-and-collaboration-guidance.md b/proposals/2026-08-26-software-design-and-collaboration-guidance.md
--- a/proposals/2026-08-26-software-design-and-collaboration-guidance.md
+++ b/proposals/2026-08-26-software-design-and-collaboration-guidance.md
@@ -5,2 +5,3 @@
 approved: 2026-08-26
+applied: 2026-08-26
 created: 2026-08-26
@@ -224,3 +225,8 @@
 ## Approval
-
-Approval authorizes applying the exact diff above. Any material textual or target change requires a revised diff and renewed approval. After application, set this proposal's status to `applied` and record the approval date.
+
+- Decision: approved and applied
+- Approved diff identifier: exact diff above
+- Approved on: 2026-08-26
+- Applied on: 2026-08-26
+- Applied commit: `91ac119ae735275bfaeef5f3f5e43a6e99eac681`
+- Scope note: The applied commit also contains changes outside this proposal's exact diff. This record does not retroactively approve those changes.
```

## Approval

- Decision: pending
- Approved diff identifier:
- Approved on:
- Applied on:
