# V1 UI intuitiveness polish — specification

Status: implementation complete on this branch; verification complete.

## Implementation record

- Discovery is now an on-demand, focus-managed in-Workbench dialog launched by the persistent `Discovery` trigger. Search, Ask, and Jump continue to use the existing renderer bridge and module outcomes.
- Atlas, Studio, and Paper Desk now share an additive functional side navigation that delegates to the existing context-preserving workspace transition.
- The existing Light/Dark theme control remains the only appearance choice and continues to be consumed by every workspace surface. Atlas, Studio, Paper Desk, and Proposal Review now use the same shared page, panel, text, border, and semantic accent tokens in each theme.
- The existing workspace composition remains the visual baseline. The responsive shell adds the approved navigation column at wide sizes and collapses it into a horizontal navigation strip at narrow sizes; existing content measures expand within readable bounds.
- Atlas, Studio, Paper Desk, and the inherited Proposal Review route now consume one shared Light/Dark palette for page, panel, text, border, and semantic accent tokens; workspace-specific reading colors have been removed.
- Dark-mode secondary workspace navigation uses a lower-brightness shared navigation token for readability, and the PDF page uses a medium-light shared viewer token with light text rather than a white or near-black surface.
- Studio now presents the Knowledge Authoring editor as the primary left-hand surface with topic, evidence, Synthesis, and saved-result cards in a right-hand supporting sidebar. Paper Desk presents the source/PDF preview as the primary left-hand surface with source status and context cards in the same sidebar pattern; both sidebars stack below their primary surface on narrow windows.
- Confirmed action copy is applied: `Switch Knowledge Repository`, `Create a new Knowledge Repository`, and `Open topic in Studio`. Missing-context guidance is associated with disabled Studio and Paper Desk destinations.
- No prototype-only mock data or unsupported interactive placeholders were added. The selected prototype fragments remain additive references for navigation framing, content density, and responsive containers.

## Verification record

- `npm run check` passes: formatting, lint, typecheck, 183 unit/contract tests, MC/DC checks, documentation tests, and documentation validation for 39 files.
- The packaged Electron workflow matrix passes: 37 workflow specs passed and 1 conditionally skipped; the TB16 desktop-quality contract is green.
- All five injected Issue 52 recovery variants pass, including Discovery transition recovery with the modal dismissed before retry.
- The focused V1 UI workflow passes Discovery open/close/reset and focus restoration, functional side-navigation transitions, confirmed action copy, and 1024px-to-1600px responsive expansion without whole-app horizontal overflow.
- Static placeholder inventory: none added. Prototype-only controls and mock data remain deferred.
- Human walkthrough remains required before release declaration, as specified by the V1 victory process.

This brief defines a bounded, minor UI change for the Knowledge Workbench before the V1 victory declaration. It improves self-directed orientation and action discoverability on the existing Atlas, Studio, Paper Desk, and Proposal Review surfaces. It does not add a capability, change a workflow contract, or alter the meaning or authority of repository content.

## Intent

The Workbench should make the next safe action apparent to a person who returns to the app after a break or arrives at a state without prior context. The person should be able to answer, without interpreting implementation terms:

1. Where am I in the Workbench?
2. What repository and working context am I looking at?
3. What can I do next?
4. Why is an action unavailable, and how can I make it available?
5. What happened after an action, and what state is preserved?

The change is minor only while it remains presentation-level. A proposal that changes persistence, authority, automatic behavior, workspace responsibilities, or the accepted V1 workflow is outside this brief and must be treated as a new product decision.

## Branch to-do list

1. **Preserve the existing visual baseline.** Keep the current UI, shared theme treatment, typography, spacing language, and layout as much as possible so the Workbench remains visually consistent. Use [`prototype/knowledge-workbench/index.html`](../../../prototype/knowledge-workbench/index.html) primarily as a reference for additive elements and information framing, not as a replacement design system.
2. Focus the branch on adding the new interface elements that improve navigation and orientation, such as a side navigation structure, while preserving existing workspace content and behavior wherever possible.
3. Keep newly introduced elements static or presentational unless their behavior is explicitly confirmed and can map to an already wired Workbench action. Static placeholder content may demonstrate intended hierarchy and density, but it must not create repository content, change Working Material, invoke Search/Ask/Jump, send a provider request, apply a Proposal, or claim that an unsupported capability is available.
4. Preserve existing logic by mapping each newly functional control to an already wired Workbench action. A prototype control with no corresponding public behavior should be rendered as non-interactive presentation—or be omitted—rather than shipped as a misleading button.
5. Treat the prototype’s variant switcher, mock data, toast messages, command-palette affordance, quick-capture affordance, notification affordance, and other `data-toast` interactions as prototype instructions/data, not as product requirements.
6. Record which prototype variant or visual fragments were selected before implementation, then verify the selected fragments at ordinary, narrow, enlarged-text, and full-screen window sizes.

