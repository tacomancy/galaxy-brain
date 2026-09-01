import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import {
  createEmptyAtlasOrientationSource,
  createFixtureAtlasOrientationSource,
} from "../src/adapters/atlas-orientation/fixture-atlas-orientation";
import {
  createAtlasOrientation,
  type AtlasOrientationSource,
} from "../src/modules/atlas-orientation";

describe("Atlas Orientation Module", () => {
  it("provides the deterministic fixture and an empty normal-launch source", async () => {
    const fixture = await createFixtureAtlasOrientationSource().read();

    assert.equal(fixture?.metrics[0]?.value, 2);
    assert.equal(fixture?.learningRoutes[0]?.ownership, "human-authored");
    assert.equal(
      fixture?.generatedRelationships[0]?.evidence,
      "The fixture Source Record describes updating a prior belief with evidence.",
    );
    assert.equal(await createEmptyAtlasOrientationSource().read(), undefined);
  });

  it("reads a source-backed overview and keeps its metric traceable", async () => {
    const source: AtlasOrientationSource = {
      async read() {
        return {
          metrics: [
            {
              id: "captured-source-annotations",
              label: "Captured source annotations",
              value: 2,
              definition:
                "Saved annotations attached to the current Source Record.",
              sourceItems: [
                {
                  id: "annotation-one",
                  title: "Source claim",
                  kind: "annotation",
                },
                {
                  id: "annotation-two",
                  title: "Evidence update",
                  kind: "annotation",
                },
              ],
              action: {
                kind: "open-source-record",
                sourceRecordId: "fixture-source",
                label: "Open source in Paper Desk",
              },
            },
          ],
          learningRoutes: [],
          generatedRelationships: [],
        };
      },
    };
    const orientation = createAtlasOrientation(source);

    const result = await orientation.read();

    assert.deepEqual(result, {
      outcome: "available",
      overview: {
        metrics: [
          {
            id: "captured-source-annotations",
            label: "Captured source annotations",
            value: 2,
            definition:
              "Saved annotations attached to the current Source Record.",
            sourceItems: [
              {
                id: "annotation-one",
                title: "Source claim",
                kind: "annotation",
              },
              {
                id: "annotation-two",
                title: "Evidence update",
                kind: "annotation",
              },
            ],
            action: {
              kind: "open-source-record",
              sourceRecordId: "fixture-source",
              label: "Open source in Paper Desk",
            },
          },
        ],
        learningRoutes: [],
        generatedRelationships: [],
      },
    });
  });

  it("edits only the human-authored route projection", async () => {
    const orientation = createAtlasOrientation({
      async read() {
        return {
          metrics: [],
          learningRoutes: [
            {
              id: "route",
              title: "Original route",
              ownership: "human-authored",
              steps: ["One"],
            },
          ],
          generatedRelationships: [],
        };
      },
    });

    const result = await orientation.editLearningRouteTitle(
      "route",
      "Renamed route",
    );

    assert.equal(result.outcome, "updated");
    if (result.outcome === "updated") {
      assert.equal(result.overview.learningRoutes[0]?.title, "Renamed route");
      assert.equal(
        result.overview.learningRoutes[0]?.ownership,
        "human-authored",
      );
    }
  });

  it("rejects an empty route title without changing the overview", async () => {
    const orientation = createAtlasOrientation({
      async read() {
        return {
          metrics: [],
          learningRoutes: [
            {
              id: "route",
              title: "Original route",
              ownership: "human-authored",
              steps: ["One"],
            },
          ],
          generatedRelationships: [],
        };
      },
    });

    const result = await orientation.editLearningRouteTitle("route", " ");

    assert.deepEqual(result, {
      outcome: "operation-failed",
      detail: "A Learning Route title is required.",
    });
    assert.equal((await orientation.read()).outcome, "available");
  });
});
