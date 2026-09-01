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
import type {
  AtlasLearningRouteEditOutcome,
  AtlasOrientationReadOutcome,
} from "../../modules/atlas-orientation";
import type {
  LearningOperationOutcome,
  LearningReadOutcome,
} from "../../modules/learning";
import type { JSX } from "react";
import { useState } from "react";

/** Props supplied by the Workbench Session through the renderer entry point. */
interface AtlasProps {
  controls: JSX.Element;
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
  orientation: AtlasOrientationReadOutcome;
  onOpenSourceRecordInPaperDesk: (sourceRecordId: string) => Promise<void>;
  onEditLearningRouteTitle: (
    routeId: string,
    title: string,
  ) => Promise<AtlasLearningRouteEditOutcome>;
  learning: LearningReadOutcome;
  onConfirmLearningProgress: (
    suggestionId: string,
  ) => Promise<LearningOperationOutcome>;
  onCorrectLearningProgress: (
    suggestionId: string,
    correction: string,
  ) => Promise<LearningOperationOutcome>;
}

const AtlasHeader = (): JSX.Element => (
  <header className="workspace-header">
    <div className="brand-lockup">
      <span className="brand-mark" aria-hidden="true">
        GB
      </span>
      <span>Galaxy Brain</span>
    </div>
    <div id="workspace-label" className="workspace-label">
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
        Switch Knowledge Repository
      </button>
      <button
        id="create-repository"
        className="button button-quiet"
        type="button"
        onClick={onCreateRepository}
      >
        Create a new Knowledge Repository
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
      Open topic in Studio
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

interface AtlasOrientationCardsProps {
  orientation: AtlasOrientationReadOutcome;
  onOpenSourceRecordInPaperDesk: (sourceRecordId: string) => Promise<void>;
  onEditLearningRouteTitle: (
    routeId: string,
    title: string,
  ) => Promise<AtlasLearningRouteEditOutcome>;
  learning: LearningReadOutcome;
  onConfirmLearningProgress: (
    suggestionId: string,
  ) => Promise<LearningOperationOutcome>;
  onCorrectLearningProgress: (
    suggestionId: string,
    correction: string,
  ) => Promise<LearningOperationOutcome>;
}

interface LearningProgressCardProps {
  learning: LearningReadOutcome;
  onOpenSourceRecordInPaperDesk: (sourceRecordId: string) => Promise<void>;
  onConfirmLearningProgress: (
    suggestionId: string,
  ) => Promise<LearningOperationOutcome>;
  onCorrectLearningProgress: (
    suggestionId: string,
    correction: string,
  ) => Promise<LearningOperationOutcome>;
}

const LearningProgressCard = ({
  learning,
  onOpenSourceRecordInPaperDesk,
  onConfirmLearningProgress,
  onCorrectLearningProgress,
}: LearningProgressCardProps): JSX.Element | null => {
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [correction, setCorrection] = useState("");
  const [operationDetail, setOperationDetail] = useState<string | undefined>();

  if (learning.outcome === "not-available") {
    return null;
  }

  if (learning.outcome === "agent-provider-unavailable") {
    return (
      <section
        id="atlas-learning-progress"
        className="atlas-support-card progress-card"
        aria-labelledby="atlas-learning-progress-heading"
        data-learning-outcome={learning.outcome}
      >
        <span className="card-kicker">Learning progress</span>
        <h2 id="atlas-learning-progress-heading">
          Learning progress suggestion
        </h2>
        <p id="atlas-learning-progress-unavailable" className="support-copy">
          {learning.detail}
        </p>
        <p id="atlas-learning-current-stage" className="support-copy">
          Current stage remains: <strong>{learning.currentStage.title}</strong>
        </p>
      </section>
    );
  }

  if (learning.outcome === "operation-failed") {
    return (
      <section
        id="atlas-learning-progress"
        className="atlas-support-card progress-card"
        aria-labelledby="atlas-learning-progress-heading"
        data-learning-outcome={learning.outcome}
      >
        <span className="card-kicker">Learning progress</span>
        <h2 id="atlas-learning-progress-heading">
          Learning progress suggestion
        </h2>
        <p id="atlas-learning-progress-status" className="support-copy">
          {learning.detail}
        </p>
      </section>
    );
  }

  const { progress } = learning;
  const { suggestion } = progress;
  const statusLabel =
    suggestion.status === "awaiting-confirmation"
      ? "Awaiting your confirmation"
      : suggestion.status === "confirmed"
        ? "Confirmed by you"
        : "Corrected by you";

  const confirmSuggestion = async (): Promise<void> => {
    const result = await onConfirmLearningProgress(suggestion.id);
    setOperationDetail(
      result.outcome === "updated" ? undefined : result.detail,
    );
  };

  const saveCorrection = async (): Promise<void> => {
    const result = await onCorrectLearningProgress(suggestion.id, correction);
    if (result.outcome === "updated") {
      setIsCorrectionOpen(false);
      setCorrection("");
      setOperationDetail(undefined);
      return;
    }

    setOperationDetail(result.detail);
  };

  return (
    <section
      id="atlas-learning-progress"
      className="atlas-support-card progress-card"
      aria-labelledby="atlas-learning-progress-heading"
      data-learning-outcome={learning.outcome}
    >
      <span className="card-kicker">Learning progress suggestion</span>
      <div className="card-header-row">
        <div>
          <h2 id="atlas-learning-progress-heading">
            Review your learning progress
          </h2>
          <p id="atlas-learning-current-stage" className="support-copy">
            Current stage: <strong>{progress.currentStage.title}</strong>
          </p>
        </div>
        <span id="atlas-learning-progress-status" className="status-pill">
          {statusLabel}
        </span>
      </div>
      <p id="atlas-learning-suggested-stage" className="suggested-stage">
        Suggested next stage: <strong>{suggestion.suggestedStage.title}</strong>
      </p>
      <p id="atlas-learning-progress-explanation" className="support-copy">
        {suggestion.explanation}
      </p>
      <p className="support-label">Evidence</p>
      <ul id="atlas-learning-progress-evidence" className="source-item-list">
        {suggestion.evidence.map((item) => (
          <li key={item.id}>
            <button
              id={`atlas-learning-progress-evidence-${item.id}`}
              className="source-item-link"
              type="button"
              onClick={() => onOpenSourceRecordInPaperDesk(item.sourceRecordId)}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>
      {suggestion.status === "awaiting-confirmation" ? (
        <div className="action-row action-row-compact">
          <button
            id="atlas-learning-progress-confirm"
            className="button button-primary"
            type="button"
            onClick={() => void confirmSuggestion()}
          >
            Confirm stage suggestion
          </button>
          <button
            id="atlas-learning-progress-correct"
            className="button button-secondary"
            type="button"
            onClick={() => setIsCorrectionOpen(true)}
          >
            Correct suggestion
          </button>
        </div>
      ) : null}
      {isCorrectionOpen ? (
        <div className="route-edit-form progress-correction-form">
          <label htmlFor="atlas-learning-progress-correction">
            Your correction
          </label>
          <input
            id="atlas-learning-progress-correction"
            value={correction}
            onChange={(event) => setCorrection(event.target.value)}
          />
          <div className="action-row action-row-compact">
            <button
              id="atlas-learning-progress-save-correction"
              className="button button-primary"
              type="button"
              onClick={() => void saveCorrection()}
            >
              Save correction
            </button>
            <button
              id="atlas-learning-progress-cancel-correction"
              className="button button-quiet"
              type="button"
              onClick={() => setIsCorrectionOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {suggestion.correction === undefined ? null : (
        <p
          id="atlas-learning-progress-correction-result"
          className="support-copy"
        >
          Correction: {suggestion.correction}
        </p>
      )}
      {operationDetail === undefined ? null : (
        <p id="atlas-learning-progress-operation-detail" role="alert">
          {operationDetail}
        </p>
      )}
    </section>
  );
};

const AtlasOrientationCards = ({
  orientation,
  onOpenSourceRecordInPaperDesk,
  onEditLearningRouteTitle,
  learning,
  onConfirmLearningProgress,
  onCorrectLearningProgress,
}: AtlasOrientationCardsProps): JSX.Element | null => {
  const [editingRouteId, setEditingRouteId] = useState<string | undefined>();
  const [routeTitleDraft, setRouteTitleDraft] = useState("");
  const [routeOutcome, setRouteOutcome] = useState<string | undefined>();

  if (orientation.outcome !== "available") {
    return null;
  }

  const { metrics, learningRoutes, generatedRelationships } =
    orientation.overview;
  const routeBeingEdited = learningRoutes.find(
    (route) => route.id === editingRouteId,
  );

  const beginRouteEdit = (routeId: string, title: string): void => {
    setEditingRouteId(routeId);
    setRouteTitleDraft(title);
    setRouteOutcome(undefined);
  };

  const cancelRouteEdit = (): void => {
    setEditingRouteId(undefined);
    setRouteTitleDraft("");
    setRouteOutcome(undefined);
  };

  const saveRouteEdit = async (): Promise<void> => {
    if (editingRouteId === undefined) {
      return;
    }

    const outcome = await onEditLearningRouteTitle(
      editingRouteId,
      routeTitleDraft,
    );
    if (outcome.outcome === "updated") {
      setEditingRouteId(undefined);
      setRouteTitleDraft("");
      setRouteOutcome("Learning Route updated for this Workbench session.");
      return;
    }

    setRouteOutcome(outcome.detail);
  };

  return (
    <>
      {metrics.map((metric) => (
        <section
          id="atlas-traceable-metric"
          className="atlas-support-card metric-card"
          key={metric.id}
          aria-labelledby="atlas-metric-heading"
        >
          <span className="card-kicker">Traceable metric</span>
          <div className="card-header-row">
            <div>
              <h2 id="atlas-metric-heading">{metric.label}</h2>
              <p id="atlas-metric-value" className="metric-value">
                {metric.value}
              </p>
            </div>
            <span className="status-pill">Defined</span>
          </div>
          <p id="atlas-metric-definition" className="support-copy">
            {metric.definition}
          </p>
          <p className="support-label">Source items</p>
          <ul id="atlas-metric-source-items" className="source-item-list">
            {metric.sourceItems.map((sourceItem) => (
              <li key={sourceItem.id}>{sourceItem.title}</li>
            ))}
          </ul>
          <button
            id="atlas-metric-open-source"
            className="button button-secondary"
            type="button"
            onClick={() =>
              onOpenSourceRecordInPaperDesk(metric.action.sourceRecordId)
            }
          >
            {metric.action.label}
          </button>
        </section>
      ))}

      {learningRoutes.map((route) => (
        <section
          id="atlas-learning-route"
          className="atlas-support-card route-card"
          key={route.id}
          aria-labelledby="atlas-learning-route-heading"
        >
          <span className="card-kicker">Learning Route</span>
          <div className="card-header-row">
            <div>
              <h2 id="atlas-learning-route-heading">{route.title}</h2>
              <p id="atlas-learning-route-owner" className="ownership-label">
                Human-authored
              </p>
            </div>
            <span className="status-pill">Human-owned</span>
          </div>
          <ol id="atlas-learning-route-steps" className="route-step-list">
            {route.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {routeBeingEdited?.id === route.id ? (
            <div className="route-edit-form">
              <label htmlFor="atlas-learning-route-title">Route title</label>
              <input
                id="atlas-learning-route-title"
                value={routeTitleDraft}
                onChange={(event) => setRouteTitleDraft(event.target.value)}
              />
              <div className="action-row action-row-compact">
                <button
                  id="atlas-learning-route-save"
                  className="button button-primary"
                  type="button"
                  onClick={() => void saveRouteEdit()}
                >
                  Save route title
                </button>
                <button
                  id="atlas-learning-route-cancel"
                  className="button button-quiet"
                  type="button"
                  onClick={cancelRouteEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              id="atlas-learning-route-edit"
              className="button button-secondary"
              type="button"
              onClick={() => beginRouteEdit(route.id, route.title)}
            >
              Edit route
            </button>
          )}
          {routeOutcome === undefined ? null : (
            <p id="atlas-learning-route-outcome" role="status">
              {routeOutcome}
            </p>
          )}
        </section>
      ))}

      {generatedRelationships.map((relationship) => (
        <section
          id="atlas-generated-relationship"
          className="atlas-support-card generated-relationship-card"
          key={relationship.id}
          aria-labelledby="atlas-generated-relationship-heading"
        >
          <span className="card-kicker">Generated Relationship suggestion</span>
          <div className="card-header-row">
            <div>
              <h2 id="atlas-generated-relationship-heading">
                {relationship.sourceTopicTitle} →{" "}
                {relationship.targetTopicTitle}
              </h2>
              <p
                id="atlas-generated-relationship-type"
                className="support-copy"
              >
                Suggested relationship: {relationship.relationship}
              </p>
            </div>
            <span className="generated-status-pill">
              Not Governed Knowledge
            </span>
          </div>
          <p
            id="atlas-generated-relationship-evidence"
            className="support-copy"
          >
            Evidence: {relationship.evidence}
          </p>
          <button
            id="atlas-generated-relationship-open-source"
            className="button button-secondary"
            type="button"
            onClick={() =>
              onOpenSourceRecordInPaperDesk(relationship.sourceRecordId)
            }
          >
            Inspect source evidence
          </button>
        </section>
      ))}
      <LearningProgressCard
        learning={learning}
        onOpenSourceRecordInPaperDesk={onOpenSourceRecordInPaperDesk}
        onConfirmLearningProgress={onConfirmLearningProgress}
        onCorrectLearningProgress={onCorrectLearningProgress}
      />
    </>
  );
};

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
  controls,
  workbench,
  lastOutcome,
  onCreateRepository,
  onOpenRepository,
  onSelectWorkbenchContext,
  onOpenTopicInStudio,
  proposalReview,
  onOpenProposalReview,
  orientation,
  onOpenSourceRecordInPaperDesk,
  onEditLearningRouteTitle,
  learning,
  onConfirmLearningProgress,
  onCorrectLearningProgress,
}: AtlasProps): JSX.Element => {
  // This is an invariant of the fresh-session Interface. Failing loudly keeps
  // a mismatched composition from looking like a valid Atlas screen.
  if (workbench.activeWorkspace !== "atlas") {
    throw new Error("A fresh Workbench must open Atlas.");
  }

  return (
    <main className="workspace-page atlas-page" aria-labelledby="atlas-heading">
      <AtlasHeader />
      {controls}
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
            <AtlasOrientationCards
              orientation={orientation}
              onOpenSourceRecordInPaperDesk={onOpenSourceRecordInPaperDesk}
              onEditLearningRouteTitle={onEditLearningRouteTitle}
              learning={learning}
              onConfirmLearningProgress={onConfirmLearningProgress}
              onCorrectLearningProgress={onCorrectLearningProgress}
            />
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