## Documentation prerequisite

Before implementation, review and keep this brief consistent with:

1. [Product Decisions](product-decisions.md), especially Atlas, shared interactions, accessibility, and the V1 scope boundary.
2. [Architecture](architecture.md), especially Workbench Session, UI adapter state ownership, and the non-negotiable invariants.
3. [Test Strategy](test-strategy.md), especially the S1 packaged Workbench seam and the requirement to assert public behavior.
4. [Tracer Bullet 16](tracer-bullet-16-spec.md), which establishes the accepted desktop quality and accessibility contract.
5. [ADR 0004](../../adr/0004-use-electron-for-the-desktop-workbench.md), [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md), [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md), and [ADR 0009](../../adr/0009-keep-governed-knowledge-editable-through-evolution.md).

The exact copy and visual treatment remain a human product choice. The candidate wording below is intended to make that choice concrete; it is not an authority until confirmed.

## Governing authorities

- [Product Decisions](product-decisions.md) owns the meaning of Atlas, Studio, Paper Desk, Proposal Review, explicit actions, local-only behavior, and the accessibility requirement.
- [Architecture](architecture.md) owns the rule that the renderer is a UI adapter, that durable domain state belongs to application modules, and that workspace transitions preserve relevant context without merging responsibilities.
- [Repository Format](repository-format.md) owns portable repository content. This brief must not add machine-local paths, UI preferences, or presentation text to repository artifacts.
- [Test Strategy](test-strategy.md) owns the public S1 packaged workflow seam and literal expected values for end-to-end evidence.
- [Tracer Bullet 16](tracer-bullet-16-spec.md) owns the accepted keyboard, focus, semantics, reduced-motion, scalable-text, contrast, theme, undo, and history quality bar.

## Scope

The proposed change has six presentation-only slices, with theme consolidation first:

1. **Consolidate appearance choices.** Expose exactly two user-selectable themes—`Light` and `Dark`—and apply the selected theme consistently across Atlas, Studio, and Paper Desk. Proposal Review inherits the same selection because it is a route rather than an independent workspace. No workspace-specific theme variants remain in scope.
2. **Make Discovery on-demand.** Replace the permanent Discovery section at the top of the shell with a persistent global trigger that opens an in-Workbench modal dialog. Search, Ask, and Jump remain the same explicit operations behind the existing Discovery interfaces.
3. **Use expanded screen real estate.** Make the existing Workbench shell and workspace content respond to the available window width and height, using more of a full-screen window without sacrificing readable text, reachable controls, or the existing information hierarchy.
4. **Orient the person.** Make the current workspace, repository state, and relevant context visibly consistent across existing surfaces.
5. **Clarify the next action.** Use concise verb-object labels and a predictable primary/secondary action hierarchy without changing which operations are available.
6. **Explain state and recovery.** Make success, unavailable, canceled, and failed outcomes state what happened, what remains unchanged, and the next valid action using the existing outcome vocabulary.

The slices may be implemented together or as small commits on this branch. Each slice must remain independently reviewable and must not require a new application Module Interface or a new UI Test Seam.

## Public behavior

### Orientation

Given any existing Workbench state:

1. The active workspace is identifiable as exactly one of `Atlas`, `Studio`, or `Paper Desk`. Proposal Review remains a dedicated route, not a fourth primary workspace.
2. The workspace switcher retains semantic navigation behavior and exposes the active destination through the existing accessible state. Visual styling may become clearer, but route names and responsibilities do not change.
3. When a Knowledge Repository is selected, the current view identifies that repository context and distinguishes `Local` from `Read only` where the current state already supports those statuses.
4. When an item, topic, Source Record, or proposal is the current context, its existing title or identity remains visible near the action that uses it. The UI must not imply a broader context than the selected item actually provides.
5. A fresh or empty state explains the immediate purpose of the current surface and presents the next valid action without requiring the person to infer it from a decorative card or icon.

### Functional side navigation

