import { useEffect, useRef, useState, type JSX } from "react";

import type {
  AuthoringConstruct,
  AuthoringDraftView,
  AuthoringMode,
  AuthoringReadOutcome,
} from "../../modules/knowledge-authoring";
import { authoringConstructs } from "../../modules/knowledge-authoring";
import type {
  ConfirmSynthesisOutcome,
  StructuredAnnotation,
  SynthesisPreview,
  SynthesisSavedResult,
} from "../../modules/source-processing";
import type { RestoreSynthesisResultOutcome } from "../../modules/source-processing";
import type {
  WorkbenchContext,
  WorkbenchState,
} from "../../modules/workbench-session";

interface StudioProps {
  controls: JSX.Element;
  workbench: WorkbenchState;
  authoring: AuthoringReadOutcome;
  isAuthoringOpen: boolean;
  onOpenAuthoringDraft: () => Promise<void>;
  onOpenAuthoringConstruct: (construct: AuthoringConstruct) => Promise<void>;
  onEditAuthoringSemanticText: (nextText: string) => Promise<void>;
  onUndoAuthoringSemanticText: () => Promise<void>;
  onSetAuthoringMode: (mode: AuthoringMode) => Promise<void>;
  onCloseAuthoringDraft: () => void;
  onOpenSourceRecordInPaperDesk: (sourceRecordId: string) => Promise<void>;
  onPrepareSynthesis: (includeAllContext: boolean) => Promise<void>;
  onRemoveSynthesisContextItem: (annotationId: string) => Promise<void>;
  onConfirmSynthesis: (
    confirmation: "confirmed" | "declined" | "canceled",
  ) => Promise<void>;
  synthesisPreview: SynthesisPreview | undefined;
  synthesisOutcome: ConfirmSynthesisOutcome | undefined;
  savedSynthesisResults: SynthesisSavedResult[];
  savedSynthesisResultsReadError: string | undefined;
  restoreOutcome: RestoreSynthesisResultOutcome | undefined;
  onRestoreSynthesisResult: (
    resultId: string,
    version: number,
  ) => Promise<void>;
}

const StudioHeader = (): JSX.Element => (
  <header className="workspace-header">
    <div className="brand-lockup">
      <span className="brand-mark" aria-hidden="true">
        GB
      </span>
      <span>Galaxy Brain</span>
    </div>
    <div id="workspace-label" className="workspace-label">
      <span className="eyebrow">Topic workspace</span>
      <strong>Studio</strong>
    </div>
  </header>
);

const StudioTopicSurface = ({
  context,
  onOpenSourceRecordInPaperDesk,
}: {
  context: WorkbenchContext;
  onOpenSourceRecordInPaperDesk: (sourceRecordId: string) => Promise<void>;
}): JSX.Element => (
  <section className="topic-surface" aria-labelledby="studio-topic-heading">
    <div className="surface-icon" aria-hidden="true">
      ◈
    </div>
    <span className="card-kicker">Current topic</span>
    <h2 id="studio-topic-heading">Current topic</h2>
    <p id="studio-topic-title" className="studio-topic-title">
      {context.topic.title}
    </p>
    <p id="studio-topic-context" className="context-note">
      Topic context preserved in this session
    </p>
    <div className="source-record-summary">
      <span className="card-kicker">Associated Source Record</span>
      <p id="studio-source-record-title">{context.sourceRecord.title}</p>
      <button
        id="studio-source-record-open-paper-desk"
        className="button button-secondary"
        type="button"
        onClick={() => onOpenSourceRecordInPaperDesk(context.sourceRecord.id)}
      >
        Open Source Record in Paper Desk
      </button>
    </div>
  </section>
);

const WorkingMaterialCard = ({
  annotation,
}: {
  annotation: StructuredAnnotation;
}): JSX.Element => (
  <aside
    id="studio-working-material"
    className="working-material-card"
    aria-labelledby="studio-working-material-heading"
  >
    <div className="card-header-row">
      <div>
        <span className="card-kicker">Supporting evidence</span>
        <h2 id="studio-working-material-heading">Working Material</h2>
      </div>
      <span className="status-pill">Source claim</span>
    </div>
    <blockquote id="studio-source-claim-text">{annotation.text}</blockquote>
    <dl className="metadata-list">
      <div>
        <dt>Source locator</dt>
        <dd>{annotation.sourceLocator.logical}</dd>
      </div>
      <div>
        <dt>State</dt>
        <dd id="studio-source-claim-state">Working Material</dd>
      </div>
    </dl>
    <p className="working-material-note">
      This captured claim supports the topic; it is not Governed Knowledge.
    </p>
  </aside>
);

