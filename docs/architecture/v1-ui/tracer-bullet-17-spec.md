# Tracer Bullet 17: Author Working Material and navigate the Knowledge Repository

Status: implementation complete from the implementation-ready specification
drafted on September 1, 2026. Automated evidence is complete, with final human
acceptance still pending. The user requested that durable local note
authoring and repository-tree navigation be brought into V1. This brief is the
implementation entry point and records the bounded behavior, confirmed seams,
expected values, persistence contract, deferrals, alternatives, and acceptance
evidence required before the first Red test.

This brief coordinates the accepted Product Decisions, Architecture, Repository
Format, Test Strategy, and ADRs. It does not replace those authorities.

## Scope

TB17 closes the gap between the V1 promise to author Working Material and the
current TB11 fixture-only authoring behavior. It adds two independently
testable local behaviors:

1. A person can create and edit a durable Working Material note in Studio and
   recover it after closing the Workbench and relaunching it.
2. A person can navigate the explicitly selected Knowledge Repository through
   a left-hand repository tree that exposes supported user-facing content and
   opens each item through the existing Workbench routes.

The note remains Working Material. It is never silently promoted to Governed
Knowledge, Proposal, or Judgment. The repository tree is a safe navigation
projection, not a general-purpose filesystem browser.

## Documentation prerequisite

Before writing behavior tests or implementation code, explicitly complete these
to-do items:

1. Review the accepted [Product Decisions](product-decisions.md),
   [Architecture](architecture.md), [Repository Format](repository-format.md),
   [Test Strategy](test-strategy.md), applicable ADRs, and the completed TB1–TB16
   and Section E delivery records.
2. Check that this guidance-compliant `tracer-bullet-17-spec.md` records the
   Public Behaviors, confirmed Test Seams, independently known expected values,
   fixture and External System Seams, minimum vertical path, persistence
   boundary, accessibility expectations, discarded alternatives, deferrals,
   and acceptance evidence.
3. Check that durable note state remains owned by the Knowledge Authoring
   Module, repository containment and tree enumeration remain owned by the
   Knowledge Repository Adapter, and the left-hand tree is only a renderer UI
   Adapter over those Interfaces.
4. Check that the selected repository root remains the only filesystem scope,
   that the renderer receives repository-relative identities rather than
   absolute paths, and that tree navigation does not discover or switch roots.
5. Check that the note representation stays ordinary UTF-8 Markdown with
   frontmatter under the existing Repository Format v1; no new portable schema,
   JSON note store, Git dependency, or provider dependency is introduced.
6. Confirm the exact default note location, fixture literals, tree visibility
   rules, save/conflict outcomes, and listed deferrals before writing the Red
   behavior test. This brief recommends `scratch/` as the default because it is
   the existing low-friction home for provisional Working Material.

If implementation reveals a need for a new Repository Format field, a new
public Test Seam, a different default placement, or a hard-to-reverse editor
decision, stop and update this brief and any applicable ADR before continuing.

## Governing authorities

