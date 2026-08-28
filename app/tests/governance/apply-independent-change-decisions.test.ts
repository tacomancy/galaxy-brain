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

const acceptedOnlyContent = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
reviewed_claim: fixture-evidence
---

# Bayesian statistics

This fixture topic gives the S1 workflow a stable item to carry between
workspaces.
`;

const currentVersion: GovernedVersion = {
  id: "bayesian-statistics-v1",
  target,
  content: currentContent,
};

const workingMaterial: WorkingMaterialDraft = {
  id: "working-material-tb9-independent-change-decisions-bayesian-statistics",
  state: "working-material",
  target,
  baseVersionId: "bayesian-statistics-v1",
  content: `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
reviewed_claim: fixture-evidence
---

# Bayesian statistics

Bayesian statistics uses evidence to update prior belief.
`,
};

describe("Governance independent change decisions", () => {
  it("applies only the explicitly accepted independent change", async () => {
    const store = createInMemoryGovernanceStore({
      currentVersion,
      nextVersionId: "bayesian-statistics-v2",
    });
    let applyVersionCalls = 0;
    const applyVersion = store.applyVersion;
    store.applyVersion = async (...args) => {
      applyVersionCalls += 1;
      return applyVersion(...args);
    };
    const governance = createGovernance({ store });

    assert.deepEqual(
      await governance.createProposal({
        proposalId:
          "proposal-tb9-independent-change-decisions-bayesian-statistics",
        proposalFingerprint:
          "proposal-fingerprint-tb9-independent-change-decisions-bayesian-statistics",
        target,
        baseVersionId: "bayesian-statistics-v1",
        workingMaterial,
        changes: [
          {
            id: "change-tb9-independent-source-evidence",
            exactChange: {
              path: "knowledge/bayesian-statistics.md",
              before: "source_record: sources/papers/bayesian-statistics.md",
              after:
                "source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence",
            },
            dependsOn: [],
          },
          {
            id: "change-tb9-independent-claim-update",
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
      }),
      {
        outcome: "proposal-created",
        proposal: {
          id: "proposal-tb9-independent-change-decisions-bayesian-statistics",
          fingerprint:
            "proposal-fingerprint-tb9-independent-change-decisions-bayesian-statistics",
          state: "draft",
          target,
          baseVersionId: "bayesian-statistics-v1",
          workingMaterialId:
            "working-material-tb9-independent-change-decisions-bayesian-statistics",
          changes: [
            {
              id: "change-tb9-independent-source-evidence",
              exactChange: {
                path: "knowledge/bayesian-statistics.md",
                before: "source_record: sources/papers/bayesian-statistics.md",
                after:
                  "source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence",
              },
              dependsOn: [],
            },
            {
              id: "change-tb9-independent-claim-update",
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
      },
    );

    assert.deepEqual(
      await governance.recordJudgment({
        judgmentId:
          "judgment-tb9-independent-change-decisions-bayesian-statistics",
        proposalId:
          "proposal-tb9-independent-change-decisions-bayesian-statistics",
        proposalFingerprint:
          "proposal-fingerprint-tb9-independent-change-decisions-bayesian-statistics",
        decision: "accepted",
        acceptedChangeIds: ["change-tb9-independent-source-evidence"],
        rejectedChangeIds: ["change-tb9-independent-claim-update"],
      }),
      {
        outcome: "judgment-recorded",
        judgment: {
          id: "judgment-tb9-independent-change-decisions-bayesian-statistics",
          proposalId:
            "proposal-tb9-independent-change-decisions-bayesian-statistics",
          proposalFingerprint:
            "proposal-fingerprint-tb9-independent-change-decisions-bayesian-statistics",
          baseVersionId: "bayesian-statistics-v1",
          decision: "accepted",
          acceptedChangeIds: ["change-tb9-independent-source-evidence"],
          rejectedChangeIds: ["change-tb9-independent-claim-update"],
        },
      },
    );

    assert.deepEqual(
      await governance.applyProposal({
        proposalId:
          "proposal-tb9-independent-change-decisions-bayesian-statistics",
        judgmentId:
          "judgment-tb9-independent-change-decisions-bayesian-statistics",
      }),
      {
        outcome: "applied",
        currentVersion: {
          id: "bayesian-statistics-v2",
          target,
          content: acceptedOnlyContent,
          parentVersionId: "bayesian-statistics-v1",
        },
        previousVersion: currentVersion,
        appliedRecord: {
          id: "applied-proposal-tb9-independent-change-decisions-bayesian-statistics",
          proposalId:
            "proposal-tb9-independent-change-decisions-bayesian-statistics",
          judgmentId:
            "judgment-tb9-independent-change-decisions-bayesian-statistics",
          targetId: "bayesian-statistics",
          previousVersionId: "bayesian-statistics-v1",
          newVersionId: "bayesian-statistics-v2",
          decision: "accepted",
        },
      },
    );
    assert.equal(applyVersionCalls, 1);
    assert.deepEqual(
      await governance.getVersion(target.id, "bayesian-statistics-v1"),
      {
        outcome: "found",
        version: currentVersion,
      },
    );
  });
});
