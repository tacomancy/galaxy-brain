# Human-agent collaboration

Galaxy Brain treats agents as helpers for research, organization, drafting,
verification, and authorized implementation. The person remains the primary
author, learner, and authority over goals, values, priorities, and governed
knowledge.

This page explains the collaboration contract in human terms. It complements
the [V1 architecture](../docs/architecture/v1-ui/README.md), the [tutorials](tutorials/index.md),
and the [safety and privacy guide](tutorials/safety-and-privacy.md).

## Who owns what

| Person | Agent |
| --- | --- |
| Sets the desired outcome and scope | Inspects the available context and performs the legwork |
| Owns values, priorities, and consequential decisions | Organizes evidence, drafts alternatives, and makes recommendations |
| Decides whether a proposal becomes governed knowledge | Applies an authorized change and reports what changed |
| Remains the author of personal knowledge and final judgment | Preserves attribution, provenance, uncertainty, and reversibility |

An agent may recommend a choice, but convenience or confidence does not give
the agent authority to make that choice. Saved agent output is still Working
Material until a person reviews and governs it.

## The normal workflow

Expect an agent to move through these stages:

1. **Understand the outcome.** The agent identifies the requested result,
   scope, available authority, and facts that can be discovered from the
   repository or project context.
2. **Inspect before asking.** The agent searches existing documentation,
   terminology, decisions, and artifacts before asking the person to repeat
   information that is already available.
3. **Do reversible legwork.** The agent can read, compare, test, draft, and
   organize within the stated scope. Low-risk assumptions should be named when
   they materially affect the result.
4. **Show the decision frontier.** When alternatives have materially different
   consequences, the agent presents the recommended option, trade-offs,
   uncertainty, and the smallest question that requires human judgment.
5. **Review the exact change.** Before a consequential, governed, destructive,
   or externally committed action, the person reviews the artifact, version,
   targets, and consequences being approved.
6. **Apply only authorized work.** An agent does not treat silence, an earlier
   approval, or a changed implementation as approval for a new material action.
7. **Hand off clearly.** The result identifies the outcome, assumptions,
   changed artifacts, verification, unresolved risks, and any useful next step.

Investigation, design, or a proposal does not by itself authorize
implementation. A request to build or change something authorizes the ordinary
reversible work needed for that outcome, subject to the review gates above.

## Three kinds of knowledge work

The destination and approval level depend on the request:

- **Conversational research** answers a question without changing the
  repository unless the person asks for the work to be saved.
- **Working-material research** records provisional notes, source annotations,
  or project material in the appropriate repository area. These artifacts are
  attributable and revisable, but they are not authoritative knowledge.
- **Core integration** prepares an exact proposal for governed knowledge. The
  proposal can include evidence, rationale, uncertainty, conflicts, and an
  exact diff, but it waits for explicit human judgment before application.

The [Repository Format overview](tutorials/repository-format-overview.md)
explains the boundary between Working Material and Governed Knowledge. A
proposal is not an accepted change, and an accepted change creates a new
reviewed version while preserving the prior version for recovery and
provenance.

## Evidence and provenance

For research and knowledge work, an agent should:

- frame the question, scope, and stopping condition;
- prefer direct primary evidence and authoritative references appropriate to
  the subject;
- cite material claims beside the claims they support;
- distinguish established facts, source claims, interpretations, agent
  inferences, and hypotheses;
- preserve uncertainty and represent credible contrary evidence; and
- keep proposed core changes separate from the evidence used to support them.

The agent's summary is not evidence merely because it is fluent. A person
should be able to trace a consequential claim back to its source and see where
interpretation or uncertainty enters the argument.

## Provider and privacy boundaries

Agent Provider access is optional. Provider-free local repository, reading,
source, editing, and governance workflows remain usable when no provider is
configured.

When a provider-dependent operation is available, the Workbench shows a
concise summary and inspectable exact payload before making the request. The
person can remove whole context items, review the regenerated payload, and
confirm, decline, or cancel. No confirmation means no request.

Provider requests and responses are transient by default. An explicit save can
preserve an agent result as attributed Working Material with provenance, but
that result does not become governed knowledge automatically. Do not place
credentials, hidden payloads, or private repository content in public examples;
see [Safety and privacy](tutorials/safety-and-privacy.md).

## When an agent should stop and ask

An agent should return the decision when the next action would:

- change governed knowledge or another human-owned durable artifact;
- expand scope or choose among value-dependent alternatives;
- delete data, discard history, or reduce recoverability;
- expose private or sensitive material to an external provider;
- make an external commitment such as publishing, pushing, or creating a
  review; or
- depend on an unresolved conflict, missing authority, or materially uncertain
  interpretation.

The agent should still complete the safe legwork first: locate the relevant
artifacts, identify the options, explain the consequences, and present the
smallest approval question.

## A practical review checklist

Before accepting agent-assisted work, ask:

1. Is this the outcome and scope I intended?
2. Which parts are source-backed facts, and which are interpretation or agent
   inference?
3. What artifact or version is changing, and can I inspect the exact diff?
4. Does the material remain Working Material, or is a governed change being
   proposed?
5. Were private contents or provider requests handled within the stated
   boundaries?
6. What assumptions, uncertainty, conflicts, or deferred decisions remain?

The goal is useful autonomy with visible, attributable, and reversible human
control.
