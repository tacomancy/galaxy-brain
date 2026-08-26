# V1 Knowledge Workbench implementation

Use this guide for implementation, testing, review, or architecture changes to the desktop Knowledge Workbench. General TDD rules remain authoritative in [code.md](code.md); this guide supplies the Workbench-specific sequence and completion criteria.

## Load the design authority

Read these before choosing a test or changing code:

1. [`CONTEXT.md`](../../../CONTEXT.md) and every applicable accepted [ADR](../adr/).
2. The [V1 architecture package](../architecture/v1-ui/README.md), including its product decisions, architecture, confirmed Test Seams, and delivery plan.
3. The [software development conventions](software-development.md) and the current [code map](../architecture/v1-ui/code-map.md).
4. The [engineering glossary](../engineering/glossary.md) for canonical development vocabulary.
5. The current GitHub issue and its discussion when the work is issue-backed.

This step is complete when you can state the current Tracer Bullet, its confirmed Test Seam, the single missing Public Behavior, its independently known expected outcome, and every External System Seam the slice crosses.

The architecture package is the accepted design authority. The files under `app/prototype/knowledge-workbench/` are disposable comparison evidence, not a production foundation or an Interface contract.

## Establish the slice

1. Inspect the repository and relevant issue before assuming implementation state.
2. Select one Public Behavior from the current Tracer Bullet in the delivery plan.
3. Name the confirmed Test Seam where that behavior is observable.
4. Define a small Fixture and Independent Expected Value without reproducing the intended Implementation.
5. Identify the minimum vertical path and the real Adapters it needs.

Proceed to Red only when all five statements are concrete. When the behavior needs an unconfirmed Test Seam, update the test-strategy rationale and obtain explicit confirmation before writing the test. When it forces a hard-to-reverse, surprising trade-off, record the decision and rationale in an ADR before allowing it to spread across Module Interfaces.

## Run one Red-to-Green Cycle

### Red

Write one Behavior Test at the confirmed Test Seam. Run the narrowest command that executes it and observe failure for the missing behavior—not a broken harness, missing dependency, syntax error, or unrelated defect.

Red is complete when the failing assertion demonstrates that the intended behavior is absent and the command and failure are available for the handoff.

### Green

Implement only the vertical path required by the failing test. Use real Workbench-owned Modules and In-memory Adapters for locally substitutable dependencies. Use narrow Mock Adapters only at External System Seams.

Run the focused test and the relevant existing suite. Green is complete when both pass and the behavior is observable through the same Interface used by production callers.

### Review

With the suite Green, review the Module Interfaces for depth, test assertions for Public Behavior, and duplication for possible refactoring. Apply any refactoring separately and rerun the relevant suite. Choose the next behavior using what this cycle taught; do not prewrite later tests.

Review is complete when the suite remains Green, the test would survive an internal refactor, and no unapproved Interface or Test Seam has entered the design.

## Architectural discipline

- Keep Atlas, Studio, Paper Desk, and Proposal Review as UI Adapters over shared application Modules and repository state.
- Keep governance eligibility inside the Governance Module and provenance rules inside Source Processing; UI Adapters render their outcomes rather than reimplementing them.
- Preserve the distinction among Working Material, Governed Knowledge, capture, Synthesis, Judgment, and application in names, tests, and Interfaces.
- Test through S1–S5 as defined in the accepted test strategy. Treat editor nodes, view models, reducers, parser phases, cache keys, filenames, and storage layout as Implementation details unless an accepted Interface explicitly exposes them.
- Preserve rich/source semantic equivalence and portable repository text; a chosen editor engine remains replaceable behind the Knowledge Authoring Interface.
- Treat repository access as local file access. Galaxy Brain may scaffold and mutate a validated repository, but never requires or invokes Git, Git LFS, GitHub, credentials, or network connectivity. Users manage version control and backups externally.
- Treat Agent Provider configuration as optional. The Workbench must remain usable without an API key or configured provider; Agentic Capabilities should explain their unavailable state without blocking non-agentic workflows or prompting for credentials at startup.
- Keep the public starter skeleton separate from synthetic test fixtures, and never open a fixture as a user's repository without an explicit development or test setup.
- Keep the throwaway prototype out of the production dependency graph.
- Update the code map in the same change that creates, moves, renames, combines, splits, or removes a production Module or Adapter.

## Handoff contract

Every completed cycle reports:

- Tracer Bullet, Public Behavior, and Test Seam;
- Red command and the expected failure observed;
- Green command and passing result;
- user-visible or caller-visible outcome;
- files changed and any ADR created or affected;
- code-map entries created or updated;
- architectural lessons, unresolved risks, and the next candidate behavior; and
- confirmation that no later Tracer Bullet was implemented speculatively.

A slice is complete only when this evidence is available, the relevant suite is Green, every change belongs to the selected behavior, and the accepted architecture documents remain accurate.
