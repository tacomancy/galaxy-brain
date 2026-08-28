import type {
  ProposalReviewDraft,
  ProposalReviewSource,
} from "../../modules/proposal-review";

/** Stable governed target used by the packaged TB10 Proposal fixture. */
export const fixtureGovernedTarget = {
  id: "bayesian-statistics",
  title: "Bayesian statistics",
  path: "knowledge/bayesian-statistics.md",
} as const;

const fixtureCurrentContent = `---
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

const fixtureProposedContent = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
---

# Bayesian statistics

Bayesian statistics uses evidence to update prior belief.
`;

/**
 * Creates the bounded, provider-free TB10 Proposal source for S1.
 * @returns A source that supplies one deterministic fixture draft.
 */
export const createFixtureProposalReviewSource = (): ProposalReviewSource => {
  let supplied = false;

  return {
    async readDraft(): Promise<ProposalReviewDraft | undefined> {
      if (supplied) {
        return undefined;
      }

      supplied = true;
      return {
        proposalId: "proposal-tb10-bayesian-statistics-evidence",
        proposalFingerprint:
          "proposal-fingerprint-tb10-bayesian-statistics-evidence",
        target: fixtureGovernedTarget,
        baseVersionId: "bayesian-statistics-v1",
        workingMaterial: {
          id: "working-material-tb10-bayesian-statistics-evidence",
          state: "working-material",
          target: fixtureGovernedTarget,
          baseVersionId: "bayesian-statistics-v1",
          content: fixtureProposedContent,
        },
        changes: [
          {
            id: "change-tb10-bayesian-statistics-evidence",
            exactChange: {
              path: fixtureGovernedTarget.path,
              before:
                "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
              after:
                "Bayesian statistics uses evidence to update prior belief.",
            },
            dependsOn: [],
          },
        ],
        judgmentId: "judgment-tb10-bayesian-statistics-evidence",
        evidence: {
          sourcePath: "sources/papers/bayesian-statistics.md",
          text: "This fixture Source Record is associated with the Bayesian statistics topic.",
        },
      };
    },
  };
};

/**
 * Creates the empty source used by normal launches without a pending item.
 * @returns A source that reports no pending draft.
 */
export const createEmptyProposalReviewSource = (): ProposalReviewSource => ({
  async readDraft(): Promise<ProposalReviewDraft | undefined> {
    return undefined;
  },
});

/** Independently known baseline content for the file-backed TB10 fixture. */
export const fixtureCurrentGovernedContent = fixtureCurrentContent;
