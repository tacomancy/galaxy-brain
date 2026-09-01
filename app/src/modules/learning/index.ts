/**
 * A human-owned learning stage.
 * The identifier is stable within a route and the title is caller-visible;
 * neither field is mutated by a provider suggestion.
 */
export interface LearningStage {
  id: string;
  title: string;
}

/**
 * A source item that explains a learning-progress suggestion.
 * The source-record identity is retained so UI callers can navigate back to
 * the authority behind derived progress.
 */
export interface LearningEvidenceItem {
  id: string;
  title: string;
  sourceRecordId: string;
}

/**
 * The current session learning state supplied at the composition seam.
 * A missing state is represented by `undefined` at the source boundary and is
 * returned to callers as `not-available`.
 */
export interface LearningState {
  routeId: string;
  routeTitle: string;
  currentStage: LearningStage;
  evidence: readonly LearningEvidenceItem[];
}

/**
 * A provider-produced suggestion before a human makes a decision.
 * The Module rejects stage mismatches, empty explanations, and unknown
 * evidence rather than exposing an ungrounded suggestion.
 */
export interface LearningProgressSuggestion {
  id: string;
  currentStageId: string;
  suggestedStage: LearningStage;
  explanation: string;
  evidence: readonly LearningEvidenceItem[];
}

/**
 * The human decision state of a progress suggestion.
 * A decision is terminal for this session; repeated confirmation or
 * correction returns `operation-failed`.
 */
export type LearningProgressStatus =
  "awaiting-confirmation" | "confirmed" | "corrected";

/**
 * The suggestion projection exposed to the Atlas UI.
 * Its status distinguishes pending, explicitly confirmed, and explicitly
 * corrected outcomes.
 */
export interface LearningProgressSuggestionView extends LearningProgressSuggestion {
  status: LearningProgressStatus;
  correction?: string;
}

/**
 * The complete human-owned learning projection exposed to callers.
 * Stage advancement is session-local and occurs only through `confirm()`.
 */
export interface LearningProgressView {
  routeId: string;
  routeTitle: string;
  currentStage: LearningStage;
  suggestion: LearningProgressSuggestionView;
}

/**
 * Source seam for current human-owned learning state.
 * Implementations return `undefined` when the current Workbench has no
 * learning state; filesystem and repository errors must be translated by the
 * Adapter before reaching this Interface.
 */
export interface LearningStateSource {
  read(): Promise<LearningState | undefined>;
}

/**
 * Narrow operation-specific provider seam for progress suggestions.
 * The provider may return a translated unavailable or failed outcome; it does
 * not own learning-stage mutation.
 */
export interface LearningSuggestionProvider {
  suggestProgress(
    input: LearningState,
  ): Promise<LearningSuggestionProviderOutcome>;
}

/**
 * Provider response translated at the Agent boundary.
 * `available` carries a candidate only; unavailable and failed outcomes never
 * mutate learning state.
 */
