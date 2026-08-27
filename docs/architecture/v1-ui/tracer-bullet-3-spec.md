# Tracer Bullet 3: Resume meaningful work

Status: accepted on August 27, 2026.

This brief records the completed tracer bullet from the [delivery plan](delivery-plan.md#3-resume-meaningful-work). It is an implementation entry point, not a second authority for product behavior, architecture, repository format, or testing.

## Scope

After a person explicitly creates or opens a Knowledge Repository, the Knowledge Workbench stores the exact selected root in machine-local session state. On a later launch, Workbench Session validates that exact root and resumes it without scanning for sibling repositories or substituting another path. A first launch with no remembered selection opens Atlas without a repository. An unavailable or invalid remembered root presents explicit Open/Create recovery choices and does not silently select a replacement.

The first cycle establishes only the repository-selection persistence needed to resume a known session. It does not add repository discovery, migration, Git integration, substantive knowledge workflows, or speculative workspace persistence before a concrete context behavior requires it.

## Authoritative decisions

The following documents own the behavior and must be updated at their owning boundary if this slice reveals a new requirement:

- [Product Decisions](product-decisions.md) owns the launch experience, local-only behavior, and non-goals.
- [Architecture](architecture.md#workbench-session-module) owns Workbench Session, machine-local session state, selection, and resume outcomes.
- [ADR 0008](../../adr/0008-resume-explicitly-selected-repositories.md) owns the exact-root and no-discovery decision.
- [Test Strategy](test-strategy.md#s1--desktop-workflow-seam) owns the S1 observation point, fixtures, and acceptance coverage.
- [Delivery Plan](delivery-plan.md#3-resume-meaningful-work) owns implementation order and delivery sequencing.

The existing [code map](code-map.md) remains the source for live and planned production locations.

## First behavior cycle

### Public behavior

After an explicit repository selection, closing and relaunching the Workbench reopens the same validated repository and displays its selected state. The remembered root is stored outside the portable Knowledge Repository. A failed validation returns a recovery state that leaves the repository unselected and offers Open/Create actions.

### Test Seam

Use S1, the packaged desktop workflow, with the real Electron main process, preload bridge, Workbench Session, Atlas UI Adapter, and production file-backed Knowledge Repository Adapter. Use isolated machine-local session-state paths supplied by the workflow harness so tests do not read or mutate a developer's real application state.

### Independently known fixture and expected values

- Create or open the checked-in synthetic fixture through an explicitly selected temporary path.
- Relaunch with the same exact path and expect the repository to be selected with the known path visible.
- Relaunch after the remembered path is unavailable or invalid and expect no repository selection, no sibling scan, and visible Open/Create recovery actions.
- Start with no remembered path and expect the authentic Atlas empty state.

### Implementation boundary

1. Add the narrow machine-local session-state Adapter needed to read and write the last explicitly selected repository root.
2. Have Workbench Session persist only after `created`, `opened`, or `read-only-compatible` succeeds.
3. Validate the remembered root through the existing Knowledge Repository Adapter before exposing it as selected.
4. Keep cancellation and failed replacement state-preserving, and keep the renderer dependent only on caller-facing Workbench outcomes.

If the machine-local session-state write fails after repository creation or opening succeeds, Workbench Session returns `operation-failed` and preserves the prior in-memory selection. The repository operation may already have created or opened files; the caller surfaces the save failure so the person can retry or choose another repository rather than treating the new root as durably remembered.

Do not persist active workspace, Working Set, reading position, or contextual navigation until the next behavior cycle gives one of those values an independently observable meaning.

## Acceptance gate

Tracer Bullet 3 is accepted. The focused S1 workflow demonstrates successful exact-root resume, first-launch behavior, and unavailable/invalid remembered-root recovery; the relevant contract and full verification suites are green; and the user reviewed the running behavior. The completion record is recorded in the [delivery plan](delivery-plan.md#tracer-bullet-3-completion-record--august-27-2026).
