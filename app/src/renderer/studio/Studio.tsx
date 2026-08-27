import type { JSX } from "react";

import type { WorkbenchState } from "../../modules/workbench-session";

interface StudioProps {
  workbench: WorkbenchState;
  onOpenSourceRecordInPaperDesk: (sourceRecordId: string) => Promise<void>;
}

/** Studio's first slice presents the topic carried from Atlas. */
export const Studio = ({
  workbench,
  onOpenSourceRecordInPaperDesk,
}: StudioProps): JSX.Element => {
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
      <header className="workspace-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            GB
          </span>
          <span>Galaxy Brain</span>
        </div>
        <div className="workspace-label">
          <span className="eyebrow">Topic workspace</span>
          <strong>Studio</strong>
        </div>
      </header>
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
          <section
            className="topic-surface"
            aria-labelledby="studio-topic-heading"
          >
            <div className="surface-icon" aria-hidden="true">
              ◈
            </div>
            <span className="card-kicker">Current topic</span>
            <h2 id="studio-topic-heading">Current topic</h2>
            <p id="studio-topic-title" className="studio-topic-title">
              {workbench.context.topic.title}
            </p>
            <p id="studio-topic-context" className="context-note">
              Topic context preserved in this session
            </p>
            <div className="source-record-summary">
              <span className="card-kicker">Associated Source Record</span>
              <p id="studio-source-record-title">
                {workbench.context.sourceRecord.title}
              </p>
              <button
                id="studio-source-record-open-paper-desk"
                className="button button-secondary"
                type="button"
                onClick={() =>
                  onOpenSourceRecordInPaperDesk(
                    workbench.context?.sourceRecord.id ?? "",
                  )
                }
              >
                Open Source Record in Paper Desk
              </button>
            </div>
          </section>
          {workbench.sourceAnnotation === undefined ? null : (
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
              <blockquote id="studio-source-claim-text">
                {workbench.sourceAnnotation.text}
              </blockquote>
              <dl className="metadata-list">
                <div>
                  <dt>Source locator</dt>
                  <dd>{workbench.sourceAnnotation.sourceLocator.logical}</dd>
                </div>
                <div>
                  <dt>State</dt>
                  <dd id="studio-source-claim-state">Working Material</dd>
                </div>
              </dl>
              <p className="working-material-note">
                This captured claim supports the topic; it is not Governed
                Knowledge.
              </p>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
};
