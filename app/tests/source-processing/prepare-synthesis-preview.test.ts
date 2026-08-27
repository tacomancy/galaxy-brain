import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createFixturePdfAdapter } from "../../src/adapters/pdf/fixture-pdf-adapter";
import { createInMemoryWorkingMaterialRepository } from "../../src/adapters/working-material/in-memory-working-material-repository";
import {
  createSourceProcessing,
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
});
