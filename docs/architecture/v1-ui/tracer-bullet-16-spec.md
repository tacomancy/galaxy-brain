# Tracer Bullet 16: Complete the desktop quality contract

Status: implementation complete on August 31, 2026; automated evidence is green and final human acceptance is pending. The user authorized all incremental slices below and will perform one final human acceptance review after the complete TB16 scope is implemented.

This brief coordinates the TB16 implementation described in the [delivery plan](delivery-plan.md#16-complete-the-desktop-quality-contract). It is an implementation entry point, not a second authority for Product Decisions, Architecture, the Repository Format, testing, or accepted ADR decisions.

## Scope

TB16 hardens the existing packaged Workbench so that the accepted local workflows are operable, understandable, and recoverable for people using a keyboard, assistive technology, reduced-motion preferences, larger text, and a selected theme. It does not add a new primary workspace or a new product capability. It makes quality properties part of the existing S1 desktop Interface and protects them with observable workflow assertions.

The work is deliberately split into eight incremental S1 slices. Each slice extends the preceding packaged workflow and keeps the same application Modules, typed preload bridge, isolated repository, and silent native-window harness. Automated evidence is gathered after every slice; human acceptance is deferred until all eight slices are complete, as explicitly requested by the user.

| Slice | Behavior | Primary evidence |
| --- | --- | --- |
| TB16.1 | Complete one critical Workbench workflow using only keyboard actions | Packaged workflow reaches Studio authoring, edits the highlight fixture, inspects source, returns to rich view, and reopens the draft without pointer input |
| TB16.2 | Make focus visible and task-oriented | Packaged focus sweep and final manual observation show a visible focus indicator on every actionable control and a sensible task order |
| TB16.3 | Expose semantic landmarks, names, states, and outcomes | Packaged assertions observe named navigation, headings, labeled regions, button names, pressed/current state, and status/alert outcomes |
| TB16.4 | Respect reduced-motion preferences | Packaged or browser-level preference test observes no required motion, delayed state, or animation-dependent meaning under `prefers-reduced-motion: reduce` |
| TB16.5 | Remain usable with scalable text | Packaged workflow at 200% text/zoom retains readable content and reachable critical controls without hidden or overlapping actions |
| TB16.6 | Persist an explicit light/dark theme choice | A selected theme is consistent across Atlas, Studio, Paper Desk, and Proposal Review and survives relaunch through machine-local session state |
| TB16.7 | Provide immediate undo for one Working Material edit | An authoring edit can be undone through an accessible action, restoring the prior semantic and source values without touching Governed Knowledge |
| TB16.8 | Recover an older saved result through visible version history | A prior result can be restored as a new current version, all versions remain available, and no Model Adapter request occurs |

The first five slices are accessibility and interaction quality for existing workflows. The last three protect the Product Decisions for theme, working edits, and recoverable result history through the same public desktop seam. No slice may weaken the existing local-only, provenance, Governance, or explicit-confirmation rules.

## Documentation prerequisite

Before writing behavior tests or implementation code, explicitly complete these to-do items:

1. Review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md) for any machine-local appearance state, [Test Strategy](test-strategy.md), applicable ADRs, and the completed TB1–TB15 delivery records. Pay particular attention to the shared-interaction accessibility requirement, the Workbench Session ownership of UI-state autosave, rich/source equivalence, explicit Governance, result history, and local-only operation.
2. Create or update this guidance-compliant `tracer-bullet-16-spec.md` with the Public Behavior, confirmed S1 Test Seam, independently known expected values, External System Seams, minimum vertical path, boundaries, discarded alternatives, deferrals, acceptance evidence, and required confirmation recorded below.
3. Check that accessibility behavior remains owned by the rendered desktop Workbench Interface and the Modules that own the underlying behavior. Do not add a shallow cross-cutting accessibility Module that duplicates focus, authoring, result-history, or session rules.
4. Check that theme preference is machine-local session state and never repository content; that undo remains Working Material behavior; and that version recovery continues to use the existing Source Processing and file-backed result-history Interfaces.
5. Check that automated accessibility tooling is supporting evidence only. Workflow tests must still observe keyboard actions, focus, visible content, semantic names/states, preservation, and explicit outcomes through the packaged application.
6. Confirm each incremental slice and its deferrals before implementation begins. The user authorized all slices in this brief on August 31, 2026 and explicitly deferred final human acceptance until the complete TB16 implementation is ready.

