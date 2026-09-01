import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { composeWorkbenchViewState } from "../src/modules/workbench-view";
import type { WorkbenchState } from "../src/modules/workbench-session";

const workbench: WorkbenchState = {
  activeWorkspace: "paper-desk",
  repositoryStatus: "selected",
  repositoryPath: "/repository",
  repositoryAccess: "read-write",
  repositorySelection: "opened",
  context: {
    topic: { id: "topic", title: "Topic" },
    sourceRecord: { id: "source", title: "Source" },
  },
};

const annotation = {
  id: "annotation-source-1-0-5",
  state: "working-material" as const,
  sourceRecord: workbench.context!.sourceRecord,
  sourceLocator: {
    page: 1,
    start: 0,
    end: 5,
    logical: "page:1#chars=0-5",
  },
  text: "claim",
  attribution: "source-claim" as const,
  classification: "source-claim" as const,
};

describe("Workbench View composition", () => {
  it("adds source-derived annotation state without changing Session state", async () => {
    const result = await composeWorkbenchViewState(workbench, {
      readSavedAnnotation: async () => ({ outcome: "found", annotation }),
    });

    assert.deepEqual(result, { ...workbench, sourceAnnotation: annotation });
  });

  it("returns contextual workspaces to Atlas when the source annotation is unavailable", async () => {
    const result = await composeWorkbenchViewState(workbench, {
      readSavedAnnotation: async () => ({
        outcome: "unavailable",
        detail: "unavailable",
      }),
    });

    assert.deepEqual(result, { ...workbench, activeWorkspace: "atlas" });
  });
});
