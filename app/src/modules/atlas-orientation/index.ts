/** A source item named by an Atlas metric for traceability. */
export interface AtlasOrientationSourceItem {
  id: string;
  title: string;
  kind: "annotation" | "source-record";
}

/** A metric with an explicit definition, evidence, and reachable action. */
export interface AtlasOrientationMetric {
  id: string;
  label: string;
  value: number;
  definition: string;
  sourceItems: readonly AtlasOrientationSourceItem[];
  action: {
    kind: "open-source-record";
    sourceRecordId: string;
    label: string;
  };
}

/** A route curated by a human and editable in the current Workbench session. */
export interface AtlasLearningRoute {
  id: string;
  title: string;
  ownership: "human-authored";
  steps: readonly string[];
}

/** A discovery-only relationship that has not entered Governed Knowledge. */
export interface AtlasGeneratedRelationship {
  id: string;
  sourceTopicTitle: string;
  targetTopicTitle: string;
  relationship: string;
  evidence: string;
  sourceRecordId: string;
}

/** The serializable orientation projection rendered by Atlas. */
export interface AtlasOrientationOverview {
  metrics: readonly AtlasOrientationMetric[];
  learningRoutes: readonly AtlasLearningRoute[];
  generatedRelationships: readonly AtlasGeneratedRelationship[];
}

/** Composition seam for fixture or future repository-backed Atlas data. */
export interface AtlasOrientationSource {
  read(): Promise<AtlasOrientationOverview | undefined>;
}

/** Result of reading the current Atlas orientation projection. */
export type AtlasOrientationReadOutcome =
  | { outcome: "available"; overview: AtlasOrientationOverview }
  | { outcome: "not-available" }
  | { outcome: "operation-failed"; detail: string };

/** Result of a human-owned Learning Route title edit. */
export type AtlasLearningRouteEditOutcome =
  | { outcome: "updated"; overview: AtlasOrientationOverview }
  | { outcome: "not-available"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/** Public Module Interface for actionable Atlas orientation content. */
export interface AtlasOrientation {
  read(): Promise<AtlasOrientationReadOutcome>;
  editLearningRouteTitle(
    routeId: string,
    title: string,
  ): Promise<AtlasLearningRouteEditOutcome>;
}

const cloneOverview = (
  overview: AtlasOrientationOverview,
): AtlasOrientationOverview => ({
  metrics: overview.metrics.map((metric) => ({
    ...metric,
    sourceItems: metric.sourceItems.map((sourceItem) => ({ ...sourceItem })),
    action: { ...metric.action },
  })),
  learningRoutes: overview.learningRoutes.map((route) => ({
    ...route,
    steps: [...route.steps],
  })),
  generatedRelationships: overview.generatedRelationships.map(
    (relationship) => ({
      ...relationship,
    }),
  ),
});

/**
 * Composes a bounded Atlas overview over a source seam.
 *
 * Route title edits deliberately remain in Module memory. Until the
 * Repository Format defines durable Learning Route writes, this keeps the UI
 * honest about what has and has not been persisted.
 * @param source Fixture or future repository-backed orientation source.
 * @returns The Atlas Orientation Module Interface.
 */
export const createAtlasOrientation = (
  source: AtlasOrientationSource,
): AtlasOrientation => {
  let overview: AtlasOrientationOverview | undefined;

  const read = async (): Promise<AtlasOrientationReadOutcome> => {
    if (overview === undefined) {
      overview = await source.read();
    }

    return overview === undefined
      ? { outcome: "not-available" }
      : { outcome: "available", overview: cloneOverview(overview) };
  };

  const editLearningRouteTitle = async (
    routeId: string,
    title: string,
  ): Promise<AtlasLearningRouteEditOutcome> => {
    const current = await read();

    if (current.outcome !== "available") {
      return {
        outcome: "not-available",
        detail: "No Atlas orientation is available for this Workbench.",
      };
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return {
        outcome: "operation-failed",
        detail: "A Learning Route title is required.",
      };
    }

    const route = current.overview.learningRoutes.find(
      (candidate) => candidate.id === routeId,
    );
    if (route === undefined) {
      return {
        outcome: "operation-failed",
        detail: "The selected Learning Route is unavailable.",
      };
    }

    overview = {
      ...current.overview,
      learningRoutes: current.overview.learningRoutes.map((candidate) =>
        candidate.id === routeId
          ? { ...candidate, title: trimmedTitle }
          : candidate,
      ),
    };
    return { outcome: "updated", overview: cloneOverview(overview) };
  };

  return { read, editLearningRouteTitle };
};
