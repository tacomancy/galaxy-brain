import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import {
  createRepositoryNavigation,
  type RepositoryNavigationSource,
} from "../src/modules/repository-navigation";

describe("Repository Navigation", () => {
  it("rejects traversal and returns the safe repository tree from its source", async () => {
    const source: RepositoryNavigationSource = {
      readEntries: async () => ({
        outcome: "available",
        entries: [
          {
            path: "scratch",
            name: "scratch",
            kind: "directory",
            support: "directory",
          },
        ],
      }),
      openEntry: async () => ({
        outcome: "working-material",
        path: "scratch/example.md",
        title: "Example",
      }),
    };
    const navigation = createRepositoryNavigation(source);

    assert.deepEqual(await navigation.readTree(), {
      outcome: "available",
      entries: [
        {
          path: "scratch",
          name: "scratch",
          kind: "directory",
          support: "directory",
        },
      ],
    });
    assert.deepEqual(await navigation.open("../private.md"), {
      outcome: "unavailable",
      detail: "The repository navigation target is invalid.",
    });
  });
});