export type LearningSuggestionProviderOutcome =
  | { outcome: "available"; suggestion: LearningProgressSuggestion }
  | { outcome: "agent-provider-unavailable"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/**
 * Result of reading the current learning suggestion.
 * It distinguishes an available projection, absent state, provider
 * unavailability, and an operation failure without exposing provider details.
 */
export type LearningReadOutcome =
  | { outcome: "available"; progress: LearningProgressView }
  | { outcome: "not-available"; detail: string }
  | {
      outcome: "agent-provider-unavailable";
      detail: string;
      currentStage: LearningStage;
    }
  | { outcome: "operation-failed"; detail: string };

/**
 * Result of an explicit human confirmation or correction.
 * Only `updated` changes the session projection; all other outcomes preserve
 * the current state.
 */
export type LearningOperationOutcome =
  | { outcome: "updated"; progress: LearningProgressView }
  | { outcome: "not-available"; detail: string }
  | {
      outcome: "agent-provider-unavailable";
      detail: string;
      currentStage: LearningStage;
    }
  | { outcome: "operation-failed"; detail: string };

/**
 * Dependencies supplied when composing the Learning Module.
 * State and provider behavior remain replaceable at this composition boundary.
 */
export interface LearningDependencies {
  state: LearningStateSource;
  suggestionProvider: LearningSuggestionProvider;
}

/**
 * Public Learning Module Interface for human-owned progress.
 * `suggest()` may contact the provider once per session; `read()` is passive,
 * and `confirm()`/`correct()` operate only on an already-generated suggestion.
 * Invalid identifiers, repeated decisions, and empty corrections return
 * `operation-failed` without mutating the projection.
 */
export interface Learning {
  suggest(): Promise<LearningReadOutcome>;
  read(): Promise<LearningReadOutcome>;
  confirm(suggestionId: string): Promise<LearningOperationOutcome>;
  correct(
    suggestionId: string,
    correction: string,
  ): Promise<LearningOperationOutcome>;
}

const cloneStage = (stage: LearningStage): LearningStage => ({ ...stage });

const cloneEvidence = (
  evidence: readonly LearningEvidenceItem[],
): LearningEvidenceItem[] => evidence.map((item) => ({ ...item }));

const cloneProgress = (
  progress: LearningProgressView,
): LearningProgressView => ({
  ...progress,
  currentStage: cloneStage(progress.currentStage),
  suggestion: {
    ...progress.suggestion,
    suggestedStage: cloneStage(progress.suggestion.suggestedStage),
    evidence: cloneEvidence(progress.suggestion.evidence),
  },
});

const invalidSuggestion = (
  suggestion: LearningProgressSuggestion,
  state: LearningState,
): string | undefined => {
  if (suggestion.currentStageId !== state.currentStage.id) {
    return "The learning suggestion does not match the current stage.";
  }

  if (suggestion.explanation.trim().length === 0) {
    return "The learning suggestion must explain its evidence.";
  }

  const knownEvidence = new Set(state.evidence.map((item) => item.id));
  if (
    suggestion.evidence.length === 0 ||
    suggestion.evidence.some((item) => !knownEvidence.has(item.id))
  ) {
    return "The learning suggestion cites unavailable evidence.";
  }

  return undefined;
};

/**
 * Composes a Learning Module over human-owned state and a narrow provider.
 *
 * The Module keeps stage changes in session memory until a human confirms a
 * suggestion. Provider responses are never treated as progress mutations.
 * @param dependencies State and progress-suggestion dependencies.
 * @returns The Learning Module Interface.
 */
export const createLearning = ({
  state,
  suggestionProvider,
}: LearningDependencies): Learning => {
  let learningState: LearningState | undefined;
  let progress: LearningProgressView | undefined;
  let providerOutcome:
    | { outcome: "agent-provider-unavailable"; detail: string }
    | { outcome: "operation-failed"; detail: string }
    | undefined;

  const suggest = async (): Promise<LearningReadOutcome> => {
    if (learningState === undefined) {
      learningState = await state.read();
    }

    if (learningState === undefined) {
      return {
        outcome: "not-available",
        detail: "No learning state is available for this Workbench.",
      };
    }

    if (progress !== undefined) {
      return { outcome: "available", progress: cloneProgress(progress) };
    }

    if (providerOutcome !== undefined) {
      return providerOutcome.outcome === "agent-provider-unavailable"
        ? {
            ...providerOutcome,
            currentStage: cloneStage(learningState.currentStage),
          }
        : providerOutcome;
    }

    const response = await suggestionProvider.suggestProgress(learningState);
    if (response.outcome !== "available") {
      providerOutcome = response;
      return response.outcome === "agent-provider-unavailable"
        ? {
            ...response,
            currentStage: cloneStage(learningState.currentStage),
          }
        : response;
    }

    const invalidDetail = invalidSuggestion(response.suggestion, learningState);
    if (invalidDetail !== undefined) {
      providerOutcome = { outcome: "operation-failed", detail: invalidDetail };
      return providerOutcome;
    }

    progress = {
      routeId: learningState.routeId,
      routeTitle: learningState.routeTitle,
      currentStage: cloneStage(learningState.currentStage),
      suggestion: {
        ...response.suggestion,
        suggestedStage: cloneStage(response.suggestion.suggestedStage),
        evidence: cloneEvidence(response.suggestion.evidence),
        status: "awaiting-confirmation",
      },
    };
    return { outcome: "available", progress: cloneProgress(progress) };
  };

  const read = async (): Promise<LearningReadOutcome> => {
    if (learningState === undefined) {
      learningState = await state.read();
    }

    if (learningState === undefined) {
      return {
        outcome: "not-available",
        detail: "No learning state is available for this Workbench.",
      };
    }

    if (progress !== undefined) {
      return { outcome: "available", progress: cloneProgress(progress) };
    }

    if (providerOutcome !== undefined) {
      return providerOutcome.outcome === "agent-provider-unavailable"
        ? {
            ...providerOutcome,
            currentStage: cloneStage(learningState.currentStage),
          }
        : providerOutcome;
    }

    return {
      outcome: "not-available",
      detail: "No learning progress suggestion has been generated.",
    };
  };

  const decide = async (
    suggestionId: string,
    decision: "confirmed" | "corrected",
    correction?: string,
  ): Promise<LearningOperationOutcome> => {
    if (learningState === undefined || progress === undefined) {
      return {
        outcome: "not-available",
        detail: "No learning progress suggestion is available.",
      };
    }

    const current = { outcome: "available" as const, progress };

    if (current.progress.suggestion.id !== suggestionId) {
      return {
        outcome: "operation-failed",
        detail: "The selected learning suggestion is unavailable.",
      };
    }

    if (current.progress.suggestion.status !== "awaiting-confirmation") {
      return {
        outcome: "operation-failed",
        detail: "The learning suggestion already has a human decision.",
      };
    }

    if (decision === "corrected") {
      const trimmedCorrection = correction?.trim() ?? "";
      if (trimmedCorrection.length === 0) {
        return {
          outcome: "operation-failed",
          detail: "A correction is required.",
        };
      }
      progress = {
        ...current.progress,
        suggestion: {
          ...current.progress.suggestion,
          status: "corrected",
          correction: trimmedCorrection,
        },
      };
      return { outcome: "updated", progress: cloneProgress(progress) };
    }

    const suggestedStage = current.progress.suggestion.suggestedStage;
    progress = {
      ...current.progress,
      currentStage: cloneStage(suggestedStage),
      suggestion: {
        ...current.progress.suggestion,
        status: "confirmed",
      },
    };
    return { outcome: "updated", progress: cloneProgress(progress) };
  };

  return {
    suggest,
    read,
    confirm: (suggestionId) => decide(suggestionId, "confirmed"),
    correct: (suggestionId, correction) =>
      decide(suggestionId, "corrected", correction),
  };
};
