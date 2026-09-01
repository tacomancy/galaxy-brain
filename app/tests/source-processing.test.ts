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
  const shortCircuitLocatorCases = [
    {
      name: "a non-integer page",
      page: 2.5,
      start: 0,
      end: 54,
    },
    {
      name: "a non-integer start",
      page: 2,
      start: 0.5,
      end: 54,
    },
    {
      name: "a negative start",
      page: 2,
      start: -1,
      end: 54,
    },
    {
      name: "a non-integer end",
      page: 2,
      start: 0,
      end: 54.5,
    },
    {
      name: "an end that is not after the start",
      page: 2,
      start: 54,
      end: 54,
    },
  ] as const;

  for (const testCase of shortCircuitLocatorCases) {
    it(`rejects ${testCase.name} through the public capture interface`, async () => {
      let pdfCalls = 0;
      const sourceProcessing = createSourceProcessing({
        pdf: {
          readSelection: async () => {
            pdfCalls += 1;
            return { outcome: "located" as const, text: "never used" };
          },
        },
        workingMaterial: createInMemoryWorkingMaterialRepository(),
      });

      assert.deepEqual(
        await sourceProcessing.captureSourceClaim({
          sourceRecord: expectedAnnotation.sourceRecord,
          page: testCase.page,
          start: testCase.start,
          end: testCase.end,
        }),
        {
          outcome: "invalid-locator",
          detail: "The source locator is invalid.",
        },
      );
      assert.equal(pdfCalls, 0);
    });
  }

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

  it("rejects an invalid locator before contacting the PDF or Working Material adapters", async () => {
    let pdfCalls = 0;
    let saveCalls = 0;
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => {
          pdfCalls += 1;
          return { outcome: "located" as const, text: "never used" };
        },
      },
      workingMaterial: {
        saveAnnotation: async () => {
          saveCalls += 1;
        },
        readAnnotation: async () => ({
          outcome: "not-found" as const,
          detail: "The source annotation was not found.",
        }),
        readAnnotationForSourceRecord: async () => ({
          outcome: "not-found" as const,
          detail: "The source annotation was not found.",
        }),
      },
    });

    assert.deepEqual(
      await sourceProcessing.captureSourceClaim({
        sourceRecord: expectedAnnotation.sourceRecord,
        page: 0,
        start: 54,
        end: 0,
      }),
      { outcome: "invalid-locator", detail: "The source locator is invalid." },
    );
    assert.equal(pdfCalls, 0);
    assert.equal(saveCalls, 0);
  });

  it("returns an unavailable PDF outcome without saving a claim", async () => {
    let saveCalls = 0;
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => ({
          outcome: "source-unavailable" as const,
          detail: "The linked PDF is unavailable.",
        }),
      },
      workingMaterial: {
        saveAnnotation: async () => {
          saveCalls += 1;
        },
        readAnnotation: async () => ({
          outcome: "not-found" as const,
          detail: "The source annotation was not found.",
        }),
        readAnnotationForSourceRecord: async () => ({
          outcome: "not-found" as const,
          detail: "The source annotation was not found.",
        }),
      },
    });

    assert.deepEqual(
      await sourceProcessing.captureSourceClaim({
        sourceRecord: expectedAnnotation.sourceRecord,
        page: 2,
        start: 0,
        end: 54,
      }),
      {
        outcome: "source-unavailable",
        detail: "The linked PDF is unavailable.",
      },
    );
    assert.equal(saveCalls, 0);
  });

  it("sanitizes PDF failures and records the cause without exposing it", async () => {
    const causes: unknown[] = [];
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => {
          throw new Error("private PDF path and parser details");
        },
      },
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      diagnostics: { record: (_diagnostic, cause) => causes.push(cause) },
    });

    assert.deepEqual(
      await sourceProcessing.captureSourceClaim({
        sourceRecord: expectedAnnotation.sourceRecord,
        page: 2,
        start: 0,
        end: 54,
      }),
      {
        outcome: "operation-failed",
        detail: "The source passage could not be resolved.",
      },
    );
    assert.deepEqual(causes, [
      new Error("private PDF path and parser details"),
    ]);
  });

  it("returns a save failure without claiming that the source claim was captured", async () => {
    const causes: unknown[] = [];
    const sourceProcessing = createSourceProcessing({
      pdf: createFixturePdfAdapter(),
      workingMaterial: {
        saveAnnotation: async () => {
          throw new Error("private repository write failure");
        },
        readAnnotation: async () => ({
          outcome: "not-found" as const,
          detail: "The source annotation was not found.",
        }),
        readAnnotationForSourceRecord: async () => ({
          outcome: "not-found" as const,
          detail: "The source annotation was not found.",
        }),
      },
      diagnostics: { record: (_diagnostic, cause) => causes.push(cause) },
    });

    assert.deepEqual(
      await sourceProcessing.captureSourceClaim({
        sourceRecord: expectedAnnotation.sourceRecord,
        page: 2,
        start: 0,
        end: 54,
      }),
      {
        outcome: "operation-failed",
        detail: "The source claim could not be saved as Working Material.",
      },
    );
    assert.deepEqual(causes, [new Error("private repository write failure")]);
  });
});
