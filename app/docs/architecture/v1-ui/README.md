# V1 Knowledge Workbench architecture package

Status: architectural direction and S1–S5 Test Seams accepted.

This package translates the accepted V1 UI direction into an Electron and strict-TypeScript desktop architecture with a test-driven delivery strategy. The foundation is selected; editor, PDF, index, model, updater, routing, state-management, and native-database choices remain deferred until a behavior slice makes them necessary. Repository files are VCS-neutral; Git and Git LFS are optional external tools managed by the user.

## Package

- [Product decisions](product-decisions.md) records the accepted experience, scope, and deferrals.
- [Architecture](architecture.md) defines modules, interfaces, state ownership, and system seams.
- [Repository Format](repository-format.md) defines the portable, versioned Knowledge Repository contract.
- [Code map](code-map.md) maps architectural responsibilities to live or explicitly planned source locations.
- [Test strategy](test-strategy.md) defines the confirmed public seams through which behavior is verified.
- [Delivery plan](delivery-plan.md) orders vertical tracer bullets for red-to-green implementation.
- [Stack decision brief](stack-research.md) records current primary-source evidence for the desktop foundation.
- [Project language](../../../../CONTEXT.md) defines the domain terms used by product, code, and tests.
- [Engineering glossary](../../engineering/glossary.md) defines the codebase-design and test-driven-development vocabulary used by this package.
- [Agent implementation guide](../../agents/workbench.md) defines the required Red-to-Green execution and handoff procedure for Workbench changes.

The hard-to-reverse decisions are recorded separately:

- [ADR 0001](../../adr/0001-use-task-specific-workspaces.md): use task-specific workspaces.
- [ADR 0002](../../adr/0002-govern-changes-through-proposals.md): govern changes through proposals.
- [ADR 0003](../../adr/0003-keep-rich-and-source-editing-equivalent.md): keep rich and source editing equivalent.
- [ADR 0004](../../adr/0004-use-electron-typescript-for-v1.md): use Electron and TypeScript for V1.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md): use portable files with optional external version control.
- [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md): keep Knowledge Repositories independent of Workbench releases.
- [ADR 0007](../../adr/0007-keep-agent-provider-configuration-optional.md): keep Agent Provider configuration optional.

## TDD gate

The S1–S5 Test Seams in [Test strategy](test-strategy.md) were confirmed on August 26, 2026. Implementation may test at those seams and no others without a documented and confirmed amendment. Delivery proceeds one behavior at a time: write one failing test at an agreed seam, observe the failure, add the minimum implementation that passes it, and then choose the next slice using what the previous cycle taught.

The existing files under `app/prototype/knowledge-workbench/` remain throwaway comparison material. They are evidence for the accepted interaction direction, not a production foundation or an implementation constraint.
