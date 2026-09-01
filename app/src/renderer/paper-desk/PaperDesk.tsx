import type { JSX } from "react";

import type { WorkbenchState } from "../../modules/workbench-session";
import type {
  CheckSourceAvailabilityOutcome,
  RelinkSourceOutcome,
} from "../../modules/source-processing";

type SourceStatusPresentation =
  CheckSourceAvailabilityOutcome | RelinkSourceOutcome;

const sourceStatusLabel = (
  status: SourceStatusPresentation | undefined,
): string => {
  if (status === undefined) {
    return "Checking source status…";
  }

  return {
    available: "Source available",
    "source-changed": "Source status changed",
    "source-status-unavailable": "Source status unavailable",
    relinked: "Source available",
  }[status.outcome];
};

const relinkOutcomeMessage = (
  outcome: RelinkSourceOutcome | undefined,
): string | undefined => {
  if (outcome === undefined || outcome.outcome === "relinked") {
    return undefined;
  }

  return outcome.outcome === "source-changed"
    ? "The replacement Source Asset changed during verification."
    : outcome.detail;
};

interface PaperDeskProps {
  controls: JSX.Element;
  workbench: WorkbenchState;
  sourceStatus: SourceStatusPresentation | undefined;
  relinkOutcome: RelinkSourceOutcome | undefined;
  onRelinkSource: () => Promise<void>;
  onOpenSavedAnnotation: () => Promise<void>;
}

const SourceStatusCard = ({
  sourceStatus,
  relinkOutcome,
  onRelinkSource,
}: {
  sourceStatus: SourceStatusPresentation | undefined;
  relinkOutcome: RelinkSourceOutcome | undefined;
  onRelinkSource: () => Promise<void>;
}): JSX.Element => {
  const failureMessage = relinkOutcomeMessage(relinkOutcome);

  return (
    <section
      id="paper-desk-source-status"
      className="source-status-card"
      data-source-status={sourceStatus?.outcome ?? "checking"}
      aria-labelledby="paper-desk-source-status-heading"
    >
      <div>
        <span className="card-kicker">Linked source</span>
        <h2 id="paper-desk-source-status-heading">
          {sourceStatusLabel(sourceStatus)}
        </h2>
        {sourceStatus?.outcome === "source-changed" ? (
          <p>The linked file differs from the recorded Source Asset.</p>
        ) : null}
        {sourceStatus?.outcome === "source-status-unavailable" ? (
          <p>{sourceStatus.detail}</p>
        ) : null}
        {sourceStatus?.outcome === "relinked" ? (
          <p id="paper-desk-relink-confirmation">
            Source relinked and verified.
          </p>
        ) : null}
        {failureMessage !== undefined ? (
          <p id="paper-desk-relink-outcome">{failureMessage}</p>
        ) : null}
      </div>
      {sourceStatus?.outcome === "source-changed" ||
      sourceStatus?.outcome === "source-status-unavailable" ? (
        <button
          id="paper-desk-relink-source"
          className="button button-secondary"
          type="button"
          onClick={onRelinkSource}
        >
          Verify replacement PDF
        </button>
      ) : null}
    </section>
  );
};

/**
 * Paper Desk presents a Source Record, captured claim, and reading position.
 * @param props The current Workbench state and annotation callback.
 * @returns The Paper Desk workspace element.
 * @throws An error when the renderer receives an invalid workspace context.
 */
