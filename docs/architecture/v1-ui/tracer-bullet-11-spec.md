# Tracer Bullet 11: Preserve one rich/source editing meaning

Status: implementation, automated acceptance, and human acceptance complete on August 28, 2026 for the bounded six-construct scope; pending merge into `main`.

This brief coordinates the approved TB11 implementation slices in the [delivery plan](delivery-plan.md#11-preserve-meaning-across-editing-views). It is an implementation entry point, not a second authority for product behavior, architecture, Repository Format, testing, or accepted ADR decisions.

## Scope

TB11 proves one semantic round trip in Studio for six bounded construct examples: `==highlight==`, `[[link]]`, `![[embed]]`, an evidence callout, inline `$equation$`, and `[@citation]`. A person opens a Working Material authoring draft, edits the current semantic object through the rich view, inspects the exact extended-Markdown source, returns to rich view, and can move to the next example without losing the current session state.

The first cycle uses the `==highlight==` draft and also proves close/reopen in the same Workbench session. The five follow-up cycles use independent deterministic drafts from the same `bayesian-statistics` fixture and prove that the same Module Interface preserves each construct's meaning and source literal. The selected Governed Knowledge file is never edited by any cycle.

The authoring session owns transient drafts for the duration of the Workbench process. Durable Working Material autosave, relaunch recovery, and a Repository Format representation for authoring drafts remain deferred. TB11 does not establish a general Markdown parser, a production editor-engine dependency, arbitrary selection, Proposal creation, Governance application, or a new primary workspace.

## Documentation prerequisite

Before writing behavior tests or implementation code, explicitly complete these to-do items:

1. Review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), [Test Strategy](test-strategy.md), applicable ADRs, and the completed TB1–TB10 delivery records.
2. Create or update this guidance-compliant `tracer-bullet-11-spec.md` with the Public Behavior, confirmed Test Seam, literal expected values, fixture and External System Seams, minimum vertical path, persistence boundary, boundaries, discarded alternatives, deferrals, acceptance evidence, and required confirmation recorded below.
3. Check that rich/source equivalence is owned by the Knowledge Authoring Module, that Studio is only a UI Adapter, and that no renderer-side string replacement becomes a second semantic authority.
4. Check that the source representation remains ordinary intelligible extended Markdown and that unknown constructs are not rewritten or discarded by this first slice.
5. Check that the draft source is test-only and transient, that opening a repository does not write a draft, and that the selected Governed Knowledge file remains unchanged until a later explicit authoring persistence decision.
6. Obtain explicit human confirmation of the exact fixtures, rich edits, source text, same-session reopen behavior, and listed deferrals before writing the Red workflow or implementation code. This confirmation was received on August 28, 2026; later cycles inherit the approved shared seam and boundaries.

This documentation review and confirmation task was complete before implementation began on August 28, 2026. If a later slice reveals a parser, persistent draft schema, editor-engine dependency, or new Test Seam, stop and update this brief before proceeding.

## Governing authorities

