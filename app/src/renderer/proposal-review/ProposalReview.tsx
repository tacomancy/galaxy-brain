import type { JSX } from "react";

import type {
  AppliedProposalReview,
  ProposalReviewApplyOutcome,
  ProposalReviewItem,
} from "../../modules/proposal-review";

interface ProposalReviewProps {
  controls: JSX.Element;
  review: ProposalReviewItem | AppliedProposalReview;
  applyOutcome?: ProposalReviewApplyOutcome | undefined;
  onAcceptAndApply: () => Promise<void>;
  onBack: () => void;
}

const ReviewHeader = (): JSX.Element => (
  <header className="workspace-header">
    <div className="brand-lockup">
      <span className="brand-mark" aria-hidden="true">
        GB
      </span>
      <span>Galaxy Brain</span>
    </div>
    <div className="workspace-label">
      <span className="eyebrow">Governance</span>
      <strong>Proposal Review</strong>
    </div>
  </header>
);

const ChangeCard = ({
  review,
}: {
  review: ProposalReviewItem | AppliedProposalReview;
}): JSX.Element => (
  <section
    className="review-card review-change-card"
    aria-labelledby="proposal-review-change-heading"
  >
    <span className="card-kicker">Exact change</span>
    <h2 id="proposal-review-change-heading">Review the proposed replacement</h2>
    {review.proposal.changes.map((change) => (
      <div className="review-change" key={change.id}>
        <p className="review-change-path">{change.exactChange.path}</p>
        <div className="review-diff-grid">
          <div>
            <span className="diff-label">Before</span>
            <pre id="proposal-review-before">{change.exactChange.before}</pre>
          </div>
          <div>
            <span className="diff-label">After</span>
            <pre id="proposal-review-after">{change.exactChange.after}</pre>
          </div>
        </div>
      </div>
    ))}
  </section>
);

const AppliedReview = ({
  review,
}: {
  review: AppliedProposalReview;
}): JSX.Element => (
  <section
    className="review-card review-success-card"
    data-workbench-outcome="applied"
    aria-live="polite"
  >
    <span className="card-kicker">Governed version updated</span>
    <h2 id="proposal-review-outcome">Proposal applied and saved locally.</h2>
    <dl className="metadata-list">
      <div>
        <dt>New version</dt>
        <dd id="proposal-review-new-version">{review.currentVersion.id}</dd>
      </div>
      <div>
        <dt>Previous version retained</dt>
        <dd id="proposal-review-previous-version">
          {review.previousVersion.id}
        </dd>
      </div>
      <div>
        <dt>Judgment</dt>
        <dd>{review.judgment.id}</dd>
      </div>
    </dl>
    <p id="proposal-review-local-save" className="review-local-save">
      Saved locally; Git commit, synchronization, and backup are external.
    </p>
  </section>
);

/**
 * Presents one exact Proposal and sends its decision through Governance.
 * @param props Review data and route actions supplied by the Workbench shell.
 * @returns The Proposal Review route.
 */
export const ProposalReview = ({
  controls,
  review,
  applyOutcome,
  onAcceptAndApply,
  onBack,
}: ProposalReviewProps): JSX.Element => {
  const isApplied = "judgment" in review;

  return (
    <main
      className="workspace-page proposal-review-page"
      data-workbench-theme-surface="page"
      aria-labelledby="proposal-review-heading"
    >
      <ReviewHeader />
      {controls}
      <div className="workspace-content proposal-review-content">
        <div className="page-intro">
          <span className="eyebrow">Needs your judgment</span>
          <h1 id="proposal-review-heading">Proposal Review</h1>
          <p className="page-intro-copy">
            Inspect the exact change and its evidence before it becomes Governed
            Knowledge.
          </p>
        </div>
        <div className="proposal-review-layout">
          <div className="proposal-review-primary">
            <section
              className="review-card review-summary-card"
              data-workbench-theme-surface="panel"
              aria-labelledby="proposal-review-target-heading"
            >
              <span className="card-kicker">Proposal</span>
              <h2 id="proposal-review-target-heading">
                <span id="proposal-review-target">
                  {review.proposal.target.title}
                </span>
              </h2>
              <dl className="metadata-list">
                <div>
                  <dt>Proposal</dt>
                  <dd>{review.proposal.id}</dd>
                </div>
                <div>
                  <dt>Reviewed base version</dt>
                  <dd id="proposal-review-base-version">
                    {review.proposal.baseVersionId}
                  </dd>
                </div>
                <div>
                  <dt>Target path</dt>
                  <dd id="proposal-review-target-path">
                    {review.proposal.target.path}
                  </dd>
                </div>
              </dl>
            </section>
            <ChangeCard review={review} />
          </div>
          <aside className="proposal-review-sidebar">
            <section
              className="review-card review-evidence-card"
              aria-labelledby="proposal-review-evidence-heading"
            >
              <span className="card-kicker">Evidence</span>
              <h2 id="proposal-review-evidence-heading">Source Record</h2>
              <p className="review-evidence-path">
                {review.evidence.sourcePath}
              </p>
              <p id="proposal-review-evidence">{review.evidence.text}</p>
            </section>
            <section className="review-card review-status-card">
              <span className="card-kicker">Current state</span>
              <p>
                Current governed version
                <strong id="proposal-review-current-version">
                  {isApplied
                    ? review.currentVersion.id
                    : review.currentVersion.id}
                </strong>
              </p>
              {isApplied ? <AppliedReview review={review} /> : null}
              {!isApplied ? (
                <div className="action-row">
                  <button
                    id="proposal-review-accept-and-apply"
                    className="button button-primary"
                    type="button"
                    onClick={onAcceptAndApply}
                  >
                    Accept and apply
                  </button>
                  {applyOutcome?.outcome === "operation-failed" ? (
                    <p id="proposal-review-error" role="alert">
                      {applyOutcome.detail}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          </aside>
        </div>
        <button
          id="proposal-review-back"
          className="button button-quiet review-back-button"
          type="button"
          onClick={onBack}
        >
          Back to Atlas
        </button>
      </div>
    </main>
  );
};
