import { strict as assert } from "node:assert";
import { join } from "node:path";

import { describe, it } from "vitest";

import { createFileBackedDiscoveryRepository } from "../src/adapters/discovery/file-backed-discovery-repository";

describe("file-backed Discovery repository Adapter", () => {
  it("reads the fixture's portable items with authority classes", async () => {
    const repository = createFileBackedDiscoveryRepository(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
    );
    const items = await repository.readDiscoverableItems();

    assert.deepEqual(
      items.map(({ id, title, kind, authority }) => ({
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
        {
          id: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
          title: "Bayesian statistics fixture source",
          kind: "structured-annotation",
          authority: "working-material",
        },
        {
          id: "annotation-bayesian-statistics-fixture-source-page-2-55-83",
          title: "Bayesian statistics fixture source",
          kind: "structured-annotation",
          authority: "working-material",
        },
      ],
    );
  });
});
