---
title: Resolve V1 document clarity and consistency issues
type: proposal
status: applied
created: 2026-08-26
reviewed: 2026-08-26
approved: 2026-08-26
applied: 2026-08-26
tags: []
aliases:
  - Document review concerns for the V1 Workbench package
targets:
  - CONTEXT.md
  - app/docs/architecture/v1-ui/product-decisions.md
  - app/docs/architecture/v1-ui/test-strategy.md
  - app/docs/architecture/v1-ui/delivery-plan.md
  - app/docs/architecture/v1-ui/code-map.md
  - app/docs/agents/software-development.md
  - app/docs/agents/knowledge-base.md
  - app/docs/agents/workbench.md
---

# Resolve V1 document clarity and consistency issues

## Decision

The focused document-review corrections were approved and applied on 2026-08-26. They clarify domain vocabulary, align the confirmed Test Seams and delivery plan, make prospective package requirements explicit, and place planned application source and test roots under `app/`.

The same review record now incorporates the later local-first repository decisions so that the project documents have one coherent authority: public application code and infrastructure are MIT-licensed; the private Knowledge Repository is independent; fixtures and starter files are public; and Git operations remain external and optional.

## Applied change set

- Added the `Knowledge Repository`, `Repository Format`, and `Source Asset` terms to `CONTEXT.md`.
- Removed stale product language around undefined external locators and corrected Governance, Synthesis, PDF, Learning, and package-script wording.
- Aligned the code map with `app/src/` and `app/tests/`.
- Added the VCS-neutral Repository Format, local-first repository creation, safe file transactions, rollback, audit, external-edit, and linked-PDF rules to the architecture and agent guidance.

## Approval record

- Decision: approved by the user in the grilling review
- Approved on: 2026-08-26
- Applied on: 2026-08-26
- Applied commit: d6a403c
