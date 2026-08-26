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

- When a saved context snapshot's current source cannot be checked or lacks a comparable identity, show `source status unavailable`, preserve the snapshot, and do not claim that it is current.
- When the user explicitly refreshes a saved context snapshot, create a new snapshot/version and preserve the original; never silently replace the historical context in place.
- Refreshing a snapshot updates only its saved context representation. Treat result regeneration as a separate explicit action requiring fresh confirmation before any new OpenAI request.
- Explicit result regeneration creates a new result version and preserves the previous result; never silently overwrite earlier agent output.
- Present the newest result as current and expose prior versions through ordinary artifact history; do not create separate top-level items for each regeneration.
- An explicit restore of an older result creates a new current version derived from it, preserves all intervening versions, and makes no OpenAI request.
- Retain prior agent-result versions by default and do not clean them up automatically. Any future deletion or history pruning requires explicit approval and a warning about lost recovery and provenance.

- Keep Atlas, Studio, Paper Desk, and Proposal Review as UI Adapters over shared application Modules and repository state.
- Keep governance eligibility inside the Governance Module and provenance rules inside Source Processing; UI Adapters render their outcomes rather than reimplementing them.
- Preserve the distinction among Working Material, Governed Knowledge, capture, Synthesis, Judgment, and application in names, tests, and Interfaces.
- Keep Proposal authorship provider-independent: a user can manually turn Working Material into an exact-diff Proposal and apply it through Judgment without an Agent Provider. Agent assistance may draft or suggest, but never owns Governance.
- Test through S1–S5 as defined in the accepted test strategy. Treat editor nodes, view models, reducers, parser phases, cache keys, filenames, and storage layout as Implementation details unless an accepted Interface explicitly exposes them.
- Preserve rich/source semantic equivalence and portable repository text; a chosen editor engine remains replaceable behind the Knowledge Authoring Interface.
- Treat repository access as local file access. Galaxy Brain may scaffold and mutate a validated repository, but never requires or invokes Git, Git LFS, GitHub, credentials, or network connectivity. Users manage version control and backups externally.
- Resume only an exact repository root previously selected by the user and stored in machine-local session state. Validate it at launch; if it is unavailable or invalid, present Open/Create choices rather than discovering or substituting a repository.
- Treat Agent Provider configuration as optional. The initial V1 path reads recognized variables from the machine-local application `.env` described by [`app/.env.example`](../../.env.example); the Workbench must remain usable without that file or an API key, and Agentic Capabilities should explain their unavailable state without blocking non-agentic workflows or prompting for credentials at startup. Never place `.env` in a Knowledge Repository or commit it.
- Provider-dependent operations use the shared `agent-provider-unavailable` outcome. Keep Search, Jump, reading, annotation, local editing, and Proposal review usable, and preserve captured material when agent-assisted work cannot run.
- Require explicit per-operation confirmation before every OpenAI request, including a user-only prompt. Show a concise summary and an inspectable exact payload, allow removal of whole context items with regenerated previews, expand small requests by default when practical, make cancellation request-free and state-preserving, and never add context after approval. Do not add arbitrary inline redaction, blanket consent, remembered consent, silent background requests, or whole-repository upload behavior in V1. Configurable confirmation policies are deferred.
- Do not retain OpenAI request or response payloads automatically. Show results transiently; persist them only when the user explicitly saves a Working Material item, Proposal, or other repository artifact. Keep prompts, selected context, and responses out of logs, caches, audit records, and support files.
- When an OpenAI result is explicitly saved, mark it agent-generated and preserve provider, pinned model, timestamp, operation, and applicable source-context metadata. The default save excludes the prompt/context; a separate explicit save-with-prompt/context action may retain the human-facing prompt, selected source references or locators, and concise context summaries as a point-in-time snapshot, but not full source excerpts or the hidden full API payload. A mismatch in saved versus current source identity or content identity may affect navigation targets but must not silently rewrite the saved snapshot; show a non-blocking stale-context warning when the saved artifact is opened. Preserve provenance through human edits; attribution does not confer Governance authority.
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