- [Product Decisions](product-decisions.md#v1-scope-boundary) owns the V1
  promise to author Working Material, local-first behavior, and the distinction
  between human edits and Governed Knowledge.
- [Product Decisions](product-decisions.md#studio) owns Studio as the primary
  authoring workspace and the rule that direct edits remain Working Material.
- [Architecture](architecture.md#knowledge-authoring-module) owns rich/source
  authoring, Working Material autosave, metadata validation, and the inward
  dependency direction.
- [Architecture](architecture.md#workbench-session-module) owns the selected
  repository, contextual navigation, and resumable Workbench state.
- [Repository Format](repository-format.md#portable-content) owns canonical
  roots, portable Markdown, preservation of unknown content, and safe writes.
- [Test Strategy](test-strategy.md#s1--desktop-workflow-seam) owns the S1
  packaged desktop seam; [Test Strategy](test-strategy.md#s5--adapter-contracts)
  owns file-backed and in-memory Adapter contracts.
- [ADR 0003](../../adr/0003-keep-rich-and-source-editing-equivalent.md) keeps
  rich and source editing semantically equivalent.
- [ADR 0005](../../adr/0005-use-portable-files-with-optional-external-version-control.md)
  keeps repository files portable and VCS-neutral.
- [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md)
  keeps the Knowledge Repository independent of Workbench releases.
- [ADR 0009](../../adr/0009-keep-governed-knowledge-editable-through-evolution.md)
  keeps direct Working Material edits separate from governed replacement.

## Public Behavior A: create and recover a Working Material note

Given an explicitly selected valid Knowledge Repository:

1. The person chooses **New Working Material** in Studio.
2. Studio opens a blank note with a visible Working Material label and an
   accessible title and content editor.
3. The new note is initially placed under `scratch/` using a safe generated
   filename derived from the title. The user does not choose an arbitrary
   filesystem path in this slice.
4. The person enters the title `Bayesian statistics working note` and the body
   `Prior belief needs evidence.`
5. The Workbench saves the note as a portable UTF-8 Markdown file and reports
   local-save status without claiming Git commit, remote backup, or
   synchronization.
6. The person closes the note, selects it again from the repository tree, and
   observes the same title and body in Studio.
7. After relaunch, the Workbench resumes the selected repository and the note
   remains available from the tree with the same content.
8. The note remains Working Material. No Governed Knowledge file, Proposal,
   Judgment, audit record, Agent Provider, Git process, or network request is
   created by authoring or navigation.

The deterministic packaged fixture uses this repository-relative target:

```text
scratch/tb17-bayesian-statistics-working-note.md
```

Its saved content is:

```text
---
title: Bayesian statistics working note
type: scratch
status: active
created: 2026-09-01
reviewed: 2026-09-01
tags: []
candidate_tags: []
aliases: []
---

# Bayesian statistics working note

Prior belief needs evidence.
```

The production clock may supply the current ISO date. The packaged test
composition supplies the deterministic date above through the existing system
Adapter seam; the date is not used as a second note identity.

The relative path is the initial navigation identity. The renderer must never
receive or display the absolute repository path as part of this behavior. The
file's frontmatter and Markdown remain readable without Galaxy Brain.

## Public Behavior B: navigate the repository tree

After the repository is selected, the left-hand **Knowledge Repository** menu:

1. Shows the selected repository's display name and the seven canonical roots:
   `assets`, `knowledge`, `projects`, `proposals`, `scratch`, `sources`, and
   `templates`.
2. Allows keyboard and pointer expansion/collapse of directories.
3. Shows regular user-facing files below those roots using repository-relative
   labels. It does not expose `.git`, machine-local state, transaction staging
   directories, credentials, caches, logs, or files outside the selected root.
4. Opens a supported Markdown topic or Working Material note in Studio.
5. Opens a supported Source Record or Structured Annotation through the existing
   Paper Desk route when that item has a known source context.
6. Opens a saved Synthesis result or Proposal through its existing contextual
   route when the item is supported by the existing Workbench behavior.
7. Presents an explicit read-only/unsupported outcome for a visible file that
   is inside the selected repository but has no supported Workbench route. It
   does not silently reinterpret or mutate that file.
8. Preserves the current repository and current view if enumeration or opening
   an item fails. A failed tree operation never substitutes another repository.

The fixture tree must expose, at minimum, these independently known entries:

```text
knowledge/README.md
knowledge/bayesian-statistics.md
projects/README.md
scratch/README.md
scratch/synthesis-results/synthesis-result-bayesian-statistics-fixture.json
scratch/tb17-bayesian-statistics-working-note.md
sources/annotations/annotation-bayesian-statistics-fixture-source-page-2-0-54.md
sources/papers/bayesian-statistics.md
templates/topic.md
```

Directory ordering is deterministic by repository-relative path. The UI may
choose visual indentation and disclosure controls, but it must not derive
meaning from filesystem ordering or expose raw directory-entry objects.

## Persistence and safety contract

TB17 uses the existing Repository Format v1. A newly authored note is an
ordinary Markdown file under `scratch/`, with the existing scratch-template
frontmatter and a human-readable heading. It is Working Material because it is
created and owned by the Knowledge Authoring workflow; `type: scratch` records
its portable note category and does not confer Governance authority.

The Knowledge Authoring Module owns the draft, semantic rich/source projections,
metadata validation, save scheduling, and caller-facing outcomes. The
file-backed Working Material Adapter owns root containment, regular-file and
symlink checks, target fingerprints, recoverable atomic replacement, and
external-edit detection. The existing repository-scoped Artifact Store may be
reused internally, but the renderer must not receive a generic filesystem API.

If the target changed after the draft was loaded, save returns an explicit
external-change/conflict outcome, preserves the external bytes, and leaves the
draft available for review or reload. It never overwrites an external edit.
If a write is interrupted, the existing recoverable atomic-write rules apply;
the Workbench must not report a successful save for a partial file.

Tree enumeration is read-only. It follows only the canonical selected root,
does not follow symbolic links, and returns sanitized repository-relative
entries. Hidden application-owned paths are filtered by the Adapter, not by a
renderer-side path check. External file changes are observed on the next
explicit tree refresh or repository reopen; live filesystem watching is not
required by this slice.

## Confirmed Test Seams

Use the existing confirmed seams:

- **S1 packaged desktop workflow:** the silent Electron/WebdriverIO workflow
  observes the accessible left-hand tree, Studio authoring controls, visible
  local-save status, navigation, relaunch recovery, conflict outcomes, and
  Working Material labeling. Human acceptance uses the same packaged app in
  visible `--galaxy-brain-test-mode=review`.
- **S5 Adapter contracts:** file-backed and in-memory repository/Working
  Material Adapters prove canonical-root containment, safe enumeration,
  Markdown round trips, target fingerprint checks, external-edit preservation,
  interruption recovery, hidden-entry filtering, deterministic ordering, and
  explicit unsupported-file outcomes.

Knowledge Authoring and Workbench Session remain application Modules observed
through S1. No new Test Seam is assumed. Tests must not inspect React state,
private Module fields, editor-engine nodes, raw filesystem enumeration, or
storage files as a substitute for a caller-visible outcome.

## External System Seams

- **Knowledge Repository Adapter:** production file-backed access to the
  selected root and safe repository-tree projection; in-memory Adapter for
  equivalent contract tests.
- **Working Material Adapter:** production file-backed note reads/writes and
  in-memory Adapter for authoring behavior tests where durable bytes are not
  the behavior under test.
- **Atomic filesystem Adapter:** existing recoverable write and fingerprint
  seam for note persistence.
- **Clock and identity Adapters:** deterministic test values for dates and
  generated filenames; production values remain outside the Module policy.
- **Workbench Session:** existing owner of the selected repository and
  machine-local active-item/session resume state.
- **Knowledge Authoring Module:** existing owner of Working Material draft
  semantics and rich/source equivalence.
- **Renderer and preload:** UI Adapter and typed bridge only; no filesystem,
  Electron, or path policy enters the application Module.
- **Agent Provider, Git, remotes, credentials, and network:** not called.

## Minimum vertical path and slices

Implement one behavior at a time, with a Red test at the confirmed seam before
each implementation change:

1. **TB17.1 — enumerate the safe repository tree:** add the S5 contract and
   S1 visible tree for the canonical fixture, including deterministic ordering,
   keyboard disclosure, hidden-entry filtering, and repository-relative
   identities.
2. **TB17.2 — open tree items through existing routes:** select the fixture
   topic, Source Record/annotation, and existing saved artifact entries and
   observe the existing Studio, Paper Desk, or contextual route without a new
   router or duplicate navigation authority.
3. **TB17.3 — create and persist a new Working Material note:** add the
   Knowledge Authoring save path for the exact fixture note, local-save status,
   and tree refresh projection.
4. **TB17.4 — edit and recover the note:** preserve rich/source equivalence,
   close/reopen, relaunch/resume, and selected-note context through the existing
   Workbench Session state.
5. **TB17.5 — preserve safety under failure:** cover external edits,
   interrupted writes, invalid titles/contents, unavailable repositories,
   unsupported files, symlinks, and provider-free operation.
6. Run focused S1/S5 suites, then the complete `check`, coverage,
   complexity, documentation, changed-lines coverage, and silent packaged
   workflow gates. Record Red/Green evidence before human acceptance.

The implementation must not introduce a general note manager, a new router, a
generic filesystem command channel, a second rich/source parser, or speculative
multi-user state.

## Accessibility and visible outcomes

The repository tree is a labeled navigation landmark with an accessible name.
Folders expose expanded/collapsed state; selected items expose current state;
all controls are keyboard-operable with visible focus. The tree remains usable
at the TB16 text-scaling and theme requirements. Save, conflict, unavailable,
unsupported, and recovery outcomes use status or alert semantics appropriate to
their urgency and do not rely on color alone.

## Explicitly deferred work

The following remain outside TB17 and must not be inferred from its tree or note
behavior:

- arbitrary filesystem browsing, absolute-path display, path picker controls,
  rename, delete, move, drag-and-drop, bulk operations, or arbitrary file
  creation;
- live filesystem watching, multi-user editing, merge/conflict UI, and
  cross-process concurrent drafts;
- choosing a project-specific destination, project-aware note routing, or
  automatic movement from `scratch/` into `projects/` or `knowledge/`;
- a new note ID registry, portable draft database, Repository Format v2, JSON
  note storage, or migration of existing arbitrary notes;
- arbitrary Markdown parsing and constructs beyond the existing TB11 supported
  forms, plus editor-engine selection, rich range editing, attachments, OCR,
  and media management;
- direct Governed Knowledge editing, automatic Proposal creation, automatic
  Governance application, or agent-generated note content;
- Git, Git LFS, GitHub, remotes, synchronization, backup, credentials, and
  provider-dependent operations;
- repository-wide indexing, fuzzy ranking, backlinks, graph views, custom
  dashboards, multi-repository switching, and mobile layouts; and
- automatic tree refresh on every filesystem event or automatic recovery from
  unknown/orphaned transaction directories.

Each deferral is owned by the V1 maintainer and is revisited only when a
concrete workflow, safety risk, repository-format requirement, or release
support requirement makes it necessary. It is not an unsupported-by-design
claim for later versions; it is outside this bounded V1 slice.

## Alternatives considered and discarded

- **Expose a raw filesystem browser:** discarded because it would leak
  machine-local/application internals, make path safety a renderer concern,
  and blur the portable Knowledge Repository contract.
- **Let the renderer enumerate files directly:** discarded because the
  renderer has no filesystem authority and would create a second containment
  and filtering policy.
- **Create notes in `knowledge/` by default:** discarded because new notes are
  Working Material and must not appear to be Governed Knowledge. `scratch/`
  provides the existing provisional home; project-aware placement can be
  added later with an explicit policy decision.
- **Store drafts in application-local session state:** discarded because a
  user's note must be portable, visible outside the Workbench, and recoverable
  independently of machine-local convenience state.
- **Introduce a new Repository Format version or note database:** discarded
  because existing V1 Markdown/frontmatter is sufficient and a new format
  would impose migration and interoperability cost before demonstrated need.
- **Make every visible file open in Studio:** discarded because source records,
  annotations, proposals, and unsupported files have different semantics and
  existing routes; navigation must preserve those distinctions.
- **Add live filesystem watching now:** deferred because explicit refresh and
  reopen provide a smaller observable behavior while avoiding a new concurrency
  and event-ordering policy.
- **Add a generic repository browser Module:** discarded because the existing
  Workbench Session, Knowledge Repository Adapter, and Knowledge Authoring
  Module provide the demonstrated owners; a generic layer would be shallow
  until a second independent caller requires it.

## Acceptance evidence

Automated evidence must include:

- S5 contract coverage for safe deterministic tree enumeration, hidden-entry and
  symlink handling, supported/unsupported outcomes, Markdown serialization,
  fingerprint conflict preservation, and recoverable atomic writes;
- S1 packaged coverage for tree disclosure/navigation, opening representative
  topic/source/artifact items, creating and editing the exact note, local-save
  status, close/reopen, relaunch recovery, failure preservation, keyboard
  operation, visible focus, theme/scaling behavior, and provider-free operation;
- full repository checks, coverage, complexity, documentation validation,
  changed-lines coverage, and silent packaged workflow evidence; and
- a release-appropriate artifact verification run with no Git, network, or
  Agent Provider dependency.

Human acceptance must observe:

1. The selected repository appears in the left-hand tree with the canonical
   roots and representative fixture entries.
2. Folders expand/collapse by keyboard and pointer, focus is visible, and
   selecting a topic, source item, annotation, and saved artifact reaches the
   expected existing view.
3. Hidden internals and absolute paths are not exposed; an unsupported file
   produces a clear non-mutating outcome.
4. New Working Material creates the exact note, displays the Working Material
   label, saves locally, and shows the note in the tree.
5. Editing, rich/source inspection, close/reopen, and relaunch preserve the
   note's exact content and meaning.
6. An external edit or interrupted save preserves the external/prior content,
   reports a meaningful conflict/recovery outcome, and never falsely claims
   success.
7. The governed Bayesian statistics topic and existing repository artifacts
   remain unchanged by note authoring and navigation.

Record the Red/Green evidence, changed files, packaged artifact identity,
manual results, explicit human acceptance, and any newly discovered deferral in
the TB17 section of the delivery plan before closing this tracer bullet.

## Implementation-readiness confirmation

This brief is implementation-ready because it identifies:

- the two independently observable Public Behaviors and their caller-visible
  outcomes;
- the existing confirmed S1 and S5 Test Seams;
- exact fixture paths, note bytes, labels, and representative tree entries;
- the minimum vertical path and independently testable slice order;
- one authoritative owner for note semantics, repository traversal, session
  state, and UI presentation;
- the existing Repository Format v1 persistence and safe-write contract;
- accessibility, provider-free, privacy, and failure-preservation criteria;
- explicit scope boundaries, discarded alternatives, and deferred work with an
  owner and revisit condition; and
- no unresolved requirement for a new ADR or a new Test Seam.

Implementation may begin with TB17.1 after the documentation prerequisite and
the exact `scratch/` default, fixture literals, and deferrals above receive
human confirmation. No later TB17 slice should be implemented speculatively.
