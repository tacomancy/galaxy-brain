# Tracer Bullet 12: Separate Search, Ask, and Jump

Status: implementation complete; human acceptance remains open.

This brief coordinates TB12 in the [delivery plan](delivery-plan.md#12-separate-search-ask-and-jump). It is an implementation entry point, not a second authority for Product Decisions, Architecture, Repository Format, Test Strategy, or accepted ADR decisions.

## Problem Statement

The Knowledge Workbench needs one discoverable entry surface for finding repository material, asking an evidence-grounded question, and moving to a known destination. Those actions look similar to a person typing into one field, but they have different trust and side-effect semantics. A retrieved item must not look like an agent answer, a provider-backed answer must not look like Governed Knowledge, and a navigation command must not be interpreted as a question. Without explicit modes, the Workbench cannot make the transmission boundary, evidence, authority, or resulting action intelligible.

## Solution

Add a Discovery Module with an explicit `Search`, `Ask`, or `Jump` intention and a mode-specific result. Add one shared, keyboard-operable Discovery entry surface to the packaged Workbench with the selected mode visibly identified before execution.

Search performs local retrieval over the selected Knowledge Repository and remains usable without an Agent Provider. Ask assembles a bounded, cited context from repository material, presents a concise summary and the exact outbound OpenAI payload, and calls a narrow Model Adapter only after immediate explicit confirmation. Jump resolves only known Workbench destinations or commands and never sends a provider request. No Discovery operation mutates Working Material, Governed Knowledge, Learning Routes, or user progress.

## User Stories

1. As a Knowledge Workbench user, I want to choose Search, Ask, or Jump explicitly, so that I know what the same entry surface will do.
2. As a user working locally, I want Search to work without an API key, so that discovery does not depend on an Agent Provider.
3. As a user working locally, I want Jump to work without an API key, network, Git, or GitHub, so that navigation remains a local capability.
4. As a user, I want Search results to identify the matching repository item, item kind, authority class, and source location when available, so that retrieval is distinguishable from interpretation.
5. As a user, I want Search to return no-match explicitly, so that an empty result is not mistaken for a failed operation.
6. As a user, I want Search to preserve deterministic result order, so that the same repository and query produce an understandable result.
7. As a user, I want to open a Search result in the relevant Workbench destination, so that retrieval leads to useful local work.
8. As a user, I want Ask to show the target operation, OpenAI destination, pinned model, prompt, selected context, authority categories, citations, and estimated request size before transmission, so that I can make an informed decision.
9. As a user, I want to inspect the exact outbound Ask payload, so that the confirmation applies to the actual request rather than a vague description.
10. As a user, I want to remove a whole Ask context item before confirmation, so that I can narrow the request without editing hidden payload text.
11. As a user, I want removing context to regenerate both the summary and exact payload, so that the review remains truthful.
12. As a user, I want declining or canceling Ask to make no provider request and leave local state unchanged, so that review is a real privacy boundary.
13. As a user, I want Ask to return a clear unavailable-provider outcome without a configured provider, so that a missing key is not presented as a blank or partial answer.
14. As a user, I want Ask to return an explicit unsupported outcome when the selected repository evidence is insufficient, so that the Workbench does not invent an answer.
15. As a user, I want a successful Ask response to cite exact repository items and Source Locators, so that I can inspect the evidence.
16. As a user, I want an Ask response to distinguish Core Knowledge, Source Records, and Working Material, so that evidence is not silently promoted to authority.
17. As a user, I want Ask to surface conflicting evidence and uncertainty, so that a concise answer cannot hide meaningful disagreement.
18. As a user, I want Ask output to remain transient unless I explicitly save it, so that prompts, context, and responses are not retained unexpectedly.
19. As a user, I want any explicitly saved Ask result to retain agent provenance and source references, so that its origin remains inspectable.
20. As a user, I want saved Ask results to remain Working Material until normal Proposal and Judgment Governance, so that an agent response cannot become Governed Knowledge automatically.
21. As a user, I want Jump to resolve a known destination such as Atlas, Studio, Paper Desk, a topic, or a Source Record, so that I can move through the repository quickly.
22. As a user, I want an unknown Jump command to return an explicit not-found outcome, so that the Workbench does not guess or execute arbitrary commands.
23. As a user, I want Jump to preserve the current Workbench context when a destination supports it, so that navigation does not discard the item I am working on.
24. As a keyboard user, I want the mode selector, entry field, results, confirmation controls, and Jump destinations to be reachable with the keyboard, so that discovery does not require a pointer.
25. As a screen-reader user, I want the selected mode, result status, citations, provider state, and confirmation boundary announced semantically, so that trust-relevant state is not conveyed by color alone.
26. As a user, I want the Discovery surface to remain readable in both themes and at enlarged text sizes, so that mode and authority distinctions remain usable.
27. As a repository owner, I want Discovery to read the selected repository only, so that Search and Ask never mix repositories or scan sibling directories.
28. As a repository owner, I want Discovery to avoid writing files during retrieval, Ask preparation, Ask decline, Ask cancellation, Jump, or provider-unavailable outcomes, so that discovery cannot create hidden knowledge changes.

## Implementation Decisions

### Documentation prerequisite

Before writing behavior tests or implementation code, explicitly complete these to-do items:

1. Review the accepted [Product Decisions](product-decisions.md), [Architecture](architecture.md), [Repository Format](repository-format.md), [Test Strategy](test-strategy.md#s4--discovery-seam), applicable ADRs 0007 and 0010–0014, the completed TB1–TB11 and TB15–TB16 records, and the current TB12–TB14 scope decision.
2. Create or update this guidance-compliant TB12 specification with the Public Behavior, confirmed Test Seam, literal expected values, minimum vertical path, boundaries, deferrals, discarded alternatives, acceptance evidence, and required confirmation.
3. Confirm that Search, Ask, and Jump are distinct caller intentions even though they share one visual entry surface; the Discovery Module owns the semantic distinction and the renderer only presents its outcomes.
4. Confirm that Ask reuses the existing explicit-confirmation and transient-result rules rather than creating a second confirmation or persistence policy.
5. Confirm that no implementation begins until the Public Behavior, Test Seam, independently known expected values, and minimum vertical path below are reviewed.

The TB12 implementation is authorized to proceed from this brief under the user's standing approval of intermediate slices. If implementation reveals a new Repository Format field, a second state authority, or an unconfirmed Test Seam, stop and update this brief and the governing document before continuing.

### Public Discovery Interface

The Discovery Module exposes one caller Interface with three explicit operations and discriminated, mode-specific outcomes:

- `search` accepts a non-empty query and returns `found` with ordered result records or `no-match` with the normalized query. Each result includes a stable item identity, title, item kind, authority class, a short repository-derived match excerpt, and zero or more source references or Source Locators. Invalid input returns `invalid-query`.
- `prepareAsk` accepts a non-empty human-facing prompt and a non-empty list of explicitly selected context-item identities. It returns `preview-ready` with a concise summary, OpenAI destination, pinned model identifier, estimated request size, authority categories, cited context references, and the exact payload. It performs no external request and no repository mutation. The caller obtains selectable context candidates through the same Discovery Module and sends the final selected identities back unchanged.
- `removeAskContextItem` accepts a pending preview and a whole context-item identity and returns a new `preview-ready` result with both the summary and exact payload regenerated. It never performs inline character redaction.
- `confirmAsk` accepts only the final preview and one of `confirmed`, `declined`, or `canceled`. Confirmation is the only path that may call the Model Adapter. Decline and cancel return explicit no-action outcomes.
- `jump` accepts a non-empty command or known target token and returns `resolved` with a typed Workbench destination, or `not-found` with the original command. It never calls the Model Adapter.

The exact TypeScript names may change during implementation, but the operation distinction and outcome vocabulary are stable. The Module hides indexing, context assembly, authority classification, command lookup, unsupported-answer logic, and provider composition from its callers.

### Search behavior

Search is case-insensitive substring retrieval over the selected repository's discoverable portable items. The first implementation indexes topic files, every supported Source Record category, Structured Annotations, and explicitly saved JSON Synthesis results that are already readable through existing repository Adapters. It does not perform fuzzy matching, semantic embeddings, web search, or cross-repository discovery. Filesystem failures return an explicit repository-unavailable outcome rather than an empty successful result.

Results are ordered by item kind priority—topic, Source Record, Structured Annotation, saved Synthesis result—then by stable item identity. A match in a title is ranked before a match in body text; ties retain the stable ordering. The result carries the authority class from the item's state and type: Core Knowledge, Source Record, or Working Material. Search does not summarize or reinterpret a match.

### Ask behavior and Model Adapter boundary

Ask assembles only the explicitly selected context. The first TB12 fixture uses the `bayesian-statistics` topic and the two known source-claim annotations. Each context item carries its identity, title, exact text or bounded summary, authority class, Source Record reference, and Source Locator when available. The Module must preserve conflicts and uncertainty supplied by its repository context; it must not collapse contradictory claims into one authoritative fact.

The preview includes the exact operation, destination, pinned model, prompt, and context in the payload shown to the user. The Model Adapter receives exactly that final payload and cannot add context. Until `confirmed`, no Model Adapter method is called. The existing `Source Processing` confirmation policy remains the governing rule for outbound requests and the existing Synthesis result lifecycle remains the persistence policy for explicitly saved agent output.

TB12 does not expose a model picker. Test and review mode uses the deterministic model label `fixture-pinned-model` and a narrow fixture Model Adapter. Normal launches without a configured production Model Adapter return `agent-provider-unavailable`; they do not prompt at startup, contact the network, or weaken provider-free Search and Jump. A later provider-enabled slice may wire the OpenAI API through the same narrow boundary and a single ADR-0011-compliant pinned model; that work is explicitly deferred here.

The fixture Model Adapter returns a structured Ask response with answer text, citations, authority classifications, uncertainty, and conflicts. The Module validates the response shape and returns `operation-failed` for an invalid external response rather than displaying an apparently successful partial answer. Unsupported evidence is a local Module outcome and does not require a provider request.

### Jump behavior

The first known Jump targets are the three primary Workbench destinations (`atlas`, `studio`, and `paper-desk`) and discoverable topic, Source Record, Structured Annotation, and saved Synthesis result identities. The command matching is explicit and case-insensitive for the documented labels; it does not parse arbitrary shell commands, URLs, file paths, or natural-language questions. A resolved topic or saved Synthesis result carries its topic identity into Studio; a resolved Source Record or annotation carries its Source Record identity into Paper Desk. Unknown input returns `not-found` and leaves session state unchanged.

### S1 entry surface

The renderer adds one shared Discovery card to the selected-repository Workbench shell, above the workspace-specific content. It contains:

- an explicit mode control labeled Search, Ask, or Jump;
- one labeled text input whose submit action is mode-specific;
- an Ask context-selection list whose checked identities are sent explicitly in the preview payload;
- mode-specific result and status regions;
- Ask preview summary and expandable exact payload before confirmation;
- whole-item context removal that regenerates the preview; and
- visible provider-unavailable, unsupported, no-match, not-found, and no-action outcomes.

The selected mode remains visible while a result is shown. Search and Jump controls remain enabled when no Agent Provider is configured. Ask's provider-unavailable result does not hide or disable them. Existing Atlas, Studio, Paper Desk, and Proposal Review navigation remains the one state authority; Discovery invokes existing transitions rather than creating a parallel router or internal tab system.

### Persistence and authority

Search, Ask preparation, Ask decline/cancel, provider-unavailable, unsupported Ask, and Jump do not write repository content. A successful Ask response is transient until an existing explicit save action is used. If saved through the existing Synthesis result lifecycle, the result retains agent-generated provenance, operation, provider/model, generation timestamp, and source references; the default save excludes prompt and context, while the explicit save-with-prompt/context option retains only the human-facing prompt, selected references/locators, and concise point-in-time context summaries—not full excerpts or hidden payloads. Saved output remains Working Material and requires normal Proposal/Judgment Governance before any governed change.

### Literal expected values

The initial deterministic fixture uses these independent values:

- query: `Bayesian`;
- topic: `bayesian-statistics`, title `Bayesian statistics`, authority `Core Knowledge`;
- Source Record: `bayesian-statistics-fixture-source`, title `Bayesian statistics fixture source`, authority `Source Record`;
- annotation 1: `annotation-bayesian-statistics-fixture-source-page-2-0-54`, text `Bayesian inference updates prior belief with evidence.`, state `working-material`, Source Locator `page:2#chars=0-54`;
- annotation 2: `annotation-bayesian-statistics-fixture-source-page-2-55-83`, text `Evidence updates confidence.`, state `working-material`, Source Locator `page:2#chars=55-83`;
- Ask prompt: `What does the fixture say about Bayesian inference?`;
- provider destination: `OpenAI API`;
- test model: `fixture-pinned-model`;
- known Jump labels: `Atlas`, `Studio`, `Paper Desk`, `Bayesian statistics`, and `Bayesian statistics fixture source`;
- unknown Jump command: `launch the moon console`;
- unsupported Ask prompt: `What is the capital of Mars?`;
- expected unsupported outcome: explicit `unsupported` with no provider call;
- expected missing-provider outcome: explicit `agent-provider-unavailable` with no repository mutation.

Tests must assert these literals directly. They must not derive expected result order, citations, authority labels, payloads, or destinations by calling the implementation's indexer, formatter, or command resolver.

### Confirmed Test Seam

Use the accepted S4 Discovery seam through the public Discovery Module Interface. Compose the real Discovery Module with a deterministic repository Adapter backed by the checked-in synthetic fixture and a narrow Model Adapter only at the external provider boundary. Repository retrieval, authority classification, context selection, unsupported logic, conflict/uncertainty preservation, and non-mutation rules remain real Module behavior. The Model Adapter may be mocked only for the confirmed outbound boundary and must receive a narrow operation-specific Ask payload.

The packaged S1 workflow uses the existing silent Electron test mode and the selected fixture Knowledge Repository. It must observe visible mode labels, result/status regions, focus, navigation transitions, exact Ask preview data, no-call decline behavior, provider-unavailable behavior, and unchanged local state. It must not inspect React state, private Module fields, storage files as a UI side channel, or implementation-specific CSS selectors beyond stable accessible labels and outcome markers.

S5 Adapter coverage is supporting evidence only if a production repository Discovery Adapter or production OpenAI Adapter is introduced in this TB. It should prove the Adapter contract without claiming that a provider integration exists when the production Adapter remains deferred.

### Minimum vertical path

1. Complete the documentation prerequisite above and link this brief from the TB12 delivery record.
2. Add a failing S4 Search test for the literal `Bayesian` query and implement only local deterministic retrieval and authority-bearing results.
3. Add failing S4 Jump tests for `Atlas` and the unknown command; implement known-target resolution without provider or repository mutation.
4. Add failing S4 Ask preview tests for the literal prompt, exact payload, citations, authority categories, and provider destination/model; implement preparation without a Model Adapter call.
5. Add a failing S4 context-removal test; implement whole-item removal and regenerated summary/payload.
6. Add failing S4 Ask confirmation tests for confirmed, declined, canceled, unsupported, and provider-unavailable outcomes; reuse the existing confirmation/persistence policies and narrow fixture Model Adapter boundary.
7. Add the S1 Discovery card and packaged workflow tests for mode visibility, explicit Ask context selection, Search/Jump without a provider, Ask preview/decline, unavailable/unsupported outcomes, Jump transitions, keyboard operation, accessible status, stale-result isolation, and theme readability.
8. Run focused S4 tests, relevant S1 workflows, `npm run check`, `npm run test:coverage`, `npm run lint:complexity`, packaging, and documentation validation. Record Red/Green evidence before human acceptance.

## Testing Decisions

- Tests assert public behavior and discriminated outcomes, not index structures, React state, helper functions, storage layout, or provider SDK details.
- S4 owns dense Discovery rules: exact Search matching and ordering, authority labels, context selection, citations, conflicts, uncertainty, unsupported logic, no-mutation, and provider-boundary outcomes.
- S1 owns the assembled packaged workflow: explicit mode visibility, accessible entry and result presentation, visible exact Ask payload, decline/no-call behavior, provider-free local operation, and existing context transitions.
- The Model Adapter is mocked only at the true external seam. The repository Adapter and Discovery policy remain real in S4 tests.
- Expected values are the literal fixture identities, text, locators, labels, outcomes, and payload fields above. A test must not ask the implementation to generate its own oracle.
- Prior art is the S3 Source Processing confirmation suite and `review-synthesis-confirmation.e2e.ts`: use operation-specific discriminated outcomes, narrow request-observation Adapters, and the silent packaged harness.
- If the S1 workflow needs an unconfirmed seam, pause and amend Test Strategy with rationale before adding the test.

## Out of Scope

TB12 does not add semantic/vector search, fuzzy ranking, web search, multi-repository indexes, background indexing, cross-repository retrieval, arbitrary command execution, shell or URL launching, a fourth workspace, a new router, internal tabs, or an unrestricted command language.

It does not add automatic Ask requests, remembered or blanket consent, inline payload editing, whole-repository upload, prompt/context retention by default, automatic saves, automatic Proposals, automatic Governance, Generated Relationships, learning-progress changes, or any direct change to Governed Knowledge.

It does not add the production OpenAI API Adapter, provider credential UI, OAuth, dynamic model discovery, model switching, or other providers. The boundary and provider-unavailable outcome are implemented and tested; live provider transmission remains a separately documented provider-enabled slice using the same confirmation contract and one pinned model.

It does not redesign Atlas cards, Studio authoring, Paper Desk reading, Proposal Review, source import, PDF processing, saved-result freshness, or the Repository Format. It reuses existing context transitions and Synthesis result persistence rather than creating duplicate state or storage.

## Deferred Work and Discarded Alternatives

The following work is explicitly deferred, not accidentally unsupported:

- Production OpenAI transmission and machine-local provider configuration integration remain a later provider-enabled slice; TB12 proves the exact boundary, unavailable behavior, and deterministic fixture path.
- A richer index, semantic ranking, incremental indexing, and search filters remain future work until a behavior slice demonstrates the need.
- Arbitrary Jump grammar, external URL/file launching, and user-defined commands remain deferred for security and scope reasons.
- Multi-repository Search/Ask and shared indexes remain deferred because the current Workbench has one explicitly selected repository and must not infer cross-repository scope.
- Full Ask save UI for prompt/context choice is reused from the existing Synthesis lifecycle; a new duplicate persistence format is deferred and prohibited by this brief.
- Generated Relationship and learning-progress suggestions remain provider-dependent future capabilities and are not silently folded into Ask.

Discarded alternatives:

- **Infer the mode from natural language:** discarded because an inferred mode can turn a command into a provider request or make an Ask answer look like retrieval. A suggestion may be added later, but the selected mode must be visible and explicit before execution.
- **Use one generic result type for all three operations:** discarded because retrieval, synthesis, and navigation have different authority, privacy, and side-effect guarantees.
- **Let the Model Adapter search the repository:** discarded because the Module must own scope, authority classification, citation selection, and the exact outbound payload; the provider cannot add hidden context.
- **Return a blank answer when evidence or provider configuration is missing:** discarded because unsupported and unavailable are meaningful user-facing outcomes.
- **Persist every Ask request for convenience:** discarded by ADR 0013; explicit save is the only retention boundary.
- **Implement Jump as shell execution or arbitrary URL opening:** discarded because it violates the local safety boundary and makes command interpretation unbounded.
- **Build a second Synthesis persistence path for Ask:** discarded because the existing Source Processing result lifecycle already owns provenance, explicit save, Working Material status, and stale-context policy.

## Acceptance Gates

1. S4 Search: literal fixture query returns independently expected ordered results, authority classes, and locators; saved JSON results and supported Source Record categories are discoverable; no-match and repository-unavailable states are explicit.
2. S4 Jump: known labels resolve to typed destinations; unknown command is explicit; no provider or repository mutation occurs.
3. S4 Ask preparation: selected mode, explicit checked context identities, summary, destination, model, context, citations, and exact payload are caller-visible before any Model Adapter call; omitted context is unsupported rather than inferred from prompt words.
4. S4 Ask safety: whole-context removal regenerates both preview views; decline/cancel make no call and change no local state; unsupported and provider-unavailable outcomes are explicit.
5. S4 Ask evidence: successful fixture response preserves citations that belong to the submitted context, authority distinctions, conflicts, uncertainty, and transient/no-retention behavior; explicit save remains deferred to the existing Synthesis lifecycle.
6. S1 packaged workflow: the shared entry surface visibly identifies the mode, remains usable without a provider, carries known targets into existing workspaces, and exposes accessible focus/status behavior in both themes.
7. Verification: focused and full automated checks, coverage, complexity, packaging, and documentation validation pass; no unrelated TB scope is changed.
8. Human acceptance: the user verifies the packaged workflow and explicitly accepts or rejects TB12. Implementation or passing CI must not be recorded as human acceptance.

## Further Notes

TB12 is complete only when the implementation, automated evidence, packaged S1 review, and explicit human acceptance are recorded in the delivery plan and Issue #31. The implementation and automated evidence are now recorded on this branch; the TB12 scope decision remains “in scope for V1” and the human release gate remains open.
