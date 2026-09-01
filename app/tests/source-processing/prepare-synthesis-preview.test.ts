import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createFixturePdfAdapter } from "../../src/adapters/pdf/fixture-pdf-adapter";
import { createInMemoryWorkingMaterialRepository } from "../../src/adapters/working-material/in-memory-working-material-repository";
import {
  createSourceProcessing,
  type SynthesisModelAdapter,
  type SynthesisPayload,
  type SynthesisSavedResult,
  type SynthesisSourceIdentityAdapter,
  type SourceProcessingDiagnostics,
  type StructuredAnnotation,
  type WorkingMaterialRepository,
  type SynthesisResultRepository,
} from "../../src/modules/source-processing";

const expectedAnnotation: StructuredAnnotation = {
  id: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
  state: "working-material",
  sourceRecord: {
    id: "bayesian-statistics-fixture-source",
    title: "Bayesian statistics fixture source",
  },
  sourceLocator: {
    page: 2,
    start: 0,
    end: 54,
    logical: "page:2#chars=0-54",
  },
  text: "Bayesian inference updates prior belief with evidence.",
  attribution: "source-claim",
  classification: "source-claim",
};

const secondAnnotation: StructuredAnnotation = {
  ...expectedAnnotation,
  id: "annotation-bayesian-statistics-fixture-source-page-2-55-83",
  sourceLocator: {
    page: 2,
    start: 55,
    end: 83,
    logical: "page:2#chars=55-83",
  },
  text: "Evidence updates confidence.",
};

const synthesisInput = {
  targetTopic: {
    id: "bayesian-statistics",
    title: "Bayesian statistics",
  },
  selectedAnnotations: [expectedAnnotation, secondAnnotation],
  provider: {
    destination: "OpenAI API",
    model: "fixture-pinned-model",
  },
};

