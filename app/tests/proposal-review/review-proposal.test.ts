import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createInMemoryGovernanceStore } from "../../src/adapters/governance/in-memory-governance-store";
import {
  createEmptyProposalReviewSource,
  createFixtureProposalReviewSource,
  fixtureCurrentGovernedContent,
} from "../../src/adapters/proposal-review/fixture-proposal-review";
import {
  createProposalReview,
  type ProposalReviewSource,
} from "../../src/modules/proposal-review";
import {
  createGovernance,
  type GovernedTarget,
} from "../../src/modules/governance";

const target: GovernedTarget = {
  id: "bayesian-statistics",
  title: "Bayesian statistics",
  path: "knowledge/bayesian-statistics.md",
};

const before = "old governed text";
const after = "new governed text";

const source: ProposalReviewSource = {
  async readDraft() {
    return {
      proposalId: "proposal-review-test",
      proposalFingerprint: "proposal-review-test-fingerprint",
      target,
      baseVersionId: "v1",
      workingMaterial: {
        id: "working-material-review-test",
        state: "working-material" as const,
        target,
        baseVersionId: "v1",
        content: after,
      },
      changes: [
        {
          id: "change-review-test",
          exactChange: { path: target.path, before, after },
          dependsOn: [],
        },
      ],
      judgmentId: "judgment-review-test",
      evidence: {
        sourcePath: "sources/review-test.md",
        text: "Review evidence text.",
      },
    };
  },
};

describe("Proposal Review session", () => {
  it("provides one deterministic fixture draft and no normal-launch draft", async () => {
    const fixture = createFixtureProposalReviewSource();
    const firstDraft = await fixture.readDraft();

    assert.equal(
      firstDraft?.proposalId,
      "proposal-tb10-bayesian-statistics-evidence",
    );
    assert.equal(
      firstDraft?.changes[0]?.exactChange.after,
      "Bayesian statistics uses evidence to update prior belief.",
    );
    assert.equal(await fixture.readDraft(), undefined);
    assert.equal(
      await createEmptyProposalReviewSource().readDraft(),
      undefined,
    );
    assert.match(fixtureCurrentGovernedContent, /stable item to carry between/);
  });

  it("keeps the Proposal pending until explicit acceptance, then applies it", async () => {
    const governance = createGovernance({
      store: createInMemoryGovernanceStore({
        currentVersion: { id: "v1", target, content: before },
        nextVersionId: "v2",
      }),
    });
    const review = createProposalReview({ governance, source });

    const pending = await review.read();
    assert.equal(pending.outcome, "available");
    if (pending.outcome !== "available") {
      return;
    }

    assert.equal(pending.review.proposal.id, "proposal-review-test");
    assert.equal(
      (await governance.loadCurrentVersion(target.id)).outcome,
      "found",
    );

    const applied = await review.acceptAndApply();
    assert.equal(applied.outcome, "applied");
    if (applied.outcome !== "applied") {
      return;
    }

    assert.equal(applied.review.currentVersion.id, "v2");
    assert.equal(applied.review.previousVersion.id, "v1");
    assert.equal(applied.review.judgment.id, "judgment-review-test");
    assert.deepEqual(await review.read(), applied);
  });
});
