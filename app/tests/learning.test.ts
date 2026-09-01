import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import {
  createFixtureLearningStateSource,
  createFixtureLearningSuggestionProvider,
  createUnavailableLearningSuggestionProvider,
} from "../src/adapters/learning/fixture-learning";
import {
  createLearning,
  type LearningProgressSuggestion,
  type LearningStateSource,
  type LearningSuggestionProvider,
} from "../src/modules/learning";

describe("Learning Module", () => {
  it("keeps a provider suggestion pending without advancing the current stage", async () => {
    const learning = createLearning({
      state: createFixtureLearningStateSource(),
      suggestionProvider: createFixtureLearningSuggestionProvider(),
    });

    const result = await learning.suggest();

    assert.equal(result.outcome, "available");
    if (result.outcome === "available") {
      assert.equal(result.progress.currentStage.title, "Evidence updates");
      assert.equal(
        result.progress.suggestion.suggestedStage.title,
        "Posterior belief",
      );
      assert.equal(result.progress.suggestion.status, "awaiting-confirmation");
    }
  });

  it("advances only after explicit confirmation and does not ask the provider again", async () => {
    let calls = 0;
    const provider: LearningSuggestionProvider = {
      async suggestProgress(input) {
        calls += 1;
        return createFixtureLearningSuggestionProvider().suggestProgress(input);
      },
    };
    const learning = createLearning({
      state: createFixtureLearningStateSource(),
      suggestionProvider: provider,
    });

    await learning.suggest();
    const result = await learning.confirm(
      "progress-suggestion-bayesian-statistics-posterior",
    );

    assert.equal(result.outcome, "updated");
    if (result.outcome === "updated") {
      assert.equal(result.progress.currentStage.title, "Posterior belief");
      assert.equal(result.progress.suggestion.status, "confirmed");
    }
    assert.equal(calls, 1);

    const repeated = await learning.confirm(
      "progress-suggestion-bayesian-statistics-posterior",
    );
    assert.deepEqual(repeated, {
      outcome: "operation-failed",
      detail: "The learning suggestion already has a human decision.",
    });
  });

  it("records a correction while preserving the prior stage", async () => {
    const learning = createLearning({
      state: createFixtureLearningStateSource(),
      suggestionProvider: createFixtureLearningSuggestionProvider(),
    });

    await learning.suggest();
    const result = await learning.correct(
      "progress-suggestion-bayesian-statistics-posterior",
      "Keep Evidence updates as the current stage",
    );

    assert.equal(result.outcome, "updated");
    if (result.outcome === "updated") {
      assert.equal(result.progress.currentStage.title, "Evidence updates");
      assert.equal(result.progress.suggestion.status, "corrected");
      assert.equal(
        result.progress.suggestion.correction,
        "Keep Evidence updates as the current stage",
      );
    }
  });

  it("rejects an empty correction without changing a pending suggestion", async () => {
    const learning = createLearning({
      state: createFixtureLearningStateSource(),
      suggestionProvider: createFixtureLearningSuggestionProvider(),
    });

    await learning.suggest();
    const result = await learning.correct(
      "progress-suggestion-bayesian-statistics-posterior",
      " ",
    );

    assert.deepEqual(result, {
      outcome: "operation-failed",
      detail: "A correction is required.",
    });
    const read = await learning.read();
    assert.equal(read.outcome, "available");
    if (read.outcome === "available") {
      assert.equal(read.progress.currentStage.title, "Evidence updates");
      assert.equal(read.progress.suggestion.status, "awaiting-confirmation");
    }
  });

  it("returns explicit provider unavailability without changing the current stage", async () => {
    const learning = createLearning({
      state: createFixtureLearningStateSource(),
      suggestionProvider: createUnavailableLearningSuggestionProvider(),
    });

    const result = await learning.suggest();

    assert.deepEqual(result, {
      outcome: "agent-provider-unavailable",
      detail:
        "Learning progress suggestions require a configured Agent Provider.",
      currentStage: { id: "evidence-updates", title: "Evidence updates" },
    });
  });

  it("rejects a provider suggestion that cites unknown evidence", async () => {
    const invalidSuggestionProvider: LearningSuggestionProvider = {
      async suggestProgress(): Promise<{
        outcome: "available";
        suggestion: LearningProgressSuggestion;
      }> {
        return {
          outcome: "available",
          suggestion: {
            id: "invalid-suggestion",
            currentStageId: "evidence-updates",
            suggestedStage: {
              id: "posterior-belief",
              title: "Posterior belief",
            },
            explanation: "This explanation names evidence.",
            evidence: [
              {
                id: "unknown-evidence",
                title: "Unknown evidence",
                sourceRecordId: "unknown-source",
              },
            ],
          },
        };
      },
    };
    const learning = createLearning({
      state: createFixtureLearningStateSource(),
      suggestionProvider: invalidSuggestionProvider,
    });

    assert.deepEqual(await learning.suggest(), {
      outcome: "operation-failed",
      detail: "The learning suggestion cites unavailable evidence.",
    });
  });

  it("keeps an absent learning state unavailable", async () => {
    const state: LearningStateSource = {
      async read() {
        return undefined;
      },
    };
    const learning = createLearning({
      state,
      suggestionProvider: createFixtureLearningSuggestionProvider(),
    });

    assert.deepEqual(await learning.read(), {
      outcome: "not-available",
      detail: "No learning state is available for this Workbench.",
    });
  });

  it("does not generate a suggestion while reading or deciding", async () => {
    let calls = 0;
    const provider: LearningSuggestionProvider = {
      async suggestProgress(input) {
        calls += 1;
        return createFixtureLearningSuggestionProvider().suggestProgress(input);
      },
    };
    const learning = createLearning({
      state: createFixtureLearningStateSource(),
      suggestionProvider: provider,
    });

    assert.equal((await learning.read()).outcome, "not-available");
    assert.equal(calls, 0);
    assert.equal(
      (
        await learning.confirm(
          "progress-suggestion-bayesian-statistics-posterior",
        )
      ).outcome,
      "not-available",
    );
    assert.equal(calls, 0);
  });
});
