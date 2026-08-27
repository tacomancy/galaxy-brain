import type { JSX } from "react";

import type { WorkbenchState } from "../../modules/workbench-session";

interface PaperDeskProps {
  workbench: WorkbenchState;
}

/** Paper Desk's first slice presents a Source Record in topic context. */
export const PaperDesk = ({ workbench }: PaperDeskProps): JSX.Element => {
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
    </main>
  );
};
