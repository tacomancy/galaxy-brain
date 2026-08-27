# Tracer Bullet 6.3: Promote the Paper Desk view

Status: planned; implementation pending.

This follow-up slice promotes the Paper Desk view from the accepted TB6 functional surface to a prototype-informed source-reading UI. It preserves the TB5/TB6 provenance and restoration behavior while adding presentation structure.

## Public Behavior

When a person opens the fixture Source Record in Paper Desk, the view presents a source-first reading surface:

- Source Record: `Bayesian statistics fixture source`.
- Saved annotation: `Bayesian inference updates prior belief with evidence.`
- Source Locator: `page:2#chars=0-54`.
- Attribution and classification: `source-claim`.
- Material state: `working-material`.
- Reading position: page 2, character 0.
- Relaunch restores the same Source Record, annotation, locator, and reading position.

## Test Seam and expected values

Use S1, the packaged desktop workflow, through Workbench Session, Source Processing state, Working Material Adapter, preload bridge, and Paper Desk UI Adapter. Assert visible source identity, annotation text, locator, provenance, reading position, focus, and relaunch state. Do not use a storage read as a substitute for the visible behavior.

## Minimum vertical path

1. Replace the minimal Paper Desk presentation with the prototype-informed reading layout.
2. Render the saved annotation and reading position through the existing TB6 caller-visible state.
3. Preserve the accessible saved-annotation action and relaunch behavior.
4. Add the focused S1 workflow and manual keyboard/focus review.

## Boundaries and acceptance

This slice does not select a production PDF engine, implement arbitrary text selection, import PDFs, choose Source Asset modes, relink sources, add new capture classification controls, or invoke Synthesis, Proposal, Governance, Git, network, or Agent Provider behavior. Acceptance requires the packaged workflow to display the exact provenance values, restore the same location after relaunch, and remain usable with keyboard and visible focus.