If a slice reveals a new persistent representation, a new accessibility Test Seam, an editor or router dependency, a new repository field, or a hard-to-reverse interaction decision, pause and update this brief and the governing documentation before continuing.

## Governing authorities

- [Product Decisions](product-decisions.md#shared-interactions) owns complete keyboard operation, discoverable shortcuts, semantic structure, visible focus, reduced motion, scalable text, sufficient contrast, no color-only meaning, user-selected consistent themes, immediate undo, and durable artifact history.
- [Architecture](architecture.md#workbench-session-module) owns Workbench Session UI-state autosave, contextual navigation, and the separation between desktop UI Adapters and framework-independent application Modules.
- [Test Strategy](test-strategy.md#s1--desktop-workflow-seam) owns the packaged S1 seam, visible outcomes, accessibility expectations, silent native-window mode, and the requirement to use real Modules with locally substitutable Adapters.
- [Repository Format](repository-format.md#portable-content) owns portable repository content. TB16 must not place theme settings, focus state, or transient undo data into repository files unless a separately approved format decision is made.
- [ADR 0003](../../adr/0003-keep-rich-and-source-editing-equivalent.md) continues to govern the rich/source authoring round trip used by the undo slice.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md) keeps the Workbench local-first and VCS-neutral.
- [ADR 0009](../../adr/0009-keep-governed-knowledge-editable-through-evolution.md) keeps Working Material edits and result recovery separate from direct Governed Knowledge mutation.

## Public Behavior

Given the checked-in synthetic Knowledge Repository and its existing packaged Workbench workflows:

1. A person can open the repository and complete the bounded TB11 authoring workflow using keyboard actions only. The workflow reaches Atlas, enters Studio, opens the transient Working Material draft, edits `prior belief` to `posterior belief`, inspects the literal source, returns to rich view, closes, and reopens the draft in the same session. Pointer clicks are not required after the test fixture repository is established.
2. Every actionable control used by the workflow has a visible focus indication when focused with the keyboard. Focus order follows the task order and does not move into an unavailable workspace or hidden region. Focus is not conveyed by color alone.
3. The desktop exposes semantic landmarks and accessible names: the primary views are named `Atlas`, `Studio`, and `Paper Desk`; the workspace navigation is a labeled `Workspaces` navigation; the current page/workspace is exposed through an accessible current state; headings label the visible regions; controls expose their action names; and success/failure outcomes use status or alert semantics appropriate to their urgency.
4. With `prefers-reduced-motion: reduce`, the same actions complete without requiring animation, transition timing, auto-scrolling, or motion-based interpretation. Status changes remain immediate and understandable.
5. At 200% browser text/zoom scaling, the current workflow remains readable and operable. Primary navigation, headings, authoring actions, source mode, undo, and result-history actions remain reachable without overlapping, disappearing, or requiring horizontal scrolling of the whole application. Long source text may retain its own intentional code/text scrolling region.
6. A person can choose `light` or `dark` theme through an accessible in-app control. The selected theme is visibly consistent across Atlas, Studio, Paper Desk, and Proposal Review, remains selected after relaunch, and is stored only in machine-local Workbench session state. A fresh repository or another repository does not receive theme fields.
7. After one supported Working Material semantic edit, an accessible Undo action restores the exact prior semantic value and complete source projection. Undo does not edit the governed topic, create a Proposal, create a Judgment, invoke Synthesis, or require a provider.
8. The saved Synthesis result fixture presents the newest result as current and the earlier result through ordinary version history. Restoring version `1` creates a new current version derived from it, preserves versions `1` and `2`, reports the restored version, and makes no Model Adapter request.
9. All existing workflows retain their current local-only and authority behavior. Accessibility controls and theme state cannot bypass explicit Proposal acceptance, explicit Synthesis confirmation, source provenance, or repository safety checks.

The S1 Interface is the rendered desktop Workbench observed through accessible actions, visible content, focus, navigation state, persisted session state, and caller-visible outcomes. Tests must not inspect React state, private reducers, CSS class names as a proxy for focus, editor-engine nodes, or repository files as a substitute for the person-visible behavior.

## Literal expected values

The slices reuse independently established fixture values rather than inventing new subject matter:

- Fixture repository: `tests/fixtures/knowledge-repository`.
- Topic: `bayesian-statistics`, titled `Bayesian statistics`.
- Source Record: `bayesian-statistics-fixture-source`, titled `Bayesian statistics fixture source`.
- Working Material state: `Working Material` / `working-material`.
- Authoring draft: `draft-tb11-bayesian-statistics-highlight`.
- Initial semantic value: `prior belief`.
- Edited semantic value: `posterior belief`.
- Initial source construct: `==prior belief==`.
- Edited source construct: `==posterior belief==`.
- Source Locator: `page:2#chars=0-54`.
- Saved result: `synthesis-result-bayesian-statistics-fixture`, titled `Bayesian statistics synthesis`.
- Current saved result version: `2`.
- Prior saved result version: `1`, titled `Bayesian statistics synthesis — first draft`.
- Restored result outcome: `restored` with a new current version `3` in the result-history fixture.
- Theme values: `light` and `dark`.

The existing TB11 complete source literals, the TB7 result fixture, and their provenance remain the expected content. TB16 must not derive expected source, result text, or labels from the rendered output it is testing. Any new user-facing copy introduced for appearance, undo, or history must be recorded in this brief before implementation.

## Confirmed Test Seam

Use the existing S1 packaged Electron/WebdriverIO workflow seam. The workflow runs the real packaged Electron application, main process, typed preload bridge, Workbench Session, renderer Adapters, and existing application Modules against an isolated repository or deterministic fixture. The harness continues to pass `--galaxy-brain-test-mode=silent`, so automated tests create the real `BrowserWindow` with `show: false` and do not interrupt the user's desktop. Human acceptance uses the explicit visible review mode only after all automated slices are green.

The S1 workflow may use the existing native-dialog mock to establish the fixture repository. That setup action is not the keyboard-only behavior under test. Once the repository is open, critical actions use WebdriverIO keyboard commands and accessible controls. Focus assertions use the visible active control and its accessible name/state; they do not inspect React implementation state. Reduced-motion and scaling tests use the browser's observable media/viewport controls or a separately justified harness Adapter, not production-only test flags that bypass the renderer.

Supporting S2/S3/S5 tests remain appropriate for dense rules: the Knowledge Authoring Module protects semantic undo, Source Processing protects result restoration, and the session-state/file-backed Adapter protects machine-local theme round trips. These lower seams supplement but do not replace the packaged S1 proof that a person can find and complete the workflow.

## Proposed application seam

TB16 should deepen existing Modules rather than add a global accessibility orchestration layer:

- The Workbench renderer remains the public S1 Interface and owns presentation projections, focus placement, semantic landmarks, theme classes/tokens, reduced-motion styles, and scalable layout.
- Workbench Session and its existing machine-local session-state Adapter own the selected theme preference and its validated persistence. The smallest additional Interface should read and set `light`/`dark`; it must not expose arbitrary CSS or repository paths.
- Knowledge Authoring owns the transient edit history needed for one-step Working Material undo and returns the same semantic and source projections already used by TB11.
- Source Processing and the existing saved-result repository own version-history recovery. The UI only invokes the public restore operation and presents its returned outcome.
- Existing typed preload operations remain operation-specific and sender-validated. Do not expose a generic DOM, browser, CSS, or storage channel to the renderer.

No new production technology is selected by TB16. Use native HTML controls and the existing CSS/React/Electron stack. If implementing scalable text or theme persistence requires a state representation beyond the existing machine-local session file, stop and record that representation and its privacy/compatibility implications before writing it.

## Minimum vertical path

1. Complete this documentation prerequisite and retain the user's authorization for all eight slices; do not treat it as final human acceptance.
2. Add one focused packaged workflow for TB16.1 and observe the Red failure for keyboard-only completion. Implement only the focus/order and keyboard actions required for the existing authoring workflow.
3. Add TB16.2 focus assertions and the minimum visible focus styling. Verify keyboard focus remains visible across all critical controls.
4. Add TB16.3 semantic landmark/name/state assertions and correct the smallest renderer markup needed to expose the user-visible structure.
5. Add TB16.4 reduced-motion coverage, then TB16.5 200% scaling coverage. Preserve the normal visible application path and ensure the silent harness is only a window-visibility setting.
6. Add the machine-local theme Interface and TB16.6 persistence workflow. Verify a relaunch restores the theme and repository content remains unchanged.
7. Add TB16.7 one-edit undo through the Knowledge Authoring Interface. Verify exact rich/source restoration and no governed mutation.
8. Add TB16.8 visible result-history recovery through the existing Source Processing Interface. Verify new current version creation, preserved prior versions, and no Model Adapter request.
9. After each Red/Green cycle, run the focused workflow and applicable lower-seam tests. Before final human review, run `npm run check`, `npm run test:coverage`, `npm run lint:complexity`, changed-lines coverage, documentation validation, and the complete packaged workflow. Record all Red/Green evidence and final manual review in the TB16 delivery record.

## External System Seams

- **Workbench Session:** owns active workspace, contextual navigation, and machine-local appearance preference. It must not persist transient focus or undo stacks as portable repository state.
- **Renderer:** presents semantic, accessible UI and visual state. It is an Adapter over application Modules, not an authority for authoring meaning, result lineage, Governance, or source provenance.
- **Knowledge Authoring Module:** owns semantic edit and undo behavior for the transient Working Material draft; it does not write Governed Knowledge.
- **Source Processing Module and result repository:** own result versions and restore policy; the renderer cannot synthesize a restored result or silently overwrite history.
- **Session-state Adapter:** persists only validated machine-local theme/session values through the existing local file seam. It must preserve unknown supported state and never write repository content.
- **Electron/preload:** provides the real packaged S1 composition and typed operation transport. No arbitrary IPC, filesystem, or browser automation channel is introduced.
- **Agent Provider:** not required for TB16. Result restoration must not call it.
- **Git, GitHub, credentials, and network:** outside the local desktop workflow and must not affect any slice.

## Boundaries and explicit deferrals

TB16 does not implement:

- mobile, tablet, or alternate platform layouts;
- a full WCAG certification, screen-reader certification matrix, or automated accessibility score as a substitute for workflow evidence;
- arbitrary keyboard shortcut discovery, command palettes, remappable shortcuts, or global hotkey management beyond ordinary keyboard operation and any already documented controls;
- a new editor engine, PDF engine, router, state-management library, or design system;
- arbitrary Markdown parsing, authoring constructs, multi-user collaboration, or durable draft persistence;
- undo across unrelated Workbench sessions, a general multi-level undo stack, redo, branching draft history, or conflict resolution;
- automatic theme detection, OS theme synchronization, high-contrast theme authoring, custom themes, or per-workspace themes;
- storing theme, focus, zoom, or transient undo state in repository Markdown or other portable Repository Format content;
- automatic result cleanup, version deletion, history pruning, branching result lineage, or recovery of results not represented by the existing result repository;
- new Search, Ask, Jump, Atlas, Paper Desk, Proposal, Governance, Synthesis, source-relink, or Agent Provider capabilities;
- changing explicit confirmation requirements, source identity rules, Proposal authority, or local-only behavior.

The final TB16 acceptance does not imply that every WCAG criterion, assistive technology, platform, browser zoom mode, or future workspace feature is certified. It accepts the bounded quality contract and evidence listed here only.

## Alternatives considered and discarded

- **Create a global accessibility Module:** discarded because semantic structure and interaction rules belong with the existing rendered Workbench Interface and the Module that owns each behavior; a cross-cutting Module would be shallow and duplicate state ownership.
- **Use an accessibility audit score as the acceptance contract:** discarded because a score cannot prove that a person can complete the keyboard workflow, understand visible outcomes, or recover a result. Automated tooling remains supporting evidence.
- **Test keyboard behavior by invoking click handlers or React state:** discarded because it would bypass the S1 Interface and fail to prove keyboard operability or focus behavior in the packaged application.
- **Persist theme and undo state in the repository:** discarded because these are machine-local preferences or transient session mechanics, not portable knowledge content.
- **Add a third-party editor or accessibility framework before behavior requires it:** discarded because the existing native controls and renderer seam can prove the bounded quality contract; technology selection remains replaceable.
- **Implement all quality concerns as one large end-to-end test:** discarded because failures would be ambiguous and the test would become shallow, slow, and coupled. Each slice has one observable behavior while the final workflow proves composition.
- **Require human acceptance after every slice:** deferred because the user explicitly requested one final human review after the complete TB16 implementation; automated Red/Green evidence remains required per slice.
- **Implement broad undo/history/theme features beyond the bounded fixtures:** discarded because they would combine new product policy, persistence, and format decisions with the quality contract.

## Acceptance evidence

Automated implementation evidence is complete only when the eight focused slice workflows and applicable lower-seam tests pass, the complete `npm run check` and packaged workflow pass, changed-lines coverage meets the active threshold, complexity lint passes, and documentation validation passes.

Final human acceptance must observe, in the visible review-mode packaged application:

1. Keyboard-only completion of the selected authoring workflow.
2. Visible focus on the controls used, with task-oriented focus order.
3. Clear semantic landmarks, names, current/pressed states, and status/error outcomes.
4. The same workflow under reduced-motion preference without required animation.
5. The same workflow at 200% text/zoom scaling with critical controls still readable and reachable.
6. Light/dark theme selection, consistency across workspaces, and persistence after relaunch without repository mutation.
7. One Working Material edit followed by Undo, restoring exact meaning and source without governed mutation.
8. Result-history restoration of version `1` as a new current version while retaining versions `1` and `2` and making no provider request.

The final review must also confirm that no deferred behavior was silently implemented, no machine-local state leaked into repository content, and existing explicit authority/confirmation boundaries remain intact. Only after all eight checks pass should the delivery plan record TB16 as human-accepted.

## Implementation record

The eight approved slices are implemented on `codex/tb16-desktop-quality-contract`:

- TB16.1–TB16.3: the packaged workflow completes the critical authoring path with keyboard actions, visible focus styling, named landmarks, and observable pressed/current/status semantics.
- TB16.4–TB16.5: reduced-motion CSS disables required animation/transition timing, and the packaged workflow verifies the critical Studio surface at 200% document zoom.
- TB16.6: the Workbench Session persists explicit `light`/`dark` theme selection through machine-local session state; the renderer applies the selected tokens consistently.
- TB16.7: Knowledge Authoring provides one-step semantic undo and restores the exact prior rich/source projection without changing Governed Knowledge.
- TB16.8: the packaged result-history workflow restores version `1` as version `3`; the existing Source Processing path preserves prior versions and does not invoke a provider.

Automated evidence recorded before human review: `npm run check` passed with 20 test files and 89 tests; coverage passed at 82.40% statements and 73.85% branches; complexity lint passed; changed-lines coverage passed against `origin/main`; and the focused packaged Electron workflow passed in silent mode with 3 tests. The complete packaged Electron workflow passed in silent mode with 25 specs and 30 workflow cases.

## Required confirmation

The user authorized implementation plans for all eight TB16 slices on August 31, 2026 and requested a single final human acceptance review after the entire TB16 implementation is complete. This authorization covers the bounded behaviors, fixtures, S1 seam, incremental sequencing, and explicit deferrals written above; it does not authorize silently expanding the scope or treating automated evidence as human acceptance.

Any new behavior, persistence representation, technology choice, or Test Seam discovered during implementation must be added here with its rationale and deferred alternatives before implementation continues.
