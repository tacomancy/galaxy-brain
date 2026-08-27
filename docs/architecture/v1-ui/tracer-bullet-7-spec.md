# Tracer Bullet 7: Synthesize selected evidence explicitly

Status: preview preparation, context removal, confirmed handoff, decline/cancel preservation, provider-unavailable handling, transient result handling, default explicit save, and opt-in prompt/context snapshot implemented on August 27, 2026; remaining TB7 cycles are pending.

This tracer bullet adds the first provider-dependent Agentic Capability to the accepted provider-free Source Processing path. It makes Synthesis an explicit, inspectable, user-authorized operation over selected Structured Annotations. It does not make an Agent Provider a prerequisite for the Workbench or promote generated output to Governed Knowledge.

## Public Behavior

The first vertical behavior is **prepare a Synthesis preview**. From the fixture Source Record, the `Bayesian statistics` topic, and the selected source-claim Structured Annotation, the S3 Source Processing Interface returns:

- a concise summary identifying the `Synthesize into topic` operation, the selected topic, the selected Source Record, the content category, the configured Agent Provider destination, and the request size;
- an inspectable exact outbound payload containing only the selected annotation and target topic context; and
- a preview state that has made no Agent Provider request and has not changed local Working Material.

Later vertical cycles extend this same behavior to whole-context-item removal and preview regeneration, explicit confirmation, the literal draft Proposal fixture returned by a confirmed provider response, decline/cancel preservation, unavailable-provider handling, non-retention, and explicit save.

## Test Seam and expected values

Use the already confirmed S3 Source Processing seam through the public Source Processing Interface. The first cycle uses a deterministic in-memory Source Processing setup and a narrow request-observation Adapter only where the external Model seam is reached in a later cycle. Do not mock the Source Processing Module or inspect renderer state, storage layout, private reducers, or payload-building helpers as a side channel.

The independently known first-cycle fixture values are:

- Topic: `bayesian-statistics`, `Bayesian statistics`.
- Source Record: `bayesian-statistics-fixture-source`, `Bayesian statistics fixture source`.
- Structured Annotation: `annotation-bayesian-statistics-fixture-source-page-2-0-54`.
- Text: `Bayesian inference updates prior belief with evidence.`
- Source Locator: `page:2#chars=0-54`.
- Attribution and classification: `source-claim`.
- Material state: `working-material`.
- Operation: `synthesize-into-topic`.
- Provider destination: `OpenAI API`.
- First-cycle model fixture: `fixture-pinned-model`.
- First-cycle summary: `Synthesize 1 selected source claim into "Bayesian statistics" using model "fixture-pinned-model" via OpenAI API; 54 source characters selected.`
- Default saved result identity: `synthesis-result-bayesian-statistics-fixture`.
- Default saved result timestamp: `2026-08-27T20:30:00.000Z`.
- Default saved result remains `working-material` and carries `agent-generated` attribution, provider `OpenAI API`, model `fixture-pinned-model`, operation `synthesize-into-topic`, and the selected Source Record/Source Locator references.
- The default saved result does not contain the human-facing prompt, full source excerpts, or the hidden request/response payload.

The first-cycle model fixture makes the preview contract deterministic without selecting a production model or exposing model choice to users. The exact pinned OpenAI model identifier is intentionally deferred until the provider-enabled cycle selects and records it, as required by ADR 0011. The preview must nevertheless expose the model field as part of the provider request contract before any request can be confirmed.

## Minimum vertical path

1. Review the accepted Product Decisions, Architecture, Repository Format, Test Strategy, applicable ADRs, TB1–TB6 delivery records, and the existing Source Processing Interface.
2. Add the public Synthesis input, preview, and outcome types to the Source Processing Module without exposing provider SDK types or storage layout.
3. Build the first preview from the selected annotation and topic context using literal, independently asserted expected values.
4. Add one S3 behavior test, observe its expected failure, and implement only the preview behavior needed to make it pass.
5. Add later cycles one behavior at a time for context removal, confirmation/provider response, decline, unavailable provider, non-retention, and explicit save.
6. Add S1 presentation only after the S3 behavior is green and the user-facing confirmation boundary has a stable Module Interface.

## External System Seams

- **Model Adapter:** the OpenAI API is the only V1 Agent Provider. It is optional, configured through the machine-local `.env`, and mocked narrowly with an operation-specific response at the external boundary. The Adapter cannot add context after confirmation or persist request/response bodies.
- **Working Material Adapter:** selected Structured Annotations remain available and unchanged when a preview is declined, canceled, or unavailable. Explicit saves use the ordinary repository artifact lifecycle and preserve agent provenance.
- **Machine-local configuration:** provider configuration and the eventual pinned model identifier remain outside the Knowledge Repository and are never logged or returned with secrets.

## Boundaries and deferrals

This tracer bullet does not add automatic Synthesis, background requests, blanket or remembered consent, arbitrary inline payload editing, whole-repository upload, dynamic model selection, additional providers, or provider-required startup. It does not apply changes to Governed Knowledge, create an applied Proposal, or bypass Governance. It does not persist request or response bodies automatically, expose hidden API payloads, or place credentials in repository content.

The following are separate later cycles within TB7: no-context user-only confirmation, removal and regenerated previews, exact final-payload confirmation, decline/cancel with no request, provider-unavailable outcomes, result non-retention, default save, explicit save-with-prompt/context, agent provenance through human edits, source-context snapshots, stale-context warnings, result versioning, regeneration, and restore. Each new network request requires a fresh confirmation.

## Acceptance evidence

The first cycle is accepted only when the S3 behavior test asserts the exact fixture values, preview summary, and exact payload through the public Interface and demonstrates that no provider request or Working Material mutation occurs. The complete TB7 slice additionally requires focused S3 evidence for every confirmation, privacy, provider, save, and snapshot rule, relevant S5 Adapter contracts, the packaged S1 confirmation presentation, the full `check` gate, and the full packaged workflow suite. Manual review must confirm that the operation, destination, model, selected context, content category, request size, exact payload, whole-item removal, regenerated preview, confirmation, decline, and unavailable states are legible and keyboard-operable.

## Required confirmation

S1–S5 are the accepted V1 Test Seams. The first TB7 behavior uses S3, which is already confirmed by the accepted Test Strategy. If implementation reveals that the confirmation boundary cannot be observed through S3 and S1 without introducing an unconfirmed seam, pause, update the Test Strategy with the proposed seam and rationale, and obtain explicit confirmation before writing that test.
