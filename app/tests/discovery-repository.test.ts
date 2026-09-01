import { strict as assert } from "node:assert";
import { join } from "node:path";

import { describe, it } from "vitest";

import { createFileBackedDiscoveryRepository } from "../src/adapters/discovery/file-backed-discovery-repository";

describe("file-backed Discovery repository Adapter", () => {
  it("reads the fixture's portable items with authority classes", async () => {
    const repository = createFileBackedDiscoveryRepository(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
    );
    const outcome = await repository.readDiscoverableItems();
    assert.equal(outcome.outcome, "available");
    if (outcome.outcome !== "available") {
      return;
    }
    const items = outcome.items;

    assert.deepEqual(
      items
        .filter(({ id }) => id.startsWith("bayesian-statistics"))
        .map(({ id, title, kind, authority }) => ({
          id,
          title,
          kind,
          authority,
        })),
      [
        {
          id: "bayesian-statistics",
          title: "Bayesian statistics",
          kind: "topic",
          authority: "core-knowledge",
        },
        {
          id: "bayesian-statistics-fixture-source",
          title: "Bayesian statistics fixture source",
          kind: "source-record",
          authority: "source-record",
        },
      ],
    );
    assert.equal(
      items.find(({ kind }) => kind === "saved-synthesis-result")?.id,
      "synthesis-result-bayesian-statistics-fixture",
    );
    assert.equal(
      items.filter(({ kind }) => kind === "structured-annotation").length,
      2,
    );
  });
});
