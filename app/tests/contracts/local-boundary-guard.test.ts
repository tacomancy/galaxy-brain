import { strict as assert } from "node:assert";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { vi, describe, it } from "vitest";

// These module guards make an attempted local Git or network dependency fail
// deterministically during the Adapter contract rather than passing by luck
// because the test machine happens to be offline.
vi.mock("node:child_process", () => {
  throw new Error("Git/process execution is denied by the local test harness.");
});
vi.mock("node:dgram", () => {
  throw new Error("Outbound sockets are denied by the local test harness.");
});
vi.mock("node:dns", () => {
  throw new Error("Outbound sockets are denied by the local test harness.");
});
vi.mock("node:http", () => {
  throw new Error("Outbound sockets are denied by the local test harness.");
});
vi.mock("node:https", () => {
  throw new Error("Outbound sockets are denied by the local test harness.");
});
vi.mock("node:net", () => {
  throw new Error("Outbound sockets are denied by the local test harness.");
});
vi.mock("node:tls", () => {
  throw new Error("Outbound sockets are denied by the local test harness.");
});

import { createFileBackedKnowledgeRepository } from "../../src/adapters/knowledge-repository/file-backed-knowledge-repository";

describe("local Knowledge Repository boundary", () => {
  it("can create and open without Git or network dependencies", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-boundary-"),
    );
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (() => {
      throw new Error(
        "Outbound requests are denied by the local test harness.",
      );
    }) as typeof fetch;
    const repository = createFileBackedKnowledgeRepository(
      `${process.cwd()}/templates/knowledge-repository`,
    );

    try {
      const repositoryPath = join(temporaryRoot, "repository");
      assert.equal(
        (await repository.createAt(repositoryPath)).outcome,
        "created",
      );
      assert.equal((await repository.openAt(repositoryPath)).outcome, "opened");
    } finally {
      globalThis.fetch = originalFetch;
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
