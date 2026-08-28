import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createInMemoryGovernanceStore } from "../../src/adapters/governance/in-memory-governance-store";
import {
  createGovernance,
  type GovernedTarget,
  type GovernedVersion,
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

const proposedContent = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
---

# Bayesian statistics

Bayesian statistics uses evidence to update prior belief.
`;

const currentVersion: GovernedVersion = {
  id: "bayesian-statistics-v1",
  target,
  content: currentContent,
};

const workingMaterial: WorkingMaterialDraft = {
  id: "working-material-tb8-bayesian-statistics-evidence",
  state: "working-material",
  target,
  baseVersionId: "bayesian-statistics-v1",
  content: proposedContent,
};

describe("Governance", () => {
  it("applies an accepted exact-version Proposal and preserves the prior version", async () => {
    const governance = createGovernance({
      store: createInMemoryGovernanceStore({
        currentVersion,
        nextVersionId: "bayesian-statistics-v2",
      }),
    });

    assert.deepEqual(await governance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: currentVersion,
    });

    const proposalOutcome = await governance.createProposal({
      proposalId: "proposal-tb8-bayesian-statistics-evidence",
      proposalFingerprint:
        "proposal-fingerprint-tb8-bayesian-statistics-evidence",
      target,
      baseVersionId: "bayesian-statistics-v1",
      workingMaterial,
      changes: [
        {
          id: "change-tb8-bayesian-statistics-evidence",
          exactChange: {
            path: "knowledge/bayesian-statistics.md",
            before:
              "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
            after: "Bayesian statistics uses evidence to update prior belief.",
          },
          dependsOn: [],
        },
      ],
    });

    assert.deepEqual(proposalOutcome, {
      outcome: "proposal-created",
      proposal: {
        id: "proposal-tb8-bayesian-statistics-evidence",
        fingerprint: "proposal-fingerprint-tb8-bayesian-statistics-evidence",
        state: "draft",
        target,
        baseVersionId: "bayesian-statistics-v1",
        workingMaterialId: "working-material-tb8-bayesian-statistics-evidence",
        changes: [
          {
            id: "change-tb8-bayesian-statistics-evidence",
            exactChange: {
              path: "knowledge/bayesian-statistics.md",
              before:
                "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
              after:
                "Bayesian statistics uses evidence to update prior belief.",
            },
            dependsOn: [],
          },
        ],
      },
    });

    assert.deepEqual(await governance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: currentVersion,
    });

    const judgmentOutcome = await governance.recordJudgment({
      judgmentId: "judgment-tb8-bayesian-statistics-evidence",
      proposalId: "proposal-tb8-bayesian-statistics-evidence",
      proposalFingerprint:
        "proposal-fingerprint-tb8-bayesian-statistics-evidence",
      decision: "accepted",
      acceptedChangeIds: ["change-tb8-bayesian-statistics-evidence"],
    });

    assert.deepEqual(judgmentOutcome, {
      outcome: "judgment-recorded",
      judgment: {
        id: "judgment-tb8-bayesian-statistics-evidence",
        proposalId: "proposal-tb8-bayesian-statistics-evidence",
        proposalFingerprint:
          "proposal-fingerprint-tb8-bayesian-statistics-evidence",
        baseVersionId: "bayesian-statistics-v1",
        decision: "accepted",
        acceptedChangeIds: ["change-tb8-bayesian-statistics-evidence"],
      },
    });

    assert.deepEqual(await governance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: currentVersion,
    });

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: "proposal-tb8-bayesian-statistics-evidence",
        judgmentId: "judgment-tb8-bayesian-statistics-evidence",
      }),
      {
        outcome: "applied",
        currentVersion: {
          id: "bayesian-statistics-v2",
          target,
          content: proposedContent,
          parentVersionId: "bayesian-statistics-v1",
        },
        previousVersion: currentVersion,
        appliedRecord: {
          id: "applied-proposal-tb8-bayesian-statistics-evidence",
          proposalId: "proposal-tb8-bayesian-statistics-evidence",
          judgmentId: "judgment-tb8-bayesian-statistics-evidence",
          targetId: "bayesian-statistics",
          previousVersionId: "bayesian-statistics-v1",
          newVersionId: "bayesian-statistics-v2",
          decision: "accepted",
        },
      },
    );

    assert.deepEqual(await governance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: {
        id: "bayesian-statistics-v2",
        target,
        content: proposedContent,
        parentVersionId: "bayesian-statistics-v1",
      },
    });
    assert.deepEqual(
      await governance.getVersion(target.id, "bayesian-statistics-v1"),
      {
        outcome: "found",
        version: currentVersion,
      },
    );
  });
});
