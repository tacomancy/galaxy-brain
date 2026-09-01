/** Renderer entry point for the desktop Workbench shell. */
import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState, type JSX } from "react";

import "./styles.css";
import { Atlas } from "./atlas/Atlas";
import { PaperDesk } from "./paper-desk/PaperDesk";
import { ProposalReview } from "./proposal-review/ProposalReview";
import { Studio } from "./studio/Studio";
import {
  WorkspaceSideNavigation,
  WorkspaceSwitcher,
} from "./workspace-switcher/WorkspaceSwitcher";
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

const readInitialSynthesisResults =
  async (): Promise<SynthesisResultListReadOutcome> => {
    try {
      return await window.workbench.readSynthesisResults();
    } catch {
      return {
        outcome: "unavailable",
        detail: "Saved Synthesis results are temporarily unavailable.",
      };
    }
  };

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

type BridgeOperationFailure = {
  operation: string;
  retry: () => Promise<void>;
};

type BridgeOperationOptions = {
  nested?: boolean;
};

const focusWorkbenchHeading = (): void => {
  window.requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>(
      "#atlas-heading, #studio-heading, #paper-desk-heading",
    );
    if (heading === null) return;
    heading.tabIndex = -1;
    heading.focus();
  });
};

// Bridge recovery preserves the last rendered projection and offers only a
// user-invoked retry of the failed operation.
const BridgeOperationRecovery = ({
  failure,
  onRetry,
}: {
  failure: BridgeOperationFailure;
  onRetry: () => Promise<void>;
}): JSX.Element => {
  const [isRetrying, setIsRetrying] = useState(false);
  const retry = async (): Promise<void> => {
    if (isRetrying) {
      return;
    }
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
      focusWorkbenchHeading();
    }
  };

  return (
    <div
      id="bridge-operation-failed"
      role="alert"
      data-workbench-outcome="bridge-operation-failed"
    >
      <p>Galaxy Brain couldn't complete that action. You can retry it.</p>
      <button
        id="retry-bridge-operation"
        type="button"
        disabled={isRetrying}
        onClick={() => void retry()}
      >
        Retry operation
      </button>
      <span className="sr-only">Failed operation: {failure.operation}</span>
    </div>
  );
};

