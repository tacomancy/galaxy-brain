import type {
  AuthoringConstruct,
  AuthoringDraftInput,
  AuthoringDraftSource,
} from "../../modules/knowledge-authoring";

const sourceFor = (body: string): string => `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: working-material
base_version: bayesian-statistics-v1
---

# Bayesian statistics

${body}`;

const fixtureDrafts: Record<AuthoringConstruct, AuthoringDraftInput> = {
  highlight: {
    id: "draft-tb11-bayesian-statistics-highlight",
    topicId: "bayesian-statistics",
    title: "Bayesian statistics",
    state: "working-material",
    construct: "highlight",
    source: sourceFor(
      "Bayesian statistics updates a ==prior belief== with evidence.",
    ),
  },
  link: {
    id: "draft-tb11-bayesian-statistics-link",
    topicId: "bayesian-statistics",
    title: "Bayesian statistics",
    state: "working-material",
    construct: "link",
    source: sourceFor(
      "Bayesian statistics compares [[bayesian-inference]] with evidence.",
    ),
  },
  embed: {
    id: "draft-tb11-bayesian-statistics-embed",
    topicId: "bayesian-statistics",
    title: "Bayesian statistics",
    state: "working-material",
    construct: "embed",
    source: sourceFor(
      "Bayesian statistics includes ![[bayesian-updates#overview]].",
    ),
  },
  callout: {
    id: "draft-tb11-bayesian-statistics-callout",
    topicId: "bayesian-statistics",
    title: "Bayesian statistics",
    state: "working-material",
    construct: "callout",
    source: sourceFor("> [!EVIDENCE] Evidence updates confidence."),
  },
  equation: {
    id: "draft-tb11-bayesian-statistics-equation",
    topicId: "bayesian-statistics",
    title: "Bayesian statistics",
    state: "working-material",
    construct: "equation",
    source: sourceFor("Bayesian updating uses $P(H|E)$ as its likelihood."),
  },
  citation: {
    id: "draft-tb11-bayesian-statistics-citation",
    topicId: "bayesian-statistics",
    title: "Bayesian statistics",
    state: "working-material",
    construct: "citation",
    source: sourceFor("The prior is documented in [@bayes-1763]."),
  },
};

/**
 * Creates the transient TB11 authoring examples for the silent packaged path.
 * @returns A source containing the six deterministic authoring examples.
 */
export const createFixtureAuthoringDraftSource = (): AuthoringDraftSource => ({
  async readDraft(
    construct: AuthoringConstruct = "highlight",
  ): Promise<AuthoringDraftInput> {
    return fixtureDrafts[construct];
  },
});

/**
 * Creates the empty source used by normal launches.
 * @returns A source that reports no available authoring draft.
 */
export const createEmptyAuthoringDraftSource = (): AuthoringDraftSource => ({
  async readDraft(): Promise<AuthoringDraftInput | undefined> {
    return undefined;
  },
});