1. The Workbench adds a side navigation surface with functional entries for exactly `Atlas`, `Studio`, and `Paper Desk`.
2. Activating an entry uses the existing Workbench workspace-transition behavior, preserves relevant context, and exposes the same active/current state as the existing workspace switcher.
3. The side navigation does not create new routes, a second session, a second repository context, or a separate navigation state machine. It is an additional renderer-owned adapter over the existing transition capability.
4. A destination that is unavailable without required context remains disabled or otherwise unavailable according to the existing contract; the side navigation must not fabricate context or perform an implicit no-op.
5. When Studio is unavailable because no topic is selected, associated guidance says `Select a topic to enable Studio`. When Paper Desk is unavailable because no Source Record is selected, associated guidance says `Open a Source Record to enable Paper Desk`.
6. Static prototype-only navigation items remain non-interactive and clearly labeled as placeholders, or are omitted from the production surface.

### Shared themes

1. The theme control offers exactly two choices: `Light` and `Dark`. There are no additional light, dark, workspace, contrast, or accent theme variants in this change.
2. The selected theme applies consistently to Atlas, Studio, Paper Desk, and the existing Proposal Review route. A workspace may retain semantic labels or non-luminance distinctions, but it must not introduce a separate theme choice or change the selected luminance mode.
3. Theme selection remains a user-owned, machine-local Workbench preference. It is not written to Knowledge Repository content, Working Material, audit records, proposals, or other portable artifacts.
4. The selected theme remains available before repository selection, applies after workspace transitions, and persists across relaunch through the existing Workbench Session behavior.
5. Both themes retain the accepted TB16 requirements for sufficient contrast, visible focus, semantic state, scalable text, reduced motion, and no color-only meaning.

### Modal Discovery

1. The permanent Discovery section is removed from the top-level shell layout. A persistent, keyboard-reachable trigger remains available from Atlas, Studio, Paper Desk, and Proposal Review; the candidate accessible name is `Open Discovery`.
2. Activating the trigger opens a modal dialog within the Workbench window. “Modal” means an in-app dialog, not a second Electron window, external browser window, or separate repository context.
3. The dialog is identified as `Discovery`, exposes the existing `Search`, `Ask`, and `Jump` modes, and keeps the selected mode visible before execution. The existing distinction—Search retrieves, Ask synthesizes, Jump navigates—remains apparent inside the dialog.
4. On open, focus moves into the dialog to its heading, close control, or first usable mode/input control according to the final accessible implementation. While open, keyboard focus cannot escape to the obscured Workbench content. On close, focus returns to the trigger that opened the dialog.
5. Escape and an explicit close control close the dialog without executing an operation. Closing before an Ask request is confirmed is equivalent to canceling that pending Ask; no provider request occurs and no local state changes. The exact visible cancellation wording continues to use the existing `canceled` outcome where it is presented.
6. Search and Jump continue to be usable without an Agent Provider. Opening or closing the dialog does not create repository content, change Working Material, alter the selected repository, or change workspace context.
7. A successful Search result may use its existing `Open` action to close the dialog and navigate to the selected result. A successful Jump may close the dialog as part of the existing context-preserving transition. Ask preview and confirmation remain in the dialog until the existing explicit confirmation or cancellation outcome is complete.
8. Provider-unavailable, unsupported, no-match, not-found, declined, canceled, and other existing Discovery outcomes remain distinguishable and are rendered with the existing semantic status/alert treatment. A modal presentation must not turn an unavailable result into a blank dialog or an apparently successful answer.
9. At enlarged text, reduced motion, light theme, and dark theme, the dialog remains readable, operable, and dismissible. It must not rely on backdrop color, animation, or focus movement alone to communicate its state.
10. Closing Discovery clears the transient query, selected mode, mode-specific outcomes, and unconfirmed Ask preview. Reopening starts in `Search` mode with an empty input. This dismissal does not alter persisted repository content or saved results.

### Dynamic layout

