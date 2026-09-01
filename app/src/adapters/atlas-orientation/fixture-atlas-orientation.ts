import type {
  AtlasOrientationOverview,
  AtlasOrientationSource,
} from "../../modules/atlas-orientation";

const fixtureOverview: AtlasOrientationOverview = {
  metrics: [
    {
      id: "captured-source-annotations",
      label: "Captured source annotations",
      value: 2,
      definition: "Saved annotations attached to the current Source Record.",
      sourceItems: [
        {
          id: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
          title: "Source claim · page 2, characters 0–54",
          kind: "annotation",
        },
        {
          id: "annotation-bayesian-statistics-fixture-source-page-2-55-83",
          title: "Source claim · page 2, characters 55–83",
          kind: "annotation",
        },
        {
          id: "bayesian-statistics-fixture-source",
          title: "Bayesian statistics fixture source",
          kind: "source-record",
        },
      ],
      action: {
        kind: "open-source-record",
        sourceRecordId: "bayesian-statistics-fixture-source",
        label: "Open source in Paper Desk",
      },
    },
  ],
  learningRoutes: [
    {
      id: "bayesian-statistics-essentials",
      title: "Bayesian statistics essentials",
      ownership: "human-authored",
      steps: ["Prior belief", "Evidence updates", "Posterior belief"],
    },
  ],
  generatedRelationships: [
    {
      id: "bayesian-statistics-evidence-updates",
      sourceTopicTitle: "Bayesian statistics",
      targetTopicTitle: "Evidence updates",
      relationship: "extends",
      evidence:
        "The fixture Source Record describes updating a prior belief with evidence.",
      sourceRecordId: "bayesian-statistics-fixture-source",
    },
  ],
};

/**
 * Creates the deterministic, provider-free TB13 orientation source for S1.
 * @returns A source containing the bounded Atlas orientation fixture.
 */
export const createFixtureAtlasOrientationSource =
  (): AtlasOrientationSource => ({
    async read(): Promise<AtlasOrientationOverview> {
      return {
        metrics: fixtureOverview.metrics.map((metric) => ({
          ...metric,
          sourceItems: metric.sourceItems.map((sourceItem) => ({
            ...sourceItem,
          })),
          action: { ...metric.action },
        })),
        learningRoutes: fixtureOverview.learningRoutes.map((route) => ({
          ...route,
          steps: [...route.steps],
        })),
        generatedRelationships: fixtureOverview.generatedRelationships.map(
          (relationship) => ({ ...relationship }),
        ),
      };
    },
  });

/**
 * Creates the empty source used by normal launches without fixture content.
 * @returns A source that reports no Atlas orientation.
 */
export const createEmptyAtlasOrientationSource =
  (): AtlasOrientationSource => ({
    async read(): Promise<undefined> {
      return undefined;
    },
  });
