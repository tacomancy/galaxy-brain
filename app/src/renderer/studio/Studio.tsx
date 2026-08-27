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
    <main aria-labelledby="studio-heading">
      <h1 id="studio-heading">Studio</h1>
      <section aria-labelledby="studio-topic-heading">
        <h2 id="studio-topic-heading">Current topic</h2>
        <p id="studio-topic-title">{workbench.context.topic.title}</p>
        <p id="studio-topic-context">Topic context preserved in this session</p>
        <p id="studio-source-record-title">
          {workbench.context.sourceRecord.title}
        </p>
        <button
          id="studio-source-record-open-paper-desk"
          type="button"
          onClick={() =>
            onOpenSourceRecordInPaperDesk(
              workbench.context?.sourceRecord.id ?? "",
            )
          }
        >
          Open Source Record in Paper Desk
        </button>
      </section>
    </main>
  );
};
