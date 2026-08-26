# Software design principles

Use these principles when creating or changing a Module Interface, assigning state or behavior, placing a Seam, choosing dependency direction, or recording an architectural decision. The [engineering glossary](../engineering/glossary.md) is the source of truth for terminology. [Code guidance](code.md) governs TDD; [software development conventions](software-development.md) govern implementation mechanics.

## Design for people

Begin with the human task and the understanding a person needs to complete it safely. Optimize Interfaces, workflows, diagnostics, and source code for human users and maintainers. Agentic helpers collaborate by exposing reasoning, evidence, and proposed changes; convenience for an agent does not confer ownership of product choices, project settings, or human-authored work.

Prefer designs whose important state and consequences are inspectable and explainable. Use canonical domain language and the fewest concepts needed to express the behavior. Technical sophistication earns its place only when it reduces total complexity for the people operating or maintaining the system.

## Start from behavior and knowledge

State the Public Behavior and the caller that needs it before choosing a code shape. Identify the domain rules, state authority, external variability, and facts the caller must know. Design is ready to begin when those concerns have an explicit owner and the proposed Interface uses the language in `CONTEXT.md`.

A Module owns the behavior whose rules change together. Keep the relevant state, invariants, decisions, and error translation local to that Module. Prefer a cohesive owner over orchestration that distributes one decision across UI, persistence, and helpers.

## Design deep Modules

Give callers substantial capability through a small Interface. An Interface includes every fact required for correct use: operations, domain types, invariants, ordering, error modes, configuration, and consequential performance characteristics. Hide representation, workflow, framework objects, storage layout, and replaceable machinery inside the Implementation.

Evaluate depth with three tests:

1. **Leverage:** does each concept learned by the caller unlock meaningful behavior?
2. **Locality:** can a rule or defect be changed once at its owner rather than across callers?
3. **Deletion:** if the Module vanished, would its complexity reappear elsewhere? If the complexity simply vanished, the Module was likely a pass-through.

When an Interface is difficult or costly to reverse, sketch at least two materially different designs. Compare what each makes callers learn, which decisions each hides, how failures appear, and how future variation would be absorbed. Record the rationale, not just the selected shape.

## Place evidence-based Seams

Place a Seam where behavior must vary without changing its callers. A production and test Adapter, two production technologies, or a genuine platform dependency demonstrate variation. One known Implementation with no credible alternative is a hypothetical Seam; keep it internal until variation appears.

Use an Adapter to translate across a real Seam. Keep domain policy in its owning Module and protocol, filesystem, framework, or vendor mechanics in the Adapter. Cross a Seam with operation-specific domain inputs and outcomes rather than exposing the external system's object model.

Callers and Behavior Tests use the same Interface. A need to inspect past it is evidence that the Interface exposes the wrong behavior, the Module owns too much, or the assertion targets an Implementation detail.

## Direct dependencies inward

High-level domain policy must not depend on UI frameworks, storage layouts, transport objects, or vendor SDK types. Compose application Modules with Adapters at an outer composition root. Accept variable dependencies rather than constructing them inside the Module.

Return explicit domain outcomes where callers must respond. Keep unavoidable side effects at the owning Adapter or outer orchestration edge. Translate infrastructure failures once, close to that edge, without erasing diagnostic causes.

Share code only after multiple concrete callers reveal stable common ownership. Similar syntax alone is not a shared concept; duplication is cheaper than an abstraction that couples unrelated change.

## Reuse before inventing

Before designing bespoke machinery, search the repository, language and platform facilities, open standards, and established libraries or frameworks for an adequate capability. Prefer the highest-level existing option that meets the behavior without importing greater complexity than it removes.

Evaluate reuse by fitness, maturity, documentation, interoperability, accessibility, security, licensing, maintenance, portability, testability, and lifecycle cost. Apply the dependency policy in [software development conventions](software-development.md); reuse is a design preference, not permission to add an unjustified dependency. Build a custom solution only when existing options fail an explicit requirement or create a larger long-term constraint, and record the rationale when that choice is consequential.

## Give state one authority

Every durable state transition has one owning Module and one authoritative source. Other representations are Working Material, caches, projections, or views with explicit derivation and recovery rules. A UI Adapter may hold transient interaction state but does not become an alternate authority for domain state.

Make invalid transitions unrepresentable when practical and reject them at the owning Interface otherwise. Concurrency, idempotency, ordering, and version expectations belong to that Interface whenever callers depend on them.

## Keep project policy human-configurable

Treat settings that express human preference, workflow, environment, privacy, or risk tolerance as human-owned project configuration. Give them safe defaults, clear names, validation, discoverable documentation, and portable persistence where the setting belongs to the project. Show the effective value and consequence when ambiguity could affect trust.

Keep true invariants in code and expose meaningful policy rather than internal tuning knobs. An agent may recommend a value or prepare a migration, but the person remains able to inspect and change the setting. Configuration evolution preserves existing intent or requests renewed Judgment when no faithful migration exists.

## Develop test-first and let evidence drive evolution

Use test-driven development as the default design loop. Begin each behavior change with a failing Behavior Test at an accepted Test Seam, implement the minimum coherent path to Green, and refactor only with the suite Green. Follow [code guidance](code.md) for the authoritative procedure.

Implement architecture through vertical Tracer Bullets. Each slice should exercise a Public Behavior and reveal the next necessary structure. Introduce only the Interfaces, Adapters, and shared abstractions required by demonstrated behavior. Support the loop with proportionate static analysis, formatting, accessibility and security checks, focused review, and automated verification.

Record an ADR before a hard-to-reverse or surprising trade-off spreads through callers. An ADR states the forces, viable alternatives, decision, and consequences. Routine refactoring that preserves accepted Interfaces needs tests and an accurate code map, not an ADR.

## Write source for human readers

Use clear names, explicit types, cohesive functions, and straightforward control flow as the primary explanation. Write comments and docstrings in concise, plain language with only the domain or technical terms needed for precision. Document exported Interfaces where callers need invariants, expected outcomes, error modes, ordering, configuration, or consequential performance behavior.

Give code with unavoidable complexity enough nearby explanation for a human maintainer to reconstruct why it is correct. Inline comments should explain the reason, invariant, algorithmic step, safety constraint, or non-obvious trade-off at the relevant block. Keep comments synchronized with behavior and remove them when the code makes the same point clearly.

## Review the design

Before completing a design or architectural change, verify that:

- the design serves the human task and remains comprehensible to users and maintainers;
- the Public Behavior and caller are explicit;
- every rule and durable state transition has one owner;
- the Interface hides more complexity than it exposes;
- dependency arrows point from framework and Adapter code toward application policy;
- every Seam is justified by demonstrated variation;
- existing project, platform, standard, library, and framework capabilities were considered before bespoke code;
- human-owned project policy is configurable without exposing internal machinery;
- tests observe behavior through caller-facing Interfaces;
- external failures become explicit domain outcomes where callers must act;
- comments and docstrings make unavoidable complexity understandable without narrating ordinary syntax;
- the code map and applicable ADRs reflect the resulting design; and
- no speculative abstraction was added for an imagined later requirement.

The review is complete when every item is satisfied or an explicit trade-off and its owner are recorded.
