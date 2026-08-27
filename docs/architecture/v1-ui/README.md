# V1 Knowledge Workbench architecture package

Status: architectural direction and S1–S5 Test Seams accepted.

This package translates the accepted V1 UI direction into an Electron and strict-TypeScript desktop architecture with a test-driven delivery strategy. The foundation is selected; editor, PDF, index, model, updater, routing, state-management, and native-database choices remain deferred until a behavior slice makes them necessary. Repository files are VCS-neutral; Git and Git LFS are optional external tools managed by the user.

This package follows the project-wide [documentation authority map](../../README.md#documentation-authority): Product Decisions own behavior, Architecture owns structure, Repository Format owns portable files, Test Strategy owns verification, Delivery Plan owns sequencing, ADRs own hard-to-reverse trade-offs, and agent guidance owns execution rules.

## Package

- [Product decisions](product-decisions.md) records the accepted experience, scope, and deferrals.
- [Architecture](architecture.md) defines modules, interfaces, state ownership, and system seams.
- [Repository Format](repository-format.md) defines the portable, versioned Knowledge Repository contract.
- [Starter inventory](starter-inventory.md) records the independent expected contents of the public V1 skeleton.
- [Code map](code-map.md) maps architectural responsibilities to live or explicitly planned source locations.
- [Test strategy](test-strategy.md) defines the confirmed public seams through which behavior is verified.
- [Delivery plan](delivery-plan.md) orders vertical tracer bullets for red-to-green implementation.
- [Tracer Bullet 2 implementation brief](tracer-bullet-2-spec.md) coordinates the current Open/Create repository slice and links to its authoritative decisions and delivery gates.
- [Stack decision brief](stack-research.md) records current primary-source evidence for the desktop foundation.
- [Project language](../../../CONTEXT.md) defines the domain terms used by product, code, and tests.
- [Engineering glossary](../../engineering/glossary.md) defines the codebase-design and test-driven-development vocabulary used by this package.
- [Agent implementation guide](../../agents/workbench.md) defines the required Red-to-Green execution and handoff procedure for Workbench changes.

The Product Decisions [V1 scope boundary](product-decisions.md#v1-scope-boundary) separates the provider-free core release gate, optional provider-enabled V1 capabilities, and post-V1 work. The other documents below explain the structure, verification, and sequence needed to deliver that boundary.

The hard-to-reverse decisions are recorded separately:

- [ADR 0001](../../adr/0001-use-task-specific-workspaces.md): use task-specific workspaces.
- [ADR 0002](../../adr/0002-govern-changes-through-proposals.md): govern changes through proposals.
- [ADR 0003](../../adr/0003-keep-rich-and-source-editing-equivalent.md): keep rich and source editing equivalent.
- [ADR 0004](../../adr/0004-use-electron-typescript-for-v1.md): use Electron and TypeScript for V1.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md): use portable files with optional external version control.
- [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md): keep Knowledge Repositories independent of Workbench releases.
- [ADR 0007](../../adr/0007-keep-agent-provider-configuration-optional.md): keep Agent Provider configuration optional.
- [ADR 0008](../../adr/0008-resume-explicitly-selected-repositories.md): resume explicitly selected repositories.
- [ADR 0009](../../adr/0009-keep-governed-knowledge-editable-through-evolution.md): keep Governed Knowledge editable through governed evolution.
- [ADR 0010](../../adr/0010-use-machine-local-env-for-v1-provider-configuration.md): use a machine-local `.env` for V1 provider configuration.
- [ADR 0011](../../adr/0011-use-one-pinned-openai-model-for-v1.md): use one pinned OpenAI model for V1.
- [ADR 0012](../../adr/0012-require-explicit-confirmation-before-agent-transmission.md): require explicit confirmation before Agent transmission.
- [ADR 0013](../../adr/0013-do-not-retain-openai-payloads-by-default.md): do not retain OpenAI payloads by default.
- [ADR 0014](../../adr/0014-preserve-agent-provenance-on-explicit-save.md): preserve agent provenance on explicit save.

## TDD gate

The S1–S5 Test Seams in [Test strategy](test-strategy.md) were confirmed on August 26, 2026. Implementation may test at those seams and no others without a documented and confirmed amendment. Delivery proceeds one behavior at a time: write one failing test at an agreed seam, observe the failure, add the minimum implementation that passes it, and then choose the next slice using what the previous cycle taught.

The existing files under `prototype/knowledge-workbench/` remain throwaway comparison material. They are evidence for the accepted interaction direction, not a production foundation or an implementation constraint.
