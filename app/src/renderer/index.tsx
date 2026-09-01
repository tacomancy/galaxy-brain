/** Renderer entry point for the desktop Workbench shell. */
import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState, type JSX } from "react";

import "./styles.css";
import { Atlas } from "./atlas/Atlas";
import { PaperDesk } from "./paper-desk/PaperDesk";
import { ProposalReview } from "./proposal-review/ProposalReview";
import { Studio } from "./studio/Studio";
import { WorkspaceSwitcher } from "./workspace-switcher/WorkspaceSwitcher";
import { Discovery } from "./discovery/Discovery";
import type {
  AuthoringConstruct,
  AuthoringMode,
  AuthoringOperationOutcome,
  AuthoringReadOutcome,
} from "../modules/knowledge-authoring";
import type {
  AskPreview,
  ConfirmAskOutcome,
  DiscoveryContextCandidate,
  DiscoveryJumpOutcome,
  DiscoverySearchOutcome,
  PrepareAskOutcome,
} from "../modules/discovery";
import type {
  ProposalReviewApplyOutcome,
  ProposalReviewReadOutcome,
} from "../modules/proposal-review";
import type {
  AtlasLearningRouteEditOutcome,
  AtlasOrientationReadOutcome,
} from "../modules/atlas-orientation";
import type {
  LearningOperationOutcome,
  LearningReadOutcome,
} from "../modules/learning";
import type {
  CheckSourceAvailabilityOutcome,
  ConfirmSynthesisOutcome,
  RelinkSourceOutcome,
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
  WorkbenchTheme,
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

const authoringReadFromOperation = (
  outcome: AuthoringOperationOutcome,
): AuthoringReadOutcome =>
  outcome.outcome === "updated"
    ? { outcome: "available", draft: outcome.draft }
    : outcome;

type SourceStatusPresentation =
  CheckSourceAvailabilityOutcome | RelinkSourceOutcome;

const ThemeControl = ({
  theme,
  onChange,
}: {
  theme: WorkbenchTheme;
  onChange: (theme: WorkbenchTheme) => Promise<void>;
}): JSX.Element => (
  <div id="appearance-controls">
    <label htmlFor="workbench-theme">Theme</label>
    <select
      id="workbench-theme"
      value={theme}
      onChange={(event) =>
        void onChange(event.currentTarget.value === "dark" ? "dark" : "light")
      }
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </div>
);

// Request session state through the typed preload bridge, then render the
// workspace selected by the application Module.
const WorkbenchShell = ({
  initialWorkbench,
  initialSavedSynthesisResults,
  initialProposalReview,
  initialAuthoring,
  initialTheme,
  initialAtlasOrientation,
  initialLearning,
}: {
  initialWorkbench: FreshWorkbench;
  initialSavedSynthesisResults: SynthesisResultListReadOutcome;
  initialProposalReview: ProposalReviewReadOutcome;
  initialAuthoring: AuthoringReadOutcome;
  initialTheme: WorkbenchTheme;
  initialAtlasOrientation: AtlasOrientationReadOutcome;
  initialLearning: LearningReadOutcome;
}) => {
  const [workbench, setWorkbench] = useState<WorkbenchState>(initialWorkbench);
  const [authoring, setAuthoring] =
    useState<AuthoringReadOutcome>(initialAuthoring);
  const [theme, setTheme] = useState<WorkbenchTheme>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const [isAuthoringOpen, setIsAuthoringOpen] = useState(
    initialAuthoring.outcome === "available",
  );
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
  const [discoverySearchOutcome, setDiscoverySearchOutcome] = useState<
    DiscoverySearchOutcome | undefined
  >();
  const [discoveryAskContextCandidates, setDiscoveryAskContextCandidates] =
    useState<DiscoveryContextCandidate[]>([]);
  const [selectedDiscoveryAskContextIds, setSelectedDiscoveryAskContextIds] =
    useState<string[]>([]);
  const [discoveryAskPreview, setDiscoveryAskPreview] = useState<
    AskPreview | undefined
  >();
  const [discoveryAskOutcome, setDiscoveryAskOutcome] = useState<
    | ConfirmAskOutcome
    | {
        outcome: "unsupported" | "invalid-prompt" | "repository-unavailable";
        detail: string;
      }
    | undefined
  >();
  const [discoveryJumpOutcome, setDiscoveryJumpOutcome] = useState<
    DiscoveryJumpOutcome | undefined
  >();
  const [proposalReview, setProposalReview] =
    useState<ProposalReviewReadOutcome>(initialProposalReview);
  const [atlasOrientation, setAtlasOrientation] =
    useState<AtlasOrientationReadOutcome>(initialAtlasOrientation);
  const [learning, setLearning] =
    useState<LearningReadOutcome>(initialLearning);
  const [sourceStatus, setSourceStatus] = useState<
    SourceStatusPresentation | undefined
  >();
  const [relinkOutcome, setRelinkOutcome] = useState<
    RelinkSourceOutcome | undefined
  >();
  const [isProposalReviewOpen, setIsProposalReviewOpen] = useState(false);
  const [proposalReviewApplyOutcome, setProposalReviewApplyOutcome] = useState<
    ProposalReviewApplyOutcome | undefined
  >();

  useEffect(() => {
    if (workbench.repositoryPath === undefined) {
      return;
    }
    void window.workbench.discoveryAskContextCandidates().then((outcome) => {
      setDiscoveryAskContextCandidates(
        outcome.outcome === "available" ? outcome.candidates : [],
      );
      setSelectedDiscoveryAskContextIds([]);
    });
  }, [workbench.repositoryPath]);

  const clearSourceStatus = (): void => {
    setSourceStatus(undefined);
    setRelinkOutcome(undefined);
  };

  const refreshSourceStatus = async (): Promise<void> => {
    setSourceStatus(await window.workbench.readSourceAvailability());
  };

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
      clearSourceStatus();
      setWorkbench(outcome.workbench);
      return;
    }

    setLastOutcome(outcome);
  };

  const refreshWorkbench = async (): Promise<void> => {
    // React owns only this presentation projection; the main-process Session
    // remains the authority for repository selection and access.
    clearSourceStatus();
    setWorkbench(await window.workbench.openFreshWorkbench());
    const authoringOutcome = await window.workbench.readAuthoringDraft();
    setAuthoring(authoringOutcome);
    setIsAuthoringOpen(authoringOutcome.outcome === "available");
    const outcome = await window.workbench.readSynthesisResults();
    if (outcome.outcome === "found") {
      setSavedSynthesisResults(outcome.results);
      setSavedSynthesisResultsReadError(undefined);
    } else {
      setSavedSynthesisResultsReadError(outcome.detail);
    }
    setProposalReview(await window.workbench.readProposalReview());
    setAtlasOrientation(await window.workbench.readAtlasOrientation());
    setLearning(await window.workbench.readLearningProgress());
  };

  const openAuthoringDraft = async (): Promise<void> => {
    const outcome = await window.workbench.openAuthoringDraft();
    setAuthoring(outcome);
    setIsAuthoringOpen(outcome.outcome === "available");
  };

  const openAuthoringConstruct = async (
    construct: AuthoringConstruct,
  ): Promise<void> => {
    const outcome = await window.workbench.openAuthoringConstruct(construct);
    setAuthoring(outcome);
    setIsAuthoringOpen(outcome.outcome === "available");
  };

  const editAuthoringSemanticText = async (nextText: string): Promise<void> => {
    setAuthoring(
      authoringReadFromOperation(
        await window.workbench.editAuthoringSemanticText(nextText),
      ),
    );
  };

  const undoAuthoringSemanticText = async (): Promise<void> => {
    setAuthoring(
      authoringReadFromOperation(
        await window.workbench.undoAuthoringSemanticText(),
      ),
    );
  };

  const changeTheme = async (nextTheme: WorkbenchTheme): Promise<void> => {
    const outcome = await window.workbench.setTheme(nextTheme);
    if (outcome.outcome === "updated") {
      setTheme(outcome.theme);
    }
  };

  const setAuthoringMode = async (mode: AuthoringMode): Promise<void> => {
    setAuthoring(
      authoringReadFromOperation(await window.workbench.setAuthoringMode(mode)),
    );
  };

  const searchDiscovery = async (query: string): Promise<void> => {
    setDiscoveryAskPreview(undefined);
    setDiscoveryAskOutcome(undefined);
    setDiscoveryJumpOutcome(undefined);
    setDiscoverySearchOutcome(await window.workbench.discoverySearch(query));
  };

  const prepareAsk = async (prompt: string): Promise<void> => {
    setDiscoverySearchOutcome(undefined);
    setDiscoveryAskOutcome(undefined);
    setDiscoveryJumpOutcome(undefined);
    const outcome: PrepareAskOutcome = await window.workbench.prepareAsk({
      prompt,
      contextItemIds: selectedDiscoveryAskContextIds,
    });
    setDiscoveryAskPreview(
      outcome.outcome === "preview-ready" ? outcome.preview : undefined,
    );
    if (outcome.outcome !== "preview-ready") {
      setDiscoveryAskOutcome(outcome);
    }
  };

  const toggleDiscoveryAskContextItem = (itemId: string): void => {
    setSelectedDiscoveryAskContextIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  const removeAskContextItem = async (itemId: string): Promise<void> => {
    const outcome = await window.workbench.removeAskContextItem(itemId);
    if (outcome.outcome === "preview-ready") {
      setDiscoveryAskPreview(outcome.preview);
      return;
    }
    setDiscoveryAskPreview(undefined);
    setDiscoveryAskOutcome(outcome);
  };

  const confirmAsk = async (
    confirmation: "confirmed" | "declined" | "canceled",
  ): Promise<void> => {
    setDiscoveryAskOutcome(await window.workbench.confirmAsk(confirmation));
    setDiscoveryAskPreview(undefined);
  };

  const jumpDiscovery = async (command: string): Promise<void> => {
    setDiscoverySearchOutcome(undefined);
    setDiscoveryAskPreview(undefined);
    setDiscoveryAskOutcome(undefined);
    const outcome = await window.workbench.discoveryJump(command);
    setDiscoveryJumpOutcome(outcome);
    if (outcome.outcome !== "resolved") {
      return;
    }
    if (outcome.target.kind === "workspace") {
      applyWorkspaceTransition(
        await window.workbench.switchWorkspace(outcome.target.workspace),
      );
    } else if (outcome.target.kind === "topic") {
      applyWorkspaceTransition(
        await window.workbench.openTopicInStudio(outcome.target.id),
      );
    } else if (outcome.target.kind === "source-record") {
      applyWorkspaceTransition(
        await window.workbench.openSourceRecordInPaperDesk(outcome.target.id),
      );
    } else if (
      outcome.target.kind === "structured-annotation" &&
      outcome.target.sourceRecordId !== undefined
    ) {
      applyWorkspaceTransition(
        await window.workbench.openSourceRecordInPaperDesk(
          outcome.target.sourceRecordId,
        ),
      );
    } else if (
      outcome.target.kind === "saved-synthesis-result" &&
      outcome.target.targetTopicId !== undefined
    ) {
      applyWorkspaceTransition(
        await window.workbench.openTopicInStudio(outcome.target.targetTopicId),
      );
    } else {
      applyWorkspaceTransition(
        await window.workbench.switchWorkspace("studio"),
      );
    }
  };

  const closeAuthoringDraft = (): void => {
    setIsAuthoringOpen(false);
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
      clearSourceStatus();
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

  const editLearningRouteTitle = async (
    routeId: string,
    title: string,
  ): Promise<AtlasLearningRouteEditOutcome> => {
    const outcome = await window.workbench.editLearningRouteTitle(
      routeId,
      title,
    );
    if (outcome.outcome === "updated") {
      setAtlasOrientation({ outcome: "available", overview: outcome.overview });
    }
    return outcome;
  };

  const confirmLearningProgress = async (
    suggestionId: string,
  ): Promise<LearningOperationOutcome> => {
    const outcome =
      await window.workbench.confirmLearningProgress(suggestionId);
    if (outcome.outcome === "updated") {
      setLearning({ outcome: "available", progress: outcome.progress });
    }
    return outcome;
  };

  const correctLearningProgress = async (
    suggestionId: string,
    correction: string,
  ): Promise<LearningOperationOutcome> => {
    const outcome = await window.workbench.correctLearningProgress(
      suggestionId,
      correction,
    );
    if (outcome.outcome === "updated") {
      setLearning({ outcome: "available", progress: outcome.progress });
    }
    return outcome;
  };

  const openProposalReview = async (): Promise<void> => {
    const outcome = await window.workbench.openProposalReview();
    setProposalReview(outcome);
    setProposalReviewApplyOutcome(undefined);

    if (outcome.outcome === "available" || outcome.outcome === "applied") {
      setIsProposalReviewOpen(true);
    }
  };

  const acceptProposalReview = async (): Promise<void> => {
    const outcome = await window.workbench.acceptProposalReview();
    setProposalReviewApplyOutcome(outcome);

    if (outcome.outcome === "applied") {
      setProposalReview(outcome);
    }
  };

  const closeProposalReview = (): void => {
    setIsProposalReviewOpen(false);
    setProposalReviewApplyOutcome(undefined);
  };

  const openSourceRecordInPaperDesk = async (
    sourceRecordId: string,
  ): Promise<void> => {
    const outcome =
      await window.workbench.openSourceRecordInPaperDesk(sourceRecordId);
    applyWorkspaceTransition(outcome);

    if (outcome.outcome === "transitioned" && outcome.workbench.context) {
      await refreshSourceStatus();
    }
  };

  const switchWorkspace = async (
    workspace: WorkbenchWorkspace,
  ): Promise<void> => {
    const outcome = await window.workbench.switchWorkspace(workspace);
    applyWorkspaceTransition(outcome);

    if (
      outcome.outcome === "transitioned" &&
      outcome.workbench.activeWorkspace === "paper-desk" &&
      outcome.workbench.context
    ) {
      await refreshSourceStatus();
    }
  };

  const openSavedAnnotation = async (): Promise<void> => {
    const outcome = await window.workbench.openSavedAnnotation();

    if (outcome.outcome === "position-restored") {
      setLastOutcome(undefined);
      clearSourceStatus();
      setWorkbench(outcome.workbench);
      void refreshSourceStatus();
      return;
    }

    if (
      outcome.outcome === "context-unavailable" ||
      outcome.outcome === "operation-failed"
    ) {
      setLastOutcome(outcome);
    }
  };

  const relinkSource = async (): Promise<void> => {
    const outcome = await window.workbench.relinkSource();

    if (outcome.outcome !== "canceled") {
      setRelinkOutcome(outcome.outcome === "relinked" ? undefined : outcome);
      if (outcome.outcome === "relinked") {
        setSourceStatus(outcome);
      }
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

  const controls = (
    <div id="workbench-controls">
      {workbench.repositoryStatus === "selected" ? (
        <WorkspaceSwitcher
          activeWorkspace={workbench.activeWorkspace}
          hasContext={workbench.context !== undefined}
          onSwitchWorkspace={switchWorkspace}
        />
      ) : null}
      <ThemeControl theme={theme} onChange={changeTheme} />
    </div>
  );

  const workspace = (() => {
    if (
      isProposalReviewOpen &&
      (proposalReview.outcome === "available" ||
        proposalReview.outcome === "applied")
    ) {
      return (
        <ProposalReview
          controls={controls}
          review={proposalReview.review}
          applyOutcome={proposalReviewApplyOutcome}
          onAcceptAndApply={acceptProposalReview}
          onBack={closeProposalReview}
        />
      );
    }

    if (workbench.activeWorkspace === "studio") {
      return (
        <Studio
          controls={controls}
          workbench={workbench}
          authoring={authoring}
          isAuthoringOpen={isAuthoringOpen}
          onOpenAuthoringDraft={openAuthoringDraft}
          onOpenAuthoringConstruct={openAuthoringConstruct}
          onEditAuthoringSemanticText={editAuthoringSemanticText}
          onUndoAuthoringSemanticText={undoAuthoringSemanticText}
          onSetAuthoringMode={setAuthoringMode}
          onCloseAuthoringDraft={closeAuthoringDraft}
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
          controls={controls}
          workbench={workbench}
          sourceStatus={sourceStatus}
          relinkOutcome={relinkOutcome}
          onRelinkSource={relinkSource}
          onOpenSavedAnnotation={openSavedAnnotation}
        />
      );
    }

    return (
      <Atlas
        controls={controls}
        workbench={workbench}
        lastOutcome={lastOutcome}
        onCreateRepository={createRepository}
        onOpenRepository={openRepository}
        onSelectWorkbenchContext={selectWorkbenchContext}
        onOpenTopicInStudio={openTopicInStudio}
        proposalReview={proposalReview}
        onOpenProposalReview={openProposalReview}
        orientation={atlasOrientation}
        onOpenSourceRecordInPaperDesk={openSourceRecordInPaperDesk}
        onEditLearningRouteTitle={editLearningRouteTitle}
        learning={learning}
        onConfirmLearningProgress={confirmLearningProgress}
        onCorrectLearningProgress={correctLearningProgress}
      />
    );
  })();

  return (
    <div id="workbench-shell">
      {workbench.repositoryStatus === "selected" ? (
        <Discovery
          askContextCandidates={discoveryAskContextCandidates}
          askOutcome={discoveryAskOutcome}
          askPreview={discoveryAskPreview}
          jumpOutcome={discoveryJumpOutcome}
          searchOutcome={discoverySearchOutcome}
          selectedAskContextIds={selectedDiscoveryAskContextIds}
          onConfirmAsk={confirmAsk}
          onJump={jumpDiscovery}
          onOpenSearchResult={jumpDiscovery}
          onPrepareAsk={prepareAsk}
          onToggleAskContextItem={toggleDiscoveryAskContextItem}
          onRemoveAskContextItem={removeAskContextItem}
          onSearch={searchDiscovery}
        />
      ) : null}
      {workspace}
    </div>
  );
};

void window.workbench.openFreshWorkbench().then(async (workbench) => {
  const [
    authoring,
    outcome,
    proposalReview,
    theme,
    atlasOrientation,
    learning,
  ] = await Promise.all([
    window.workbench.readAuthoringDraft(),
    window.workbench.readSynthesisResults(),
    window.workbench.readProposalReview(),
    window.workbench.readTheme(),
    window.workbench.readAtlasOrientation(),
    window.workbench.readLearningProgress(),
  ]);

  root.render(
    <WorkbenchShell
      initialWorkbench={workbench}
      initialAuthoring={authoring}
      initialSavedSynthesisResults={outcome}
      initialProposalReview={proposalReview}
      initialTheme={theme}
      initialAtlasOrientation={atlasOrientation}
      initialLearning={learning}
    />,
  );
});
