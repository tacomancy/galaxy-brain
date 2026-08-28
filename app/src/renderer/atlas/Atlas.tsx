import type {
  RepositoryOperationOutcome,
  WorkbenchContext,
  WorkbenchContextSelection,
  WorkbenchContextSelectionOutcome,
  WorkbenchState,
  WorkspaceTransitionOutcome,
} from "../../modules/workbench-session";
import type {
  ProposalReviewItem,
  ProposalReviewReadOutcome,
} from "../../modules/proposal-review";
import type { JSX } from "react";

/** Props supplied by the Workbench Session through the renderer entry point. */
interface AtlasProps {
  workbench: WorkbenchState;
  lastOutcome:
    | RepositoryOperationOutcome
    | WorkbenchContextSelectionOutcome
    | WorkspaceTransitionOutcome
    | undefined;
  onCreateRepository: () => Promise<void>;
  onOpenRepository: () => Promise<void>;
  onSelectWorkbenchContext: (
    selection: WorkbenchContextSelection,
  ) => Promise<void>;
  onOpenTopicInStudio: (topicId: string) => Promise<void>;
  proposalReview: ProposalReviewReadOutcome;
  onOpenProposalReview: () => Promise<void>;
}

const AtlasHeader = (): JSX.Element => (
  <header className="workspace-header">
    <div className="brand-lockup">
      <span className="brand-mark" aria-hidden="true">
        GB
      </span>
      <span>Galaxy Brain</span>
    </div>
    <div className="workspace-label">
      <span className="eyebrow">Local workspace</span>
      <strong>Atlas</strong>
    </div>
  </header>
);

interface EmptyAtlasStateProps {
  hasPreviousOutcome: boolean;
  onCreateRepository: () => Promise<void>;
  onOpenRepository: () => Promise<void>;
}

const EmptyAtlasState = ({
  hasPreviousOutcome,
  onCreateRepository,
  onOpenRepository,
}: EmptyAtlasStateProps): JSX.Element => (
  <section
    id="atlas-empty-state"
    className="empty-state-card"
    aria-labelledby="atlas-empty-heading"
  >
    <span className="card-kicker">Start here</span>
    <h2 id="atlas-empty-heading">No Knowledge Repository is open.</h2>
    <p>
      {hasPreviousOutcome
        ? "Choose Open or Create to recover this Workbench session."
        : "Open or create one to begin."}
    </p>
    <div className="action-row">
      <button
        id="open-repository"
        className="button button-primary"
        type="button"
        onClick={onOpenRepository}
      >
        Open a Knowledge Repository
      </button>
      <button
        id="create-repository"
        className="button button-secondary"
        type="button"
        onClick={onCreateRepository}
      >
        Create a Knowledge Repository
      </button>
    </div>
  </section>
);

interface SelectedRepositoryCardProps {
  workbench: WorkbenchState;
  onCreateRepository: () => Promise<void>;
  onOpenRepository: () => Promise<void>;
}

const SelectedRepositoryCard = ({
  workbench,
  onCreateRepository,
  onOpenRepository,
}: SelectedRepositoryCardProps): JSX.Element => (
  <section
    id="repository-status"
    className="repository-card"
    aria-labelledby="repository-status-heading"
  >
    <div className="card-header-row">
      <div>
        <span className="card-kicker">Active repository</span>
        <h2 id="repository-status-heading">
          {workbench.repositorySelection === "opened"
            ? "Knowledge Repository opened and selected."
            : workbench.repositorySelection === "read-only-compatible"
              ? "Knowledge Repository opened read-only."
              : "Knowledge Repository created and selected."}
        </h2>
      </div>
      <span className="status-pill">
        {workbench.repositoryAccess === "read-only" ? "Read only" : "Local"}
      </span>
    </div>
    <p id="repository-location" className="repository-location">
      {workbench.repositoryPath}
    </p>
    {workbench.repositoryAccess === "read-only" ? (
      <p id="repository-access" className="notice-copy">
        Read-only: this repository uses a newer format version.
      </p>
    ) : null}
    <div className="action-row action-row-compact">
      <button
        id="open-repository"
        className="button button-secondary"
        type="button"
        onClick={onOpenRepository}
      >
        Open another Knowledge Repository
      </button>
      <button
        id="create-repository"
        className="button button-quiet"
        type="button"
        onClick={onCreateRepository}
      >
        Create another Knowledge Repository
      </button>
    </div>
  </section>
);

interface ContinueWorkingCardProps {
  context: WorkbenchContext;
  onOpenTopicInStudio: (topicId: string) => Promise<void>;
}

const ContinueWorkingCard = ({
  context,
  onOpenTopicInStudio,
}: ContinueWorkingCardProps): JSX.Element => (
  <section
    id="atlas-continue-surface"
    className="atlas-continue-card"
    aria-labelledby="atlas-continue-heading"
  >
    <div className="continue-card-mark" aria-hidden="true">
      →
    </div>
    <span className="card-kicker">Continue working</span>
    <h2 id="atlas-continue-heading">Continue working</h2>
    <p id="atlas-topic-title" className="topic-display-title">
      {context.topic.title}
    </p>
    <p className="topic-display-support">
      Current Source Record
      <strong id="atlas-topic-source-record-title">
        {context.sourceRecord.title}
      </strong>
    </p>
    <button
      id="atlas-topic-open-studio"
      className="button button-light"
      type="button"
      onClick={() => onOpenTopicInStudio(context.topic.id)}
    >
      Open in Studio
    </button>
  </section>
);

