import { strict as assert } from "node:assert";
import {
  cp,
  mkdir,
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

import {
  defaultAtomicFileSystem,
  type AtomicFileSystem,
} from "../../src/adapters/file-backed-atomic-write";
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

const resultWithoutLegacyHistory = { ...result };
delete resultWithoutLegacyHistory.priorResults;
const normalizedResult: SynthesisSavedResult = {
  ...resultWithoutLegacyHistory,
  priorVersions: [
    {
      version: 1,
      generatedAt: "2026-08-27T20:00:00.000Z",
      title: "Bayesian statistics synthesis — first draft",
    },
  ],
};

describe("Synthesis result Repository Adapter", () => {
  it("retains only sanitized diagnostics when the repository path is unavailable", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const repositoryPath = join(temporaryRoot, "GB_PRIVACY_ABSOLUTE_PATH");
    const diagnostics: unknown[] = [];

    try {
      const repository = createFileBackedSynthesisResultRepository(
        repositoryPath,
        { record: (diagnostic) => diagnostics.push(diagnostic) },
      );

      assert.deepEqual(await repository.readResult?.(result.id), {
        outcome: "unavailable",
        detail: "The Knowledge Repository could not be read.",
      });
      assert.deepEqual(await repository.readResults?.(), {
        outcome: "unavailable",
        detail: "The Knowledge Repository could not be read.",
      });
      assert.deepEqual(diagnostics, [
        { category: "filesystem", operation: "read-repository" },
        { category: "filesystem", operation: "read-repository" },
      ]);
      assert.doesNotMatch(
        JSON.stringify(diagnostics),
        /GB_PRIVACY_ABSOLUTE_PATH/u,
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

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
        result: normalizedResult,
      });
      assert.deepEqual(await repository.readResults?.(), {
        outcome: "found",
        results: [normalizedResult],
      });
      assert.deepEqual(await repository.readResult?.("missing-result"), {
        outcome: "not-found",
        detail: "The Synthesis result was not found.",
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("migrates legacy nested history only when an explicit write occurs", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-synthesis-migration-"),
    );
    const repositoryPath = join(temporaryRoot, "repository");
    const resultDirectory = join(
      repositoryPath,
      "scratch",
      "synthesis-results",
    );

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const repository =
        createFileBackedSynthesisResultRepository(repositoryPath);
      const before = await repository.readResult?.(result.id);
      assert.equal(before?.outcome, "found");
      assert.deepEqual(
        JSON.parse(
          await readFile(join(resultDirectory, `${result.id}.json`), "utf8"),
        ).schema,
        undefined,
      );

      if (before?.outcome !== "found") return;
      await repository.saveResult(before.result);

      assert.deepEqual(
        JSON.parse(
          await readFile(join(resultDirectory, `${result.id}.json`), "utf8"),
        ),
        {
          schema: "galaxy-brain-synthesis-result-pointer",
          schema_version: 1,
          id: result.id,
          current_version: 2,
        },
      );
      assert.deepEqual(
        JSON.parse(
          await readFile(
            join(resultDirectory, `${result.id}--version-1.json`),
            "utf8",
          ),
        ).resultVersion,
        1,
      );
      assert.deepEqual(await repository.readResultVersion?.(result.id, 1), {
        outcome: "found",
        result: {
          ...result.priorResults![0],
          title: "Bayesian statistics synthesis — first draft",
          text: "Bayesian inference updates prior belief.",
          resultVersion: 1,
        },
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("rejects moving the current result pointer to an older version", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-synthesis-version-order-"),
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

      await assert.rejects(
        repository.saveResult({
          ...result,
          resultVersion: 1,
          text: "An attempted rollback must not replace the current result.",
        }),
        /cannot move backwards/u,
      );

      assert.deepEqual(await repository.readResult?.(result.id), {
        outcome: "found",
        result: normalizedResult,
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("preserves the previous result when atomic replacement fails", async () => {
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

      const replacementFailure: AtomicFileSystem = {
        ...defaultAtomicFileSystem,
        rename: async () => {
          throw new Error("replacement interrupted");
        },
      };

      await assert.rejects(
        createFileBackedSynthesisResultRepository(
          repositoryPath,
          undefined,
          replacementFailure,
        ).saveResult({
          ...result,
          resultVersion: 3,
          text: "a competing result",
        }),
        /replacement interrupted|immutable/,
      );
      assert.deepEqual(await repository.readResult?.(result.id), {
        outcome: "found",
        result: normalizedResult,
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("discards an abandoned result temporary file before reading", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-synthesis-"),
    );
    const repositoryPath = join(temporaryRoot, "repository");
    const resultDirectory = join(
      repositoryPath,
      "scratch",
      "synthesis-results",
    );

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const repository =
        createFileBackedSynthesisResultRepository(repositoryPath);
      await repository.saveResult(result);
      const abandonedTemporaryPath = join(
        resultDirectory,
        ".galaxy-brain-atomic-abandoned.tmp",
      );
      await writeFile(abandonedTemporaryPath, '{"incomplete":', "utf8");

      assert.deepEqual(await repository.readResult?.(result.id), {
        outcome: "found",
        result: normalizedResult,
      });
      await assert.rejects(readFile(abandonedTemporaryPath, "utf8"), {
        code: "ENOENT",
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("does not follow a symlink when reading a saved result", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-synthesis-"),
    );
    const repositoryPath = join(temporaryRoot, "repository");
    const resultPath = join(
      repositoryPath,
      "scratch",
      "synthesis-results",
      `${result.id}.json`,
    );
    const externalResultPath = join(temporaryRoot, "external-result.json");

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const repository =
        createFileBackedSynthesisResultRepository(repositoryPath);
      await repository.saveResult(result);
      await rename(resultPath, externalResultPath);
      await symlink(externalResultPath, resultPath);

      assert.deepEqual(await repository.readResult?.(result.id), {
        outcome: "unavailable",
        detail: "The Synthesis result could not be read.",
      });
      assert.deepEqual(await repository.readResults?.(), {
        outcome: "unavailable",
        detail: "The Synthesis results could not be read.",
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("distinguishes a missing result directory from malformed result content", async () => {
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
      const resultDirectory = join(
        repositoryPath,
        "scratch",
        "synthesis-results",
      );
      await rm(resultDirectory, { recursive: true, force: true });
      await mkdir(resultDirectory);
      assert.deepEqual(await repository.readResults?.(), {
        outcome: "found",
        results: [],
      });
      assert.deepEqual(await repository.readResult?.("missing-result"), {
        outcome: "not-found",
        detail: "The Synthesis result was not found.",
      });

      await writeFile(
        join(resultDirectory, `${result.id}.json`),
        "{ malformed result\n",
        "utf8",
      );

      assert.deepEqual(await repository.readResult?.(result.id), {
        outcome: "unavailable",
        detail: "The Synthesis result could not be read.",
      });
      assert.deepEqual(await repository.readResults?.(), {
        outcome: "unavailable",
        detail: "The Synthesis results could not be read.",
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("preserves an external result edit instead of overwriting it", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-synthesis-"),
    );
    const repositoryPath = join(temporaryRoot, "repository");
    const resultPath = join(
      repositoryPath,
      "scratch",
      "synthesis-results",
      `${result.id}.json`,
    );

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      const originalRepository =
        createFileBackedSynthesisResultRepository(repositoryPath);
      await originalRepository.saveResult(result);

      const externalEditFilesystem: AtomicFileSystem = {
        ...defaultAtomicFileSystem,
        writeFile: async (path, contents, options) => {
          await defaultAtomicFileSystem.writeFile(path, contents, options);
          if (String(path).includes(".galaxy-brain-atomic-")) {
            const current = await readFile(resultPath, "utf8");
            await writeFile(
              resultPath,
              current.replace(result.text, "an external result edit"),
              "utf8",
            );
          }
        },
      };

      await assert.rejects(
        createFileBackedSynthesisResultRepository(
          repositoryPath,
          undefined,
          externalEditFilesystem,
        ).saveResult({ ...result, text: "a competing local result" }),
        /immutable/,
      );
      assert.deepEqual(await originalRepository.readResult?.(result.id), {
        outcome: "found",
        result: normalizedResult,
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("reports an unsafe result directory without following its symlink", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-synthesis-"),
    );
    const repositoryPath = join(temporaryRoot, "repository");
    const resultDirectory = join(
      repositoryPath,
      "scratch",
      "synthesis-results",
    );
    const externalDirectory = join(temporaryRoot, "external-results");

    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    try {
      await rename(resultDirectory, externalDirectory);
      await symlink(externalDirectory, resultDirectory);
      assert.deepEqual(
        await createFileBackedSynthesisResultRepository(
          repositoryPath,
        ).readResults?.(),
        {
          outcome: "unavailable",
          detail: "The Synthesis results could not be read.",
        },
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("reports an unreadable result directory as unavailable", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-synthesis-"),
    );
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
          throw new Error("result directory is unreadable");
        },
      };
      const repository = createFileBackedSynthesisResultRepository(
        repositoryPath,
        { record: (cause) => causes.push(cause) },
        unreadableFilesystem,
      );

      assert.deepEqual(await repository.readResult?.(result.id), {
        outcome: "unavailable",
        detail: "The Synthesis result could not be read.",
      });
      assert.deepEqual(await repository.readResults?.(), {
        outcome: "unavailable",
        detail: "The Synthesis results could not be read.",
      });
      assert.equal(causes.length, 2);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
