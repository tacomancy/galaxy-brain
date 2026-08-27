import { strict as assert } from "node:assert";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, it } from "vitest";

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
});
