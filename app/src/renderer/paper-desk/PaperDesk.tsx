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
    <main aria-labelledby="paper-desk-heading">
      <h1 id="paper-desk-heading">Paper Desk</h1>
      <section aria-labelledby="paper-desk-source-record-heading">
        <h2 id="paper-desk-source-record-heading">Current Source Record</h2>
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
          aria-labelledby="paper-desk-annotation-heading"
        >
          <h2 id="paper-desk-annotation-heading">Saved source claim</h2>
          <p id="paper-desk-annotation-text">
            {workbench.sourceAnnotation.text}
          </p>
          <p id="paper-desk-source-locator">
            {workbench.sourceAnnotation.sourceLocator.logical}
          </p>
          <p id="paper-desk-annotation-attribution">
            Attribution: {workbench.sourceAnnotation.attribution}
          </p>
          <p id="paper-desk-annotation-classification">
            Classification: {workbench.sourceAnnotation.classification}
          </p>
          <p id="paper-desk-annotation-state">
            State: {workbench.sourceAnnotation.state}
          </p>
          <button
            id="paper-desk-open-saved-annotation"
            type="button"
            onClick={onOpenSavedAnnotation}
          >
            Open saved annotation
          </button>
        </section>
      )}
      <p id="paper-desk-reading-position">
        {workbench.readingPosition === undefined
          ? "No reading position saved."
          : `Page ${workbench.readingPosition.page}, character ${workbench.readingPosition.characterOffset}`}
      </p>
    </main>
  );
};
