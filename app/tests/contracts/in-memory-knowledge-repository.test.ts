import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createInMemoryKnowledgeRepository } from "../../src/adapters/knowledge-repository/in-memory-knowledge-repository";

describe("in-memory Knowledge Repository contract", () => {
  it("keeps create and open outcomes consistent for known paths", async () => {
    const repository = createInMemoryKnowledgeRepository();

    assert.deepEqual(await repository.createAt("./test-repository"), {
      outcome: "created",
      repositoryPath: `${process.cwd()}/test-repository`,
    });
    assert.deepEqual(await repository.openAt("./test-repository"), {
      outcome: "opened",
      repositoryPath: `${process.cwd()}/test-repository`,
    });
  });

  it("does not report success for an unknown or duplicate path", async () => {
    const repository = createInMemoryKnowledgeRepository();

    assert.deepEqual(await repository.openAt("./unknown-repository"), {
      outcome: "target-unavailable",
      detail: "The selected Knowledge Repository is unavailable.",
    });
    await repository.createAt("./duplicate-repository");
    assert.deepEqual(await repository.createAt("./duplicate-repository"), {
      outcome: "operation-failed",
      detail: "The Knowledge Repository could not be created.",
    });
  });
});
