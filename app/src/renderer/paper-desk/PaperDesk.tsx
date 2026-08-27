import type { JSX } from "react";

import type { WorkbenchState } from "../../modules/workbench-session";

interface PaperDeskProps {
  workbench: WorkbenchState;
  onOpenSavedAnnotation: () => Promise<void>;
}

/** Paper Desk presents a Source Record, captured claim, and reading position. */
export const PaperDesk = ({
  workbench,
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
        <div className="workspace-label">
          <span className="eyebrow">Source workspace</span>
          <strong>Paper Desk</strong>
        </div>
      </header>
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
            <p className="source-preview-note">
              Fixture preview · production PDF rendering remains deferred.
            </p>
          </section>
          <aside className="paper-desk-sidebar">
            <section
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
