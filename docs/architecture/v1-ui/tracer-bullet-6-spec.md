# Tracer Bullet 6: Reopen the capture

Status: implementation complete; user acceptance pending.

This brief coordinates Tracer Bullet 6 in the [delivery plan](delivery-plan.md#6-reopen-the-capture). It is an implementation entry point, not a second authority for product behavior, architecture, repository format, or testing.

## Scope

Using the checked-in Bayesian statistics Knowledge Repository fixture, a person can open the previously captured TB5 source claim in Paper Desk, move to that saved source location, and relaunch the Workbench. The Workbench resumes the exact selected repository, Paper Desk context, saved Structured Annotation, and machine-local reading position.

This slice joins the accepted TB5 Source Processing artifact to the S1 desktop workflow. It does not implement new capture controls, arbitrary PDF selection, production PDF rendering, PDF import or asset-mode selection, source availability or relinking, Synthesis, Proposal creation, Governance, authoring, Search, Ask, Jump, or cross-device synchronization.

## Documentation prerequisite

Before implementation, review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), [Test Strategy](test-strategy.md), applicable ADRs, and the completed TB1–TB5 delivery records. This brief is the resulting guidance-compliant implementation spec. Its behavior, seam, expected values, vertical path, boundaries, deferrals, and acceptance evidence must remain checked against those authorities before each implementation cycle.

## Authoritative decisions

The following documents own the behavior and must be updated at their owning boundary if this slice reveals a new requirement:

- [Product Decisions](product-decisions.md) owns Paper Desk behavior, autosaved reading position, source identity, and the distinction between Working Material and Governed Knowledge.
- [Architecture](architecture.md#workbench-session-module) owns Workbench Session state ownership, restorable convenience state, Source Processing provenance, and dependency direction.
- [Repository Format](repository-format.md) owns portable source annotations and the boundary between repository content and machine-local session state.
- [Test Strategy](test-strategy.md#s1--desktop-workflow-seam) owns the S1 packaged desktop observation point and the rule that tests observe rendered behavior rather than storage side channels.
- [ADR 0001](../../adr/0001-use-task-specific-workspaces.md) owns the Paper Desk workspace boundary.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md) owns portable local files and VCS-neutral behavior.
- [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md) owns the separation between repository content and machine-local state.
- [ADR 0008](../../adr/0008-resume-explicitly-selected-repositories.md) owns exact-root validation and safe resume behavior.

The existing [code map](code-map.md) remains the source for live and planned production locations.

## First Public Behavior

Given the fixture repository and its previously captured TB5 annotation, the S1 desktop workflow has this observable path:

1. Open the fixture Knowledge Repository from Atlas.
2. Follow the existing contextual path into Paper Desk for the `Bayesian statistics fixture source` Source Record.
3. Paper Desk presents the saved source claim and allows the person to move to its known location.
4. The person relaunches the Workbench.
5. The Workbench opens the exact remembered repository directly in Paper Desk and presents the same saved annotation at the same reading position.

The independently known expected values are:

- Source Record: `bayesian-statistics-fixture-source` / `Bayesian statistics fixture source`.
- Annotation: `annotation-bayesian-statistics-fixture-source-page-2-0-54`.
- Source Locator: page `2`, character range `0..54` (end exclusive), logical locator `page:2#chars=0-54`.
- Captured text: `Bayesian inference updates prior belief with evidence.`
- Attribution and classification: `source-claim`.
- Material state: `working-material`.
- Restored workspace: `paper-desk`.
- Restored reading position: page `2`, character offset `0`, at the saved annotation's start.

The expected values must be written literally in the S1 behavior test. The test must observe visible Paper Desk content, accessible actions, relaunch state, and the caller-visible outcome; it must not read repository files or machine-local session files as a side channel.

## Test Seam and fixtures

Use S1, the packaged desktop workflow, through the real Electron main process, preload bridge, Workbench Session, Paper Desk UI Adapter, file-backed Knowledge Repository Adapter, file-backed Working Material Adapter, and machine-local session-state Adapter. Use the existing synthetic fixture repository with one checked-in TB5 annotation as the independently known saved artifact.

The reading position is machine-local restorable convenience state keyed to the exact Source Record identity. It is not added to the portable Knowledge Repository. A missing, malformed, or unavailable reading position must not substitute another source or invent a current position; the Workbench may fall back to the saved repository context while reporting that no position was restored.

## Minimum vertical path

1. Extend the Workbench Session public state and persistence boundary to retain the active Paper Desk source context and reading position while preserving TB1–TB5 first-launch and exact-root resume behavior.
2. Read the saved TB5 annotation through the Working Material/Knowledge Repository public Adapter boundary and expose it to Paper Desk without changing the Source Record or Governed Knowledge.
3. Add the smallest fixture-backed Paper Desk presentation and accessible action needed to move to and display the known saved location.
4. Persist the position through the machine-local session-state Adapter and restore it on a real packaged Workbench relaunch.

Run one Red-to-Green cycle per behavior, stopping at Green before refactoring or selecting the next cycle.

## Boundaries and deferrals

- The Workbench may persist only machine-local convenience state for the exact selected repository and exact Source Record reading position; no machine-local path or position enters portable repository content.
- Reopen preserves the Source Record, Source Locator, attribution, classification, and Working Material state. It does not promote or mutate Governed Knowledge.
- No Git, Git LFS, GitHub, credentials, network request, Agent Provider, Proposal, or Synthesis operation is involved.
- The fixture Adapter remains deterministic. A production PDF engine is not selected by this slice.
- No new Test Seam or hard-to-reverse architectural decision is introduced. If one becomes necessary, stop and obtain the required confirmation before implementation.

## Acceptance gate

Tracer Bullet 6 is complete only when:

- the packaged S1 workflow opens the fixture Source Record, presents the saved TB5 annotation, moves to the known source location, relaunches, and visibly restores Paper Desk at the same location;
- the restored annotation retains the exact Source Record, Source Locator, text, attribution, classification, and Working Material state;
- the exact selected repository is resumed or safely rejected according to the accepted TB3 behavior, with no repository discovery or substitution;
- the relevant S1 and Adapter contract suites are green, `npm run check` passes, and the code map names every new production Module and Adapter location;
- no portable repository files are used as a side channel for machine-local reading position; and
- the user reviews the running behavior and accepts the restoration result.

The implementation completion record belongs in the [delivery plan](delivery-plan.md). Later arbitrary reading, source import, PDF rendering, relinking, Synthesis, and broader Working Set behaviors remain separate tracer bullets.
