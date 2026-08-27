import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createFixturePdfAdapter } from "../../src/adapters/pdf/fixture-pdf-adapter";
import { createInMemoryWorkingMaterialRepository } from "../../src/adapters/working-material/in-memory-working-material-repository";
import {
  createSourceProcessing,
  type SynthesisModelAdapter,
  type StructuredAnnotation,
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
});
