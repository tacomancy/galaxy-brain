import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createSynthesisLifecycle } from "../src/modules/synthesis-lifecycle";
import type {
  ConfirmSynthesisOutcome,
  PrepareSynthesisOutcome,
  SynthesisPreview,
} from "../src/modules/source-processing";

const preview: SynthesisPreview = {
  summary: "Synthesize one source claim into a topic.",
  estimatedRequestSize: 5,
  provider: { destination: "fixture", model: "fixture-model" },
  payload: {
    operation: "synthesize-into-topic",
    model: "fixture-model",
    targetTopic: { id: "topic", title: "Topic" },
    context: [
      {
        kind: "structured-annotation",
        annotationId: "annotation-a",
        text: "claim",
        sourceRecord: { id: "source", title: "Source" },
        sourceLocator: "page:1#chars=0-5",
        attribution: "source-claim",
        classification: "source-claim",
        state: "working-material",
      },
    ],
  },
};

describe("Synthesis lifecycle", () => {
  it("owns pending state, consumes confirmation, and invalidates on repository change", async () => {
    const confirmations: string[] = [];
    const lifecycle = createSynthesisLifecycle({
      sourceProcessingFor: () => ({
        removeSynthesisContextItem: async () => ({
          outcome: "preview-ready",
          preview,
        }),
        confirmSynthesis: async ({
          confirmation,
        }): Promise<ConfirmSynthesisOutcome> => {
          confirmations.push(confirmation);
          return { outcome: "canceled" };
        },
      }),
    });

    assert.deepEqual(
      lifecycle.prepare({ repositoryPath: "/repo-a", preview }),
      {
        outcome: "preview-ready",
        preview,
      },
    );
    assert.deepEqual(await lifecycle.confirm("/repo-b", "confirmed"), {
      outcome: "operation-failed",
      detail: "The Synthesis preview is no longer available. Prepare it again.",
    });
    assert.deepEqual(await lifecycle.confirm("/repo-a", "canceled"), {
      outcome: "canceled",
    });
    assert.deepEqual(await lifecycle.confirm("/repo-a", "confirmed"), {
      outcome: "operation-failed",
      detail: "The Synthesis preview is no longer available. Prepare it again.",
    });
    assert.deepEqual(confirmations, ["canceled"]);

    lifecycle.prepare({ repositoryPath: "/repo-a", preview });
    lifecycle.invalidate();
    assert.deepEqual(await lifecycle.confirm("/repo-a", "confirmed"), {
      outcome: "operation-failed",
      detail: "The Synthesis preview is no longer available. Prepare it again.",
    });
  });

  it("updates the pending preview only when Source Processing accepts the removal", async () => {
    let receivedPreview: SynthesisPreview | undefined;
    const lifecycle = createSynthesisLifecycle({
      sourceProcessingFor: () => ({
        removeSynthesisContextItem: async ({ preview: received }) => {
          receivedPreview = received;
          return { outcome: "invalid-selection", detail: "missing" };
        },
        confirmSynthesis: async () => ({ outcome: "canceled" }),
      }),
    });

    lifecycle.prepare({ repositoryPath: "/repo-a", preview });
    const outcome: PrepareSynthesisOutcome = await lifecycle.removeContextItem(
      "/repo-a",
      "missing",
    );

    assert.deepEqual(outcome, {
      outcome: "invalid-selection",
      detail: "missing",
    });
    assert.deepEqual(receivedPreview, preview);
  });
});