1. The Workbench responds to the current window dimensions rather than preserving a narrow fixed-width composition when the person expands the app to use the whole screen.
2. At wide dimensions, existing workspace content may use additional horizontal space for existing cards, inspectors, lists, and controls. It must not stretch ordinary prose or code-like content beyond a readable measure merely to fill the viewport.
3. At short or narrow dimensions, the same content reflows or scrolls within its intentional region. Critical headings, primary actions, status outcomes, and modal controls remain visible and reachable; the whole application does not require horizontal scrolling.
4. Resizing the window does not change the selected repository, active workspace, Working Material, Proposal state, Discovery mode/outcome, or theme. It is a presentation response, not a domain operation.
5. The dynamic layout applies consistently across Atlas, Studio, Paper Desk, and Proposal Review. Workspace-specific content may retain its existing hierarchy and semantic distinctions, but no workspace may require a separate layout preference or theme.
6. The Discovery modal uses the available viewport responsibly: it has usable insets at ordinary sizes, can display larger result or confirmation content on a wide screen, and keeps long content in an intentional internal scroll region instead of expanding beyond the window.
7. At 200% text/zoom scaling, reduced motion, and both shared themes, the responsive layout retains the accepted TB16 behavior. No meaning depends on a breakpoint, animation, hover state, or color-only distinction.

### Static prototype alignment

1. The implementation may introduce additive structural elements inspired by the selected prototype composition, including navigation framing, editor/reading surfaces, inspectors, card groupings, metadata rows, placeholder result lists, and responsive containers, while retaining the existing UI as the visual baseline.
2. Static elements must use the Workbench’s actual terminology and must not present mock counts, fake outcomes, or unsupported actions as current repository state. If illustrative content is necessary, it is visibly identified as placeholder content or uses an existing deterministic fixture.
3. Existing functional controls retain their public accessible names, state semantics, and outcome behavior unless a separately confirmed copy decision changes only their presentation wording.
4. New static visual elements are excluded from the keyboard workflow and accessibility tree when they carry no user action. New functional controls are included only when their exact behavior and existing Workbench action mapping are confirmed and tested.

### Action clarity

1. Actions use a consistent verb-object form where an object is necessary to distinguish their effects, such as opening a Knowledge Repository, opening a topic in Studio, or opening a Source Record in Paper Desk.
2. The primary action is visually and semantically distinct from secondary or escape actions, while remaining fully keyboard reachable and usable without color.
3. A disabled workspace destination remains disabled when its required context is absent. The interface also communicates the missing prerequisite in visible or programmatically associated supporting text; it does not imply that clicking will create context or perform a no-op transition.
4. Existing explicit-confirmation actions remain explicit. A clearer label or placement must never turn an action that requires confirmation into an automatic request, save, Proposal, or governed change.
5. “Save,” “accept,” “apply,” “open,” “create,” “switch,” and “retry” retain their existing meanings. Copy changes must not collapse these distinct operations into a generic “Continue” action.

### State and recovery clarity

1. A successful action identifies the completed operation and the resulting state. For example, opening or creating a Knowledge Repository continues to distinguish opened, created, read-only-compatible, and other existing outcomes.
2. A canceled action communicates that no replacement or mutation occurred when that is the existing contract. The current repository, Working Material, proposal, and review state remain unchanged.
3. An unavailable or failed action states the affected capability in plain language, preserves the current state where the module contract requires preservation, and offers only a valid recovery action such as retry, open another Knowledge Repository, or create one.
4. Provider-unavailable and source-unavailable conditions remain distinguishable from local application failure. The UI may explain them more clearly but may not suggest that a missing Agent Provider prevents local Workbench use.
5. Existing trust-sensitive language remains explicit: saved Working Material is not Governed Knowledge, a Proposal is not applied until the user confirms it, and an unavailable or changed source is not presented as current.

## Candidate copy and presentation rules

The following is a reviewable candidate map, not yet a final copy contract.

| Current or related wording | Candidate treatment | Reason |
| --- | --- | --- |
| `Atlas`, `Studio`, `Paper Desk` | Keep exact workspace names | These are domain terms and stable navigation targets. |
| `Open another Knowledge Repository` | `Switch Knowledge Repository` | Makes clear that the active repository is being replaced. |
| `Create another Knowledge Repository` | `Create a new Knowledge Repository` | Clarifies that creation is a new local repository rather than a mutation of the current one. |
| `Open in Studio` | `Open topic in Studio` when the target is a topic | Makes the destination and object explicit without changing the route. |
| `Open Source Record in Paper Desk` | Keep exact wording | Already identifies both the operation and the target workspace. |
| Multiple workspace-specific theme variants | Replace with one `Light` choice and one `Dark` choice shared by all Workbench surfaces | Removes a needless appearance decision while preserving user-selected theme behavior. |
| Permanent Discovery section at the top of the shell | Replace with a persistent `Open Discovery` trigger and an in-Workbench modal dialog | Keeps Search/Ask/Jump available without consuming permanent vertical space. |
| Narrow fixed-width composition on a wide window | Let existing workspace regions expand or reflow within the available viewport while retaining readable measures | Uses full-screen space without introducing a new information hierarchy or stretching text uncomfortably. |
| Disabled `Studio` or `Paper Desk` destination | Keep destination name and add associated prerequisite text | The destination remains discoverable while the reason for unavailability becomes understandable. |
| `Start here` empty states | Keep as a heading where useful, followed by a direct explanation and one primary next action | Orientation should not depend on a heading alone. |
| Existing success, error, unavailable, and read-only status vocabulary | Keep semantic outcome terms; improve surrounding explanation only | Tests and trust boundaries depend on distinguishing outcomes. |