- [Product Decisions](product-decisions.md#studio) owns rich semantic editing, equivalent extended-Markdown source editing, Working Material authorship, and the rule that direct edits do not mutate Governed Knowledge.
- [Architecture](architecture.md#knowledge-authoring-module) owns the Knowledge Authoring Module, its rich/source representations, draft editing, metadata validation, and the inward dependency direction.
- [Test Strategy](test-strategy.md#s1--desktop-workflow-seam) owns the packaged desktop S1 seam, visible outcomes, accessibility expectations, and real Modules with locally substitutable Adapters.
- [Repository Format](repository-format.md#portable-content) owns portable Markdown and preservation of unrecognized files and extensions. This slice does not add a draft schema.
- [ADR 0003](../../adr/0003-keep-rich-and-source-editing-equivalent.md) requires the two editing representations to preserve the same supported meaning.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md) keeps local editing VCS-neutral; Git status does not determine authoring behavior.
- [ADR 0009](../../adr/0009-keep-governed-knowledge-editable-through-evolution.md) keeps direct editing separate from governed replacement and version evolution.

## Public Behavior

Given an isolated copy of the checked-in synthetic Knowledge Repository:

1. Open the repository through the existing Atlas flow and enter Studio for the `Bayesian statistics` context.
2. Studio opens one fixture Working Material authoring draft in rich mode. The current construct's value is presented as a semantic object, not as raw delimiter text.
3. Edit the current semantic value through the accessible authoring control.
4. Switch to source mode. The source view shows the exact updated Markdown construct in the complete draft text, including unchanged surrounding content.
5. Switch back to rich mode. The edited value is still presented as the same semantic object.
6. For the first highlight example, close the authoring surface, reopen the same draft during the same Workbench session, and observe the edited phrase in both rich and source views without loss or reinterpretation.
7. Select each of the five follow-up examples and repeat the rich edit/source inspection round trip.
8. The selected repository's governed topic file remains unchanged. Every draft remains Working Material and is not a Proposal or Governed Knowledge.

The user-visible source representation is the source text itself; the renderer must not reconstruct it from a second expected string or hide it behind editor-engine nodes. The user-visible rich representation is the semantic object and its edited text. Both are projections owned by the Knowledge Authoring Module.

## Approved follow-up construct fixtures

Each follow-up cycle uses one complete source literal and one independently known semantic edit. The fixture source remains transient and is selected only through the silent packaged test composition path.

| Construct | Initial semantic value | Edited semantic value | Initial source body | Edited source body |
| --- | --- | --- | --- | --- |
| `==highlight==` | `prior belief` | `posterior belief` | `Bayesian statistics updates a ==prior belief== with evidence.` | `Bayesian statistics updates a ==posterior belief== with evidence.` |
| `[[link]]` | `bayesian-inference` | `conditional-inference` | `Bayesian statistics compares [[bayesian-inference]] with evidence.` | `Bayesian statistics compares [[conditional-inference]] with evidence.` |
| `![[embed]]` | `bayesian-updates#overview` | `bayesian-updates#human-readable-anchor` | `Bayesian statistics includes ![[bayesian-updates#overview]].` | `Bayesian statistics includes ![[bayesian-updates#human-readable-anchor]].` |
| `> [!EVIDENCE]` | `Evidence updates confidence.` | `Evidence changes confidence.` | `> [!EVIDENCE] Evidence updates confidence.` | `> [!EVIDENCE] Evidence changes confidence.` |
| `$equation$` | `P(H|E)` | `P(E|H)` | `Bayesian updating uses $P(H|E)$ as its likelihood.` | `Bayesian updating uses $P(E|H)$ as its likelihood.` |
| `[@citation]` | `bayes-1763` | `laplace-1812` | `The prior is documented in [@bayes-1763].` | `The prior is documented in [@laplace-1812].` |

Every source body is wrapped by the exact frontmatter and heading shown in the first fixture. A construct selector is a testable authoring affordance for moving among these bounded examples; it is not a promise of a production fixture catalog or a user repository browser.

## Literal expected values

The independently known fixture uses the existing checked-in context:

- Target topic ID: `bayesian-statistics`.
- Target title: `Bayesian statistics`.
- Governed base version: `bayesian-statistics-v1`.
- Draft ID: `draft-tb11-bayesian-statistics-highlight`.
- Draft state: `working-material`.
- Initial highlighted text: `prior belief`.
- Edited highlighted text: `posterior belief`.
- Construct: `==highlight==`.

The complete initial draft source is:

```text
---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: working-material
base_version: bayesian-statistics-v1
---

# Bayesian statistics

Bayesian statistics updates a ==prior belief== with evidence.
```

After the rich edit, the complete source must be:

```text
---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: working-material
base_version: bayesian-statistics-v1
---

# Bayesian statistics

Bayesian statistics updates a ==posterior belief== with evidence.
```

The source view must expose `==posterior belief==` literally. It must not expose an HTML `<mark>` element, an editor-specific token, or a renderer-generated substitute. The governed repository file remains the checked-in text:

```text
This fixture topic gives the S1 workflow a stable item to carry between
workspaces.
```

## Confirmed Test Seam

Use the existing S1 packaged Electron/WebdriverIO workflow seam. The workflow opens an isolated temporary copy of the synthetic repository and interacts only with accessible Studio controls, visible rich/source content, and the visible Working Material state. The native Electron window remains hidden under `--galaxy-brain-test-mode=silent` while the real renderer, main process, preload bridge, Workbench Session, and Knowledge Authoring Module execute. Human acceptance uses the same packaged application with `--galaxy-brain-test-mode=review`, which composes the fixture while leaving the window visible; this is an explicit local review mode, not a normal launch or a supported demo mode.

The main-process composition root supplies one deterministic authoring-draft fixture only for these explicit packaged test/review paths. The fixture is composed over the selected repository context and cannot write the repository merely by being opened. The Knowledge Authoring Module owns the draft and the rich/source conversion. The renderer receives typed operation-specific data through preload; it never reads repository files, parses Markdown as a second authority, or receives an editor-engine object.

The workflow must assert the visible rich representation, the accessible edit action, the exact source representation, the returned rich meaning, same-session reopen behavior, Working Material labeling, and non-mutation of the governed topic. It must not inspect React state, DOM implementation details, parser nodes, or a private draft map as a substitute for the user-visible behavior.

## Proposed application seam

Add the smallest Knowledge Authoring capability needed by the approved TB11 cycles:

- a framework-independent authoring-session Interface that opens one draft, selects a bounded construct example, applies the supported semantic-text edit, returns the rich projection, returns the exact source projection, and reopens the session draft;
- a test-only transient authoring-draft source at the main-process composition boundary; and
- typed preload operations for opening the draft, applying the edit, switching representation, and reopening it.

The authoring Interface should expose domain-level semantic content and explicit outcomes, not HTML, DOM nodes, editor-engine transactions, or filesystem paths. It may use a small internal document model for the paragraph and six construct forms required by these cycles. The model must serialize to and parse from the literal source text through one Module-owned path.

The draft’s in-session state is authoritative for this slice. Studio may hold only transient mode and focus state. The current Governed Knowledge file, the Governance Module, and the Repository Format remain outside the edit operation. Durable Working Material autosave will require a separately specified Repository Format or repository-independent representation and is therefore not silently introduced here.

## Minimum vertical path

1. Complete the documentation prerequisite and obtain confirmation of the approved fixtures, edits, seam, and persistence boundary.
2. Add `app/tests/workflows/edit-rich-source-equivalence.e2e.ts` and observe the expected Red failure because Studio has no authoring draft or rich/source controls.
3. Add the narrow Knowledge Authoring Module and transient fixture source; cover the highlight semantic round trip with a focused Module test.
4. Expose typed main/preload operations with sender validation and preserve the existing Workbench Session context.
5. Add the Studio authoring surface with rich mode as the default, accessible semantic-object editing, exact source mode, construct selection, and explicit Working Material labeling.
6. Add same-session close/reopen behavior and assert that the governed topic remains unchanged.
7. Repeat the Red/Green cycle for link, embed, callout, equation, and citation using the approved fixture table and the same Module Interface.
8. Run the focused workflow, `npm run check`, `npm run test:coverage`, `npm run lint:complexity`, changed-lines coverage, and public documentation validation. Record Red/Green evidence and manual acceptance before closing TB11.

## External System Seams

- **Knowledge Repository Adapter:** production file-backed Adapter opens the isolated repository and supplies the existing selected topic context; it must not be used as an implicit write-through editor store in this slice.
- **Knowledge Authoring Module:** production policy owner for semantic edit, rich/source projections, session draft state, and caller-facing outcomes.
- **Fixture authoring-draft source:** test-only composition Adapter supplying the one literal draft without writing repository content.
- **Workbench Session:** existing Module owns repository selection and Studio context; authoring must not duplicate or replace that authority.
- **Governance Module:** not called. Direct editing remains Working Material and does not create a Proposal or Judgment.
- **Agent Provider:** not configured or called; the fixture is provider-free.
- **Git, remotes, credentials, and network:** outside the product boundary and must not affect local authoring.

## Boundaries and explicit deferrals

TB11 does not implement:

- durable Working Material autosave, relaunch recovery, or a new portable draft schema;
- arbitrary Markdown parsing, broad syntax support, or automatic preservation rules beyond the six explicitly listed constructs and their fixture forms;
- Mermaid, semantic HTML, macros, image links, directives, or other extended-Markdown constructs not listed in the fixture table;
- arbitrary selection, rich text ranges, multi-paragraph editing, keyboard shortcuts beyond ordinary accessible control operation, or editor-engine-specific behavior;
- metadata editing, title changes, backlinks, inspector projections, source capture, Synthesis, Proposal authoring, Judgment, or Governance application;
- concurrent draft editing, conflict recovery, external-edit detection for drafts, or undo/history beyond the browser’s immediate interaction state;
- Studio metrics, Atlas changes, Paper Desk changes, Agent Provider use, Git, or network behavior.

Future authoring work must repeat the documentation prerequisite and decide whether the six-construct round trip warrants a general document model, a persistent Working Material Adapter, or both. It must not infer durable schema, arbitrary syntax, or a production editor engine from these fixtures.

## Alternatives considered and discarded

- **Edit the Governed Knowledge file directly:** discarded because direct authoring must remain Working Material and a rich-editor action must not bypass governed evolution.
- **Render and edit raw `==...==` delimiter text in rich mode:** discarded because rich mode would not demonstrate semantic editing and would expose source representation as the rich representation.
- **Let React convert HTML or delimiter strings independently:** discarded because it would create a second meaning authority and make rich/source divergence likely; the Knowledge Authoring Module owns conversion.
- **Add a full Markdown editor/parser dependency now:** deferred because six fixture forms do not establish the required engine, full syntax coverage, security posture, or lifecycle cost. The seam keeps that choice replaceable.
- **Persist a new draft file on first rich edit:** deferred because Repository Format does not yet define a portable authoring-draft representation; persistence would combine a format decision with a semantic round-trip slice.
- **Use an editor-engine node or DOM snapshot as the test contract:** discarded because tests must survive editor-engine replacement and observe the user-visible meaning and exact source projection.

## Acceptance evidence

Automated acceptance requires the focused packaged workflow, full repository gates, changed-lines coverage, and public documentation validation to pass. Human acceptance must observe:

1. Studio opens the fixture as Working Material in rich mode, with `prior belief` visibly highlighted.
2. Editing that highlighted text to `posterior belief` changes the semantic object, not just visible delimiter text.
3. Source mode exposes the exact complete Markdown draft with `==posterior belief==`.
4. Returning to rich mode preserves the highlight and edited meaning.
5. Closing and reopening in the same session preserves both representations while the governed topic remains unchanged.
6. Each link, embed, callout, equation, and citation example presents its semantic value, accepts the listed edit, and exposes the exact edited source body.

Record the human confirmation, Red/Green evidence, changed files, and any newly discovered deferral in the TB11 section of the delivery plan before closing the tracer bullet.

## Required confirmation

The user confirmed all of the following decisions on August 28, 2026:

- the first supported construct is `==highlight==` with the exact Bayesian-statistics fixture above, followed by the five construct fixtures in the approved table;
- each rich edit changes the listed initial semantic value to its listed edited value through a semantic authoring control;
- source mode must show the complete literal extended-Markdown draft and rich mode must restore the same construct meaning;
- the Knowledge Authoring Module owns the round trip and the S1 workflow uses a transient test fixture without mutating the governed repository;
- close/reopen means same-Workbench-session recovery for the first slice; durable autosave, relaunch recovery, and draft persistence remain explicitly deferred; and
- additional Markdown constructs beyond the six, editor-engine selection, metadata, Proposal/Governance behavior, and concurrent editing remain deferred.
