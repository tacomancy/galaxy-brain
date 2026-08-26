---
title: Add software design and human-agent collaboration guidance
type: proposal
status: applied
created: 2026-08-26
approved: 2026-08-26
applied: 2026-08-26
tags: []
targets:
  - AGENTS.md
  - README.md
  - app/docs/agents/software-design.md
  - app/docs/agents/collaboration.md
---

# Add software design and human-agent collaboration guidance

## Decision

The project adopted repository-owned guidance for software design and human-agent collaboration. The guidance preserves the existing engineering glossary, TDD/Test Seam rules, software-development conventions, and specialized knowledge/research/workbench guidance while giving agents a concise shared standard for design, ownership, reuse, dependencies, configurability, and explanatory code.

## Applied changes

- `AGENTS.md` now routes material design and collaboration work through the relevant guidance.
- `README.md` exposes the collaboration and software-design guides to human readers.
- `app/docs/agents/software-design.md` defines the shared design principles: design for people, start from behavior, build deep Modules, place evidence-based Seams, direct dependencies inward, reuse before inventing, give state one authority, keep policy human-configurable, develop test-first, and write source for human readers.
- `app/docs/agents/collaboration.md` defines authority, approval, shared context, reversibility, and handoff rules.

The guidance does not add a domain concept or change an architectural decision. The exact historical diff remains recoverable in Git commit `d6a403c`.

## Approval record

- Decision: approved by the user in the grilling review
- Approved on: 2026-08-26
- Applied on: 2026-08-26
- Applied commit: d6a403c
