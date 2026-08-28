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

const editedContent = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
reviewed_claim: fixture-evidence
---

# Bayesian statistics

Bayesian statistics updates prior belief with evidence.
`;

const currentVersion: GovernedVersion = {
  id: "bayesian-statistics-v1",
  target,
  content: currentContent,
};

const workingMaterial: WorkingMaterialDraft = {
  id: "working-material-tb9-edited-change-bayesian-statistics",
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

describe("Governance edited change decisions", () => {
  it("applies the reviewer-edited replacement instead of the Proposal replacement", async () => {
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
        proposalId: "proposal-tb9-edited-change-bayesian-statistics",
        proposalFingerprint:
          "proposal-fingerprint-tb9-edited-change-bayesian-statistics",
        target,
        baseVersionId: "bayesian-statistics-v1",
        workingMaterial,
        changes: [
          {
            id: "change-tb9-edited-source-evidence",
            exactChange: {
              path: "knowledge/bayesian-statistics.md",
              before: "source_record: sources/papers/bayesian-statistics.md",
              after:
                "source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence",
            },
            dependsOn: [],
          },
          {
            id: "change-tb9-edited-claim-update",
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
          id: "proposal-tb9-edited-change-bayesian-statistics",
          fingerprint:
            "proposal-fingerprint-tb9-edited-change-bayesian-statistics",
          state: "draft",
          target,
          baseVersionId: "bayesian-statistics-v1",
          workingMaterialId:
            "working-material-tb9-edited-change-bayesian-statistics",
          changes: [
            {
              id: "change-tb9-edited-source-evidence",
              exactChange: {
                path: "knowledge/bayesian-statistics.md",
                before: "source_record: sources/papers/bayesian-statistics.md",
                after:
                  "source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence",
              },
              dependsOn: [],
            },
            {
              id: "change-tb9-edited-claim-update",
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
        judgmentId: "judgment-tb9-edited-change-bayesian-statistics",
        proposalId: "proposal-tb9-edited-change-bayesian-statistics",
        proposalFingerprint:
          "proposal-fingerprint-tb9-edited-change-bayesian-statistics",
        decision: "accepted",
        acceptedChangeIds: ["change-tb9-edited-source-evidence"],
        rejectedChangeIds: [],
        deferredChangeIds: [],
        editedChanges: [
          {
            changeId: "change-tb9-edited-claim-update",
            exactChange: {
              path: "knowledge/bayesian-statistics.md",
              before:
                "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
              after: "Bayesian statistics updates prior belief with evidence.",
            },
          },
        ],
      }),
      {
        outcome: "judgment-recorded",
        judgment: {
          id: "judgment-tb9-edited-change-bayesian-statistics",
          proposalId: "proposal-tb9-edited-change-bayesian-statistics",
          proposalFingerprint:
            "proposal-fingerprint-tb9-edited-change-bayesian-statistics",
          baseVersionId: "bayesian-statistics-v1",
          decision: "accepted",
          acceptedChangeIds: ["change-tb9-edited-source-evidence"],
          rejectedChangeIds: [],
          deferredChangeIds: [],
          editedChanges: [
            {
              changeId: "change-tb9-edited-claim-update",
              exactChange: {
                path: "knowledge/bayesian-statistics.md",
                before:
                  "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
                after:
                  "Bayesian statistics updates prior belief with evidence.",
              },
            },
          ],
        },
      },
    );

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: "proposal-tb9-edited-change-bayesian-statistics",
        judgmentId: "judgment-tb9-edited-change-bayesian-statistics",
      }),
      {
        outcome: "applied",
        currentVersion: {
          id: "bayesian-statistics-v2",
          target,
          content: editedContent,
          parentVersionId: "bayesian-statistics-v1",
        },
        previousVersion: currentVersion,
        appliedRecord: {
          id: "applied-proposal-tb9-edited-change-bayesian-statistics",
          proposalId: "proposal-tb9-edited-change-bayesian-statistics",
          judgmentId: "judgment-tb9-edited-change-bayesian-statistics",
          targetId: "bayesian-statistics",
          previousVersionId: "bayesian-statistics-v1",
          newVersionId: "bayesian-statistics-v2",
          decision: "accepted",
        },
      },
    );
    assert.equal(applyVersionCalls, 1);
    assert.equal(
      editedContent.includes(
        "Bayesian statistics uses evidence to update prior belief.",
      ),
      false,
    );
    assert.deepEqual(
      await governance.getVersion(target.id, "bayesian-statistics-v1"),
      {
        outcome: "found",
        version: currentVersion,
      },
    );
  });
});
