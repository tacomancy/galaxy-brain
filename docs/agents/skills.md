# Agent skill routing

Use this file to choose a locally available repository-facing skill by task shape. The skill's own `SKILL.md` remains the detailed procedure. Use the smallest set that covers the request; combine skills only when one explicitly hands off to another or the task crosses their boundaries.

## First-run procedure

For a brand-new task in this repository:

1. Read `AGENTS.md`, then use this catalog to classify the request.
2. Read every applicable file under `docs/agents/` before acting. The repository guidance is the local authority for collaboration, approvals, domain language, testing, and implementation boundaries.
3. Select the smallest skill that matches the task. Use `ask-matt` when the fit is unclear, and follow explicit skill handoffs when a selected skill names the next one.
4. Verify the selected skill is available in the agent's configured skill locations. If it is missing, follow the [third-party skill approval rules](collaboration.md#third-party-agent-skills) before any network access or installation.
5. Keep investigation, planning, and implementation distinct: a request to investigate or propose does not authorize implementation; a request to build authorizes the ordinary reversible work for that outcome.

## Planning, decisions, and design

| Skill | Use when | Boundary or sequencing |
| --- | --- | --- |
| `ask-matt` | You are unsure which engineering skill or flow fits the task. | Use it as a router before guessing. |
| `grill-me` | The user wants a relentless interview to stress-test a plan, design, decision, or idea. | Invokes `grilling`; do not implement until the user confirms shared understanding. |
| `grill-with-docs` | The user wants that interview plus durable domain decisions or terminology captured as documents. | Invokes `grilling` and `domain-modeling`; for existing-document review, use the document-grilling ledger rules and do not change reviewed documents solely because a concern was found. |
| `grilling` | A grilling workflow needs the underlying interview process. | Ask the whole current decision frontier in rounds, then wait for the user's answers. |
| `codebase-design` | Designing or improving Module Interfaces, dependency direction, state ownership, Seams, or testability. | Read `docs/agents/software-design.md` before applying it. |
| `domain-modeling` | Clarifying codebase terminology, editing `CONTEXT.md`, or recording or editing an ADR. | Read `CONTEXT.md`, relevant ADRs, and `docs/agents/domain.md` first. |
| `prototype` | A throwaway prototype can answer a design or UI/state-model question faster than implementation. | Keep the result disposable unless the user authorizes production work. |
| `wayfinder` | The effort is too large for one session and needs a decision map on the issue tracker. | Plan the route and resolve decision tickets; do not silently turn planning into implementation. |
| `loop-me` | The user wants to be interviewed specifically about workflows to build in this workspace. | Use the grilling-style interview for workflow specifications. |
| `wait-what` | The user's last message did not land or needs a clearer re-pitch. | Stop the current interpretation and re-explain the proposal plainly. |

## Implementation, testing, and review

| Skill | Use when | Boundary or sequencing |
| --- | --- | --- |
| `implement` | Implementing work from a spec or set of tickets. | Use `tdd` where possible; run verification and finish with `code-review`. |
| `implement-spec` | Implementing an entire specification whose work is represented by tickets. | Follow the ticket dependency graph and frontier; keep the work on one branch. |
| `tdd` | Building or fixing behavior test-first, or when the user asks for red-green-refactor or integration tests. | Required for code/test changes here; read `docs/agents/code.md` and confirm test seams before writing tests. |
| `diagnosing-bugs` | The user reports behavior that is broken, failing, throwing, regressing, or slow, or asks to diagnose/debug it. | Diagnose first; implement only when requested or clearly authorized. |
| `code-review` | Reviewing a branch, PR, WIP, or changes since a fixed commit, branch, tag, or merge-base. | Review both repository standards and the originating spec. |
| `resolving-merge-conflicts` | A merge or rebase is currently conflicted. | Resolve only the in-progress conflict; preserve unrelated work. |
| `migrate-to-shoehorn` | Tests use `as` assertions or need partial test data migrated to `@total-typescript/shoehorn`. | Limit the change to test migration unless the user expands scope. |
| `improve-codebase-architecture` | The user wants a codebase scan for deepening opportunities and a visual report. | Present findings, then grill through the selected opportunity before changing architecture. |
| `retro` | Reviewing a completed coding session for lessons and process improvements. | Reflect on the session; do not treat a retrospective as authorization for code changes. |

## Research, issue tracking, and delivery planning

