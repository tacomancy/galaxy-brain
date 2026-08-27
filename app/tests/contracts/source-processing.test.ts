import { strict as assert } from "node:assert";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it } from "vitest";

import { createFixturePdfAdapter } from "../../src/adapters/pdf/fixture-pdf-adapter";
import { createFileBackedWorkingMaterialRepository } from "../../src/adapters/working-material/file-backed-working-material-repository";
import { createInMemoryWorkingMaterialRepository } from "../../src/adapters/working-material/in-memory-working-material-repository";
import type {
  StructuredAnnotation,
  WorkingMaterialRepository,
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

const assertWorkingMaterialContract = async (
  repository: WorkingMaterialRepository,
): Promise<void> => {
  await repository.saveAnnotation(expectedAnnotation);

  assert.deepEqual(await repository.readAnnotation(expectedAnnotation.id), {
    outcome: "found",
    annotation: expectedAnnotation,
  });
  assert.deepEqual(await repository.readAnnotation("missing-annotation"), {
    outcome: "not-found",
    detail: "The source annotation was not found.",
  });
};

describe("Source Processing Adapter contracts", () => {
  it("resolves the literal TB5 PDF fixture passage", async () => {
    assert.deepEqual(
      await createFixturePdfAdapter().readSelection({
        sourceRecord: {
          id: "bayesian-statistics-fixture-source",
          title: "Bayesian statistics fixture source",
        },
        page: 2,
        start: 0,
        end: 54,
      }),
      {
        outcome: "located",
        text: "Bayesian inference updates prior belief with evidence.",
      },
    );
  });

  it("preserves Working Material semantics in memory", async () => {
    await assertWorkingMaterialContract(
      createInMemoryWorkingMaterialRepository(),
    );
  });

  it("preserves Working Material semantics in portable files", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const repositoryPath = join(temporaryRoot, "repository");

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      await assertWorkingMaterialContract(
        createFileBackedWorkingMaterialRepository(repositoryPath),
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