Implementation must not change all labels mechanically. A label may be changed only when the candidate wording is more precise for that specific target and does not make the action longer or more ambiguous.

## Confirmed test seam

Use the existing S1 packaged Workbench workflow seam. Extend the established desktop-quality workflow only where a new assertion proves a user-visible contract; otherwise add a focused workflow beside it. Do not create a React-only test seam for behavior already observable through the packaged app.

The S1 evidence should inspect:

- accessible workspace names and active navigation state;
- visible repository status and current-context identity;
- accessible names and enabled/disabled state of primary and secondary actions;
- associated prerequisite or recovery guidance for unavailable actions;
- the resulting heading/status text after open, create, cancel, retry, or transition outcomes; and
- preservation of the current state after canceled or failed replacement actions.

Tests must not assert CSS class names, DOM nesting, exact pixel dimensions, or private React state. They should assert semantic roles, accessible names, visible status, and public outcomes. Existing TB16 checks remain the evidence for keyboard operation, focus, reduced motion, scalable text, theme behavior, and non-color-only meaning.

## Literal expected values

The following values are stable expectations for the first workflow slice:

- Workbench primary workspace names: `Atlas`, `Studio`, `Paper Desk`.
- Functional side navigation entries: `Atlas`, `Studio`, `Paper Desk`; no additional product destinations are introduced by this slice.
- Disabled-destination guidance: `Select a topic to enable Studio`; `Open a Source Record to enable Paper Desk`.
- Repository status vocabulary: `Local`, `Read only`.
- Empty-state action names: `Open a Knowledge Repository`, `Create a Knowledge Repository`.
- Topic navigation action: `Open topic in Studio` when the target is a specific topic.
- Theme choices: `Light`, `Dark` only; the persisted public values remain `light` and `dark`.
- Discovery trigger and modes: accessible trigger name `Open Discovery`, visible label candidate `Discovery`, and modes `Search`, `Ask`, `Jump`.
- Responsive layout expectation: wide, full-screen windows use additional available space; narrow windows retain readable, reachable, non-clipped content.
- Prototype reference: `prototype/knowledge-workbench/index.html`; selected variant/fragments must be recorded before implementation.
- Selected prototype composition: Variant A editor-first Studio, Variant B dashboard-first Atlas, Variant C source-first Paper Desk; shared typography, spacing, color tokens, panels, and responsive treatment.
- Placeholder treatment: unwired prototype content is clearly labeled, non-interactive, excluded from the keyboard path, and never presented as live repository state.
- Wide-layout rule: preserve existing content relationships; allow existing regions to grow within the viewport, with no new side-by-side content relationships beyond the approved side navigation.
- Existing accepted fixture, if a context-bearing workflow is required: `bayesian-statistics`.
- Proposal state remains expressed through existing domain terms: `Working Material`, `Proposal`, `Governed Knowledge`, and `Judgment`.
- Agentic capability state remains provider-independent when unavailable; no provider request is expected for the orientation or action-label workflow.

The selected replacements from the candidate copy table and the exact prerequisite guidance are recorded above. The remaining visual details may be chosen during implementation only when they preserve the confirmed baseline, behavior, and accessibility boundaries.

## Minimum vertical path