interface AuthoringSurfaceProps {
  draft: AuthoringDraftView;
  onEdit: (nextText: string) => Promise<void>;
  onUndo: () => Promise<void>;
  onOpenConstruct: (construct: AuthoringConstruct) => Promise<void>;
  onSetMode: (mode: AuthoringMode) => Promise<void>;
  onClose: () => void;
}

const AuthoringSurface = ({
  draft,
  onEdit,
  onUndo,
  onOpenConstruct,
  onSetMode,
  onClose,
}: AuthoringSurfaceProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [nextText, setNextText] = useState(draft.rich.semanticText);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const applyEdit = async (): Promise<void> => {
    await onEdit(nextText);
    setIsEditing(false);
  };

  return (
    <section
      id="studio-authoring-surface"
      className="working-material-card authoring-card"
      aria-labelledby="studio-authoring-heading"
    >
      <div className="card-header-row">
        <div>
          <span className="card-kicker">Knowledge Authoring</span>
          <h2 id="studio-authoring-heading">Authoring draft</h2>
        </div>
        <span id="studio-authoring-state" className="status-pill">
          Working Material
        </span>
      </div>
      <p id="studio-authoring-title" className="authoring-title">
        {draft.title}
      </p>
      <div
        className="authoring-construct-row"
        aria-label="Supported authoring constructs"
      >
        <span className="card-kicker">Examples</span>
        {authoringConstructs.map((construct) => (
          <button
            key={construct}
            id={`studio-authoring-construct-${construct}`}
            className="button button-quiet"
            type="button"
            aria-pressed={draft.construct === construct}
            onClick={() => onOpenConstruct(construct)}
          >
            {construct}
          </button>
        ))}
      </div>
      <div className="authoring-mode-row" aria-label="Authoring representation">
        <button
          id="studio-rich-mode"
          className="button button-secondary"
          type="button"
          aria-pressed={draft.mode === "rich"}
          onClick={() => onSetMode("rich")}
        >
          Rich view
        </button>
        <button
          id="studio-source-mode"
          className="button button-secondary"
          type="button"
          aria-pressed={draft.mode === "source"}
          onClick={() => onSetMode("source")}
        >
          Source view
        </button>
      </div>
      {draft.mode === "rich" ? (
        <div id="studio-rich-view" className="authoring-rich-view">
          <span
            id={
              draft.construct === "highlight"
                ? "studio-rich-highlight"
                : "studio-rich-semantic-object"
            }
            data-construct={draft.construct}
            data-highlighted={draft.rich.highlighted}
          >
            {draft.rich.semanticText}
          </span>
        </div>
      ) : (
        <pre id="studio-authoring-source" className="authoring-source-view">
          {draft.source}
        </pre>
      )}
      {draft.mode === "rich" ? (
        <div className="authoring-edit-panel">
          <button
            id="studio-rich-edit"
            className="button button-secondary"
            type="button"
            onClick={() => {
              setNextText(draft.rich.semanticText);
              setIsEditing(true);
            }}
          >
            Edit semantic object
          </button>
          {isEditing ? (
            <div className="authoring-edit-controls">
              <label htmlFor="studio-rich-edit-input">
                Semantic object text
              </label>
              <input
                id="studio-rich-edit-input"
                ref={inputRef}
                aria-describedby="studio-rich-edit-help"
                value={nextText}
                onChange={(event) => setNextText(event.currentTarget.value)}
              />
              <span id="studio-rich-edit-help" className="visually-hidden">
                Enter one line of semantic object text.
              </span>
              <button
                id="studio-rich-edit-apply"
                className="button button-primary"
                type="button"
                onClick={applyEdit}
              >
                Apply edit
              </button>
            </div>
          ) : null}
          <button
            id="studio-rich-undo"
            className="button button-quiet"
            type="button"
            onClick={() => void onUndo()}
          >
            Undo last edit
          </button>
        </div>
      ) : null}
      <div className="authoring-governed-status">
        <span className="card-kicker">Governed Knowledge</span>
        <p id="studio-governed-topic">
          This fixture topic gives the S1 workflow a stable item to carry
          between workspaces.
        </p>
        <span>Unchanged by this Working Material edit</span>
      </div>
      <div className="action-row">
        <button
          id="studio-authoring-close"
          className="button button-quiet"
          type="button"
          onClick={onClose}
        >
          Close draft
        </button>
      </div>
    </section>
  );
};