// Startup recovery prevents a rejected bootstrap promise from leaving a blank
// renderer and keeps retry under explicit keyboard-operable user control.
const StartupRecovery = ({
  onRetry,
}: {
  onRetry: () => Promise<void>;
}): JSX.Element => {
  const [isRetrying, setIsRetrying] = useState(false);
  const retry = async (): Promise<void> => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
      focusWorkbenchHeading();
    }
  };

  return (
    <main
      id="workbench-startup-failure"
      role="alert"
      data-workbench-outcome="startup-failed"
      aria-labelledby="workbench-startup-failure-heading"
    >
      <h1 id="workbench-startup-failure-heading">
        Galaxy Brain couldn't start
      </h1>
      <p>
        The Workbench could not finish loading. Check the application state and
        retry loading it.
      </p>
      <button
        id="retry-workbench-bootstrap"
        type="button"
        disabled={isRetrying}
        onClick={() => void retry()}
      >
        Retry loading Workbench
      </button>
    </main>
  );
};

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
  const bridgeOperationDepth = useRef(0);
  const bridgeOperationQueue = useRef(Promise.resolve());
  const bridgeFailureVersion = useRef(0);
  const bridgeRootOperation = useRef<string | undefined>(undefined);
  const [lastOutcome, setLastOutcome] = useState<
    | RepositoryOperationOutcome
    | WorkbenchContextSelectionOutcome
    | WorkspaceTransitionOutcome
    | undefined
  >(initialWorkbench.repositoryResumeFailure);
  const bridgeRetry = useRef<(() => Promise<void>) | undefined>(undefined);
  const [bridgeFailure, setBridgeFailure] = useState<
    BridgeOperationFailure | undefined
  >();
  const runBridgeOperation = async <T,>(
    operation: string,
    action: () => Promise<T>,
    retryOperation?: () => Promise<void>,
    options?: BridgeOperationOptions,
  ): Promise<T | undefined> => {
    const isNestedOperation = options?.nested === true;
    const isRootOperation = !isNestedOperation;
    const execute = async (): Promise<T | undefined> => {
      const failureVersionAtStart = bridgeFailureVersion.current;
      if (isRootOperation) {
        bridgeRootOperation.current = operation;
      }
      const retry =
        retryOperation ??
        (async (): Promise<void> => {
          await runBridgeOperation(operation, action);
        });
      bridgeOperationDepth.current += 1;
      try {
        const result = await action();
        if (
          isRootOperation &&
          bridgeFailureVersion.current === failureVersionAtStart &&
          bridgeRetry.current === undefined
        ) {
          bridgeRetry.current = undefined;
          bridgeRootOperation.current = undefined;
          setBridgeFailure(undefined);
        }
        return result;
      } catch {
        bridgeFailureVersion.current += 1;
        if (isRootOperation) {
          bridgeRetry.current = retry;
        }
        setBridgeFailure({
          operation: bridgeRootOperation.current ?? operation,
          retry,
        });
        return undefined;
      } finally {
        bridgeOperationDepth.current -= 1;
        if (isRootOperation && bridgeOperationDepth.current === 0) {
          bridgeRootOperation.current = undefined;
        }
      }
    };

    if (isNestedOperation) {
      return execute();
    }

    const previousOperation = bridgeOperationQueue.current;
    let release!: () => void;
    bridgeOperationQueue.current = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previousOperation;
    try {
      return await execute();
    } finally {
      release();
    }
  };
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
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
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
    void runBridgeOperation("discovery-context-candidates", async () => {
      const outcome = await window.workbench.discoveryAskContextCandidates();
      setDiscoveryAskContextCandidates(
        outcome.outcome === "available" ? outcome.candidates : [],
      );
      setSelectedDiscoveryAskContextIds([]);
    });
    // Intentional narrow suppression: the bridge runner is recreated with the
    // shell projection and is not a state dependency of this repository read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workbench.repositoryPath]);

  const clearSourceStatus = (): void => {
    setSourceStatus(undefined);
    setRelinkOutcome(undefined);
  };

  const refreshSourceStatus = async (): Promise<void> => {
    await runBridgeOperation("read-source-availability", async () => {
      setSourceStatus(await window.workbench.readSourceAvailability());
    });
  };

  const readSavedSynthesisResults = async (): Promise<boolean> => {
    let didRead = false;
    await runBridgeOperation("read-synthesis-results", async () => {
      const outcome = await window.workbench.readSynthesisResults();
      if (outcome.outcome === "found") {
        setSavedSynthesisResults(outcome.results);
        setSavedSynthesisResultsReadError(undefined);
        didRead = true;
      } else {
        setSavedSynthesisResultsReadError(outcome.detail);
        throw new Error("Saved Synthesis results are unavailable.");
      }
    });
    if (!didRead) {
      setSavedSynthesisResultsReadError(
        "Saved Synthesis results are temporarily unavailable.",
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (
      initialSavedSynthesisResults.outcome === "unavailable" &&
      bridgeRetry.current === undefined
    ) {
      const retry = async (): Promise<void> => {
        await readSavedSynthesisResults();
      };
      bridgeRetry.current = retry;
      bridgeFailureVersion.current += 1;
      setBridgeFailure({ operation: "read-synthesis-results", retry });
    }
    // The retry ref intentionally captures the current operation descriptor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSavedSynthesisResults.outcome]);

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
    let didOpenFreshWorkbench = false;
    await runBridgeOperation("open-fresh-workbench", async () => {
      setWorkbench(await window.workbench.openFreshWorkbench());
      didOpenFreshWorkbench = true;
    });
    if (!didOpenFreshWorkbench) return;
    let didReadAuthoring = false;
    await runBridgeOperation("read-authoring-draft", async () => {
      const authoringOutcome = await window.workbench.readAuthoringDraft();
      setAuthoring(authoringOutcome);
      setIsAuthoringOpen(authoringOutcome.outcome === "available");
      didReadAuthoring = true;
    });
    if (!didReadAuthoring) return;
    const didReadSynthesisResults = await readSavedSynthesisResults();
    if (!didReadSynthesisResults) return;
    let didReadProposalReview = false;
    await runBridgeOperation("read-proposal-review", async () => {
      setProposalReview(await window.workbench.readProposalReview());
      didReadProposalReview = true;
    });
    if (!didReadProposalReview) return;
    let didReadAtlasOrientation = false;
    await runBridgeOperation("read-atlas-orientation", async () => {
      setAtlasOrientation(await window.workbench.readAtlasOrientation());
      didReadAtlasOrientation = true;
    });
    if (!didReadAtlasOrientation) return;
    let didReadLearning = false;
    await runBridgeOperation("read-learning-progress", async () => {
      setLearning(await window.workbench.readLearningProgress());
      didReadLearning = true;
    });
    if (!didReadLearning) return;
  };

  const openAuthoringDraft = async (): Promise<void> => {
    await runBridgeOperation("open-authoring-draft", async () => {
      const outcome = await window.workbench.openAuthoringDraft();
      setAuthoring(outcome);
      setIsAuthoringOpen(outcome.outcome === "available");
    });
  };

  const openAuthoringConstruct = async (
    construct: AuthoringConstruct,
  ): Promise<void> => {
    await runBridgeOperation("open-authoring-construct", async () => {
      const outcome = await window.workbench.openAuthoringConstruct(construct);
      setAuthoring(outcome);
      setIsAuthoringOpen(outcome.outcome === "available");
    });
  };

  const editAuthoringSemanticText = async (nextText: string): Promise<void> => {
    await runBridgeOperation("edit-authoring-semantic-text", async () => {
      setAuthoring(
        authoringReadFromOperation(
          await window.workbench.editAuthoringSemanticText(nextText),
        ),
      );
    });
  };

  const undoAuthoringSemanticText = async (): Promise<void> => {
    await runBridgeOperation("undo-authoring-semantic-text", async () => {
      setAuthoring(
        authoringReadFromOperation(
          await window.workbench.undoAuthoringSemanticText(),
        ),
      );
    });
  };

  const changeTheme = async (nextTheme: WorkbenchTheme): Promise<void> => {
    await runBridgeOperation("set-theme", async () => {
      const outcome = await window.workbench.setTheme(nextTheme);
      if (outcome.outcome === "updated") setTheme(outcome.theme);
    });
  };

  const setAuthoringMode = async (mode: AuthoringMode): Promise<void> => {
    await runBridgeOperation("set-authoring-mode", async () => {
      setAuthoring(
        authoringReadFromOperation(
          await window.workbench.setAuthoringMode(mode),
        ),
      );
    });
  };

  const searchDiscovery = async (query: string): Promise<void> => {
    setDiscoveryAskPreview(undefined);
    setDiscoveryAskOutcome(undefined);
    setDiscoveryJumpOutcome(undefined);
    await runBridgeOperation("discovery-search", async () => {
      setDiscoverySearchOutcome(await window.workbench.discoverySearch(query));
    });
  };

  const prepareAsk = async (prompt: string): Promise<void> => {
    setDiscoverySearchOutcome(undefined);
    setDiscoveryAskOutcome(undefined);
    setDiscoveryJumpOutcome(undefined);
    await runBridgeOperation("prepare-ask", async () => {
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
    });
  };

  const toggleDiscoveryAskContextItem = (itemId: string): void => {
    setSelectedDiscoveryAskContextIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
  };

  const removeAskContextItem = async (itemId: string): Promise<void> => {
    await runBridgeOperation("remove-ask-context-item", async () => {
      const outcome = await window.workbench.removeAskContextItem(itemId);
      if (outcome.outcome === "preview-ready") {
        setDiscoveryAskPreview(outcome.preview);
        return;
      }
      setDiscoveryAskPreview(undefined);
      setDiscoveryAskOutcome(outcome);
    });
  };

  const closeDiscovery = (): void => {
    setIsDiscoveryOpen(false);
    setDiscoverySearchOutcome(undefined);
    setDiscoveryAskPreview(undefined);
    setDiscoveryAskOutcome(undefined);
    setDiscoveryJumpOutcome(undefined);
    setSelectedDiscoveryAskContextIds([]);
  };

  const confirmAsk = async (
    confirmation: "confirmed" | "declined" | "canceled",
  ): Promise<void> => {
    await runBridgeOperation("confirm-ask", async () => {
      setDiscoveryAskOutcome(await window.workbench.confirmAsk(confirmation));
      setDiscoveryAskPreview(undefined);
    });
  };

  const jumpDiscovery = async (command: string): Promise<void> => {
    setDiscoverySearchOutcome(undefined);
    setDiscoveryAskPreview(undefined);
    setDiscoveryAskOutcome(undefined);
    await runBridgeOperation("discovery-jump", async () => {
      const outcome = await window.workbench.discoveryJump(command);
      setDiscoveryJumpOutcome(outcome);
      if (outcome.outcome !== "resolved") return;
      const target = outcome.target;

      const transitionDiscoveryTarget = async (): Promise<void> => {
        const nested = bridgeRootOperation.current !== undefined;
        const runDiscoveryTransition = (
          action: () => Promise<WorkspaceTransitionOutcome>,
        ): Promise<WorkspaceTransitionOutcome | undefined> =>
          runBridgeOperation(
            "discovery-jump-transition",
            action,
            transitionDiscoveryTarget,
            { nested },
          );
        let transition: WorkspaceTransitionOutcome | undefined;
        if (target.kind === "workspace") {
          transition = await runDiscoveryTransition(() =>
            window.workbench.switchWorkspace(target.workspace),
          );
        } else if (target.kind === "topic") {
          transition = await runDiscoveryTransition(() =>
            window.workbench.openTopicInStudio(target.id),
          );
        } else if (target.kind === "source-record") {
          transition = await runDiscoveryTransition(() =>
            window.workbench.openSourceRecordInPaperDesk(target.id),
          );
        } else if (
          target.kind === "structured-annotation" &&
          target.sourceRecordId !== undefined
        ) {
          const sourceRecordId = target.sourceRecordId;
          transition = await runDiscoveryTransition(() =>
            window.workbench.openSourceRecordInPaperDesk(sourceRecordId),
          );
        } else if (
          target.kind === "saved-synthesis-result" &&
          target.targetTopicId !== undefined
        ) {
          const targetTopicId = target.targetTopicId;
          transition = await runDiscoveryTransition(() =>
            window.workbench.openTopicInStudio(targetTopicId),
          );
        } else {
          transition = await runDiscoveryTransition(() =>
            window.workbench.switchWorkspace("studio"),
          );
        }

        if (transition === undefined) {
          closeDiscovery();
          return;
        }

        applyWorkspaceTransition(transition);
        if (transition.outcome === "transitioned") {
          closeDiscovery();
        }
      };

      await transitionDiscoveryTarget();
    });
  };

  const closeAuthoringDraft = (): void => {
    setIsAuthoringOpen(false);
  };

  const createRepository = async (): Promise<void> => {
    const outcome = await runBridgeOperation(
      "create-repository",
      async () => window.workbench.createRepository(),
      createRepository,
    );
    if (outcome === undefined) return;
    setLastOutcome(outcome);
    if (
      outcome.outcome === "created" ||
      outcome.outcome === "opened" ||
      outcome.outcome === "read-only-compatible"
    ) {
      setSynthesisPreview(undefined);
      setSynthesisOutcome(undefined);
      setDiscoveryAskPreview(undefined);
      setDiscoveryAskOutcome(undefined);
    }
    await refreshWorkbench();
  };

  const openRepository = async (): Promise<void> => {
    const outcome = await runBridgeOperation(
      "open-repository",
      async () => window.workbench.openRepository(),
      openRepository,
    );
    if (outcome === undefined) return;
    setLastOutcome(outcome);
    if (
      outcome.outcome === "created" ||
      outcome.outcome === "opened" ||
      outcome.outcome === "read-only-compatible"
    ) {
      setSynthesisPreview(undefined);
      setSynthesisOutcome(undefined);
      setDiscoveryAskPreview(undefined);
      setDiscoveryAskOutcome(undefined);
    }
    await refreshWorkbench();
  };

  const selectWorkbenchContext = async (
    selection: WorkbenchContextSelection,
  ): Promise<void> => {
    await runBridgeOperation("select-workbench-context", async () => {
      const outcome = await window.workbench.selectWorkbenchContext(selection);
      if (outcome.outcome === "selected") {
        setLastOutcome(undefined);
        clearSourceStatus();
        setWorkbench(outcome.workbench);
        shouldFocusSelectedContextAction.current = true;
        return;
      }
      setLastOutcome(outcome);
    });
  };

  const openTopicInStudio = async (topicId: string): Promise<void> => {
    await runBridgeOperation("open-topic-in-studio", async () => {
      applyWorkspaceTransition(
        await window.workbench.openTopicInStudio(topicId),
      );
    });
  };

  const editLearningRouteTitle = async (
    routeId: string,
    title: string,
  ): Promise<AtlasLearningRouteEditOutcome> => {
    let outcome: AtlasLearningRouteEditOutcome = {
      outcome: "operation-failed",
      detail: "The Workbench could not save the Learning Route title.",
    };
    await runBridgeOperation("edit-learning-route-title", async () => {
      outcome = await window.workbench.editLearningRouteTitle(routeId, title);
      if (outcome.outcome === "updated") {
        setAtlasOrientation({
          outcome: "available",
          overview: outcome.overview,
        });
      }
    });
    return outcome;
  };

  const confirmLearningProgress = async (
    suggestionId: string,
  ): Promise<LearningOperationOutcome> => {
    let outcome: LearningOperationOutcome = {
      outcome: "operation-failed",
      detail: "The Workbench could not confirm Learning progress.",
    };
    await runBridgeOperation("confirm-learning-progress", async () => {
      outcome = await window.workbench.confirmLearningProgress(suggestionId);
      if (outcome.outcome === "updated") {
        setLearning({ outcome: "available", progress: outcome.progress });
      }
    });
    return outcome;
  };

  const correctLearningProgress = async (
    suggestionId: string,
    correction: string,
  ): Promise<LearningOperationOutcome> => {
    let outcome: LearningOperationOutcome = {
      outcome: "operation-failed",
      detail: "The Workbench could not save the Learning progress correction.",
    };
    await runBridgeOperation("correct-learning-progress", async () => {
      outcome = await window.workbench.correctLearningProgress(
        suggestionId,
        correction,
      );
      if (outcome.outcome === "updated") {
        setLearning({ outcome: "available", progress: outcome.progress });
      }
    });
    return outcome;
  };

  const openProposalReview = async (): Promise<void> => {
    await runBridgeOperation("open-proposal-review", async () => {
      const outcome = await window.workbench.openProposalReview();
      setProposalReview(outcome);
      setProposalReviewApplyOutcome(undefined);
      if (outcome.outcome === "available" || outcome.outcome === "applied") {
        setIsProposalReviewOpen(true);
      }
    });
  };

  const acceptProposalReview = async (): Promise<void> => {
    await runBridgeOperation("accept-proposal-review", async () => {
      const outcome = await window.workbench.acceptProposalReview();
      setProposalReviewApplyOutcome(outcome);
      if (outcome.outcome === "applied") setProposalReview(outcome);
    });
  };

  const closeProposalReview = (): void => {
    setIsProposalReviewOpen(false);
    setProposalReviewApplyOutcome(undefined);
  };

  const openSourceRecordInPaperDesk = async (
    sourceRecordId: string,
  ): Promise<void> => {
    const outcome = await runBridgeOperation(
      "open-source-record-in-paper-desk",
      () => window.workbench.openSourceRecordInPaperDesk(sourceRecordId),
      async () => openSourceRecordInPaperDesk(sourceRecordId),
    );
    if (outcome === undefined) return;
    applyWorkspaceTransition(outcome);
    if (outcome.outcome === "transitioned" && outcome.workbench.context) {
      await refreshSourceStatus();
    }
  };

  const switchWorkspace = async (
    workspace: WorkbenchWorkspace,
  ): Promise<void> => {
    const outcome = await runBridgeOperation(
      "switch-workspace",
      () => window.workbench.switchWorkspace(workspace),
      async () => switchWorkspace(workspace),
    );
    if (outcome === undefined) return;
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
    await runBridgeOperation("open-saved-annotation", async () => {
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
    });
  };

  const relinkSource = async (): Promise<void> => {
    await runBridgeOperation("relink-source", async () => {
      const outcome = await window.workbench.relinkSource();
      if (outcome.outcome !== "canceled") {
        setRelinkOutcome(outcome.outcome === "relinked" ? undefined : outcome);
        if (outcome.outcome === "relinked") {
          setSourceStatus(outcome);
        }
      }
    });
  };

  const prepareSynthesis = async (
    includeAllContext: boolean,
  ): Promise<void> => {
    // Do not leave an old confirmation surface actionable while the main
    // process prepares the next preview. Otherwise a quick follow-up click
    // can race the previous IPC request and apply its outcome out of order.
    setSynthesisPreview(undefined);
    setSynthesisOutcome(undefined);

    await runBridgeOperation("prepare-synthesis", async () => {
      const outcome =
        await window.workbench.prepareSynthesis(includeAllContext);
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
    });
  };

  const confirmSynthesis = async (
    confirmation: "confirmed" | "declined" | "canceled",
  ): Promise<void> => {
    await runBridgeOperation("confirm-synthesis", async () => {
      setSynthesisOutcome(
        await window.workbench.confirmSynthesis(confirmation),
      );
    });
  };

  const removeSynthesisContextItem = async (
    annotationId: string,
  ): Promise<void> => {
    await runBridgeOperation("remove-synthesis-context-item", async () => {
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
    });
  };

  const restoreSynthesisResult = async (
    resultId: string,
    version: number,
  ): Promise<void> => {
    const outcome = await runBridgeOperation(
      "restore-synthesis-result",
      () => window.workbench.restoreSynthesisResult(resultId, version),
      async () => restoreSynthesisResult(resultId, version),
    );
    if (outcome === undefined) return;
    setRestoreOutcome(outcome);
    if (outcome.outcome === "restored") {
      await readSavedSynthesisResults();
    }
  };

  const controls = (
    <div id="workbench-controls">
      {workbench.repositoryStatus === "selected" ? (
        <>
          <WorkspaceSwitcher
            activeWorkspace={workbench.activeWorkspace}
            hasContext={workbench.context !== undefined}
            onSwitchWorkspace={switchWorkspace}
          />
          <button
            id="discovery-trigger"
            className="button button-secondary"
            type="button"
            aria-label="Open Discovery"
            onClick={() => setIsDiscoveryOpen(true)}
          >
            Discovery
          </button>
        </>
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
      {bridgeFailure !== undefined ? (
        <BridgeOperationRecovery
          failure={bridgeFailure}
          onRetry={async () => {
            bridgeRetry.current = undefined;
            await bridgeFailure.retry();
          }}
        />
      ) : null}
      {workbench.repositoryStatus === "selected" ? (
        <Discovery
          isOpen={isDiscoveryOpen}
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
          onClose={closeDiscovery}
        />
      ) : null}
      <div
        id="workbench-layout"
        className={
          workbench.repositoryStatus === "selected"
            ? "has-side-navigation"
            : undefined
        }
      >
        {workbench.repositoryStatus === "selected" ? (
          <aside
            className="workbench-side-navigation-shell"
            aria-label="Workbench navigation"
          >
            <p className="side-navigation-brand">Galaxy Brain</p>
            <span className="side-navigation-kicker">Workspaces</span>
            <WorkspaceSideNavigation
              activeWorkspace={workbench.activeWorkspace}
              hasContext={workbench.context !== undefined}
              onSwitchWorkspace={switchWorkspace}
            />
          </aside>
        ) : null}
        <div id="workbench-main">{workspace}</div>
      </div>
    </div>
  );
};

let isBootstrapping = false;

const bootstrapWorkbench = async (): Promise<void> => {
  if (isBootstrapping) return;
  isBootstrapping = true;

  try {
    const workbench = await window.workbench.openFreshWorkbench();
    const [
      authoring,
      outcome,
      proposalReview,
      theme,
      atlasOrientation,
      learning,
    ] = await Promise.all([
      window.workbench.readAuthoringDraft(),
      readInitialSynthesisResults(),
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
  } catch {
    root.render(<StartupRecovery onRetry={bootstrapWorkbench} />);
  } finally {
    isBootstrapping = false;
  }
};

void bootstrapWorkbench();
