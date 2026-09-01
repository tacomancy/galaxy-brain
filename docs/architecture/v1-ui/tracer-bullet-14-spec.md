# Tracer Bullet 14: Keep learning progress human-owned

Status: implementation-ready specification prepared on
`codex/tb14-learning-progress`.

## Dependency

TB14 is a dependent slice over the TB13 Atlas surface from PR #126. PR #126
has merged into `main`, and this branch has been rebased onto that merged
surface. The TB14 PR must not duplicate the TB13 diff.

## Intent

Show one explainable learning-progress suggestion in Atlas while preserving
human ownership of learning state. A suggestion may describe evidence and
propose a next stage, but reading, source activity, route activity, or merely
rendering the suggestion must not advance a stage. Only an explicit human
confirmation may advance the session's learning projection; a correction keeps
the prior stage and makes the human decision visible.

## Governing behavior

The implementation follows the Learning Module contract in
`docs/architecture/v1-ui/architecture.md`, the Atlas and provider decisions in
`docs/architecture/v1-ui/product-decisions.md`, and the S1 rules in
`docs/architecture/v1-ui/test-strategy.md`:

- learning goals and stages remain user-owned;
- suggestions explain their evidence and remain correctable;
- passive activity cannot complete a stage;
- a missing Agent Provider returns the explicit
  `agent-provider-unavailable` outcome without blocking local Workbench use;
- confirmation is a separate human operation from suggestion generation;
- no suggestion writes Governed Knowledge, Learning Route content, or
  repository files in this slice.

## Fixture contract

The S1 fixture uses the existing Bayesian statistics context:

- topic: `bayesian-statistics`, displayed as “Bayesian statistics”;
- Source Record: `bayesian-statistics-fixture-source`, displayed as
  “Bayesian statistics fixture source”;
- evidence items: the two existing saved annotations
  `annotation-bayesian-statistics-fixture-source-page-2-0-54` and
  `annotation-bayesian-statistics-fixture-source-page-2-55-83`;
- current Learning Route: `bayesian-statistics-essentials`;
- current stage: “Evidence updates”;
- suggested next stage: “Posterior belief”.

The deterministic fixture Agent Adapter returns one suggestion:

- ID: `progress-suggestion-bayesian-statistics-posterior`;
- explanation: “Both saved source annotations describe evidence updating
  confidence, so Posterior belief is a reasonable next stage to review.”;
- evidence: both annotation IDs and the fixture Source Record;
- state before human action: “Awaiting your confirmation”;
- action: “Confirm stage suggestion” or “Correct suggestion”.

The fixture is not evidence that the user completed the stage. It is a stable
provider response used to observe the Workbench's trust behavior.

## Module and Adapter seam

`app/src/modules/learning/index.ts` defines the framework-independent Learning
Module Interface. It owns the current session learning projection, validates
suggestion evidence, and separates `suggest()` from `confirm()` and
`correct()` operations. Its public outcomes distinguish an available pending
suggestion, an explicitly confirmed stage, an explicitly corrected suggestion,
and `agent-provider-unavailable`.

`app/src/adapters/learning/fixture-learning.ts` supplies the deterministic
fixture state and a narrow operation-specific suggestion Adapter in the
existing S1 fixture/review modes. Normal launches compose an unavailable
provider Adapter. No generic model mock or provider credential is introduced.

## Vertical path

Fixture Learning State Adapter + narrow Learning Suggestion Adapter → Learning
Module → Electron main IPC → typed preload bridge → Atlas UI Adapter → visible
evidence, pending status, and explicit confirmation/correction actions.

The confirmation and correction operations remain local Module operations. They
do not call the Agent Adapter again and do not mutate the Knowledge Repository
or TB13 Learning Route projection.

## Intermediate slices

Implement and verify these slices in order:

1. **Suggestion read:** display the current stage, proposed stage, exact
   explanation, all evidence items, and the pending-human-action status. Verify
   that rendering, reload, and passive navigation leave the current stage at
   “Evidence updates”.
2. **Explicit confirmation:** activate the confirmation action and verify that
   the visible session projection changes to “Posterior belief”, records the
   human confirmation, and does not contact the Agent Adapter or change
   repository content.
3. **Explicit correction:** activate correction, provide the fixed fixture
   correction “Keep Evidence updates as the current stage”, and verify that the
   current stage remains “Evidence updates”, the suggestion is marked corrected,
   and the evidence remains inspectable.
4. **Unavailable provider:** run the same Atlas route with the empty provider
   Adapter and verify `agent-provider-unavailable` is visible while repository,
   Atlas continuation, Paper Desk, and Proposal Review remain usable.

## Acceptance evidence

The S1 packaged workflow must prove:

1. The suggestion is visible in Atlas and clearly separate from
   `Continue working` and `Needs your judgment`.
2. The current and proposed stages, explanation, Source Record, and both
   annotation evidence items are visible.
3. No passive render, reload, route navigation, or source activity advances
   the stage.
4. Only explicit confirmation advances the stage.
5. Correction leaves the prior stage in place and records the correction.
6. The unavailable-provider outcome is explicit and non-blocking.
7. All controls are keyboard-operable with visible focus and semantic names;
   no color-only status communicates ownership or confirmation.

Focused S2 tests must cover the Module's evidence validation, pending state,
confirmation, correction, repeated operations, and unavailable-provider
outcomes. The S1 workflow observes only visible content, focus, navigation, and
durable session outcomes.

## Boundaries and deferrals

- TB14 does not add a learning-goal editor, route authoring model, spaced
  repetition, streaks, health scores, generic notifications, or automatic
  reminders.
- No passive activity, annotation count, route edit, or agent response mutates
  a learning stage without the explicit human operation.
- No provider credentials or prompt/response payloads enter repository content,
  logs, or session state.
- Durable Learning Repository Format, relaunch persistence for stage changes,
  multi-stage progression, correction history, and production OpenAI integration
  remain deferred unless a later slice specifies them.