interface NeedsJudgmentCardProps {
  review: ProposalReviewItem;
  onOpenProposalReview: () => Promise<void>;
}

const NeedsJudgmentCard = ({
  review,
  onOpenProposalReview,
}: NeedsJudgmentCardProps): JSX.Element => (
  <section
    id="atlas-needs-judgment"
    className="review-queue-card"
    aria-labelledby="atlas-needs-judgment-heading"
  >
    <span className="card-kicker">Needs your judgment</span>
    <h2 id="atlas-needs-judgment-heading">Needs your judgment</h2>
    <p id="atlas-proposal-title" className="topic-display-title">
      {review.proposal.target.title}
    </p>
    <p>
      An exact governed change is ready to inspect with its supporting Source
      Record.
    </p>
    <button
      id="atlas-proposal-review"
      className="button button-light"
      type="button"
      onClick={onOpenProposalReview}
    >
      Review Proposal
    </button>
  </section>
);

interface ContextSelectionCardProps {
  contexts: WorkbenchContext[];
  onSelectWorkbenchContext: (
    selection: WorkbenchContextSelection,
  ) => Promise<void>;
}

const ContextSelectionCard = ({
  contexts,
  onSelectWorkbenchContext,
}: ContextSelectionCardProps): JSX.Element => (
  <section
    id="atlas-context-selection"
    className="atlas-continue-card"
    aria-labelledby="atlas-context-selection-heading"
  >
    <span className="card-kicker">Choose where to continue</span>
    <h2 id="atlas-context-selection-heading">Select a Workbench context</h2>
    <p>
      This Knowledge Repository contains multiple topics. Choose the topic and
      Source Record that should be your current context.
    </p>
    <ul id="atlas-context-options">
      {contexts.map((context) => (
        <li
          id={`atlas-context-option-${context.topic.id}`}
          key={`${context.topic.id}:${context.sourceRecord.id}`}
        >
          <strong>{context.topic.title}</strong>
          <span>{context.sourceRecord.title}</span>
          <button
            id={`atlas-context-select-${context.topic.id}`}
            className="button button-light"
            type="button"
            aria-label={`Use ${context.topic.title} with ${context.sourceRecord.title}`}
            onClick={() =>
              onSelectWorkbenchContext({
                topicId: context.topic.id,
                sourceRecordId: context.sourceRecord.id,
              })
            }
          >
            Use this context
          </button>
        </li>
      ))}
    </ul>
  </section>
);

const AtlasOutcomeNotice = ({
  outcome,
}: {
  outcome:
    | RepositoryOperationOutcome
    | WorkbenchContextSelectionOutcome
    | WorkspaceTransitionOutcome;
}): JSX.Element | null =>
  "detail" in outcome ? (
    <p
      id="repository-error"
      role="alert"
      data-workbench-outcome={outcome.outcome}
    >
      {outcome.detail}
    </p>
  ) : null;

/**
 * Atlas is the fresh-session orientation workspace.
 *
 * It renders the empty state from domain state rather than querying a
 * repository or inventing demonstration content in the UI Adapter.
 * @param props The current Workbench state and user-action callbacks.
 * @returns The Atlas workspace element.
 * @throws An error when the renderer receives an invalid workspace state.
 */
export const Atlas = ({
  workbench,
  lastOutcome,
  onCreateRepository,
  onOpenRepository,
  onSelectWorkbenchContext,
  onOpenTopicInStudio,
  proposalReview,
  onOpenProposalReview,
}: AtlasProps): JSX.Element => {
  // This is an invariant of the fresh-session Interface. Failing loudly keeps
  // a mismatched composition from looking like a valid Atlas screen.
  if (workbench.activeWorkspace !== "atlas") {
    throw new Error("A fresh Workbench must open Atlas.");
  }

  return (
    <main className="workspace-page atlas-page" aria-labelledby="atlas-heading">
      <AtlasHeader />
      <div className="workspace-content">
        <div className="page-intro">
          <span className="eyebrow">Knowledge atlas</span>
          <h1 id="atlas-heading">Atlas</h1>
          <p className="page-intro-copy">
            Orient yourself in the work already in motion and choose the next
            place to continue.
          </p>
        </div>
        {/* Keep the empty state explicit and accessible while the user chooses a
            repository. */}
        {workbench.repositoryStatus === "not-selected" ? (
          <EmptyAtlasState
            hasPreviousOutcome={lastOutcome !== undefined}
            onCreateRepository={onCreateRepository}
            onOpenRepository={onOpenRepository}
          />
        ) : (
          <div className="atlas-layout">
            <SelectedRepositoryCard
              workbench={workbench}
              onCreateRepository={onCreateRepository}
              onOpenRepository={onOpenRepository}
            />
            {workbench.contextOptions === undefined ? null : (
              <ContextSelectionCard
                contexts={workbench.contextOptions}
                onSelectWorkbenchContext={onSelectWorkbenchContext}
              />
            )}
            {workbench.context === undefined ? null : (
              <ContinueWorkingCard
                context={workbench.context}
                onOpenTopicInStudio={onOpenTopicInStudio}
              />
            )}
            {proposalReview.outcome === "available" ? (
              <NeedsJudgmentCard
                review={proposalReview.review}
                onOpenProposalReview={onOpenProposalReview}
              />
            ) : null}
          </div>
        )}
      </div>
      {/* Stable outcome is exposed separately from explanatory copy for S1. */}
      {lastOutcome === undefined ? null : (
        <AtlasOutcomeNotice outcome={lastOutcome} />
      )}
    </main>
  );
};