export const PaperDesk = ({
  controls,
  workbench,
  sourceStatus,
  relinkOutcome,
  onRelinkSource,
  onOpenSavedAnnotation,
}: PaperDeskProps): JSX.Element => {
  if (workbench.activeWorkspace !== "paper-desk") {
    throw new Error("Paper Desk requires an active Paper Desk workspace.");
  }

  if (workbench.context === undefined) {
    throw new Error("Paper Desk requires a contextual Source Record.");
  }

  return (
    <main
      className="workspace-page paper-desk-page"
      aria-labelledby="paper-desk-heading"
    >
      <header className="workspace-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            GB
          </span>
          <span>Galaxy Brain</span>
        </div>
        <div id="workspace-label" className="workspace-label">
          <span className="eyebrow">Source workspace</span>
          <strong>Paper Desk</strong>
        </div>
      </header>
      {controls}
      <div className="workspace-content paper-desk-content">
        <div className="page-intro paper-desk-intro">
          <span className="eyebrow">Source-first reading</span>
          <h1 id="paper-desk-heading">Paper Desk</h1>
          <p className="page-intro-copy">
            Keep the source passage, its provenance, and your place in the
            reading together.
          </p>
        </div>
        <div id="paper-desk-reading-surface" className="paper-desk-layout">
          <section
            id="paper-desk-source-preview"
            className="source-preview"
            aria-labelledby="paper-desk-preview-heading"
          >
            <div className="source-preview-header">
              <div>
                <span className="card-kicker">Source preview</span>
                <h2 id="paper-desk-preview-heading">
                  {workbench.context.sourceRecord.title}
                </h2>
              </div>
              <span className="page-badge">Page 2</span>
            </div>
            <article className="source-page">
              <p className="source-page-label">Captured passage</p>
              {workbench.sourceAnnotation === undefined ? (
                <p className="source-page-empty">
                  No saved source claim is available for this Source Record.
                </p>
              ) : (
                <p className="source-page-text">
                  <mark>{workbench.sourceAnnotation.text}</mark>
                </p>
              )}
            </article>
          </section>
          <aside
            id="paper-desk-supporting-sidebar"
            className="paper-desk-sidebar"
            aria-label="Supporting context"
          >
            <SourceStatusCard
              sourceStatus={sourceStatus}
              relinkOutcome={relinkOutcome}
              onRelinkSource={onRelinkSource}
            />
            <section
              data-source-record-id={workbench.context.sourceRecord.id}
              className="source-identity-card"
              aria-labelledby="paper-desk-source-record-heading"
            >
              <span className="card-kicker">Source Record</span>
              <h2 id="paper-desk-source-record-heading">
                Current Source Record
              </h2>
              <p id="paper-desk-source-record-title">
                {workbench.context.sourceRecord.title}
              </p>
              <p id="paper-desk-topic-relationship">
                Related topic: {workbench.context.topic.title}
              </p>
            </section>
            {workbench.sourceAnnotation === undefined ? null : (
              <section
                id="paper-desk-saved-annotation"
                className="annotation-card"
                data-annotation-id={workbench.sourceAnnotation.id}
                aria-labelledby="paper-desk-annotation-heading"
              >
                <div className="annotation-card-heading">
                  <div>
                    <span className="card-kicker">Working Material</span>
                    <h2 id="paper-desk-annotation-heading">
                      Saved source claim
                    </h2>
                  </div>
                  <span className="annotation-pin" aria-hidden="true">
                    1
                  </span>
                </div>
                <p id="paper-desk-annotation-text">
                  {workbench.sourceAnnotation.text}
                </p>
                <p id="paper-desk-source-locator" className="source-locator">
                  {workbench.sourceAnnotation.sourceLocator.logical}
                </p>
                <div className="annotation-metadata">
                  <p id="paper-desk-annotation-attribution">
                    Attribution: {workbench.sourceAnnotation.attribution}
                  </p>
                  <p id="paper-desk-annotation-classification">
                    Classification: {workbench.sourceAnnotation.classification}
                  </p>
                  <p id="paper-desk-annotation-state">
                    State: {workbench.sourceAnnotation.state}
                  </p>
                </div>
                <button
                  id="paper-desk-open-saved-annotation"
                  className="button button-primary"
                  type="button"
                  onClick={onOpenSavedAnnotation}
                >
                  Open saved annotation
                </button>
              </section>
            )}
            <section
              className="reading-position-card"
              aria-labelledby="paper-desk-reading-position-heading"
            >
              <span className="card-kicker">Resume point</span>
              <h2 id="paper-desk-reading-position-heading">Reading position</h2>
              <p id="paper-desk-reading-position">
                {workbench.readingPosition === undefined
                  ? "No reading position saved."
                  : `Page ${workbench.readingPosition.page}, character ${workbench.readingPosition.characterOffset}`}
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};
