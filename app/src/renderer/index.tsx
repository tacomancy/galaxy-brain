/** Renderer entry point for the desktop Workbench shell. */
import { createRoot } from "react-dom/client";
import { useState } from "react";

import "./styles.css";
import { Atlas } from "./atlas/Atlas";
import { PaperDesk } from "./paper-desk/PaperDesk";
import { Studio } from "./studio/Studio";
import { WorkspaceSwitcher } from "./workspace-switcher/WorkspaceSwitcher";
import type {
  FreshWorkbench,
  RepositoryOperationOutcome,
  WorkbenchState,
  WorkbenchWorkspace,
  WorkspaceTransitionOutcome,
} from "../modules/workbench-session";

const rootElement = document.getElementById("root");

// A missing mount point means the packaged document and renderer are out of
// sync; do not silently drop the Workbench UI in that case.
if (rootElement === null) {
  throw new Error("Workbench root is unavailable.");
}

const root = createRoot(rootElement);

// Request session state through the typed preload bridge, then render the
// workspace selected by the application Module.
const WorkbenchShell = ({
  initialWorkbench,
}: {
  initialWorkbench: FreshWorkbench;
}) => {
  const [workbench, setWorkbench] = useState<WorkbenchState>(initialWorkbench);
  const [lastOutcome, setLastOutcome] = useState<
    RepositoryOperationOutcome | WorkspaceTransitionOutcome | undefined
  >(initialWorkbench.repositoryResumeFailure);

  const applyWorkspaceTransition = (
    outcome: WorkspaceTransitionOutcome,
  ): void => {
    if (outcome.outcome === "transitioned") {
      setLastOutcome(undefined);
      setWorkbench(outcome.workbench);
      return;
    }

    setLastOutcome(outcome);
  };

  const refreshWorkbench = async (): Promise<void> => {
    // React owns only this presentation projection; the main-process Session
    // remains the authority for repository selection and access.
    setWorkbench(await window.workbench.openFreshWorkbench());
  };

  const createRepository = async (): Promise<void> => {
    const outcome = await window.workbench.createRepository();
    setLastOutcome(outcome);
    await refreshWorkbench();
  };

  const openRepository = async (): Promise<void> => {
    const outcome = await window.workbench.openRepository();
    setLastOutcome(outcome);
    await refreshWorkbench();
  };

  const openTopicInStudio = async (topicId: string): Promise<void> => {
    const outcome = await window.workbench.openTopicInStudio(topicId);
    applyWorkspaceTransition(outcome);
  };

  const openSourceRecordInPaperDesk = async (
    sourceRecordId: string,
  ): Promise<void> => {
    const outcome =
      await window.workbench.openSourceRecordInPaperDesk(sourceRecordId);
    applyWorkspaceTransition(outcome);
  };

  const switchWorkspace = async (
    workspace: WorkbenchWorkspace,
  ): Promise<void> => {
    const outcome = await window.workbench.switchWorkspace(workspace);
    applyWorkspaceTransition(outcome);
  };

  const openSavedAnnotation = async (): Promise<void> => {
    const outcome = await window.workbench.openSavedAnnotation();

    if (outcome.outcome === "position-restored") {
      setLastOutcome(undefined);
      setWorkbench(outcome.workbench);
      return;
    }

    if (
      outcome.outcome === "context-unavailable" ||
      outcome.outcome === "operation-failed"
    ) {
      setLastOutcome(outcome);
    }
  };

  const workspace = (() => {
    if (workbench.activeWorkspace === "studio") {
      return (
        <Studio
          workbench={workbench}
          onOpenSourceRecordInPaperDesk={openSourceRecordInPaperDesk}
        />
      );
    }

    if (workbench.activeWorkspace === "paper-desk") {
      return (
        <PaperDesk
          workbench={workbench}
          onOpenSavedAnnotation={openSavedAnnotation}
        />
      );
    }

    return (
      <Atlas
        workbench={workbench}
        lastOutcome={lastOutcome}
        onCreateRepository={createRepository}
        onOpenRepository={openRepository}
        onOpenTopicInStudio={openTopicInStudio}
      />
    );
  })();

  return (
    <>
      {workbench.repositoryStatus === "selected" ? (
        <WorkspaceSwitcher
          activeWorkspace={workbench.activeWorkspace}
          hasContext={workbench.context !== undefined}
          onSwitchWorkspace={switchWorkspace}
        />
      ) : null}
      {workspace}
    </>
  );
};

void window.workbench.openFreshWorkbench().then((workbench) => {
  root.render(<WorkbenchShell initialWorkbench={workbench} />);
});
