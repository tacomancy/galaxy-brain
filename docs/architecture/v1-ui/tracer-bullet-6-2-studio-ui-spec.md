# Tracer Bullet 6.2: Promote the Studio view

Status: planned; implementation pending.

This follow-up slice promotes the Studio view from the accepted TB4/TB6 contextual shell to a prototype-informed production UI. It introduces presentation, not authoring or Synthesis behavior.

## Public Behavior

When a person opens the fixture topic in Studio, the view presents a polished topic-focused surface with real context:

- Topic: `Bayesian statistics`.
- Associated Source Record: `Bayesian statistics fixture source`.
- The topic relationship remains visible.
- The saved TB5 source claim is presented as supporting Working Material with its source provenance.
- A visible, keyboard-operable action opens the Source Record in Paper Desk.

The view clearly distinguishes Working Material from Governed Knowledge.

## Test Seam and expected values

Use S1, the packaged desktop workflow, through Workbench Session, Source Processing state, the preload bridge, and the Studio UI Adapter. Assert the exact topic, Source Record, source-claim text, Working Material state, accessible actions, and preserved Studio → Paper Desk context. Do not inspect React state or repository files as a UI side channel.

## Minimum vertical path

1. Replace the minimal Studio presentation with the prototype-informed topic layout.
2. Render the current topic, Source Record, and saved source claim through caller-visible state.
3. Preserve the existing Source Record transition and workspace switcher behavior.
4. Add the focused S1 workflow and manual accessibility review.

## Boundaries and acceptance

This slice does not implement a rich/source editor, editing semantics, authoring autosave, Synthesis, Proposal creation, Governance, agent-generated content, or invented metrics and relationships. Acceptance requires the packaged workflow to show the exact real context, label Working Material correctly, preserve keyboard operation, and reach Paper Desk without context loss.
