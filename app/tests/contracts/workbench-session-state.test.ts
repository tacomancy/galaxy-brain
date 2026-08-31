import { strict as assert } from "node:assert";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, it } from "vitest";

import { defaultAtomicFileSystem } from "../../src/adapters/file-backed-atomic-write";
import { createFileBackedWorkbenchSessionState } from "../../src/adapters/session-state/file-backed-workbench-session-state";

describe("file-backed Workbench session-state contract", () => {
  let temporaryRoot: string;

  beforeEach(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb6-state-"));
  });

  afterEach(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("round-trips exact-root active work and reading position", async () => {
    const sessionStatePath = join(temporaryRoot, "session", "workbench.json");
    const sessionState =
      createFileBackedWorkbenchSessionState(sessionStatePath);
    const expected = {
      selectedRepositoryPath: "/repositories/bayesian-statistics",
      activeWorkspace: "paper-desk" as const,
      readingPosition: {
        sourceRecordId: "bayesian-statistics-fixture-source",
        page: 2,
        characterOffset: 0,
      },
    };

    await sessionState.writeSession(expected);

    assert.deepEqual(await sessionState.readSession(), expected);
    assert.equal(
      await readFile(sessionStatePath, "utf8"),
      `${JSON.stringify(expected)}\n`,
    );
  });

  it("treats malformed state as a first launch", async () => {
    const sessionStatePath = join(temporaryRoot, "workbench.json");
    await writeFile(
      sessionStatePath,
      '{"selectedRepositoryPath":"/repo","activeWorkspace":"unknown"}\n',
      "utf8",
    );

    assert.equal(
      await createFileBackedWorkbenchSessionState(
        sessionStatePath,
      ).readSession(),
      undefined,
    );
  });

  it("discards a recognized abandoned temporary file before reading state", async () => {
    const sessionStatePath = join(temporaryRoot, "workbench.json");
    const abandonedTemporaryPath = join(
      temporaryRoot,
      ".galaxy-brain-atomic-abandoned.tmp",
    );
    const expected = {
      selectedRepositoryPath: "/repositories/bayesian-statistics",
    };

    await writeFile(sessionStatePath, `${JSON.stringify(expected)}\n`, "utf8");
    await writeFile(abandonedTemporaryPath, '{"incomplete":', "utf8");

    assert.deepEqual(
      await createFileBackedWorkbenchSessionState(
        sessionStatePath,
      ).readSession(),
      expected,
    );
    await assert.rejects(readFile(abandonedTemporaryPath, "utf8"), {
      code: "ENOENT",
    });
  });

  it("preserves the previous state when atomic replacement fails", async () => {
    const sessionStatePath = join(temporaryRoot, "workbench.json");
    const first = {
      selectedRepositoryPath: "/repositories/first",
    };
    const second = {
      selectedRepositoryPath: "/repositories/second",
    };

    await createFileBackedWorkbenchSessionState(sessionStatePath).writeSession(
      first,
    );

    const replacementFailure = {
      ...defaultAtomicFileSystem,
      mkdir,
      rename: async () => {
        throw new Error("replacement interrupted");
      },
    };

    await assert.rejects(
      createFileBackedWorkbenchSessionState(
        sessionStatePath,
        replacementFailure,
      ).writeSession(second),
      /replacement interrupted/,
    );
    assert.deepEqual(
      await createFileBackedWorkbenchSessionState(
        sessionStatePath,
      ).readSession(),
      first,
    );
  });

  it("serializes concurrent writes with distinct temporary files", async () => {
    const sessionStatePath = join(temporaryRoot, "workbench.json");
    const temporaryPaths: string[] = [];
    const filesystem = {
      ...defaultAtomicFileSystem,
      mkdir,
      writeFile: async (
        path: Parameters<typeof writeFile>[0],
        contents: Parameters<typeof writeFile>[1],
        options: Parameters<typeof writeFile>[2],
      ) => {
        temporaryPaths.push(path.toString());
        await defaultAtomicFileSystem.writeFile(path, contents, options);
      },
    };
    const sessionState = createFileBackedWorkbenchSessionState(
      sessionStatePath,
      filesystem,
    );

    await Promise.all([
      sessionState.writeSession({
        selectedRepositoryPath: "/repositories/first",
      }),
      sessionState.writeSession({
        selectedRepositoryPath: "/repositories/second",
      }),
    ]);

    assert.equal(new Set(temporaryPaths).size, 2);
    assert.deepEqual(await sessionState.readSession(), {
      selectedRepositoryPath: "/repositories/second",
    });
    assert.deepEqual(
      (await readdir(temporaryRoot)).filter((name) =>
        name.startsWith(".galaxy-brain-atomic-"),
      ),
      [],
    );
  });

  it("treats a missing session directory as an unavailable first launch", async () => {
    assert.equal(
      await createFileBackedWorkbenchSessionState(
        join(temporaryRoot, "missing", "workbench.json"),
      ).readSession(),
      undefined,
    );
  });

  it("continues reading state when abandoned-file cleanup fails", async () => {
    const sessionStatePath = join(temporaryRoot, "workbench.json");
    const expected = {
      selectedRepositoryPath: "/repositories/bayesian-statistics",
    };

    await writeFile(sessionStatePath, `${JSON.stringify(expected)}\n`, "utf8");
    await writeFile(
      join(temporaryRoot, ".galaxy-brain-atomic-abandoned.tmp"),
      "incomplete",
      "utf8",
    );

    const cleanupFailure = {
      ...defaultAtomicFileSystem,
      mkdir,
      rm: async () => {
        throw new Error("cleanup unavailable");
      },
    };

    assert.deepEqual(
      await createFileBackedWorkbenchSessionState(
        sessionStatePath,
        cleanupFailure,
      ).readSession(),
      expected,
    );
  });

  it("treats unexpected temporary-directory read failures as a first launch", async () => {
    const sessionStatePath = join(temporaryRoot, "workbench.json");
    await writeFile(
      sessionStatePath,
      '{"selectedRepositoryPath":"/repositories/bayesian-statistics"}\n',
      "utf8",
    );

    const directoryReadFailure = {
      ...defaultAtomicFileSystem,
      mkdir,
      readdir: async () => {
        throw new Error("directory unavailable");
      },
    };

    assert.equal(
      await createFileBackedWorkbenchSessionState(
        sessionStatePath,
        directoryReadFailure,
      ).readSession(),
      undefined,
    );
  });

  it("round-trips an explicitly selected Workbench context", async () => {
    const sessionStatePath = join(temporaryRoot, "workbench.json");
    const sessionState =
      createFileBackedWorkbenchSessionState(sessionStatePath);
    const expected = {
      selectedRepositoryPath: "/repositories/multiple-topics",
      activeWorkspace: "atlas" as const,
      selectedContext: {
        topicId: "bayesian-statistics",
        sourceRecordId: "bayesian-statistics-fixture-source",
      },
    };

    await sessionState.writeSession(expected);

    assert.deepEqual(await sessionState.readSession(), expected);
    assert.equal(
      await readFile(sessionStatePath, "utf8"),
      `${JSON.stringify(expected)}\n`,
    );
  });

  it("round-trips an explicitly selected theme", async () => {
    const sessionStatePath = join(temporaryRoot, "workbench.json");
    const sessionState =
      createFileBackedWorkbenchSessionState(sessionStatePath);
    const expected = {
      selectedRepositoryPath: "/repositories/bayesian-statistics",
      theme: "dark" as const,
    };

    await sessionState.writeSession(expected);

    assert.deepEqual(await sessionState.readSession(), expected);
  });

  it("round-trips a theme before a repository is selected", async () => {
    const sessionStatePath = join(temporaryRoot, "workbench.json");
    const sessionState =
      createFileBackedWorkbenchSessionState(sessionStatePath);
    const expected = {
      activeWorkspace: "atlas" as const,
      theme: "dark" as const,
    };

    await sessionState.writeSession(expected);

    assert.deepEqual(await sessionState.readSession(), expected);
  });
});
