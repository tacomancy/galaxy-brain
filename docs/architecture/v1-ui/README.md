# V1 Knowledge Workbench architecture package

Status: architectural direction and S1–S5 Test Seams accepted.

This package translates the accepted V1 UI direction into an Electron and strict-TypeScript desktop architecture with a test-driven delivery strategy. The foundation is selected; editor, PDF, index, model, updater, routing, state-management, and native-database choices remain deferred until a behavior slice makes them necessary. Repository files are VCS-neutral; Git and Git LFS are optional external tools managed by the user.

This package follows the project-wide [documentation authority map](../../README.md#documentation-authority): Product Decisions own behavior, Architecture owns structure, Repository Format owns portable files, Test Strategy owns verification, Delivery Plan owns sequencing, Current Capabilities owns public status, Changelog/release notes own published-version behavior, Tutorials own supported task instructions, ADRs own hard-to-reverse trade-offs, and agent guidance owns execution rules.

> **Public reading boundary:** Start with [Current capabilities](../../../docs-site/current-capabilities.md) to distinguish the latest published release, the reviewed `main` snapshot, and planned work. This architecture package describes intended V1 structure and accepted design direction; it is not a claim that every described Module or workflow is currently available in the desktop Workbench.

## Public reading path

- [Product decisions](product-decisions.md) records the accepted experience, scope, and deferrals.
- [Architecture](architecture.md) defines modules, interfaces, state ownership, and system seams.
- [Repository Format](repository-format.md) defines the portable, versioned Knowledge Repository contract.
- [Test strategy](test-strategy.md) defines the confirmed public seams through which behavior is verified.

These pages are linked from the public site. Their ownership is narrower than
the Current Capabilities page: Product Decisions describe intended behavior,
Architecture describes structure, Repository Format describes portable files,
and Test Strategy describes verification boundaries.

## Internal implementation records

The following documents support project development but are not public product
navigation or release-status authorities:

- `starter-inventory.md` records the independent expected contents of the public V1 skeleton.
- `code-map.md` maps architectural responsibilities to live or explicitly planned source locations.
- `delivery-plan.md` orders vertical tracer bullets for red-to-green implementation.
- [V1 victory checklist](v1-victory-checklist.md) records the release gates and final scope decisions required to declare V1 complete.
- [V1 release-readiness specification](v1-release-readiness-spec.md) scopes the provider-free packaged-app and initial MC/DC evidence work.
- [Provider-free PDF source-status packaged-gate specification](provider-free-pdf-gate-spec.md) records the implemented and human-accepted packaged linked-PDF preservation slice and its explicit deferrals.
- [Provider-free privacy and non-retention packaged-gate specification](provider-free-privacy-gate-spec.md) prepares the remaining Section C privacy boundary work without claiming human acceptance.
- [V1 stable distribution and release operations specification](v1-release-operations-spec.md) defines the implementation and acceptance boundary for Section D, including the required public-versus-developer-only decision.
- `tracer-bullet-*-spec.md` and `issue-51-explicit-context-selection-spec.md` record scoped implementation briefs and delivery evidence.
- `stack-research.md` records primary-source evidence for the desktop foundation.
- `complexity-policy.md` records the production complexity limits and verification evidence.
- `CONTEXT.md`, the engineering glossary, and the agent implementation guide define project language and execution procedure.

These records may preserve historical evidence or implementation detail. They
must not be read as a mutable substitute for [Current capabilities](../../../docs-site/current-capabilities.md)
or the published [release notes](../../../app/CHANGELOG.md).

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

Before implementation begins for every tracer bullet, review the governing documentation and applicable ADRs, create or update a guidance-compliant tracer-bullet spec, and confirm its Public Behavior, Test Seam, independently known expected values, minimum vertical path, boundaries, and acceptance evidence. This documentation prerequisite must be complete before writing implementation code or behavior tests.

The existing files under `prototype/knowledge-workbench/` remain throwaway comparison material. They are evidence for the accepted interaction direction, not a production foundation or an implementation constraint.
