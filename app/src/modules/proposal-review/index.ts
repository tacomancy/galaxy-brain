import type {
  AppliedRecord,
  CreateProposalInput,
  Governance,
  GovernedVersion,
  Judgment,
  Proposal,
} from "../governance";

/** Evidence shown beside a Proposal's exact governed replacement. */
export interface ProposalReviewEvidence {
  sourcePath: string;
  text: string;
}

/** One transient Proposal supplied to the review composition boundary. */
export interface ProposalReviewDraft extends CreateProposalInput {
  judgmentId: string;
  evidence: ProposalReviewEvidence;
}

/** The Proposal and current version presented before human acceptance. */
export interface ProposalReviewItem {
  proposal: Proposal;
  evidence: ProposalReviewEvidence;
  currentVersion: GovernedVersion;
}

/** The result presented after Governance has applied a reviewed Proposal. */
export interface AppliedProposalReview {
  proposal: Proposal;
  evidence: ProposalReviewEvidence;
  judgment: Judgment;
  appliedRecord: AppliedRecord;
  previousVersion: GovernedVersion;
  currentVersion: GovernedVersion;
}

/** Result of reading the contextual review route's pending item. */
export type ProposalReviewReadOutcome =
  | { outcome: "available"; review: ProposalReviewItem }
  | { outcome: "applied"; review: AppliedProposalReview }
  | { outcome: "not-available" }
  | { outcome: "operation-failed"; detail: string };

/** Result of explicitly accepting and applying the current Proposal. */
export type ProposalReviewApplyOutcome =
  | { outcome: "applied"; review: AppliedProposalReview }
  | { outcome: "operation-failed"; detail: string };

/** Source seam for a transient or future persisted pending Proposal. */
export interface ProposalReviewSource {
  readDraft(): Promise<ProposalReviewDraft | undefined>;
}

/** Dependencies supplied when composing the Proposal Review session. */
export interface ProposalReviewDependencies {
  governance: Governance;
  source: ProposalReviewSource;
}

/** Caller-facing Proposal Review operations used by the desktop Adapter. */
export interface ProposalReview {
  read(): Promise<ProposalReviewReadOutcome>;
  acceptAndApply(): Promise<ProposalReviewApplyOutcome>;
}

const failed = (
  detail: string,
): { outcome: "operation-failed"; detail: string } => ({
  outcome: "operation-failed",
  detail,
});

/** Composes a review session over Governance and one Proposal source. */
export const createProposalReview = ({
  governance,
  source,
}: ProposalReviewDependencies): ProposalReview => {
  let draft: ProposalReviewDraft | undefined;
  let item: ProposalReviewItem | undefined;
  let applied: AppliedProposalReview | undefined;

  const read = async (): Promise<ProposalReviewReadOutcome> => {
    if (applied !== undefined) {
      return { outcome: "applied", review: applied };
    }

    if (item !== undefined) {
      return { outcome: "available", review: item };
    }

    draft = await source.readDraft();

    if (draft === undefined) {
      return { outcome: "not-available" };
    }

    const created = await governance.createProposal(draft);

    if (created.outcome !== "proposal-created") {
      return failed(
        created.outcome === "not-found"
          ? created.detail
          : "The Proposal could not be prepared for review.",
      );
    }

    const currentVersion = await governance.loadCurrentVersion(
      created.proposal.target.id,
    );

    if (currentVersion.outcome !== "found") {
      return failed(currentVersion.detail);
    }

    item = {
      proposal: created.proposal,
      evidence: draft.evidence,
      currentVersion: currentVersion.version,
    };
    return { outcome: "available", review: item };
  };

  const acceptAndApply = async (): Promise<ProposalReviewApplyOutcome> => {
    const pending = await read();

    if (pending.outcome !== "available" || draft === undefined) {
      return failed(
        pending.outcome === "operation-failed"
          ? pending.detail
          : "No Proposal is available for review.",
      );
    }

    const { proposal } = pending.review;
    const judgment = await governance.recordJudgment({
      judgmentId: draft.judgmentId,
      proposalId: proposal.id,
      proposalFingerprint: proposal.fingerprint,
      decision: "accepted",
      acceptedChangeIds: proposal.changes.map((change) => change.id),
      rejectedChangeIds: [],
      deferredChangeIds: [],
      editedChanges: [],
    });

    if (judgment.outcome !== "judgment-recorded") {
      return failed(
        judgment.outcome === "not-found"
          ? judgment.detail
          : "The Judgment could not be recorded.",
      );
    }

    const result = await governance.applyProposal({
      proposalId: proposal.id,
      judgmentId: judgment.judgment.id,
    });

    if (result.outcome !== "applied") {
      return failed(
        result.outcome === "operation-failed" ||
          result.outcome === "external-change" ||
          result.outcome === "stale-judgment" ||
          result.outcome === "invalid-dependency-subset" ||
          result.outcome === "not-eligible" ||
          result.outcome === "judgment-required" ||
          result.outcome === "not-found"
          ? result.detail
          : "The Proposal could not be applied.",
      );
    }

    applied = {
      proposal,
      evidence: pending.review.evidence,
      judgment: judgment.judgment,
      appliedRecord: result.appliedRecord,
      previousVersion: result.previousVersion,
      currentVersion: result.currentVersion,
    };
    return { outcome: "applied", review: applied };
  };

  return { read, acceptAndApply };
};
