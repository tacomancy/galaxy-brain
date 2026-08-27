import { strict as assert } from "node:assert";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it } from "vitest";

import { createFileBackedSynthesisResultRepository } from "../../src/adapters/working-material/file-backed-synthesis-result-repository";
import type { SynthesisSavedResult } from "../../src/modules/source-processing";

const result: SynthesisSavedResult = {
  id: "synthesis-result-bayesian-statistics-fixture",
  state: "working-material",
  title: "Bayesian statistics synthesis — reviewed",
  text: "Bayesian inference updates prior belief with evidence; reviewed by a human.",
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
  prompt: "Explain how this evidence supports the topic.",
  contextSnapshotVersion: 2,
  contextSnapshot: [
    {
      annotationId: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
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
  resultVersion: 2,
  priorResults: [
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
        generatedAt: "2026-08-27T20:00:00.000Z",
        operation: "synthesize-into-topic",
        sourceContext: [],
      },
      resultVersion: 1,
    },
  ],
  humanAuthorship: "human-authored",
  humanEdits: [
    {
      attribution: "human-authored",
      editedAt: "2026-08-27T21:30:00.000Z",
      changedFields: ["title", "text"],
    },
  ],
};

describe("Synthesis result Repository Adapter", () => {
  it("round-trips saved result versions and provenance through portable files", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-synthesis-"),
    );
    const repositoryPath = join(temporaryRoot, "repository");

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const repository =
        createFileBackedSynthesisResultRepository(repositoryPath);

      await repository.saveResult(result);

      assert.deepEqual(await repository.readResult?.(result.id), {
        outcome: "found",
        result,
      });
      assert.deepEqual(await repository.readResults?.(), {
        outcome: "found",
        results: [result],
      });
      assert.deepEqual(await repository.readResult?.("missing-result"), {
        outcome: "not-found",
        detail: "The Synthesis result was not found.",
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
