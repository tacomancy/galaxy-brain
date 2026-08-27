import { strict as assert } from "node:assert";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it } from "vitest";

import { createFileBackedKnowledgeRepository } from "../src/adapters/knowledge-repository/file-backed-knowledge-repository";
import { createFixturePdfAdapter } from "../src/adapters/pdf/fixture-pdf-adapter";
import { createFileBackedWorkingMaterialRepository } from "../src/adapters/working-material/file-backed-working-material-repository";
import { createInMemoryWorkingMaterialRepository } from "../src/adapters/working-material/in-memory-working-material-repository";
import { createSourceProcessing } from "../src/modules/source-processing";

const expectedAnnotation = {
  id: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
  state: "working-material" as const,
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
  attribution: "source-claim" as const,
  classification: "source-claim" as const,
};

describe("Source Processing", () => {
  it("captures and persists one located source claim as Working Material", async () => {
    const workingMaterial = createInMemoryWorkingMaterialRepository();
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial,
    });

    const outcome = await sourceProcessing.captureSourceClaim({
      sourceRecord: {
        id: "bayesian-statistics-fixture-source",
        title: "Bayesian statistics fixture source",
      },
      page: 2,
      start: 0,
      end: 54,
    });

    assert.deepEqual(outcome, {
      outcome: "captured",
      annotation: expectedAnnotation,
    });
    assert.deepEqual(
      await workingMaterial.readAnnotation(expectedAnnotation.id),
      {
        outcome: "found",
        annotation: expectedAnnotation,
      },
    );
  });

  it("reopens the captured annotation from portable repository files", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb5-"));
    const repositoryPath = join(temporaryRoot, "repository");

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const knowledgeRepository = createFileBackedKnowledgeRepository(
        join(process.cwd(), "templates", "knowledge-repository"),
      );
      const sourceRecordBefore =
        await knowledgeRepository.readWorkbenchContext(repositoryPath);
      assert.deepEqual(sourceRecordBefore, {
        outcome: "available",
        context: {
          topic: { id: "bayesian-statistics", title: "Bayesian statistics" },
          sourceRecord: {
            id: "bayesian-statistics-fixture-source",
            title: "Bayesian statistics fixture source",
          },
        },
      });

      const workingMaterial =
        createFileBackedWorkingMaterialRepository(repositoryPath);
      const sourceProcessing = createSourceProcessing({
        pdf: createFixturePdfAdapter(),
        workingMaterial,
      });

      const outcome = await sourceProcessing.captureSourceClaim({
        sourceRecord: {
          id: "bayesian-statistics-fixture-source",
          title: "Bayesian statistics fixture source",
        },
        page: 2,
        start: 0,
        end: 54,
      });

      assert.deepEqual(outcome, {
        outcome: "captured",
        annotation: expectedAnnotation,
      });
      assert.deepEqual(
        await workingMaterial.readAnnotation(expectedAnnotation.id),
        {
          outcome: "found",
          annotation: expectedAnnotation,
        },
      );
      assert.deepEqual(
        await knowledgeRepository.readWorkbenchContext(repositoryPath),
        sourceRecordBefore,
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("rejects a resolved passage whose text does not match its locator", async () => {
    const workingMaterial = createInMemoryWorkingMaterialRepository();
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => ({
          outcome: "located" as const,
          text: "short",
        }),
      },
      workingMaterial,
    });

    const outcome = await sourceProcessing.captureSourceClaim({
      sourceRecord: {
        id: "bayesian-statistics-fixture-source",
        title: "Bayesian statistics fixture source",
      },
      page: 2,
      start: 0,
      end: 54,
    });

    assert.deepEqual(outcome, {
      outcome: "invalid-locator",
      detail: "The resolved source passage does not match its locator.",
    });
    assert.deepEqual(
      await workingMaterial.readAnnotation(
        "annotation-bayesian-statistics-fixture-source-page-2-0-54",
      ),
      {
        outcome: "not-found",
        detail: "The source annotation was not found.",
      },
    );
  });
});