const AuthoringDraftCard = ({
  authoring,
  isOpen,
  onOpen,
  onEdit,
  onUndo,
  onOpenConstruct,
  onSetMode,
  onClose,
}: {
  authoring: AuthoringReadOutcome;
  isOpen: boolean;
  onOpen: () => Promise<void>;
  onEdit: (nextText: string) => Promise<void>;
  onUndo: () => Promise<void>;
  onOpenConstruct: (construct: AuthoringConstruct) => Promise<void>;
  onSetMode: (mode: AuthoringMode) => Promise<void>;
  onClose: () => void;
}): JSX.Element | null => {
  if (authoring.outcome !== "available") {
    return null;
  }

  if (isOpen) {
    return (
      <AuthoringSurface
        key={authoring.draft.id}
        draft={authoring.draft}
        onEdit={onEdit}
        onUndo={onUndo}
        onOpenConstruct={onOpenConstruct}
        onSetMode={onSetMode}
        onClose={onClose}
      />
    );
  }

  return (
    <section
      id="studio-authoring-closed"
      className="working-material-card authoring-card"
      aria-labelledby="studio-authoring-closed-heading"
    >
      <span className="card-kicker">Knowledge Authoring</span>
      <h2 id="studio-authoring-closed-heading">Authoring draft closed</h2>
      <button
        id="studio-authoring-open"
        className="button button-secondary"
        type="button"
        onClick={onOpen}
      >
        Reopen draft
      </button>
    </section>
  );
};

interface SynthesisReviewCardProps {
  includeAllContext: boolean;
  onPrepareSynthesis: (includeAllContext: boolean) => Promise<void>;
  onRemoveSynthesisContextItem: (annotationId: string) => Promise<void>;
  onConfirmSynthesis: (
    confirmation: "confirmed" | "declined" | "canceled",
  ) => Promise<void>;
  synthesisPreview: SynthesisPreview | undefined;
  synthesisOutcome: ConfirmSynthesisOutcome | undefined;
  onIncludeAllContextChange: (includeAllContext: boolean) => void;
}

const synthesisOutcomeText = (outcome: ConfirmSynthesisOutcome): string => {
  if (
    outcome.outcome === "agent-provider-unavailable" ||
    outcome.outcome === "operation-failed"
  ) {
    return outcome.detail;
  }

  return `Synthesis ${outcome.outcome}.`;
};

const SynthesisReviewCard = ({
  includeAllContext,
  onPrepareSynthesis,
  onRemoveSynthesisContextItem,
  onConfirmSynthesis,
  synthesisPreview,
  synthesisOutcome,
  onIncludeAllContextChange,
}: SynthesisReviewCardProps): JSX.Element => (
  <section
    id="studio-synthesis"
    className="working-material-card synthesis-card"
    aria-labelledby="studio-synthesis-heading"
  >
    <div className="card-header-row">
      <div>
        <span className="card-kicker">Agentic capability</span>
        <h2 id="studio-synthesis-heading">Synthesize into topic</h2>
      </div>
      <span className="status-pill">Explicit action</span>
    </div>
    <p>
      Review the selected source claims and exact request before any provider
      request is considered.
    </p>
    <button
      id="studio-synthesis-prepare"
      className="button button-secondary"
      type="button"
      onClick={() => onPrepareSynthesis(includeAllContext)}
    >
      Review Synthesis request
    </button>
    <label className="checkbox-row">
      <input
        id="studio-synthesis-include-all-context"
        type="checkbox"
        checked={includeAllContext}
        onChange={(event) =>
          onIncludeAllContextChange(event.currentTarget.checked)
        }
      />
      Include all saved claims for this Source Record
    </label>
    {synthesisPreview === undefined ? null : (
      <div
        id="studio-synthesis-preview"
        className="synthesis-preview"
        aria-live="polite"
      >
        <h3>Confirm this request</h3>
        <p id="studio-synthesis-summary">{synthesisPreview.summary}</p>
        <dl className="metadata-list">
          <div>
            <dt>Destination</dt>
            <dd id="studio-synthesis-destination">
              {synthesisPreview.provider.destination}
            </dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd id="studio-synthesis-model">
              {synthesisPreview.provider.model}
            </dd>
          </div>
          <div>
            <dt>Selected context</dt>
            <dd>{synthesisPreview.payload.context.length} source claim(s)</dd>
          </div>
        </dl>
        <ul id="studio-synthesis-context" className="context-list">
          {synthesisPreview.payload.context.map((item) => (
            <li key={item.annotationId}>
              <span>{item.text}</span>
              <button
                id={`studio-synthesis-remove-${item.annotationId}`}
                className="button button-quiet"
                type="button"
                onClick={() => onRemoveSynthesisContextItem(item.annotationId)}
              >
                Remove context item
              </button>
            </li>
          ))}
        </ul>
        <details>
          <summary>Inspect exact payload</summary>
          <pre id="studio-synthesis-payload">
            {JSON.stringify(synthesisPreview.payload, null, 2)}
          </pre>
        </details>
        <div className="action-row">
          <button
            id="studio-synthesis-confirm"
            className="button button-primary"
            type="button"
            onClick={() => onConfirmSynthesis("confirmed")}
          >
            Confirm and send
          </button>
          <button
            id="studio-synthesis-decline"
            className="button button-secondary"
            type="button"
            onClick={() => onConfirmSynthesis("declined")}
          >
            Decline
          </button>
          <button
            id="studio-synthesis-cancel"
            className="button button-quiet"
            type="button"
            onClick={() => onConfirmSynthesis("canceled")}
          >
            Cancel
          </button>
        </div>
        {synthesisOutcome === undefined ? null : (
          <p
            id="studio-synthesis-outcome"
            role={
              synthesisOutcome.outcome === "operation-failed"
                ? "alert"
                : "status"
            }
            aria-live={
              synthesisOutcome.outcome === "operation-failed"
                ? "assertive"
                : "polite"
            }
            data-synthesis-outcome={synthesisOutcome.outcome}
          >
            {synthesisOutcomeText(synthesisOutcome)}
          </p>
        )}
      </div>
    )}
  </section>
);