| Skill | Use when | Boundary or sequencing |
| --- | --- | --- |
| `research` | Investigating a question, API fact, or topic against high-trust primary sources and capturing findings in the repository. | Read `docs/agents/research.md`; cite material claims and preserve uncertainty. |
| `triage` | Moving issues or external PRs through the repository's triage state machine and writing agent-ready briefs. | Read `docs/agents/issue-tracker.md` and `docs/agents/triage-labels.md`; use the configured GitHub tracker. |
| `to-spec` | Planning implementation from a settled conversation, decision, or design and needing an agent-ready specification. | Use after decisions are settled and before `to-tickets`, `implement`, or `implement-spec`; synthesize without adding an interview and publish to the issue tracker when tracker work is in scope. |
| `to-tickets` | Breaking a plan, spec, or conversation into tracer-bullet tickets with blocking edges. | Publish tickets only when issue-tracker work is in scope. |
| `to-questionnaire` | Turning an unresolved decision into a questionnaire for another person to answer. | Use when the missing input cannot be discovered by repository inspection. |
| `scaffold-exercises` | Creating exercise directories, problems, solutions, and explainers. | Keep generated structure consistent with the repository's exercise conventions. |

## Repository and workflow setup

| Skill | Use when | Boundary or sequencing |
| --- | --- | --- |
| `setup-matt-pocock-skills` | Configuring a repository for the engineering skill set for the first time. | Use once before the other engineering skills when the repository lacks that setup. |
| `setup-pre-commit` | Adding Husky, lint-staged, formatting, typechecking, and test checks at commit time. | Use only when the user requests commit hooks or equivalent setup. |
| `setup-ts-deep-modules` | Wiring dependency-cruiser into a TypeScript repository to enforce deep modules. | User-invoked; do not add it as incidental implementation work. |
| `git-guardrails-claude-code` | Adding Claude Code hooks that block dangerous Git commands. | Use only when the user asks for Git safety hooks or command blocking. |
| `wizard` | The user must perform credential, dashboard, infrastructure, CI-secret, or cutover steps themselves. | Generate a guided shell wizard; perform agent-owned steps directly when possible. |
| `handoff` | Packaging the current conversation for another agent to continue. | Use for an explicit handoff or when the current workflow requires one. |
| `claude-handoff` | Handing the current conversation to a fresh background agent immediately. | Use only for an explicit handoff flow. |

## Writing and learning

| Skill | Use when | Boundary or sequencing |
| --- | --- | --- |
| `writing-for-agents` | Creating or editing skills, `AGENTS.md`, `CLAUDE.md`, or other documents consumed by agents. | Apply its context-pointer, progressive-disclosure, and pruning guidance. |
| `writing-fragments` | Exploring raw writing material without imposing structure yet. | Mine fragments first; shape them in a later stage. |
| `writing-beats` | Turning grounded material into a sequence or journey of beats. | Establish each term before relying on it in a beat. |
| `writing-shape` | Shaping raw material into an article or polished prose. | Work paragraph by paragraph from the available material. |
| `teach` | Teaching the user a skill or concept within this workspace. | Adapt the lesson to the user's goal and keep exercises before solutions where applicable. |

## Discovery and maintenance

| Skill | Use when | Boundary or sequencing |
| --- | --- | --- |
| `find-skills` | The user asks whether a skill exists, how to accomplish something that may have a skill, or wants skills discovered or installed. | Discover first; install only with the applicable approval and installer rules. |
| `plugin-management` | The task would materially benefit from an external app, connector, or plugin, or the user asks about plugins. | Prefer an available purpose-built connector; do not install unrelated plugins. |

## Planning flow

Use this sequence when the user wants an idea turned into implementation:

`grill-me` → `to-spec` → `to-tickets` → `implement` / `implement-spec`

- Start with `grill-me` when material decisions remain unresolved. Use `grill-with-docs` instead when the session should also capture approved domain terminology or decisions.
- Use `to-spec` once the direction is settled but the implementation contract is not yet explicit.
- Use `to-tickets` when the specification needs a dependency-aware set of executable work items.
- Use `implement` for a defined piece of work or ticket set; use `implement-spec` when implementing the complete specification.
- During implementation, `tdd` governs code and test changes; finish with `code-review` when the implementation flow calls for review.

## Repository-specific gates

- Before software, design, or review work, inspect the locally available Matt Pocock skills and follow the approval rule in `docs/agents/collaboration.md` before installing anything missing.
- If a selected skill is unavailable, follow the [third-party skill approval rules](collaboration.md#third-party-agent-skills): identify the skill and its effect, ask for approval, install only the approved skill from the supported source, and verify it before relying on it.
- When changing code or tests, use `tdd` and read `docs/agents/code.md`.
- When changing production code, dependencies, tooling, packaging, or CI, also read `docs/agents/software-development.md`.
- When changing Module Interfaces, dependency direction, state ownership, or architectural Seams, read `docs/agents/software-design.md` before the code guidance.
- When planning, implementing, testing, or reviewing the desktop Workbench, read `docs/agents/workbench.md` after the code guidance.
- When a grilling workflow examines project documents, follow the document-grilling rules in `docs/agents/collaboration.md`: record findings in the review ledger and keep findings separate from decisions and source changes.
