# Issue 52: Recoverable desktop bootstrap and bridge failures

Status: implementation complete on September 1, 2026; automated evidence is green. The prerequisite TB12, TB13, and TB14 changes are merged into `main` through PRs 130, 126, and 128. This brief coordinates the Issue #52 implementation without changing the accepted V1 architecture or creating a new tracer-bullet Test Seam.

## Public behavior

When the packaged Workbench cannot complete renderer bootstrap or an unexpected desktop bridge operation rejects, the person sees a safe, keyboard-operable recovery surface instead of a blank or stale-looking application.

- A rejected `openFreshWorkbench` renders a `Galaxy Brain couldn't start` alert with `data-workbench-outcome="startup-failed"` and a `Retry loading Workbench` button. Retry reruns the complete bootstrap once per activation; there is no automatic retry.
- An initial Synthesis-results read failure does not prevent Workbench rendering. It preserves any prior visible result list, reports that saved results are unavailable, and offers retry guidance without claiming an empty successful list.
- An unexpected repository, context, workspace transition, source navigation, or Synthesis-result operation rejection renders a safe `bridge-operation-failed` alert. It does not expose exception text, stack traces, prompts, source contents, credentials, or absolute paths.
- Failed operations preserve the last known Workbench state and retain stable inputs for a user-invoked retry. Typed domain outcomes continue to render as their existing outcomes.
- A failure while creating the native window is handled in the main process with a native Retry/Quit choice and a safe message. The raw cause remains main-process diagnostic data only.

## Confirmed Test Seam and expected values

Use the existing S1 packaged Electron/WebdriverIO seam: the real packaged macOS application, Electron main process, typed preload bridge, renderer, Workbench Session, and existing fixture/file-backed Adapters. The test harness uses a narrow one-shot failure injection at the main-process bridge boundary, controlled only by a test argument; normal launches have no injection.

Independently known expectations:

- Startup heading: `Galaxy Brain couldn't start`.
- Startup marker: `data-workbench-outcome="startup-failed"`.
- Startup retry accessible name: `Retry loading Workbench`.
- Operation marker: `data-workbench-outcome="bridge-operation-failed"`.
- Operation retry accessible name: `Retry operation`.
- Safe operation guidance contains `couldn't complete that action` and never the injected exception text.
- A successful retry returns to the existing `Atlas` or requested workspace and clears the corresponding recovery marker.

## Minimum vertical path

1. Add focused S1 workflows for bootstrap recovery, optional saved-results recovery, repository-open recovery, workspace-transition recovery, and nested Discovery-transition recovery; observe the missing behavior as Red.
2. Add the renderer bootstrap boundary and safe optional results projection.
3. Add a renderer operation wrapper with stable retry descriptors and a single visible recovery notice, then cover representative repository and workspace operations.
4. Add the main-process one-shot test injection, safe structured diagnostics, and native `createWindow` Retry/Quit handling.
5. Extend the same wrapper to the remaining bridge operations whose unexpected rejection must be recoverable, then run the full packaged suite and repository checks.

## External System Seams

- Electron IPC and the preload bridge remain narrow, typed, sender-validated operation seams.
- The main process owns structured diagnostics containing only operation, phase, category, and timestamp; it never forwards raw failures to the renderer.
- The existing S1 fixture repository and native dialog mock establish stable repository/context inputs.
- No new renderer mock, preload capability, telemetry channel, or persistent failure cache is introduced.

## Boundaries and deferrals

This change does not alter domain outcomes, add automatic retries, persist transient failure state, expose a generic IPC operation, redesign workspace navigation, or make provider-dependent behavior available. Native startup recovery is manually observed because a blocking native dialog is unsuitable for the silent S1 harness.

## Acceptance evidence

The implementation is ready for review. Focused Issue #52 workflows pass for all five injected failure modes; existing S1/S5 tests remain green; `npm run check`, `npm run lint:complexity`, the packaged workflow, and documentation checks pass. Recovery text contains no sensitive values, and the branch contains no changes beyond Issue #52 recovery and its documentation.