1. Add a focused S1 Red workflow proving that the theme control exposes only `Light` and `Dark`, applies the choice across Atlas, Studio, and Paper Desk, and does not mutate repository content.
2. Implement the smallest theme-surface changes needed to make that workflow pass, preserving the existing Workbench Session theme persistence and TB16 quality contract.
3. Add a focused S1 Red workflow proving that the permanent Discovery section is absent, the global trigger opens a modal dialog, focus is contained and restored, Escape/close is safe, and Search/Jump/Ask retain their public outcomes.
4. Implement the smallest shell and Discovery presentation changes needed to make that workflow pass. Do not alter Discovery module outcomes, preload capabilities, persistence, or repository content.
5. Add a focused S1 Red workflow proving the functional side navigation exposes Atlas, Studio, and Paper Desk, marks the current destination, and performs context-preserving transitions through the existing behavior.
6. Implement the smallest side-navigation presentation changes needed to make that workflow pass. Do not add a new route, session state, preload capability, or transition policy.
7. Select the prototype variant/fragments to match and identify each new element as functional, static placeholder, or deferred.
8. Add a focused S1 Red workflow at representative narrow and wide window dimensions proving that existing content expands/reflows without whole-app horizontal overflow, clipping, or loss of critical controls, and that resizing preserves the visible domain state.
9. Implement the smallest responsive shell/layout and static prototype-alignment changes needed to make that workflow pass. Do not add a new layout state, repository preference, or domain capability.
10. Confirm the exact copy choices and whether disabled destinations use supporting text, an explanation affordance, or another accessible treatment.
11. Add a focused S1 Red workflow for the selected orientation and action-label behavior. Use the packaged app and existing deterministic repository fixture.
12. Implement the smallest presentation changes needed to make the workflow pass. Do not alter module outcomes, preload capabilities, persistence, or repository content.
13. Add the recovery/status assertion for one canceled or failed replacement path, then verify that the current state remains unchanged.
14. Re-run the focused S1 workflows, the full `npm run check`, the documentation check, and the existing desktop-quality workflow.
15. Perform the human walkthrough at the packaged-app level using keyboard navigation, visible focus, both themes, narrow and full-screen sizes, scalable text, and the exact confirmed labels.
16. Record the final copy, responsive decisions, selected prototype fragments, static-placeholder inventory, evidence, and any deferred polish in this brief before declaring the branch PR-ready.

## External system and ownership boundaries

- **Workbench Session module:** continues to own active workspace, selected repository, context restoration, and transition outcomes. UI changes may explain these outcomes but may not recreate or reinterpret them.
- **Atlas, Studio, Paper Desk, and Proposal Review adapters:** own presentation and unprivileged interaction state only. They do not gain durable domain state or new authority.
- **Theme preference:** remains Workbench Session machine-local state. The renderer consumes the one selected `light` or `dark` value; individual workspace adapters do not own theme variants.
- **Discovery module:** continues to own Search, Ask, and Jump semantics, scope, provider boundary, outcomes, and context-preserving navigation. The modal is only a presentation adapter over those operations.
- **Responsive shell/layout:** remains renderer-owned presentation. It may use CSS layout and viewport queries, but it does not create persisted layout preferences or duplicate domain state.
- **Side navigation:** remains a renderer-owned adapter over Workbench Session transitions. It does not own active workspace, context restoration, or route history.
- **Preload bridge and main process:** unchanged unless an existing public capability is insufficient to render already-owned state. A new capability requires a separate design review.
- **Repository Format and Working Material:** unchanged. UI labels, transient status, and presentation preferences must not be persisted as repository content.
- **Governance and Proposal flow:** unchanged. No label may make save equivalent to accept or review equivalent to apply.
- **Agent Provider and external sources:** unchanged. Intuitiveness work must not introduce requests, background work, source refresh, or automatic recovery.
- **S1 packaged workflow seam:** remains the primary integration evidence; no new seam is justified by presentation-only changes.

## Explicit deferrals

This brief does not implement:

- a new workspace, dashboard, command palette, onboarding tour, or demo mode;
- a global navigation redesign or user-configurable Atlas layout;
- new shortcuts, gesture systems, notifications, or background reminders;
- changes to repository selection, session persistence, Working Set semantics, or route history;
- new Agentic Capabilities, provider configuration, automatic requests, or remembered confirmation;
- new source viewers, automatic relinking, automatic Synthesis, or automatic Proposal application;
- a design-system migration, broad visual rebrand, icon replacement, or accessibility certification beyond the existing TB16 contract;
- per-workspace themes, more than one Light or Dark variant, workspace-specific luminance modes, or a theme editor;
- a separate Discovery application window, a second repository context, or a second Search/Ask/Jump implementation;
- changing Search, Ask, or Jump semantics, adding implicit mode inference, or allowing modal dismissal to bypass Ask confirmation;
- user-configurable layouts, saved breakpoints, detachable panes, a new information hierarchy, or a second full-screen application mode;
- importing prototype-only mock data, variant switching, toast simulations, or static controls as functional product behavior;
- adding analytics, telemetry, remote synchronization, or network-dependent UI behavior; or
- changes to the V1 victory checklist or release declaration before this branch is reviewed and accepted.

