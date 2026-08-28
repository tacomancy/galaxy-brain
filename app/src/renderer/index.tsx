/** Renderer entry point for the desktop Workbench shell. */
import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";

import "./styles.css";
import { Atlas } from "./atlas/Atlas";
import { PaperDesk } from "./paper-desk/PaperDesk";
import { Studio } from "./studio/Studio";
import { WorkspaceSwitcher } from "./workspace-switcher/WorkspaceSwitcher";
import type {
  ConfirmSynthesisOutcome,
  RestoreSynthesisResultOutcome,
  SynthesisPreview,
  SynthesisResultListReadOutcome,
  SynthesisSavedResult,
} from "../modules/source-processing";
import type {
  FreshWorkbench,
  RepositoryOperationOutcome,
  WorkbenchContextSelection,
  WorkbenchContextSelectionOutcome,
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
  initialSavedSynthesisResults,
}: {
  initialWorkbench: FreshWorkbench;
  initialSavedSynthesisResults: SynthesisResultListReadOutcome;
}) => {
  const [workbench, setWorkbench] = useState<WorkbenchState>(initialWorkbench);
  const shouldFocusSelectedContextAction = useRef(false);
  const [lastOutcome, setLastOutcome] = useState<
    | RepositoryOperationOutcome
    | WorkbenchContextSelectionOutcome
    | WorkspaceTransitionOutcome
    | undefined
  >(initialWorkbench.repositoryResumeFailure);
  const [synthesisPreview, setSynthesisPreview] = useState<
    SynthesisPreview | undefined
  >();
  const [synthesisOutcome, setSynthesisOutcome] = useState<
    ConfirmSynthesisOutcome | undefined
  >();
  const [savedSynthesisResults, setSavedSynthesisResults] = useState<
    SynthesisSavedResult[]
  >(
    initialSavedSynthesisResults.outcome === "found"
      ? initialSavedSynthesisResults.results
      : [],
  );
  const [savedSynthesisResultsReadError, setSavedSynthesisResultsReadError] =
    useState<string | undefined>(
      initialSavedSynthesisResults.outcome === "unavailable"
        ? initialSavedSynthesisResults.detail
        : undefined,
    );
  const [restoreOutcome, setRestoreOutcome] = useState<
    RestoreSynthesisResultOutcome | undefined
  >();

  useEffect(() => {
    if (!shouldFocusSelectedContextAction.current) {
      return;
    }

    const nextAction = document.getElementById("atlas-topic-open-studio");
    if (nextAction instanceof HTMLButtonElement) {
      nextAction.focus();
      shouldFocusSelectedContextAction.current = false;
    }
  }, [workbench]);

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
    const outcome = await window.workbench.readSynthesisResults();
    if (outcome.outcome === "found") {
      setSavedSynthesisResults(outcome.results);
      setSavedSynthesisResultsReadError(undefined);
    } else {
      setSavedSynthesisResultsReadError(outcome.detail);
    }
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

  const selectWorkbenchContext = async (
    selection: WorkbenchContextSelection,
  ): Promise<void> => {
    const outcome = await window.workbench.selectWorkbenchContext(selection);

    if (outcome.outcome === "selected") {
      setLastOutcome(undefined);
      setWorkbench(outcome.workbench);
      shouldFocusSelectedContextAction.current = true;
      return;
    }

    setLastOutcome(outcome);
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

  const prepareSynthesis = async (
    includeAllContext: boolean,
  ): Promise<void> => {
    // Do not leave an old confirmation surface actionable while the main
    // process prepares the next preview. Otherwise a quick follow-up click
    // can race the previous IPC request and apply its outcome out of order.
    setSynthesisPreview(undefined);
    setSynthesisOutcome(undefined);

    const outcome = await window.workbench.prepareSynthesis(includeAllContext);

    if (outcome.outcome === "preview-ready") {
      setSynthesisPreview(outcome.preview);
      setSynthesisOutcome(undefined);
      return;
    }

    setSynthesisPreview(undefined);
    setSynthesisOutcome({
      outcome: "operation-failed",
      detail: outcome.detail,
    });
  };

  const confirmSynthesis = async (
    confirmation: "confirmed" | "declined" | "canceled",
  ): Promise<void> => {
    setSynthesisOutcome(await window.workbench.confirmSynthesis(confirmation));
  };

  const removeSynthesisContextItem = async (
    annotationId: string,
  ): Promise<void> => {
    const outcome =
      await window.workbench.removeSynthesisContextItem(annotationId);

    if (outcome.outcome === "preview-ready") {
      setSynthesisPreview(outcome.preview);
      setSynthesisOutcome(undefined);
      return;
    }

    setSynthesisOutcome({
      outcome: "operation-failed",
      detail: outcome.detail,
    });
  };

  const restoreSynthesisResult = async (
    resultId: string,
    version: number,
  ): Promise<void> => {
    const outcome = await window.workbench.restoreSynthesisResult(
      resultId,
      version,
    );
    setRestoreOutcome(outcome);

    if (outcome.outcome === "restored") {
      const refreshed = await window.workbench.readSynthesisResults();
      if (refreshed.outcome === "found") {
        setSavedSynthesisResults(refreshed.results);
        setSavedSynthesisResultsReadError(undefined);
      } else {
        setSavedSynthesisResultsReadError(refreshed.detail);
      }
    }
  };

  const workspace = (() => {
    if (workbench.activeWorkspace === "studio") {
      return (
        <Studio
          workbench={workbench}
          onOpenSourceRecordInPaperDesk={openSourceRecordInPaperDesk}
          onPrepareSynthesis={prepareSynthesis}
          onConfirmSynthesis={confirmSynthesis}
          onRemoveSynthesisContextItem={removeSynthesisContextItem}
          synthesisPreview={synthesisPreview}
          synthesisOutcome={synthesisOutcome}
          savedSynthesisResults={savedSynthesisResults}
          savedSynthesisResultsReadError={savedSynthesisResultsReadError}
          restoreOutcome={restoreOutcome}
          onRestoreSynthesisResult={restoreSynthesisResult}
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
        onSelectWorkbenchContext={selectWorkbenchContext}
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

void window.workbench.openFreshWorkbench().then(async (workbench) => {
  const outcome = await window.workbench.readSynthesisResults();
  root.render(
    <WorkbenchShell
      initialWorkbench={workbench}
      initialSavedSynthesisResults={outcome}
    />,
  );
});
