import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createInMemoryGovernanceStore } from "../../src/adapters/governance/in-memory-governance-store";
import {
  createGovernance,
  type ApplyVersionInput,
  type ApplyVersionResult,
  type GovernedTarget,
  type GovernedVersion,
  type GovernanceVersionStore,
  type WorkingMaterialDraft,
} from "../../src/modules/governance";

const target: GovernedTarget = {
  id: "bayesian-statistics",
  title: "Bayesian statistics",
  path: "knowledge/bayesian-statistics.md",
};

const currentContent = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
---

# Bayesian statistics

This fixture topic gives the S1 workflow a stable item to carry between
workspaces.
`;

const proposalAContent = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
---

# Bayesian statistics

Bayesian statistics uses evidence to update prior belief.
`;

const proposalBContent = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
---

# Bayesian statistics

Bayesian statistics compares prior belief with new evidence.
`;

const currentVersion: GovernedVersion = {
  id: "bayesian-statistics-v1",
  target,
  content: currentContent,
};

const createProposalInput = (
  proposalId: string,
  proposalFingerprint: string,
  workingMaterialId: string,
  content: string,
  after: string,
) => ({
  proposalId,
  proposalFingerprint,
  target,
  baseVersionId: "bayesian-statistics-v1",
  workingMaterial: {
    id: workingMaterialId,
    state: "working-material" as const,
    target,
    baseVersionId: "bayesian-statistics-v1",
    content,
  } satisfies WorkingMaterialDraft,
  exactChange: {
    path: target.path,
    before:
      "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
    after,
  },
});

describe("Governance stale Judgment", () => {
  it("rejects a Judgment after another Proposal advances the current version", async () => {
    const store: GovernanceVersionStore = createInMemoryGovernanceStore({
      currentVersion,
      nextVersionId: "bayesian-statistics-v2",
    });
    let applyVersionCalls = 0;
    const observedStore: GovernanceVersionStore = {
      ...store,
      applyVersion: async (
        input: ApplyVersionInput,
      ): Promise<ApplyVersionResult> => {
        applyVersionCalls += 1;
        return store.applyVersion(input);
      },
    };
    const governance = createGovernance({ store: observedStore });

    const proposalA = createProposalInput(
      "proposal-tb9-stale-bayesian-statistics-evidence",
      "proposal-fingerprint-tb9-stale-bayesian-statistics-evidence",
      "working-material-tb9-stale-bayesian-statistics-evidence",
      proposalAContent,
      "Bayesian statistics uses evidence to update prior belief.",
    );
    const proposalB = createProposalInput(
      "proposal-tb9-version-advance-bayesian-statistics",
      "proposal-fingerprint-tb9-version-advance-bayesian-statistics",
      "working-material-tb9-version-advance-bayesian-statistics",
      proposalBContent,
      "Bayesian statistics compares prior belief with new evidence.",
    );

    assert.equal(
      (await governance.createProposal(proposalA)).outcome,
      "proposal-created",
    );
    assert.equal(
      (
        await governance.recordJudgment({
          judgmentId: "judgment-tb9-stale-bayesian-statistics-evidence",
          proposalId: proposalA.proposalId,
          proposalFingerprint: proposalA.proposalFingerprint,
          decision: "accepted",
        })
      ).outcome,
      "judgment-recorded",
    );
    assert.equal(
      (await governance.createProposal(proposalB)).outcome,
      "proposal-created",
    );
    assert.equal(
      (
        await governance.recordJudgment({
          judgmentId: "judgment-tb9-version-advance-bayesian-statistics",
          proposalId: proposalB.proposalId,
          proposalFingerprint: proposalB.proposalFingerprint,
          decision: "accepted",
        })
      ).outcome,
      "judgment-recorded",
    );

    assert.equal(
      (
        await governance.applyProposal({
          proposalId: proposalB.proposalId,
          judgmentId: "judgment-tb9-version-advance-bayesian-statistics",
        })
      ).outcome,
      "applied",
    );
    assert.equal(applyVersionCalls, 1);

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: proposalA.proposalId,
        judgmentId: "judgment-tb9-stale-bayesian-statistics-evidence",
      }),
      {
        outcome: "stale-judgment",
        detail:
          "The Judgment is stale because the current governed version changed after review.",
      },
    );
    assert.equal(applyVersionCalls, 1);

    assert.deepEqual(await governance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: {
        id: "bayesian-statistics-v2",
        target,
        content: proposalBContent,
        parentVersionId: "bayesian-statistics-v1",
      },
    });
    assert.deepEqual(
      await governance.getVersion(target.id, "bayesian-statistics-v1"),
      { outcome: "found", version: currentVersion },
    );
  });
});