interface SavedSynthesisResultsCardProps {
  results: SynthesisSavedResult[];
  readError: string | undefined;
  restoreOutcome: RestoreSynthesisResultOutcome | undefined;
  onRestore: (resultId: string, version: number) => Promise<void>;
}

const SavedSynthesisResultsCard = ({
  results,
  readError,
  restoreOutcome,
  onRestore,
}: SavedSynthesisResultsCardProps): JSX.Element | null => {
  if (readError === undefined && results.length === 0) {
    return null;
  }

  return (
    <section
      id="studio-synthesis-results"
      className="working-material-card synthesis-card"
      aria-labelledby="studio-synthesis-results-heading"
    >
      <div className="card-header-row">
        <div>
          <span className="card-kicker">Saved Working Material</span>
          <h2 id="studio-synthesis-results-heading">Synthesis results</h2>
        </div>
        <span className="status-pill">Recoverable</span>
      </div>
      {readError === undefined ? null : (
        <p id="studio-synthesis-results-read-error" role="alert">
          Saved Synthesis results are unavailable: {readError}
        </p>
      )}
      {results.map((result) => (
        <article
          key={result.id}
          id={`studio-synthesis-result-${result.id}`}
          className="synthesis-result"
          aria-labelledby={`studio-synthesis-result-title-${result.id}`}
        >
          <h3 id={`studio-synthesis-result-title-${result.id}`}>
            {result.title}
          </h3>
          <p>{result.text}</p>
          <dl className="metadata-list">
            <div>
              <dt>State</dt>
              <dd>Working Material</dd>
            </div>
            <div>
              <dt>Attribution</dt>
              <dd>
                {result.humanAuthorship === "human-authored"
                  ? "Human-authored edit; agent provenance retained"
                  : "Agent-generated"}
              </dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>
                {result.provenance.provider} / {result.provenance.model}
              </dd>
            </div>
            <div>
              <dt>Operation</dt>
              <dd>{result.provenance.operation}</dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{result.provenance.generatedAt}</dd>
            </div>
            <div>
              <dt>Source Record / Locator</dt>
              <dd>
                {result.provenance.sourceContext.length === 0
                  ? "None retained"
                  : result.provenance.sourceContext.map((source) => (
                      <span key={source.annotationId}>
                        {source.sourceRecord.title} ({source.sourceRecord.id}) —{" "}
                        {source.sourceLocator}
                      </span>
                    ))}
              </dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{result.resultVersion ?? 1}</dd>
            </div>
          </dl>
          {result.priorResults?.map((prior) => (
            <button
              key={`${result.id}-restore-${prior.resultVersion ?? 1}`}
              id={`studio-synthesis-restore-${result.id}-${prior.resultVersion ?? 1}`}
              className="button button-quiet"
              type="button"
              onClick={() => onRestore(result.id, prior.resultVersion ?? 1)}
            >
              Restore version {prior.resultVersion ?? 1}
            </button>
          ))}
        </article>
      ))}
      {restoreOutcome === undefined ? null : (
        <p
          id="studio-synthesis-restore-outcome"
          role={
            restoreOutcome.outcome === "operation-failed" ? "alert" : "status"
          }
          aria-live={
            restoreOutcome.outcome === "operation-failed"
              ? "assertive"
              : "polite"
          }
          data-synthesis-restore-outcome={restoreOutcome.outcome}
        >
          {restoreOutcome.outcome === "restored"
            ? `Restored version ${restoreOutcome.result.resultVersion ?? 1}.`
            : restoreOutcome.detail}
        </p>
      )}
    </section>
  );
};

