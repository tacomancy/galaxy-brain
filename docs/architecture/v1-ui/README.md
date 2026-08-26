# V1 Knowledge Workbench architecture package

Status: architectural direction and S1–S5 Test Seams accepted.

This package translates the accepted V1 UI direction into a technology-neutral architecture and a test-driven delivery strategy. It does not choose a desktop framework, editor engine, PDF library, indexing engine, or model provider. Those choices should follow from the first behavior slice that makes them necessary.

## Package

- [Product decisions](product-decisions.md) records the accepted experience, scope, and deferrals.
- [Architecture](architecture.md) defines modules, interfaces, state ownership, and system seams.
- [Test strategy](test-strategy.md) proposes the public seams through which behavior should be verified.
- [Delivery plan](delivery-plan.md) orders vertical tracer bullets for red-to-green implementation.
- [Project language](../../../CONTEXT.md) defines the domain terms used by product, code, and tests.
- [Engineering glossary](../../engineering/glossary.md) defines the codebase-design and test-driven-development vocabulary used by this package.

The hard-to-reverse decisions are recorded separately:

- [ADR 0001](../../adr/0001-use-task-specific-workspaces.md): use task-specific workspaces.
- [ADR 0002](../../adr/0002-govern-changes-through-proposals.md): govern changes through proposals.
- [ADR 0003](../../adr/0003-keep-rich-and-source-editing-equivalent.md): keep rich and source editing equivalent.

## TDD gate

The S1–S5 Test Seams in [Test strategy](test-strategy.md) were confirmed on August 26, 2026. Implementation may test at those seams and no others without a documented and confirmed amendment. Delivery proceeds one behavior at a time: write one failing test at an agreed seam, observe the failure, add the minimum implementation that passes it, and then choose the next slice using what the previous cycle taught.

The existing files under `prototype/knowledge-workbench/` remain throwaway comparison material. They are evidence for the accepted interaction direction, not a production foundation or an implementation constraint.
