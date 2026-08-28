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

Bayesian statistics updates prior belief from evidence.
`;

const currentVersion: GovernedVersion = {
  id: "bayesian-statistics-v1",
  target,
  content: currentContent,
};

const workingMaterial: WorkingMaterialDraft = {
  id: "working-material-tb9-edited-dependent-change-bayesian-statistics",
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

const proposalInput = {
  proposalId: "proposal-tb9-edited-dependent-change-bayesian-statistics",
  proposalFingerprint:
    "proposal-fingerprint-tb9-edited-dependent-change-bayesian-statistics",
  target,
  baseVersionId: "bayesian-statistics-v1",
  workingMaterial,
  changes: [
    {
      id: "change-tb9-edited-dependent-source-evidence",
      exactChange: {
        path: "knowledge/bayesian-statistics.md",
        before: "source_record: sources/papers/bayesian-statistics.md",
        after:
          "source_record: sources/papers/bayesian-statistics.md\nreviewed_claim: fixture-evidence",
      },
      dependsOn: [],
    },
    {
      id: "change-tb9-edited-dependent-claim-update",
      exactChange: {
        path: "knowledge/bayesian-statistics.md",
        before:
          "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
        after: "Bayesian statistics uses evidence to update prior belief.",
      },
      dependsOn: ["change-tb9-edited-dependent-source-evidence"],
    },
  ],
};

const editedChange = {
  changeId: "change-tb9-edited-dependent-claim-update",
  exactChange: {
    path: "knowledge/bayesian-statistics.md",
    before:
      "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
    after: "Bayesian statistics updates prior belief from evidence.",
  },
};

describe("Governance edited dependent change decisions", () => {
  it("applies an edited dependent change only with its accepted prerequisite", async () => {
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

    assert.equal(
      (await governance.createProposal(proposalInput)).outcome,
      "proposal-created",
    );

    assert.deepEqual(
      await governance.recordJudgment({
        judgmentId: "judgment-tb9-edited-dependent-missing-prerequisite",
        proposalId: proposalInput.proposalId,
        proposalFingerprint: proposalInput.proposalFingerprint,
        decision: "accepted",
        acceptedChangeIds: [],
        rejectedChangeIds: ["change-tb9-edited-dependent-source-evidence"],
        deferredChangeIds: [],
        editedChanges: [editedChange],
      }),
      {
        outcome: "judgment-recorded",
        judgment: {
          id: "judgment-tb9-edited-dependent-missing-prerequisite",
          proposalId: proposalInput.proposalId,
          proposalFingerprint: proposalInput.proposalFingerprint,
          baseVersionId: "bayesian-statistics-v1",
          decision: "accepted",
          acceptedChangeIds: [],
          rejectedChangeIds: ["change-tb9-edited-dependent-source-evidence"],
          deferredChangeIds: [],
          editedChanges: [editedChange],
        },
      },
    );

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: proposalInput.proposalId,
        judgmentId: "judgment-tb9-edited-dependent-missing-prerequisite",
      }),
      {
        outcome: "invalid-dependency-subset",
        detail: "The accepted change subset omits a required dependency.",
      },
    );
    assert.equal(applyVersionCalls, 0);
    assert.deepEqual(await governance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: currentVersion,
    });

    assert.deepEqual(
      await governance.recordJudgment({
        judgmentId: "judgment-tb9-edited-dependent-change-bayesian-statistics",
        proposalId: proposalInput.proposalId,
        proposalFingerprint: proposalInput.proposalFingerprint,
        decision: "accepted",
        acceptedChangeIds: ["change-tb9-edited-dependent-source-evidence"],
        rejectedChangeIds: [],
        deferredChangeIds: [],
        editedChanges: [editedChange],
      }),
      {
        outcome: "judgment-recorded",
        judgment: {
          id: "judgment-tb9-edited-dependent-change-bayesian-statistics",
          proposalId: proposalInput.proposalId,
          proposalFingerprint: proposalInput.proposalFingerprint,
          baseVersionId: "bayesian-statistics-v1",
          decision: "accepted",
          acceptedChangeIds: ["change-tb9-edited-dependent-source-evidence"],
          rejectedChangeIds: [],
          deferredChangeIds: [],
          editedChanges: [editedChange],
        },
      },
    );

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: proposalInput.proposalId,
        judgmentId: "judgment-tb9-edited-dependent-change-bayesian-statistics",
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
          id: `applied-${proposalInput.proposalId}`,
          proposalId: proposalInput.proposalId,
          judgmentId:
            "judgment-tb9-edited-dependent-change-bayesian-statistics",
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
