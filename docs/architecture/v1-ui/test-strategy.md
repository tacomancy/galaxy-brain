# Test strategy

Status: **accepted on August 26, 2026**.

Tests should describe behavior through public interfaces and survive changes to framework, editor engine, route implementation, persistence layout, and internal module composition. The following seams intentionally cover the highest-risk behavior without testing every internal module.

## Selection rationale

S1 through S5 were selected to balance three goals:

1. **Observe meaningful behavior.** Every test result should matter to a Workbench user, a Module caller, or the correctness of a production Adapter.
2. **Concentrate integrity risk.** Governance, provenance, discovery authority, and Adapter fidelity deserve focused tests because defects there could make the Workbench confidently misrepresent knowledge.
3. **Preserve implementation freedom.** UI frameworks, storage layouts, editor engines, PDF engines, and internal Module composition should be replaceable without rewriting behavior tests.

The seams form a layered test surface:

```text
                    S1 Desktop workflow
                  /          |           \
       S3 Source Processing  S2 Governance  S4 Discovery
                  \          |           /
                   S5 Adapter contracts
```

S1 proves that the assembled product works. S2 through S4 provide economical, precise coverage of the highest-risk application rules. S5 proves that production and test infrastructure mean the same thing. The layers overlap deliberately at a small number of critical workflows; they do not duplicate every assertion at every seam.

## S1 — Desktop workflow seam

**Public interface:** the rendered desktop Knowledge Workbench operated through accessible user actions and observed through visible content, focus, navigation state, and durable outcomes returned by the Workbench.

**Decision rationale:** this is the only seam that proves Atlas, Studio, Paper Desk, and Proposal Review form one coherent product. It covers the composition of UI adapters and real in-process application Modules through the Interface closest to the person using the Workbench.

Lower seams can prove that a Proposal is eligible or that a Structured Annotation retains its Source Locator. They cannot prove that a person can find the Proposal, understand its evidence, complete Judgment with a keyboard, or observe the resulting version. S1 therefore owns cross-workspace continuity, accessibility, and the visible completion of critical workflows.

Critical behaviors:

- A fresh Workbench opens Atlas; a meaningful prior activity resumes with its context.
- Global switching and contextual transitions preserve the relevant topic, Source Record, annotations, or Proposal.
- Atlas separates continuation from pending Judgment and links every metric to the items it counts.
- Studio preserves supported meaning across rich and source editing.
- Paper Desk captures a located Structured Annotation without automatically creating a Proposal.
- Proposal review shows exact changes and applies only eligible decisions.
- Search, Ask, and Jump visibly execute the selected mode.
- Keyboard-only operation, focus behavior, semantic structure, theme selection, and reduced motion are observable desktop behaviors.

Tests at this seam use real application modules and local in-memory adapters. They do not mock workspace modules, inspect UI implementation state, select editor-engine nodes, or query storage as a side channel.

**Why S1 is not the only Test Seam:** expressing every version, dependency, provenance, and authority edge case through the UI would make the suite slow, repetitive, and sensitive to harmless presentation changes. S1 proves representative end-to-end paths; S2 through S4 exhaustively protect the dense rules behind those paths.

## S2 — Governance seam

**Public interface:** the Governance module's Proposal, Judgment, and application operations and their returned domain outcomes.

**Decision rationale:** exact-version approval, selective Judgment, dependencies, auditability, and reversibility carry the highest integrity risk in the Workbench. An error could silently turn Working Material into Governed Knowledge or apply a decision to material the user never reviewed. Those rules need precise tests independently of any UI adapter.

Governance also has enough depth to justify its own Test Seam: a small Interface hides Proposal eligibility, version comparison, dependency validation, stale-review detection, reversible application, and audit behavior. If the Governance Module were removed, those rules would spread across Studio, Proposal Review, persistence, and agent workflows.

Critical behaviors:

- Working Material can be saved without becoming Governed Knowledge.
- An unapplied or partially ineligible Proposal cannot alter Governed Knowledge.
- Judgment can accept, edit, defer, or reject independently reviewable changes.
- Dependencies prevent an incoherent subset from being applied.
- A changed Proposal or target makes prior Judgment stale.
- Applying an eligible Proposal creates the specified new version, preserves the prior version, and records the exact decision.

Expected changes are known literal patches and version identifiers from fixtures. A test must not derive its expected diff by calling the same renderer or differ used by the implementation.

**Why not verify through S1 or storage alone:** S1 would make combinatorial eligibility cases expensive to express. Reading repository files afterward would verify through a side channel and couple tests to persistence layout. S2 asks Governance directly for its domain outcome and retrieves resulting versions through the same Interface used by its callers.

## S3 — Source Processing seam

**Public interface:** the Source Processing module's capture, availability, relinking, and Synthesis operations and returned domain outcomes.

**Decision rationale:** source provenance must survive replacement of both the PDF engine and the Paper Desk UI. This seam concentrates the distinction among source text, personal interpretation, agent inference, and proposed knowledge changes, rather than distributing those rules across highlight controls, view state, and repository code.

Source Processing is deep enough to warrant direct behavior tests: its small Interface hides locator integrity, attribution, classification, incomplete-capture state, source availability, relinking, target suggestions, and the rule that capture never implies Synthesis.

Critical behaviors:

- Capture preserves a known source identity and Source Locator.
- Classification and attribution remain visible after autosave and reopen.
- Synthesis considers only the selected Structured Annotations.
- Synthesis may produce a draft Proposal, a source link, an open question, or no knowledge change.
- Finishing a source never triggers Synthesis automatically.
- When a PDF is unavailable, existing annotations remain usable and relinking preserves their logical locators.

PDF fixtures provide independently known page text and locator values. Tests assert those literals rather than reproducing locator computation.

