---
title: Document review concerns for the V1 Workbench package
type: proposal
status: draft
created: 2026-08-26
reviewed: 2026-08-26
tags: []
aliases: []
targets:
  - docs/architecture/v1-ui/product-decisions.md
  - docs/architecture/v1-ui/architecture.md
  - docs/architecture/v1-ui/test-strategy.md
  - docs/architecture/v1-ui/delivery-plan.md
  - knowledge/README.md
  - proposals/2026-08-26-software-design-and-collaboration-guidance.md
---

# Document review concerns for the V1 Workbench package

This is an advisory review memo, not an approved change. It records concerns found while reviewing the project documents on 2026-08-26 for conciseness, clarity, and consistency. No source documents were changed as a result of the review.

## Priority concerns

### 1. Align Synthesis outcomes

`docs/architecture/v1-ui/product-decisions.md` says that Synthesis produces a draft Proposal, a source link without a knowledge change, or an explicit no-action result. `docs/architecture/v1-ui/test-strategy.md` additionally lists an open question as a Synthesis outcome.

Resolve whether an open question is a first-class Synthesis outcome. Then use the same outcome vocabulary in the product decision, Source Processing interface, test strategy, and delivery plan.

References: [product decisions](../docs/architecture/v1-ui/product-decisions.md#paper-desk), [test strategy](../docs/architecture/v1-ui/test-strategy.md#s3--source-processing-seam).

### 2. Use only confirmed Test Seams in the delivery plan

The delivery plan says learning progress may be tested at S1 or at “the Learning module's existing caller interface.” The accepted test strategy says Learning has no separate Test Seam in V1.

Recommended resolution: specify S1 for the learning behavior. If a direct Learning seam becomes necessary, amend and reconfirm the test strategy before writing tests there.

References: [delivery plan](../docs/architecture/v1-ui/delivery-plan.md#13-keep-learning-progress-human-owned), [test strategy](../docs/architecture/v1-ui/test-strategy.md#why-there-are-no-additional-test-seams).

### 3. Clarify PDF adapter ownership

The architecture describes the PDF adapter as supplying pages, text, and locators. The S5 contract additionally says each PDF adapter must report unavailability without discarding the Source Record.

Recommended resolution: keep page/text/locator resolution and availability in the PDF adapter contract; test Source Record and annotation preservation through Source Processing and the Knowledge Repository. The PDF adapter should not own source-record persistence.

References: [architecture](../docs/architecture/v1-ui/architecture.md#system-seams-and-adapters), [test strategy](../docs/architecture/v1-ui/test-strategy.md#s5--adapter-contracts).

### 4. Keep Governance tests within Governance ownership

S2 lists “Working Material can be saved without becoming Governed Knowledge,” but Knowledge Authoring owns Working Material autosave and persistence in the architecture.

Recommended resolution: change the Governance behavior to “saved Working Material is not promoted to Governed Knowledge,” or move the save behavior to the owning seam. This keeps the test aligned with the module being tested.

References: [architecture](../docs/architecture/v1-ui/architecture.md#knowledge-authoring-module), [test strategy](../docs/architecture/v1-ui/test-strategy.md#s2--governance-seam).

### 5. Remove canonical-term drift

`CONTEXT.md` marks “Dashboard” and “Tabs” as terms to avoid. The knowledge map refers to “generated dashboards,” and the architecture refers to “Paper Desk tabs.”

Recommended resolution: use “operational projections” or similar language for generated state, and “Paper Desk views” or “items” instead of “tabs.” The prototype's “dashboard-first” label can remain if it is clearly understood as a discarded comparison variant.

References: [project language](../CONTEXT.md#language), [knowledge map](../knowledge/README.md#knowledge-map), [architecture](../docs/architecture/v1-ui/architecture.md#state-ownership).

## Conciseness opportunities

- `test-strategy.md`, `delivery-plan.md`, `workbench.md`, and `software-design.md` repeat the same TDD, seam, and completion rules. Let the test strategy define seam boundaries, the delivery plan define order, and the guidance documents link to those authorities.
- `stack-research.md` is useful evidence, but its Tauri comparison, Electron boundaries, TDD consequences, and risks repeat parts of ADR 0004 and the architecture package. Consider shortening the decision brief and leaving detailed implementation constraints in the software-development guide.
- The root `CONTEXT.md`, architecture package index, and ADRs are comparatively concise and provide a good model for direct, decision-oriented prose.

## Historical-document cleanup

The applied proposal `proposals/2026-08-26-software-design-and-collaboration-guidance.md` still uses future-tense approval instructions: “Approval authorizes applying the exact diff above” and “After application, set this proposal's status to `applied`.”

Once the exact applied state is verified, replace those instructions with a historical record of approval and application, including an applied date and, if useful, an identifier for the approved diff.

Reference: [applied proposal](2026-08-26-software-design-and-collaboration-guidance.md#approval).

## Decisions to resolve later

1. Is “open question” a first-class result of Synthesis?
2. Is S1 sufficient as the sole test seam for Learning in V1?
3. Which layer is authoritative for preserving Source Records when a PDF is unavailable?

Until these are resolved, this memo should remain a draft advisory record rather than being treated as an architectural decision.

## Exact diff and approval

No exact source-document diff is proposed here. This memo records review findings and recommended directions only; any edits to accepted architecture, guidance, or governed knowledge require a separate exact proposal and approval.