describe("Synthesize selected evidence", () => {
  it("prepares an exact preview from the selected source claim", async () => {
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
    });

    assert.deepEqual(
      await sourceProcessing.prepareSynthesis({
        targetTopic: {
          id: "bayesian-statistics",
          title: "Bayesian statistics",
        },
        selectedAnnotations: [expectedAnnotation],
        provider: {
          destination: "OpenAI API",
          model: "fixture-pinned-model",
        },
      }),
      {
        outcome: "preview-ready",
        preview: {
          summary:
            'Synthesize 1 selected source claim into "Bayesian statistics" using model "fixture-pinned-model" via OpenAI API; 54 source characters selected.',
          estimatedRequestSize: 54,
          provider: {
            destination: "OpenAI API",
            model: "fixture-pinned-model",
          },
          payload: {
            operation: "synthesize-into-topic",
            model: "fixture-pinned-model",
            targetTopic: {
              id: "bayesian-statistics",
              title: "Bayesian statistics",
            },
            context: [
              {
                kind: "structured-annotation",
                annotationId:
                  "annotation-bayesian-statistics-fixture-source-page-2-0-54",
                text: "Bayesian inference updates prior belief with evidence.",
                sourceRecord: {
                  id: "bayesian-statistics-fixture-source",
                  title: "Bayesian statistics fixture source",
                },
                sourceLocator: "page:2#chars=0-54",
                attribution: "source-claim",
                classification: "source-claim",
                state: "working-material",
              },
            ],
          },
        },
      },
    );
  });

  it("applies the confirmation boundary to a user-only request without context", async () => {
    let requestCount = 0;
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model: {
        requestSynthesis: async () => {
          requestCount += 1;
          return {
            outcome: "draft-proposal" as const,
            draft: {
              title: "User-only Synthesis",
              text: "This result should not be produced before confirmation.",
            },
          };
        },
      },
    });

    const preview = await sourceProcessing.prepareSynthesis({
      targetTopic: synthesisInput.targetTopic,
      selectedAnnotations: [],
      provider: synthesisInput.provider,
      prompt: "Explain Bayesian inference in one sentence.",
    });

    assert.deepEqual(preview, {
      outcome: "preview-ready",
      preview: {
        summary:
          'Synthesize with no repository-derived context into "Bayesian statistics" using model "fixture-pinned-model" via OpenAI API; 0 source characters selected. Prompt: "Explain Bayesian inference in one sentence.".',
        estimatedRequestSize: 0,
        provider: {
          destination: "OpenAI API",
          model: "fixture-pinned-model",
        },
        prompt: "Explain Bayesian inference in one sentence.",
        payload: {
          operation: "synthesize-into-topic",
          model: "fixture-pinned-model",
          targetTopic: {
            id: "bayesian-statistics",
            title: "Bayesian statistics",
          },
          context: [],
          prompt: "Explain Bayesian inference in one sentence.",
        },
      },
    });

    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.confirmSynthesis({
        preview: preview.preview,
        confirmation: "declined",
      }),
      { outcome: "declined" },
    );
    assert.equal(requestCount, 0);
  });

  it("removes one whole context item and regenerates the preview", async () => {
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
    });
    const initial = await sourceProcessing.prepareSynthesis(synthesisInput);

    assert.equal(initial.outcome, "preview-ready");
    if (initial.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.removeSynthesisContextItem({
        preview: initial.preview,
        annotationId: expectedAnnotation.id,
      }),
      {
        outcome: "preview-ready",
        preview: {
          summary:
            'Synthesize 1 selected source claim into "Bayesian statistics" using model "fixture-pinned-model" via OpenAI API; 28 source characters selected.',
          estimatedRequestSize: 28,
          provider: {
            destination: "OpenAI API",
            model: "fixture-pinned-model",
          },
          payload: {
            operation: "synthesize-into-topic",
            model: "fixture-pinned-model",
            targetTopic: {
              id: "bayesian-statistics",
              title: "Bayesian statistics",
            },
            context: [
              {
                kind: "structured-annotation",
                annotationId:
                  "annotation-bayesian-statistics-fixture-source-page-2-55-83",
                text: "Evidence updates confidence.",
                sourceRecord: {
                  id: "bayesian-statistics-fixture-source",
                  title: "Bayesian statistics fixture source",
                },
                sourceLocator: "page:2#chars=55-83",
                attribution: "source-claim",
                classification: "source-claim",
                state: "working-material",
              },
            ],
          },
        },
      },
    );
  });

  it("rejects an empty preview without a prompt or valid target", async () => {
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
    });

    assert.deepEqual(
      await sourceProcessing.prepareSynthesis({
        targetTopic: { id: "", title: "" },
        selectedAnnotations: [],
        provider: { destination: "", model: "" },
      }),
      {
        outcome: "invalid-selection",
        detail: "Synthesis requires a target topic and selected evidence.",
      },
    );
  });

  it("does not leave a preview when removing its only context item without a prompt", async () => {
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
    });
    const initial = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(initial.outcome, "preview-ready");
    if (initial.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.removeSynthesisContextItem({
        preview: initial.preview,
        annotationId: expectedAnnotation.id,
      }),
      {
        outcome: "invalid-selection",
        detail: "Synthesis requires a target topic and selected evidence.",
      },
    );
  });

  it("sends only the confirmed exact payload to the Model Adapter", async () => {
    const requests: unknown[] = [];
    const model: SynthesisModelAdapter = {
      requestSynthesis: async (payload) => {
        requests.push(payload);
        return {
          outcome: "draft-proposal",
          draft: {
            title: "Bayesian statistics synthesis",
            text: "Bayesian inference updates prior belief with evidence.",
          },
        };
      },
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model,
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.confirmSynthesis({
        preview: preview.preview,
        confirmation: "confirmed",
      }),
      {
        outcome: "draft-proposal",
        draft: {
          title: "Bayesian statistics synthesis",
          text: "Bayesian inference updates prior belief with evidence.",
        },
      },
    );
    assert.deepEqual(requests, [preview.preview.payload]);
  });

  it("retains only sanitized diagnostics when a provider request fails", async () => {
    const diagnostics: unknown[] = [];
    const diagnosticSink: SourceProcessingDiagnostics = {
      record: (diagnostic) => diagnostics.push(diagnostic),
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      diagnostics: diagnosticSink,
      model: {
        requestSynthesis: async () => {
          throw new Error(
            "GB_PRIVACY_PROVIDER_ERROR /private/fixture/prompt-and-payload",
          );
        },
      },
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.confirmSynthesis({
        preview: preview.preview,
        confirmation: "confirmed",
      }),
      {
        outcome: "operation-failed",
        detail: "The Synthesis request could not be completed.",
      },
    );
    assert.deepEqual(diagnostics, [
      { category: "source-processing", operation: "request-synthesis" },
    ]);
    assert.doesNotMatch(
      JSON.stringify(diagnostics),
      /GB_PRIVACY_PROVIDER_ERROR/u,
    );
    assert.doesNotMatch(JSON.stringify(diagnostics), /\/private\/fixture/u);
  });

  it("preserves the preview and makes no request when declined or canceled", async () => {
    const requests: unknown[] = [];
    const model: SynthesisModelAdapter = {
      requestSynthesis: async (payload) => {
        requests.push(payload);
        return {
          outcome: "draft-proposal",
          draft: {
            title: "Bayesian statistics synthesis",
            text: "Bayesian inference updates prior belief with evidence.",
          },
        };
      },
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model,
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.confirmSynthesis({
        preview: preview.preview,
        confirmation: "declined",
      }),
      { outcome: "declined" },
    );
    assert.deepEqual(
      await sourceProcessing.confirmSynthesis({
        preview: preview.preview,
        confirmation: "canceled",
      }),
      { outcome: "canceled" },
    );
    assert.deepEqual(requests, []);
    assert.deepEqual(preview.preview.payload.context, [
      {
        kind: "structured-annotation",
        annotationId:
          "annotation-bayesian-statistics-fixture-source-page-2-0-54",
        text: "Bayesian inference updates prior belief with evidence.",
        sourceRecord: {
          id: "bayesian-statistics-fixture-source",
          title: "Bayesian statistics fixture source",
        },
        sourceLocator: "page:2#chars=0-54",
        attribution: "source-claim",
        classification: "source-claim",
        state: "working-material",
      },
    ]);
  });

  it("reports provider unavailable without changing selected evidence", async () => {
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.confirmSynthesis({
        preview: preview.preview,
        confirmation: "confirmed",
      }),
      {
        outcome: "agent-provider-unavailable",
        detail: "Synthesis requires a configured Agent Provider.",
      },
    );
    assert.equal(
      preview.preview.payload.context[0]?.text,
      expectedAnnotation.text,
    );
  });

  it("passes through a Model Adapter provider-unavailable outcome", async () => {
    let requestCount = 0;
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model: {
        requestSynthesis: async () => {
          requestCount += 1;
          return {
            outcome: "agent-provider-unavailable" as const,
            detail: "The configured Agent Provider is unavailable.",
          };
        },
      },
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.confirmSynthesis({
        preview: preview.preview,
        confirmation: "confirmed",
      }),
      {
        outcome: "agent-provider-unavailable",
        detail: "The configured Agent Provider is unavailable.",
      },
    );
    assert.equal(requestCount, 1);
    assert.equal(
      preview.preview.payload.context[0]?.text,
      expectedAnnotation.text,
    );
  });

  it("sanitizes a Model Adapter failure and leaves selected evidence unchanged", async () => {
    const causes: unknown[] = [];
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model: {
        requestSynthesis: async () => {
          throw new Error("private provider response details");
        },
      },
      diagnostics: { record: (cause) => causes.push(cause) },
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.confirmSynthesis({
        preview: preview.preview,
        confirmation: "confirmed",
      }),
      {
        outcome: "operation-failed",
        detail: "The Synthesis request could not be completed.",
      },
    );
    assert.deepEqual(causes, [new Error("private provider response details")]);
    assert.equal(
      preview.preview.payload.context[0]?.text,
      expectedAnnotation.text,
    );
  });

  it("returns the draft transiently without automatically saving it", async () => {
    let saveCalls = 0;
    const workingMaterial: WorkingMaterialRepository = {
      saveAnnotation: async () => {
        saveCalls += 1;
      },
      readAnnotation: async () => ({
        outcome: "not-found",
        detail: "The source annotation was not found.",
      }),
      readAnnotationForSourceRecord: async () => ({
        outcome: "not-found",
        detail: "The source annotation was not found.",
      }),
    };
    const model: SynthesisModelAdapter = {
      requestSynthesis: async () => ({
        outcome: "draft-proposal",
        draft: {
          title: "Bayesian statistics synthesis",
          text: "Bayesian inference updates prior belief with evidence.",
        },
      }),
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial,
      model,
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.confirmSynthesis({
        preview: preview.preview,
        confirmation: "confirmed",
      }),
      {
        outcome: "draft-proposal",
        draft: {
          title: "Bayesian statistics synthesis",
          text: "Bayesian inference updates prior belief with evidence.",
        },
      },
    );
    assert.equal(saveCalls, 0);
  });

  it("explicitly saves a Working Material result with agent provenance", async () => {
    const savedResults: SynthesisSavedResult[] = [];
    const results: SynthesisResultRepository = {
      saveResult: async (result) => {
        savedResults.push(result);
      },
    };
    const model: SynthesisModelAdapter = {
      requestSynthesis: async () => ({
        outcome: "draft-proposal",
        draft: {
          title: "Bayesian statistics synthesis",
          text: "Bayesian inference updates prior belief with evidence.",
        },
      }),
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model,
      results,
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    const confirmed = await sourceProcessing.confirmSynthesis({
      preview: preview.preview,
      confirmation: "confirmed",
    });
    assert.equal(confirmed.outcome, "draft-proposal");
    if (confirmed.outcome !== "draft-proposal") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.saveSynthesisResult({
        resultId: "synthesis-result-bayesian-statistics-fixture",
        preview: preview.preview,
        draft: confirmed.draft,
        generatedAt: "2026-08-27T20:30:00.000Z",
      }),
      {
        outcome: "saved",
        result: {
          id: "synthesis-result-bayesian-statistics-fixture",
          state: "working-material",
          title: "Bayesian statistics synthesis",
          text: "Bayesian inference updates prior belief with evidence.",
          targetTopic: {
            id: "bayesian-statistics",
            title: "Bayesian statistics",
          },
          provenance: {
            attribution: "agent-generated",
            provider: "OpenAI API",
            model: "fixture-pinned-model",
            generatedAt: "2026-08-27T20:30:00.000Z",
            operation: "synthesize-into-topic",
            sourceContext: [
              {
                annotationId:
                  "annotation-bayesian-statistics-fixture-source-page-2-0-54",
                sourceRecord: {
                  id: "bayesian-statistics-fixture-source",
                  title: "Bayesian statistics fixture source",
                },
                sourceLocator: "page:2#chars=0-54",
                attribution: "source-claim",
                classification: "source-claim",
              },
            ],
          },
        },
      },
    );
    assert.deepEqual(savedResults, [
      {
        id: "synthesis-result-bayesian-statistics-fixture",
        state: "working-material",
        title: "Bayesian statistics synthesis",
        text: "Bayesian inference updates prior belief with evidence.",
        targetTopic: {
          id: "bayesian-statistics",
          title: "Bayesian statistics",
        },
        provenance: {
          attribution: "agent-generated",
          provider: "OpenAI API",
          model: "fixture-pinned-model",
          generatedAt: "2026-08-27T20:30:00.000Z",
          operation: "synthesize-into-topic",
          sourceContext: [
            {
              annotationId:
                "annotation-bayesian-statistics-fixture-source-page-2-0-54",
              sourceRecord: {
                id: "bayesian-statistics-fixture-source",
                title: "Bayesian statistics fixture source",
              },
              sourceLocator: "page:2#chars=0-54",
              attribution: "source-claim",
              classification: "source-claim",
            },
          ],
        },
      },
    ]);
  });

  it("saves prompt and concise context only with explicit opt-in", async () => {
    const results: SynthesisResultRepository = {
      saveResult: async () => undefined,
    };
    const sourceIdentity: SynthesisSourceIdentityAdapter = {
      readIdentity: async () => ({
        outcome: "available",
        sourceIdentity: "source-identity-bayesian-statistics-v1",
        contentIdentity: "content-identity-bayesian-statistics-v1",
      }),
    };
    const model: SynthesisModelAdapter = {
      requestSynthesis: async () => ({
        outcome: "draft-proposal",
        draft: {
          title: "Bayesian statistics synthesis",
          text: "Bayesian inference updates prior belief with evidence.",
        },
      }),
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model,
      results,
      sourceIdentity,
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      prompt: "Explain how this evidence supports the topic.",
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    const confirmed = await sourceProcessing.confirmSynthesis({
      preview: preview.preview,
      confirmation: "confirmed",
    });
    assert.equal(confirmed.outcome, "draft-proposal");
    if (confirmed.outcome !== "draft-proposal") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.saveSynthesisResult({
        resultId: "synthesis-result-bayesian-statistics-with-context",
        preview: preview.preview,
        draft: confirmed.draft,
        generatedAt: "2026-08-27T20:30:00.000Z",
        includePromptAndContext: true,
      }),
      {
        outcome: "saved",
        result: {
          id: "synthesis-result-bayesian-statistics-with-context",
          state: "working-material",
          title: "Bayesian statistics synthesis",
          text: "Bayesian inference updates prior belief with evidence.",
          targetTopic: {
            id: "bayesian-statistics",
            title: "Bayesian statistics",
          },
          provenance: {
            attribution: "agent-generated",
            provider: "OpenAI API",
            model: "fixture-pinned-model",
            generatedAt: "2026-08-27T20:30:00.000Z",
            operation: "synthesize-into-topic",
            sourceContext: [
              {
                annotationId:
                  "annotation-bayesian-statistics-fixture-source-page-2-0-54",
                sourceRecord: {
                  id: "bayesian-statistics-fixture-source",
                  title: "Bayesian statistics fixture source",
                },
                sourceLocator: "page:2#chars=0-54",
                attribution: "source-claim",
                classification: "source-claim",
              },
            ],
          },
          prompt: "Explain how this evidence supports the topic.",
          contextSnapshotVersion: 1,
          contextSnapshotRefreshedAt: "2026-08-27T20:30:00.000Z",
          contextSnapshot: [
            {
              annotationId:
                "annotation-bayesian-statistics-fixture-source-page-2-0-54",
              sourceRecord: {
                id: "bayesian-statistics-fixture-source",
                title: "Bayesian statistics fixture source",
              },
              sourceLocator: "page:2#chars=0-54",
              sourceIdentity: "source-identity-bayesian-statistics-v1",
              contentIdentity: "content-identity-bayesian-statistics-v1",
              summary:
                "Selected source claim from the Bayesian statistics fixture source.",
            },
          ],
        },
      },
    );
  });

  it("warns without rewriting a saved snapshot when the source changes", async () => {
    let currentIdentity = {
      sourceIdentity: "source-identity-bayesian-statistics-v1",
      contentIdentity: "content-identity-bayesian-statistics-v1",
    };
    const sourceIdentity: SynthesisSourceIdentityAdapter = {
      readIdentity: async () => ({
        outcome: "available",
        ...currentIdentity,
      }),
    };
    const savedResults: SynthesisSavedResult[] = [];
    const results: SynthesisResultRepository = {
      saveResult: async (result) => {
        savedResults.push(result);
      },
    };
    const model: SynthesisModelAdapter = {
      requestSynthesis: async () => ({
        outcome: "draft-proposal",
        draft: {
          title: "Bayesian statistics synthesis",
          text: "Bayesian inference updates prior belief with evidence.",
        },
      }),
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model,
      results,
      sourceIdentity,
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      prompt: "Explain how this evidence supports the topic.",
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    const confirmed = await sourceProcessing.confirmSynthesis({
      preview: preview.preview,
      confirmation: "confirmed",
    });
    assert.equal(confirmed.outcome, "draft-proposal");
    if (confirmed.outcome !== "draft-proposal") {
      return;
    }

    const saved = await sourceProcessing.saveSynthesisResult({
      resultId: "synthesis-result-bayesian-statistics-with-context",
      preview: preview.preview,
      draft: confirmed.draft,
      generatedAt: "2026-08-27T20:30:00.000Z",
      includePromptAndContext: true,
    });
    assert.equal(saved.outcome, "saved");
    if (saved.outcome !== "saved") {
      return;
    }

    currentIdentity = {
      sourceIdentity: "source-identity-bayesian-statistics-v2",
      contentIdentity: "content-identity-bayesian-statistics-v2",
    };
    assert.deepEqual(
      await sourceProcessing.checkSynthesisContext({ result: saved.result }),
      {
        outcome: "stale-context",
        result: saved.result,
        warning: "The saved Synthesis context differs from the current source.",
      },
    );
    assert.deepEqual(savedResults, [saved.result]);
    assert.deepEqual(saved.result.contextSnapshot, [
      {
        annotationId:
          "annotation-bayesian-statistics-fixture-source-page-2-0-54",
        sourceRecord: {
          id: "bayesian-statistics-fixture-source",
          title: "Bayesian statistics fixture source",
        },
        sourceLocator: "page:2#chars=0-54",
        sourceIdentity: "source-identity-bayesian-statistics-v1",
        contentIdentity: "content-identity-bayesian-statistics-v1",
        summary:
          "Selected source claim from the Bayesian statistics fixture source.",
      },
    ]);
  });

  it("preserves the saved result when source status is unavailable", async () => {
    const savedResult: SynthesisSavedResult = {
      id: "synthesis-result-bayesian-statistics-with-context",
      state: "working-material",
      title: "Bayesian statistics synthesis",
      text: "Bayesian inference updates prior belief with evidence.",
      targetTopic: {
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
      provenance: {
        attribution: "agent-generated",
        provider: "OpenAI API",
        model: "fixture-pinned-model",
        generatedAt: "2026-08-27T20:30:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      contextSnapshot: [
        {
          annotationId:
            "annotation-bayesian-statistics-fixture-source-page-2-0-54",
          sourceRecord: {
            id: "bayesian-statistics-fixture-source",
            title: "Bayesian statistics fixture source",
          },
          sourceLocator: "page:2#chars=0-54",
          sourceIdentity: "source-identity-bayesian-statistics-v1",
          contentIdentity: "content-identity-bayesian-statistics-v1",
          summary:
            "Selected source claim from the Bayesian statistics fixture source.",
        },
      ],
    };
    const sourceIdentity: SynthesisSourceIdentityAdapter = {
      readIdentity: async () => ({
        outcome: "unavailable",
        detail: "The source identity cannot be checked.",
      }),
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      sourceIdentity,
    });

    assert.deepEqual(
      await sourceProcessing.checkSynthesisContext({ result: savedResult }),
      {
        outcome: "source-status-unavailable",
        result: savedResult,
        warning: "source status unavailable",
      },
    );
  });

  it("reports source status unavailable when identity checking throws", async () => {
    const savedResult: SynthesisSavedResult = {
      id: "synthesis-result-bayesian-statistics-with-context",
      state: "working-material",
      title: "Bayesian statistics synthesis",
      text: "Bayesian inference updates prior belief with evidence.",
      targetTopic: {
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
      provenance: {
        attribution: "agent-generated",
        provider: "OpenAI API",
        model: "fixture-pinned-model",
        generatedAt: "2026-08-27T20:30:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      contextSnapshot: [
        {
          annotationId:
            "annotation-bayesian-statistics-fixture-source-page-2-0-54",
          sourceRecord: {
            id: "bayesian-statistics-fixture-source",
            title: "Bayesian statistics fixture source",
          },
          sourceLocator: "page:2#chars=0-54",
          sourceIdentity: "source-identity-bayesian-statistics-v1",
          contentIdentity: "content-identity-bayesian-statistics-v1",
          summary:
            "Selected source claim from the Bayesian statistics fixture source.",
        },
      ],
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      sourceIdentity: {
        readIdentity: async () => {
          throw new Error("identity backend unavailable");
        },
      },
    });

    assert.deepEqual(
      await sourceProcessing.checkSynthesisContext({ result: savedResult }),
      {
        outcome: "source-status-unavailable",
        result: savedResult,
        warning: "source status unavailable",
      },
    );
  });

  it("refreshes context as a new version without regenerating the result", async () => {
    const savedResult: SynthesisSavedResult = {
      id: "synthesis-result-bayesian-statistics-with-context",
      state: "working-material",
      title: "Bayesian statistics synthesis",
      text: "Bayesian inference updates prior belief with evidence.",
      targetTopic: {
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
      provenance: {
        attribution: "agent-generated",
        provider: "OpenAI API",
        model: "fixture-pinned-model",
        generatedAt: "2026-08-27T20:30:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      contextSnapshotVersion: 1,
      contextSnapshot: [
        {
          annotationId:
            "annotation-bayesian-statistics-fixture-source-page-2-0-54",
          sourceRecord: {
            id: "bayesian-statistics-fixture-source",
            title: "Bayesian statistics fixture source",
          },
          sourceLocator: "page:2#chars=0-54",
          sourceIdentity: "source-identity-bayesian-statistics-v1",
          contentIdentity: "content-identity-bayesian-statistics-v1",
          summary:
            "Selected source claim from the Bayesian statistics fixture source.",
        },
      ],
    };
    const refreshedResults: SynthesisSavedResult[] = [];
    const results: SynthesisResultRepository = {
      saveResult: async (result) => {
        refreshedResults.push(result);
      },
    };
    const sourceIdentity: SynthesisSourceIdentityAdapter = {
      readIdentity: async () => ({
        outcome: "available",
        sourceIdentity: "source-identity-bayesian-statistics-v2",
        contentIdentity: "content-identity-bayesian-statistics-v2",
      }),
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      results,
      sourceIdentity,
    });

    assert.deepEqual(
      await sourceProcessing.refreshSynthesisContext({
        result: savedResult,
        refreshedAt: "2026-08-27T21:00:00.000Z",
      }),
      {
        outcome: "refreshed",
        result: {
          ...savedResult,
          contextSnapshotVersion: 2,
          contextSnapshotRefreshedAt: "2026-08-27T21:00:00.000Z",
          contextSnapshot: [
            {
              annotationId:
                "annotation-bayesian-statistics-fixture-source-page-2-0-54",
              sourceRecord: {
                id: "bayesian-statistics-fixture-source",
                title: "Bayesian statistics fixture source",
              },
              sourceLocator: "page:2#chars=0-54",
              sourceIdentity: "source-identity-bayesian-statistics-v2",
              contentIdentity: "content-identity-bayesian-statistics-v2",
              summary:
                "Selected source claim from the Bayesian statistics fixture source.",
            },
          ],
          priorContextSnapshots: [
            {
              version: 1,
              refreshedAt: "2026-08-27T20:30:00.000Z",
              snapshot: savedResult.contextSnapshot,
            },
          ],
        },
      },
    );
    assert.deepEqual(refreshedResults, [
      {
        ...savedResult,
        contextSnapshotVersion: 2,
        contextSnapshotRefreshedAt: "2026-08-27T21:00:00.000Z",
        contextSnapshot: [
          {
            annotationId:
              "annotation-bayesian-statistics-fixture-source-page-2-0-54",
            sourceRecord: {
              id: "bayesian-statistics-fixture-source",
              title: "Bayesian statistics fixture source",
            },
            sourceLocator: "page:2#chars=0-54",
            sourceIdentity: "source-identity-bayesian-statistics-v2",
            contentIdentity: "content-identity-bayesian-statistics-v2",
            summary:
              "Selected source claim from the Bayesian statistics fixture source.",
          },
        ],
        priorContextSnapshots: [
          {
            version: 1,
            refreshedAt: "2026-08-27T20:30:00.000Z",
            snapshot: savedResult.contextSnapshot,
          },
        ],
      },
    ]);
  });

  it("requires fresh confirmation before regenerating a saved result", async () => {
    let modelCalls = 0;
    let saveCalls = 0;
    const previousResult: SynthesisSavedResult = {
      id: "synthesis-result-bayesian-statistics-fixture",
      state: "working-material",
      title: "Bayesian statistics synthesis",
      text: "Bayesian inference updates prior belief with evidence.",
      targetTopic: {
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
      provenance: {
        attribution: "agent-generated",
        provider: "OpenAI API",
        model: "fixture-pinned-model",
        generatedAt: "2026-08-27T20:30:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      resultVersion: 1,
    };
    const model: SynthesisModelAdapter = {
      requestSynthesis: async () => {
        modelCalls += 1;
        return {
          outcome: "draft-proposal",
          draft: {
            title: "Regenerated Bayesian statistics synthesis",
            text: "The regenerated synthesis remains Working Material.",
          },
        };
      },
    };
    const results: SynthesisResultRepository = {
      saveResult: async () => {
        saveCalls += 1;
      },
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model,
      results,
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.regenerateSynthesisResult({
        previousResult,
        preview: preview.preview,
        confirmation: "declined",
        generatedAt: "2026-08-27T21:00:00.000Z",
      }),
      { outcome: "declined" },
    );
    assert.deepEqual(
      await sourceProcessing.regenerateSynthesisResult({
        previousResult,
        preview: preview.preview,
        confirmation: "canceled",
        generatedAt: "2026-08-27T21:00:00.000Z",
      }),
      { outcome: "canceled" },
    );
    assert.equal(modelCalls, 0);
    assert.equal(saveCalls, 0);
    assert.deepEqual(previousResult, {
      id: "synthesis-result-bayesian-statistics-fixture",
      state: "working-material",
      title: "Bayesian statistics synthesis",
      text: "Bayesian inference updates prior belief with evidence.",
      targetTopic: {
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
      provenance: {
        attribution: "agent-generated",
        provider: "OpenAI API",
        model: "fixture-pinned-model",
        generatedAt: "2026-08-27T20:30:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      resultVersion: 1,
    });
  });

  it("saves regeneration as a new result version and preserves the prior result", async () => {
    const previousResult: SynthesisSavedResult = {
      id: "synthesis-result-bayesian-statistics-fixture",
      state: "working-material",
      title: "Bayesian statistics synthesis",
      text: "Bayesian inference updates prior belief with evidence.",
      targetTopic: {
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
      provenance: {
        attribution: "agent-generated",
        provider: "OpenAI API",
        model: "fixture-pinned-model",
        generatedAt: "2026-08-27T20:30:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      resultVersion: 1,
    };
    const requests: SynthesisPayload[] = [];
    const savedResults: SynthesisSavedResult[] = [];
    const model: SynthesisModelAdapter = {
      requestSynthesis: async (payload) => {
        requests.push(payload);
        return {
          outcome: "draft-proposal",
          draft: {
            title: "Regenerated Bayesian statistics synthesis",
            text: "The regenerated synthesis remains Working Material.",
          },
        };
      },
    };
    const results: SynthesisResultRepository = {
      saveResult: async (result) => {
        savedResults.push(result);
      },
    };
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model,
      results,
    });
    const preview = await sourceProcessing.prepareSynthesis({
      ...synthesisInput,
      selectedAnnotations: [expectedAnnotation],
    });

    assert.equal(preview.outcome, "preview-ready");
    if (preview.outcome !== "preview-ready") {
      return;
    }

    assert.deepEqual(
      await sourceProcessing.regenerateSynthesisResult({
        previousResult,
        preview: preview.preview,
        confirmation: "confirmed",
        generatedAt: "2026-08-27T21:00:00.000Z",
      }),
      {
        outcome: "regenerated",
        result: {
          ...previousResult,
          title: "Regenerated Bayesian statistics synthesis",
          text: "The regenerated synthesis remains Working Material.",
          provenance: {
            ...previousResult.provenance,
            generatedAt: "2026-08-27T21:00:00.000Z",
            sourceContext: [
              {
                annotationId:
                  "annotation-bayesian-statistics-fixture-source-page-2-0-54",
                sourceRecord: {
                  id: "bayesian-statistics-fixture-source",
                  title: "Bayesian statistics fixture source",
                },
                sourceLocator: "page:2#chars=0-54",
                attribution: "source-claim",
                classification: "source-claim",
              },
            ],
          },
          resultVersion: 2,
          priorResults: [previousResult],
        },
      },
    );
    assert.deepEqual(requests, [preview.preview.payload]);
    assert.deepEqual(savedResults, [
      {
        ...previousResult,
        title: "Regenerated Bayesian statistics synthesis",
        text: "The regenerated synthesis remains Working Material.",
        provenance: {
          ...previousResult.provenance,
          generatedAt: "2026-08-27T21:00:00.000Z",
          sourceContext: [
            {
              annotationId:
                "annotation-bayesian-statistics-fixture-source-page-2-0-54",
              sourceRecord: {
                id: "bayesian-statistics-fixture-source",
                title: "Bayesian statistics fixture source",
              },
              sourceLocator: "page:2#chars=0-54",
              attribution: "source-claim",
              classification: "source-claim",
            },
          ],
        },
        resultVersion: 2,
        priorResults: [previousResult],
      },
    ]);
    assert.deepEqual(previousResult, {
      id: "synthesis-result-bayesian-statistics-fixture",
      state: "working-material",
      title: "Bayesian statistics synthesis",
      text: "Bayesian inference updates prior belief with evidence.",
      targetTopic: {
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
      provenance: {
        attribution: "agent-generated",
        provider: "OpenAI API",
        model: "fixture-pinned-model",
        generatedAt: "2026-08-27T20:30:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      resultVersion: 1,
    });
  });

  it("restores an older result as a new current version without a provider call", async () => {
    const firstResult: SynthesisSavedResult = {
      id: "synthesis-result-bayesian-statistics-fixture",
      state: "working-material",
      title: "Bayesian statistics synthesis",
      text: "Bayesian inference updates prior belief with evidence.",
      targetTopic: {
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
      provenance: {
        attribution: "agent-generated",
        provider: "OpenAI API",
        model: "fixture-pinned-model",
        generatedAt: "2026-08-27T20:30:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      resultVersion: 1,
    };
    const currentResult: SynthesisSavedResult = {
      ...firstResult,
      title: "Regenerated Bayesian statistics synthesis",
      text: "The regenerated synthesis remains Working Material.",
      provenance: {
        ...firstResult.provenance,
        generatedAt: "2026-08-27T21:00:00.000Z",
      },
      resultVersion: 2,
      priorResults: [firstResult],
    };
    let modelCalls = 0;
    const savedResults: SynthesisSavedResult[] = [];
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      model: {
        requestSynthesis: async () => {
          modelCalls += 1;
          throw new Error("Restore must not call the provider.");
        },
      },
      results: {
        saveResult: async (result) => {
          savedResults.push(result);
        },
      },
    });

    assert.deepEqual(
      await sourceProcessing.restoreSynthesisResult({
        currentResult,
        version: 1,
      }),
      {
        outcome: "restored",
        result: {
          ...firstResult,
          resultVersion: 3,
          priorResults: [firstResult, currentResult],
        },
      },
    );
    assert.deepEqual(savedResults, [
      {
        ...firstResult,
        resultVersion: 3,
        priorResults: [firstResult, currentResult],
      },
    ]);
    assert.equal(modelCalls, 0);
    assert.deepEqual(currentResult, {
      ...firstResult,
      title: "Regenerated Bayesian statistics synthesis",
      text: "The regenerated synthesis remains Working Material.",
      provenance: {
        ...firstResult.provenance,
        generatedAt: "2026-08-27T21:00:00.000Z",
      },
      resultVersion: 2,
      priorResults: [firstResult],
    });
  });

  it("preserves agent provenance when a human edits the saved result", async () => {
    const result: SynthesisSavedResult = {
      id: "synthesis-result-bayesian-statistics-fixture",
      state: "working-material",
      title: "Bayesian statistics synthesis",
      text: "Bayesian inference updates prior belief with evidence.",
      targetTopic: {
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
      provenance: {
        attribution: "agent-generated",
        provider: "OpenAI API",
        model: "fixture-pinned-model",
        generatedAt: "2026-08-27T20:30:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      resultVersion: 1,
    };
    const savedResults: SynthesisSavedResult[] = [];
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      results: {
        saveResult: async (savedResult) => {
          savedResults.push(savedResult);
        },
      },
    });

    assert.deepEqual(
      await sourceProcessing.editSynthesisResult({
        result,
        title: "Bayesian statistics synthesis — reviewed",
        text: "Bayesian inference updates prior belief with evidence; reviewed by a human.",
        editedAt: "2026-08-27T21:30:00.000Z",
      }),
      {
        outcome: "edited",
        result: {
          ...result,
          title: "Bayesian statistics synthesis — reviewed",
          text: "Bayesian inference updates prior belief with evidence; reviewed by a human.",
          humanAuthorship: "human-authored",
          humanEdits: [
            {
              attribution: "human-authored",
              editedAt: "2026-08-27T21:30:00.000Z",
              changedFields: ["title", "text"],
            },
          ],
        },
      },
    );
    assert.deepEqual(savedResults, [
      {
        ...result,
        title: "Bayesian statistics synthesis — reviewed",
        text: "Bayesian inference updates prior belief with evidence; reviewed by a human.",
        humanAuthorship: "human-authored",
        humanEdits: [
          {
            attribution: "human-authored",
            editedAt: "2026-08-27T21:30:00.000Z",
            changedFields: ["title", "text"],
          },
        ],
      },
    ]);
  });
});
