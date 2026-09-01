# Tracer Bullet 13: Make Atlas actionable

Status: implementation-ready and implemented on `codex/tb13-atlas-actionable`.

## Intent

Make Atlas an orientation surface with three independently understandable
secondary slices while preserving the existing `Continue working` and `Needs
your judgment` lanes:

- a traceable metric whose definition, source items, and action are visible;
- a human-authored, editable Learning Route;
- a Generated Relationship suggestion that is visibly distinct from governed
  knowledge and explains its evidence.

This specification is the TB13 slice of the TB13-TB14 issue. TB14's progress
suggestions are deliberately deferred: no learning stage, goal, or progress
state is changed by this work.

## Governing behavior

The implementation follows the Atlas decisions in
`docs/architecture/v1-ui/product-decisions.md` and the S1 rules in
`docs/architecture/v1-ui/test-strategy.md`:

- Atlas keeps continuation and pending Judgment as separate primary lanes.
- Every metric names what it counts, identifies the source items, and leads to
  an intelligible action.
- Learning Routes are labeled as human-authored and remain editable by the
  human owner. The edit in this slice is session-local because a Learning Route
  Repository Format and durable route-write operation have not yet been
  specified; the UI does not imply that a transient edit was persisted.
- Generated Relationships are suggestions, not Governed Knowledge. They show
  their evidence and use a separate visual treatment and explicit status.
- The fixture is deterministic and provider-free. Normal launches compose an
  empty orientation source, so the absence of an Agent Provider does not block
  the core Workbench.

## Fixture contract

The checked-in S1 repository remains the source of the fixture context:

- topic: `bayesian-statistics`, displayed as “Bayesian statistics”;
- Source Record: `sources/papers/bayesian-statistics.md`, displayed as
  “Bayesian statistics fixture source”;
- saved annotations counted by the metric: the two annotations under
  `sources/annotations/bayesian-statistics/`.

The fixture orientation Adapter supplies these independently known values:

### Traceable metric

- ID: `captured-source-annotations`;
- label: “Captured source annotations”;
- value: `2`;
- definition: “Saved annotations attached to the current Source Record.”;
- source items: the two fixture annotation IDs and the fixture Source Record;
- action: “Open source in Paper Desk”, which uses the existing source-record
  transition and does not create or mutate knowledge.

### Human-authored Learning Route

- ID: `bayesian-statistics-essentials`;
- title: “Bayesian statistics essentials”;
- ownership: “Human-authored”;
- steps: “Prior belief”, “Evidence updates”, and “Posterior belief”;
- action: an editable title field with Save and Cancel. Save changes only the
  in-session projection and reports that the route remains human-owned; it
  does not claim durable persistence.

### Generated Relationship suggestion

- ID: `bayesian-statistics-evidence-updates`;
- relationship: “Bayesian statistics → Evidence updates”;
- status: “Generated Relationship suggestion” and “Not Governed Knowledge”;
- evidence: “The fixture Source Record describes updating a prior belief with
  evidence.”;
- action: “Inspect source evidence”, which opens the existing Source Record in
  Paper Desk. The suggestion cannot edit, create, or silently alter a topic.

## Module and Adapter seam

`app/src/modules/atlas-orientation/index.ts` defines the serializable Atlas
orientation Interface and validates the read-only overview contract. The
Module owns the route edit projection and returns an explicit outcome for the
session-local update.

`app/src/adapters/atlas-orientation/fixture-atlas-orientation.ts` supplies the
deterministic fixture above. An empty source is used for ordinary launches.
The Electron composition root selects the source based on the existing
fixture-mode argument, and the typed preload bridge exposes only
`readAtlasOrientation` and `editLearningRouteTitle`.

## Vertical path

Fixture Adapter → Atlas Orientation Module → Electron main IPC → typed preload
bridge → renderer Atlas Adapter → visible Atlas cards and actions.

The metric and Generated Relationship actions terminate at the existing
`openSourceRecordInPaperDesk` transition. The Learning Route edit terminates
at the Atlas Orientation Module's session-local state. No new persistence,
provider, notification, or learning-progress path is introduced.

## Acceptance evidence

The S1 workflow opens the checked-in fixture repository and verifies:

1. `Continue working` and `Needs your judgment` remain visible and distinct.
2. The metric displays value `2`, its definition, both source items, and an
   enabled Paper Desk action that reaches the fixture Source Record.
3. The Learning Route displays its human-authored ownership and all steps;
   editing and saving its title changes the visible route while preserving the
   ownership label, and Cancel leaves the prior title intact.
4. The Generated Relationship displays its suggestion and non-governed status,
   its evidence, and a Paper Desk action that reaches the fixture Source
   Record.
5. Keyboard-operable controls, visible focus, and durable navigation outcomes
   are asserted at the rendered desktop boundary.

## Boundaries

- TB14 progress suggestions and stage confirmation are not implemented here.
- No composite health score, streak, generic notification, or engagement
  metric is added.
- No generated suggestion is written into the Knowledge Repository.
- Empty normal-launch orientation remains non-blocking and does not invent
  content in the renderer.