**Why not test only through Paper Desk or the PDF Adapter:** Paper Desk tests would entangle provenance rules with presentation, while the PDF Adapter can only promise that source material was resolved. Neither alone can prove that a capture remains correctly attributed, that Synthesis uses only selected annotations, or that relinking preserves logical Source Locators.

## S4 — Discovery seam

**Public interface:** the Discovery module's explicit Search, Ask, and Jump intentions and their mode-specific results.

**Decision rationale:** Search, Ask, and Jump share one visual input but carry materially different trust semantics. Search retrieves, Ask synthesizes a cited response, and Jump invokes navigation or a command. A generic input pipeline could blur those intentions and cause an Ask response to look like retrieved knowledge or a command to be interpreted as a question.

S4 gives those intentions one explicit caller Interface with mode-specific outcomes while hiding indexing, context assembly, model prompting, command lookup, authority classification, and unsupported-answer logic.

Critical behaviors:

- Search returns matching repository items with their authority class.
- Ask cites the exact fixture notes and Source Locators it used.
- Ask distinguishes Core Knowledge from Working Material, surfaces fixture conflicts, and returns an unsupported outcome when evidence is insufficient.
- Jump returns only known navigation or command targets and never interprets a command as an Ask request.
- No Discovery operation changes Working Material or Governed Knowledge.

The model is mocked only at its true external seam with a narrow Ask response. Repository search and authority rules remain real.

**Why not test only through S1 or a model mock:** S1 proves that the selected mode is visible and usable, but it is an inefficient place to enumerate authority and conflict cases. A model mock alone would only prove that an external response was returned. S4 proves the Workbench's own citation, authority, conflict, insufficiency, and non-mutation rules around that response.

## S5 — Adapter contracts

**Public interfaces:** the Knowledge Repository and PDF adapter interfaces.

**Decision rationale:** the Knowledge Repository and PDF seams each have at least two justified Adapters: a production Adapter and a deterministic test Adapter. They are therefore real seams rather than speculative abstractions. A defect or semantic mismatch could invalidate every higher-level test while still allowing the suite to pass against an unrealistic test implementation.

Contract behaviors:

- Each Knowledge Repository adapter preserves versions, attribution, Source Records, Source Locators, and the distinction between Working Material and Governed Knowledge.
- Each PDF adapter resolves the same fixture page and locator semantics or reports unavailability without discarding the Source Record.

Contract tests are shared across adapters. They do not assert filenames, SQL, parser calls, cache keys, or other implementation details unless such a detail is explicitly part of the adapter interface.

**Why S5 is separate from application behavior:** S1 through S4 legitimately use deterministic Adapters for speed and control. Shared contract tests provide the missing evidence that those Adapters and production Adapters preserve the same observable semantics. S5 tests conformance, not application rules.

The model provider is not included in S5. It is a true external dependency whose generative behavior cannot be made equivalent to a local test Adapter. The Workbench instead mocks the narrow external model Interface and verifies its own trust behavior at S4; provider-specific integration checks may be added later without becoming an application Test Seam.

## Why there are no additional Test Seams

The accepted architecture contains more Module Interfaces than confirmed Test Seams. This is deliberate.

- **Atlas, Studio, Paper Desk, and Proposal Review are not separate Test Seams.** Their meaningful behavior is visible through S1. Testing each UI adapter in isolation would encourage mocks of Workbench-owned Modules and couple tests to the initial presentation structure.
- **Workbench Session, Knowledge Authoring, and Learning are not separate Test Seams in V1.** Their critical behavior is currently economical to observe through S1. If a tracer bullet exposes dense rules that S1 cannot express without excessive setup, a new seam may be proposed rather than assumed.
- **Editor parsers, reducers, view models, caches, and routing helpers are Implementation details.** Tests reach them through the Module that owns their behavior.
- **The model provider is an External System Seam, not an application Test Seam.** A narrow Mock Adapter controls its responses while S4 verifies Galaxy Brain's behavior.

Adding tests at every Interface would reduce locality and bind the suite to the first decomposition. The accepted seams instead test where behavior is consequential and permit internal Modules to be combined, divided, or deepened without renegotiating tests unless their public observation point changes.

## Test data and mocks

Use a small, fixed example corpus whose expected outcomes are written independently of implementation:

- a reviewed “Bayesian statistics” topic with a known version;
- a Working Material draft that differs by a literal sentence;
- a PDF fixture with a known source identity, page number, passage, and equation;
- one supporting source and one conflicting source;
- a Proposal containing two changes with one explicit dependency; and
- a stale-target variant with a different literal version identifier.

Mocks are allowed only for true external dependencies such as a model provider. Prefer in-memory adapters for local-substitutable dependencies such as the repository. Inject clocks and identity sources when their outputs affect observable behavior.

## Prohibited test shapes

- Tests of private methods, reducers, view-model fields, component state, parser phases, or call ordering.
- Mocks of Workbench-owned modules merely to isolate a workspace.
- Assertions made by reading repository storage instead of using the public interface that retrieves the saved artifact.
- Snapshots whose expected output is produced by the same serializer under test.
- One bulk test suite written before any implementation.
- Refactoring mixed into a red-to-green cycle.

## Decision and change policy

S1 through S5 were explicitly confirmed as the V1 Test Seams on August 26, 2026. This decision establishes where tests may observe behavior; it does not freeze method names, type shapes, framework choices, or internal Module design.

If a tracer bullet reveals a missing or misplaced seam, implementation pauses before testing at the new location. Update this document with the proposed Interface, the critical behavior it protects, why an existing seam is insufficient, and the implementation freedom it preserves. Obtain explicit confirmation of that change before writing the test.
