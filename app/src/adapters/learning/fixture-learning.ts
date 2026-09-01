import type {
  LearningProgressSuggestion,
  LearningState,
  LearningStateSource,
  LearningSuggestionProvider,
} from "../../modules/learning";

const fixtureEvidence = [
  {
    id: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
    title: "Source claim · page 2, characters 0–54",
    sourceRecordId: "bayesian-statistics-fixture-source",
  },
  {
    id: "annotation-bayesian-statistics-fixture-source-page-2-55-83",
    title: "Source claim · page 2, characters 55–83",
    sourceRecordId: "bayesian-statistics-fixture-source",
  },
  {
    id: "bayesian-statistics-fixture-source",
    title: "Bayesian statistics fixture source",
    sourceRecordId: "bayesian-statistics-fixture-source",
  },
] as const;

const fixtureState: LearningState = {
  routeId: "bayesian-statistics-essentials",
  routeTitle: "Bayesian statistics essentials",
  currentStage: { id: "evidence-updates", title: "Evidence updates" },
  evidence: fixtureEvidence,
};

const fixtureSuggestion: LearningProgressSuggestion = {
  id: "progress-suggestion-bayesian-statistics-posterior",
  currentStageId: "evidence-updates",
  suggestedStage: { id: "posterior-belief", title: "Posterior belief" },
  explanation:
    "Both saved source annotations describe evidence updating confidence, so Posterior belief is a reasonable next stage to review.",
  evidence: fixtureEvidence,
};

const cloneState = (): LearningState => ({
  ...fixtureState,
  currentStage: { ...fixtureState.currentStage },
  evidence: fixtureState.evidence.map((item) => ({ ...item })),
});

const cloneSuggestion = (): LearningProgressSuggestion => ({
  ...fixtureSuggestion,
  suggestedStage: { ...fixtureSuggestion.suggestedStage },
  evidence: fixtureSuggestion.evidence.map((item) => ({ ...item })),
});

/**
 * Creates the deterministic fixture Learning State source for S1.
 * @returns A state source containing the Bayesian statistics fixture state.
 */
export const createFixtureLearningStateSource = (): LearningStateSource => ({
  async read(): Promise<LearningState> {
    return cloneState();
  },
});

/**
 * Creates the narrow provider response used by the TB14 S1 fixture.
 * @returns A suggestion provider that returns the deterministic fixture suggestion.
 */
export const createFixtureLearningSuggestionProvider =
  (): LearningSuggestionProvider => ({
    async suggestProgress(): Promise<{
      outcome: "available";
      suggestion: LearningProgressSuggestion;
    }> {
      return { outcome: "available", suggestion: cloneSuggestion() };
    },
  });

/**
 * Creates the explicit unavailable-provider Adapter for provider-free S1.
 * @returns A suggestion provider that reports the provider-free outcome.
 */
export const createUnavailableLearningSuggestionProvider =
  (): LearningSuggestionProvider => ({
    async suggestProgress(): Promise<{
      outcome: "agent-provider-unavailable";
      detail: string;
    }> {
      return {
        outcome: "agent-provider-unavailable",
        detail:
          "Learning progress suggestions require a configured Agent Provider.",
      };
    },
  });
