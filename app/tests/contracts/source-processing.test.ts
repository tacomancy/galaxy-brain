import { strict as assert } from "node:assert";
import {
  cp,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it } from "vitest";

import { createFixturePdfAdapter } from "../../src/adapters/pdf/fixture-pdf-adapter";
import {
  defaultAtomicFileSystem,
  type AtomicFileSystem,
} from "../../src/adapters/file-backed-atomic-write";
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

const laterAnnotation: StructuredAnnotation = {
  ...expectedAnnotation,
  id: "annotation-z-later",
  sourceLocator: {
    page: 3,
    start: 0,
    end: 54,
    logical: "page:3#chars=0-54",
  },
};

const assertWorkingMaterialContract = async (
  repository: WorkingMaterialRepository,
): Promise<void> => {
  await repository.saveAnnotation(laterAnnotation);
  await repository.saveAnnotation(expectedAnnotation);

  assert.deepEqual(await repository.readAnnotation(expectedAnnotation.id), {
    outcome: "found",
    annotation: expectedAnnotation,
  });
  assert.deepEqual(
    await repository.readAnnotationForSourceRecord(
      expectedAnnotation.sourceRecord.id,
    ),
    {
      outcome: "found",
      annotation: expectedAnnotation,
    },
  );
  assert.deepEqual(
    await repository.readAnnotationsForSourceRecord?.(
      expectedAnnotation.sourceRecord.id,
    ),
    {
      outcome: "found",
      annotations: [expectedAnnotation, laterAnnotation],
    },
  );
  assert.deepEqual(await repository.readAnnotation("missing-annotation"), {
    outcome: "not-found",
    detail: "The source annotation was not found.",
  });
  assert.deepEqual(
    await repository.readAnnotationForSourceRecord("missing-source-record"),
    {
      outcome: "not-found",
      detail: "The source annotation was not found.",
    },
  );
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
    await rm(
      join(
        repositoryPath,
        "sources",
        "annotations",
        "annotation-bayesian-statistics-fixture-source-page-2-55-83.md",
      ),
    );

    try {
      await assertWorkingMaterialContract(
        createFileBackedWorkingMaterialRepository(repositoryPath),
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("preserves the previous annotation when atomic replacement fails", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const repositoryPath = join(temporaryRoot, "repository");

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const repository =
        createFileBackedWorkingMaterialRepository(repositoryPath);
      const updatedAnnotation = {
        ...expectedAnnotation,
        text: "The externally reviewed Bayesian inference claim.",
      };

      await repository.saveAnnotation(expectedAnnotation);

      const replacementFailure: AtomicFileSystem = {
        ...defaultAtomicFileSystem,
        rename: async () => {
          throw new Error("replacement interrupted");
        },
      };

      await assert.rejects(
        createFileBackedWorkingMaterialRepository(
          repositoryPath,
          undefined,
          replacementFailure,
        ).saveAnnotation(updatedAnnotation),
        /replacement interrupted/,
      );
      assert.deepEqual(await repository.readAnnotation(expectedAnnotation.id), {
        outcome: "found",
        annotation: expectedAnnotation,
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("rejects an external annotation edit observed after staging", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const repositoryPath = join(temporaryRoot, "repository");
    const annotationPath = join(
      repositoryPath,
      "sources",
      "annotations",
      `${expectedAnnotation.id}.md`,
    );

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const originalRepository =
        createFileBackedWorkingMaterialRepository(repositoryPath);
      await originalRepository.saveAnnotation(expectedAnnotation);

      const externalEditFilesystem: AtomicFileSystem = {
        ...defaultAtomicFileSystem,
        writeFile: async (path, contents, options) => {
          await defaultAtomicFileSystem.writeFile(path, contents, options);

          if (String(path).includes(".galaxy-brain-atomic-")) {
            const current = await readFile(annotationPath, "utf8");
            await writeFile(
              annotationPath,
              current.replace(expectedAnnotation.text, "an external edit"),
              "utf8",
            );
          }
        },
      };

      await assert.rejects(
        createFileBackedWorkingMaterialRepository(
          repositoryPath,
          undefined,
          externalEditFilesystem,
        ).saveAnnotation({
          ...expectedAnnotation,
          text: "a competing local edit",
        }),
        /changed while it was being saved/,
      );
      assert.deepEqual(
        await originalRepository.readAnnotation(expectedAnnotation.id),
        {
          outcome: "found",
          annotation: { ...expectedAnnotation, text: "an external edit" },
        },
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("does not follow a symlink when reading a saved annotation", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const repositoryPath = join(temporaryRoot, "repository");
    const annotationPath = join(
      repositoryPath,
      "sources",
      "annotations",
      `${expectedAnnotation.id}.md`,
    );
    const externalAnnotationPath = join(
      temporaryRoot,
      "external-annotation.md",
    );

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const repository =
        createFileBackedWorkingMaterialRepository(repositoryPath);
      await repository.saveAnnotation(expectedAnnotation);
      await rename(annotationPath, externalAnnotationPath);
      await symlink(externalAnnotationPath, annotationPath);

      assert.deepEqual(await repository.readAnnotation(expectedAnnotation.id), {
        outcome: "unavailable",
        detail: "The source annotation could not be read.",
      });
      assert.deepEqual(
        await repository.readAnnotationsForSourceRecord?.(
          expectedAnnotation.sourceRecord.id,
        ),
        {
          outcome: "unavailable",
          detail: "The source annotation could not be read.",
        },
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("reports malformed annotation content as unavailable without exposing parser details", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const repositoryPath = join(temporaryRoot, "repository");
    const annotationPath = join(
      repositoryPath,
      "sources",
      "annotations",
      `${expectedAnnotation.id}.md`,
    );
    const causes: unknown[] = [];

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      await writeFile(
        annotationPath,
        "not valid annotation frontmatter\n",
        "utf8",
      );
      const repository = createFileBackedWorkingMaterialRepository(
        repositoryPath,
        { record: (cause) => causes.push(cause) },
      );

      assert.deepEqual(await repository.readAnnotation(expectedAnnotation.id), {
        outcome: "unavailable",
        detail: "The source annotation could not be read.",
      });
      assert.equal(causes.length, 1);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("reports an unreadable annotation directory as unavailable", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const repositoryPath = join(temporaryRoot, "repository");
    const causes: unknown[] = [];

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const unreadableFilesystem: AtomicFileSystem = {
        ...defaultAtomicFileSystem,
        readdir: async () => {
          throw new Error("annotation directory is unreadable");
        },
      };
      const repository = createFileBackedWorkingMaterialRepository(
        repositoryPath,
        { record: (cause) => causes.push(cause) },
        unreadableFilesystem,
      );

      assert.deepEqual(await repository.readAnnotation(expectedAnnotation.id), {
        outcome: "unavailable",
        detail: "The source annotation could not be read.",
      });
      assert.equal(causes.length, 1);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
