import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createFixturePdfAdapter } from "../../src/adapters/pdf/fixture-pdf-adapter";
import { createInMemoryWorkingMaterialRepository } from "../../src/adapters/working-material/in-memory-working-material-repository";
import {
  createSourceProcessing,
  type SynthesisModelAdapter,
  type SynthesisSavedResult,
  type SynthesisSourceIdentityAdapter,
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
});