## Acceptance evidence

The branch is ready for implementation review when:

1. The exact copy choices and disabled-action treatment are confirmed in this brief.
2. The focused S1 workflow proves that exactly one Light and one Dark theme are shared across Atlas, Studio, Paper Desk, and Proposal Review, including persistence after relaunch.
3. The focused S1 workflow proves that Discovery is opened on demand in an accessible modal, focus is contained/restored, dismissal is safe, and Search/Ask/Jump public outcomes remain intact.
4. The focused S1 workflow proves that representative narrow and wide window sizes use available space appropriately without whole-app horizontal overflow, clipping, or state mutation.
5. The focused S1 workflow proves the functional side navigation exposes exactly Atlas, Studio, and Paper Desk, marks the current workspace, preserves context, and does not add routes or session state.
6. The selected prototype fragments are recorded, and static placeholders are non-interactive, accurately labeled, and absent from the functional keyboard path.
7. The focused S1 workflow proves the remaining changed public behavior in the packaged app.
8. `npm run check` passes, including type checking, tests, linting, and documentation validation as configured by the repository.
9. The existing desktop-quality workflow remains green.
10. A human walkthrough confirms both themes remain readable, Discovery is easy to open and dismiss, the layout benefits from full-screen size, side navigation is understandable and context-preserving, prototype placeholders do not mislead, and the next action is apparent in the fresh, selected, unavailable, canceled, and failed states covered by scope.
11. No diff changes repository format, domain authority, provider confirmation, source provenance, or the accepted TB16 accessibility boundary.

## Open product decisions

The following decisions are intentionally left visible for confirmation rather than being inferred by the implementation:

1. **Confirmed:** collapse theme choices to exactly `Light` and `Dark`, shared across Atlas, Studio, and Paper Desk; Proposal Review inherits the same selection.
2. **Confirmed:** replace the permanent top-of-shell Discovery section with an in-Workbench modal dialog launched by a persistent global trigger; preserve Search, Ask, and Jump semantics and existing trust boundaries.
3. **Confirmed:** make the Workbench layout respond to available window width and height so full-screen use benefits from additional real estate, while preserving readable measures, reachable controls, and the existing hierarchy.
4. **Confirmed:** retain the existing UI, theme, and layout as the visual baseline; use the selected prototype variants only as additive references for new navigation/orientation elements.
5. **Confirmed:** use a deliberate prototype combination: Variant A editor-first Studio, Variant B dashboard-first Atlas, and Variant C source-first Paper Desk, without replacing the existing workspace compositions wholesale.
6. **Confirmed:** unwired additive elements are clearly labeled static placeholders, remain non-interactive, and are excluded from the keyboard path; only explicitly approved elements may map to existing Workbench actions.
7. **Confirmed:** add functional side navigation for Atlas, Studio, and Paper Desk using existing context-preserving workspace transitions; do not add routes or a second navigation state machine.
8. **Confirmed:** use `Open Discovery` as the Discovery trigger’s accessible name and `Discovery` as its visible label.
9. **Confirmed:** closing Discovery clears transient query/mode/results and any unconfirmed Ask preview; reopening starts in `Search` mode with an empty input, without changing persisted content or saved results.
10. **Confirmed:** preserve existing content relationships at wide sizes; let existing columns, cards, and inspectors grow within the viewport while keeping readable measures. The approved side navigation is the only new structural column.
11. **Confirmed:** use `Switch Knowledge Repository` for replacing the active repository.
12. **Confirmed:** use `Create a new Knowledge Repository` for repository creation.
13. **Confirmed:** use `Open topic in Studio` wherever the target is a specific topic.
14. **Confirmed:** keep Studio and Paper Desk disabled without required context and provide associated guidance: `Select a topic to enable Studio` and `Open a Source Record to enable Paper Desk`.
15. **Confirmed:** include all remaining slices in this branch: theme consolidation, modal Discovery, responsive layout, functional side navigation, static prototype alignment, orientation, action clarity, and recovery messaging. Do not add a new authoring capability or other domain logic.