/**
 * Studio's first slice presents the topic carried from Atlas.
 * @param props The topic context and Synthesis action callbacks.
 * @returns The Studio workspace element.
 * @throws An error when the renderer receives an invalid workspace context.
 */
export const Studio = ({
  controls,
  workbench,
  authoring,
  isAuthoringOpen,
  onOpenAuthoringDraft,
  onOpenAuthoringConstruct,
  onEditAuthoringSemanticText,
  onUndoAuthoringSemanticText,
  onSetAuthoringMode,
  onCloseAuthoringDraft,
  onOpenSourceRecordInPaperDesk,
  onPrepareSynthesis,
  onRemoveSynthesisContextItem,
  onConfirmSynthesis,
  synthesisPreview,
  synthesisOutcome,
  savedSynthesisResults,
  savedSynthesisResultsReadError,
  restoreOutcome,
  onRestoreSynthesisResult,
}: StudioProps): JSX.Element => {
  const [includeAllContext, setIncludeAllContext] = useState(false);

  if (workbench.activeWorkspace !== "studio") {
    throw new Error("Studio requires an active Studio workspace.");
  }

  if (workbench.context === undefined) {
    throw new Error("Studio requires a contextual topic.");
  }

  return (
    <main
      className="workspace-page studio-page"
      aria-labelledby="studio-heading"
    >
      <StudioHeader />
      {controls}
      <div className="workspace-content studio-content">
        <div className="page-intro">
          <span className="eyebrow">Knowledge in motion</span>
          <h1 id="studio-heading">Studio</h1>
          <p className="page-intro-copy">
            Keep the topic and its supporting evidence together as you develop
            your understanding.
          </p>
        </div>
        <div id="studio-topic-surface" className="studio-layout">
          <div className="studio-primary-column">
            <AuthoringDraftCard
              authoring={authoring}
              isOpen={isAuthoringOpen}
              onOpen={onOpenAuthoringDraft}
              onEdit={onEditAuthoringSemanticText}
              onUndo={onUndoAuthoringSemanticText}
              onOpenConstruct={onOpenAuthoringConstruct}
              onSetMode={onSetAuthoringMode}
              onClose={onCloseAuthoringDraft}
            />
          </div>
          <aside
            id="studio-supporting-sidebar"
            className="studio-sidebar"
            aria-label="Supporting context"
          >
            <StudioTopicSurface
              context={workbench.context}
              onOpenSourceRecordInPaperDesk={onOpenSourceRecordInPaperDesk}
            />
            {workbench.sourceAnnotation === undefined ? null : (
              <WorkingMaterialCard annotation={workbench.sourceAnnotation} />
            )}
            {workbench.sourceAnnotation === undefined ? null : (
              <SynthesisReviewCard
                includeAllContext={includeAllContext}
                onPrepareSynthesis={onPrepareSynthesis}
                onRemoveSynthesisContextItem={onRemoveSynthesisContextItem}
                onConfirmSynthesis={onConfirmSynthesis}
                synthesisPreview={synthesisPreview}
                synthesisOutcome={synthesisOutcome}
                onIncludeAllContextChange={setIncludeAllContext}
              />
            )}
            <SavedSynthesisResultsCard
              results={savedSynthesisResults}
              readError={savedSynthesisResultsReadError}
              restoreOutcome={restoreOutcome}
              onRestore={onRestoreSynthesisResult}
            />
          </aside>
        </div>
      </div>
    </main>
  );
};
