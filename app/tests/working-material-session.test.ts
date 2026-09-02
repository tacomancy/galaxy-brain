import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createWorkbenchSession } from "../src/modules/workbench-session";

describe("Working Material session resume", () => {
  it("resumes Studio with the selected note without requiring topic context", async () => {
    const session = createWorkbenchSession(
      {
        createAt: async () => ({
          outcome: "created" as const,
          repositoryPath: "/repository",
        }),
        openAt: async () => ({
          outcome: "opened" as const,
          repositoryPath: "/repository",
        }),
        readWorkbenchContext: async () => ({
          outcome: "not-found" as const,
          detail:
            "No complete context is required for a Working Material note.",
        }),
      },
      {
        readSession: async () => ({
          selectedRepositoryPath: "/repository",
          activeWorkspace: "studio",
          selectedWorkingMaterialPath:
            "scratch/tb17-bayesian-statistics-working-note.md",
        }),
        writeSession: async () => undefined,
      },
    );

    assert.deepEqual(await session.openFreshWorkbench(), {
      activeWorkspace: "studio",
      repositoryStatus: "selected",
      repositoryPath: "/repository",
      repositoryAccess: "read-write",
      repositorySelection: "opened",
      selectedWorkingMaterialPath:
        "scratch/tb17-bayesian-statistics-working-note.md",
    });
  });
});
