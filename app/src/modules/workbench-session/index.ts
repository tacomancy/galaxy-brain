import type {
  StructuredAnnotation,
  WorkingMaterialReadOutcome,
} from "../source-processing";

/** Workspace names exposed by the V1 Workbench shell. */
export type WorkbenchWorkspace = "atlas" | "studio" | "paper-desk";

/** Stable, visible identity used when a topic is carried between workspaces. */
export interface WorkbenchTopic {
  id: string;
  title: string;
}

/** Stable, visible identity used when a Source Record is carried between workspaces. */
export interface WorkbenchSourceRecord {
  id: string;
  title: string;
}

/** Machine-local position within the currently resumed Source Record. */
export interface ReadingPosition {
  sourceRecordId: string;
  page: number;
  characterOffset: number;
}

/**
 * The bounded context carried between the V1 workspaces. A context is complete
 * only when it contains one topic and its associated Source Record.
 */
export interface WorkbenchContext {
  topic: WorkbenchTopic;
  sourceRecord: WorkbenchSourceRecord;
}

/** Stable identity used to persist one explicitly selected context. */
export interface WorkbenchContextSelection {
  topicId: string;
  sourceRecordId: string;
}

/**
 * Caller-visible state rendered by the desktop Workbench shell. A selected
 * state always has a canonical repository path and access mode; contextual
 * state is omitted when the selected repository has no complete context.
 */
export interface WorkbenchState {
  activeWorkspace: WorkbenchWorkspace;
  repositoryStatus: "not-selected" | "selected";
  repositoryPath?: string;
  repositoryAccess?: "read-write" | "read-only";
  repositorySelection?: "created" | "opened" | "read-only-compatible";
  context?: WorkbenchContext;
  /** Complete topic contexts shown when the repository needs an explicit choice. */
  contextOptions?: WorkbenchContext[];
  /** The saved source claim shown when Paper Desk resumes meaningful work. */
  sourceAnnotation?: StructuredAnnotation;
  /** The machine-local reading position for the selected Source Record. */
  readingPosition?: ReadingPosition;
  /** The remembered root could not be validated; recovery stays unselected. */
  repositoryResumeFailure?: RepositoryResumeFailure;
}

/** Launch state begins in Atlas unless meaningful Paper Desk work resumes. */
export type FreshWorkbench = WorkbenchState;

/**
 * Caller-visible outcomes for repository selection. Failure outcomes preserve
 * the current selection; successful outcomes identify the canonical root.
 */
export type RepositoryOperationOutcome =
  | { outcome: "canceled" }
  | { outcome: "created"; repositoryPath: string }
  | { outcome: "opened"; repositoryPath: string }
  | { outcome: "read-only-compatible"; repositoryPath: string }
  | { outcome: "invalid-format"; detail: string }
  | { outcome: "unsafe-target"; detail: string }
  | { outcome: "target-unavailable"; detail: string }
  | { outcome: "unsupported-format"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/** Outcomes that leave the Workbench unselected and require recovery choices. */
export type RepositoryResumeFailure = Extract<
  RepositoryOperationOutcome,
  {
    outcome:
      | "invalid-format"
      | "unsafe-target"
      | "target-unavailable"
      | "unsupported-format"
      | "operation-failed";
  }
>;

/**
 * Result of reading optional contextual metadata. `cause` is retained only in
 * the main-process Module for diagnostics and is never sent to the renderer.
 */
export type WorkbenchContextReadOutcome =
  | { outcome: "available"; context: WorkbenchContext }
  | { outcome: "ambiguous"; contexts: WorkbenchContext[] }
  | { outcome: "not-found"; detail: string }
  | { outcome: "unavailable"; detail: string; cause: unknown };

/**
 * Caller-visible result of a contextual workspace transition. A failed
 * transition leaves the current workspace and context unchanged.
 */
export type WorkspaceTransitionOutcome =
  | { outcome: "transitioned"; workbench: WorkbenchState }
  | { outcome: "context-unavailable"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/** Caller-visible result of choosing one ambiguous Workbench context. */
export type WorkbenchContextSelectionOutcome =
  | { outcome: "selected"; workbench: WorkbenchState }
  | { outcome: "context-unavailable"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/** Caller-visible result of moving Paper Desk to its saved annotation. */
export type ReadingPositionOutcome =
  | { outcome: "position-restored"; workbench: WorkbenchState }
  | { outcome: "context-unavailable"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/**
 * The Knowledge Repository behavior required by the current Workbench
 * Session. The Adapter owns filesystem details; the Module owns selection
 * state and caller-facing outcomes. Selection methods return discriminated
 * outcomes rather than throwing expected validation or availability failures.
 */
export interface KnowledgeRepository {
  /** Creates a repository only at a new or explicitly empty target. */
  createAt(repositoryPath: string): Promise<RepositoryOperationOutcome>;
  /** Validates and opens an existing repository without changing its files. */
  openAt(repositoryPath: string): Promise<RepositoryOperationOutcome>;
  /** Reads the optional complete topic-to-Source-Record context for a root. */
  readWorkbenchContext(
    repositoryPath: string,
  ): Promise<WorkbenchContextReadOutcome>;
  /** Reads the saved source annotation associated with a Source Record. */
  readWorkbenchAnnotation(
    repositoryPath: string,
    sourceRecordId: string,
  ): Promise<WorkingMaterialReadOutcome>;
}

/**
 * Machine-local convenience state for exact-root resume and active work.
 * Implementations must not store this state in the portable repository.
 */
export interface WorkbenchSessionSnapshot {
  selectedRepositoryPath: string;
  activeWorkspace?: WorkbenchWorkspace;
  selectedContext?: WorkbenchContextSelection;
  readingPosition?: ReadingPosition;
}

/** Machine-local persistence Interface for resumable Workbench state. */
export interface WorkbenchSessionState {
  /** Missing, malformed, or unreadable state is treated as first launch. */
  readSession(): Promise<WorkbenchSessionSnapshot | undefined>;
  /** Rejecting this write leaves the current caller-visible state unchanged. */
  writeSession(snapshot: WorkbenchSessionSnapshot): Promise<void>;
}

/**
 * Opens and describes the current Workbench session and creates a repository
 * for its callers. Implementations hide repository selection and session
 * state decisions from the renderer.
 */
export interface WorkbenchSession {
  /** Validates the remembered root once, then returns launch or resume state. */
  openFreshWorkbench(): Promise<FreshWorkbench>;
  /** A session-state write failure returns operation-failed and preserves selection. */
  createRepository(repositoryPath: string): Promise<RepositoryOperationOutcome>;
  /** A session-state write failure returns operation-failed and preserves selection. */
  openRepository(repositoryPath: string): Promise<RepositoryOperationOutcome>;
  /** Selects one complete context when repository inspection found ambiguity. */
  selectWorkbenchContext(
    selection: WorkbenchContextSelection,
  ): Promise<WorkbenchContextSelectionOutcome>;
  /** Carries a known topic into Studio and persists active-work state. */
  openTopicInStudio(topicId: string): Promise<WorkspaceTransitionOutcome>;
  /** Carries the selected Source Record and its topic into Paper Desk. */
  openSourceRecordInPaperDesk(
    sourceRecordId: string,
  ): Promise<WorkspaceTransitionOutcome>;
  /** Changes the visible workspace while retaining the selected context. */
  switchWorkspace(
    workspace: WorkbenchWorkspace,
  ): Promise<WorkspaceTransitionOutcome>;
  /** Moves Paper Desk to the saved annotation and persists its position. */
  openSavedAnnotation(): Promise<ReadingPositionOutcome>;
}

/**
 * Composes repository and machine-local session Adapters behind the
 * Workbench Session Interface. It keeps repository context in memory and
 * persists only exact-root resume and machine-local active-work convenience
 * state.
 * @param knowledgeRepository The selected repository Adapter.
 * @param sessionState The machine-local session-state Adapter.
 * @returns The Workbench Session Module Interface.
 */
export const createWorkbenchSession = (
  knowledgeRepository: KnowledgeRepository,
  sessionState: WorkbenchSessionState,
): WorkbenchSession => {
  let selectedRepository:
    | {
        path: string;
        access: "read-write" | "read-only";
        selection: "created" | "opened" | "read-only-compatible";
        context?: WorkbenchContext;
        contextOptions?: WorkbenchContext[];
        contextReadFailure?: Extract<
          WorkbenchContextReadOutcome,
          { outcome: "unavailable" }
        >;
        sourceAnnotation?: StructuredAnnotation;
      }
    | undefined;

  let hasRestoredSession = false;
  let repositoryResumeFailure: RepositoryResumeFailure | undefined;
  let activeWorkspace: WorkbenchWorkspace = "atlas";
  let readingPosition: ReadingPosition | undefined;
  type SelectedRepository = NonNullable<typeof selectedRepository>;

  const selectedContextFor = (
    repository: SelectedRepository,
  ): WorkbenchContextSelection | undefined =>
    repository.context === undefined
      ? undefined
      : {
          topicId: repository.context.topic.id,
          sourceRecordId: repository.context.sourceRecord.id,
        };

  const readWorkbenchContext = async (
    repositoryPath: string,
  ): Promise<WorkbenchContextReadOutcome> => {
    try {
      return await knowledgeRepository.readWorkbenchContext(repositoryPath);
    } catch (cause: unknown) {
      return {
        outcome: "unavailable",
        detail: "The selected repository context could not be read.",
        cause,
      };
    }
  };

  const restoreRememberedContext = (
    contextReadOutcome: WorkbenchContextReadOutcome,
    selection: WorkbenchContextSelection | undefined,
  ): WorkbenchContextReadOutcome => {
    if (selection === undefined) {
      return contextReadOutcome;
    }

    const contexts =
      contextReadOutcome.outcome === "available"
        ? [contextReadOutcome.context]
        : contextReadOutcome.outcome === "ambiguous"
          ? contextReadOutcome.contexts
          : undefined;

    if (contexts === undefined) {
      return contextReadOutcome;
    }

    const context = contexts.find(
      (candidate) =>
        candidate.topic.id === selection.topicId &&
        candidate.sourceRecord.id === selection.sourceRecordId,
    );

    if (context !== undefined) {
      return { outcome: "available", context };
    }

    return { outcome: "ambiguous", contexts };
  };

  const setSelectedRepository = (
    outcome: Extract<
      RepositoryOperationOutcome,
      { outcome: "created" | "opened" | "read-only-compatible" }
    >,
    contextReadOutcome: WorkbenchContextReadOutcome,
  ): void => {
    selectedRepository = {
      path: outcome.repositoryPath,
      access:
        outcome.outcome === "read-only-compatible" ? "read-only" : "read-write",
      selection: outcome.outcome,
      ...(contextReadOutcome.outcome === "available"
        ? { context: contextReadOutcome.context }
        : {}),
      ...(contextReadOutcome.outcome === "ambiguous"
        ? { contextOptions: contextReadOutcome.contexts }
        : {}),
      ...(contextReadOutcome.outcome === "unavailable"
        ? { contextReadFailure: contextReadOutcome }
        : {}),
    };
  };

  const restoreRememberedWorkspace = (
    workspace: WorkbenchWorkspace | undefined,
    contextReadOutcome: WorkbenchContextReadOutcome,
  ): void => {
    if (workspace === "atlas") {
      activeWorkspace = workspace;
      return;
    }

    if (
      (workspace === "studio" || workspace === "paper-desk") &&
      contextReadOutcome.outcome === "available"
    ) {
      activeWorkspace = workspace;
    }
  };

  const restoreRememberedPosition = (
    position: ReadingPosition | undefined,
    contextReadOutcome: WorkbenchContextReadOutcome,
  ): void => {
    if (
      position !== undefined &&
      contextReadOutcome.outcome === "available" &&
      position.sourceRecordId === contextReadOutcome.context.sourceRecord.id
    ) {
      readingPosition = position;
    }
  };

  const restoreRememberedAnnotation = async (
    repositoryPath: string,
    contextReadOutcome: WorkbenchContextReadOutcome,
  ): Promise<void> => {
    if (
      (activeWorkspace !== "studio" && activeWorkspace !== "paper-desk") ||
      contextReadOutcome.outcome !== "available" ||
      selectedRepository === undefined
    ) {
      return;
    }

    const annotationOutcome = await knowledgeRepository.readWorkbenchAnnotation(
      repositoryPath,
      contextReadOutcome.context.sourceRecord.id,
    );

    if (annotationOutcome.outcome === "found") {
      selectedRepository.sourceAnnotation = annotationOutcome.annotation;
      return;
    }

    activeWorkspace = "atlas";
    readingPosition = undefined;
  };

  const isContextualWorkspace = (workspace: WorkbenchWorkspace): boolean =>
    workspace === "studio" || workspace === "paper-desk";

  const ensureSourceAnnotation = async (
    repository: SelectedRepository,
    workspace: WorkbenchWorkspace,
  ): Promise<void> => {
    if (
      !isContextualWorkspace(workspace) ||
      repository.context === undefined ||
      repository.sourceAnnotation !== undefined
    ) {
      return;
    }

    const annotationOutcome = await knowledgeRepository.readWorkbenchAnnotation(
      repository.path,
      repository.context.sourceRecord.id,
    );

    if (annotationOutcome.outcome === "found") {
      repository.sourceAnnotation = annotationOutcome.annotation;
    }
  };

  const restoreSelectedRepository = async (): Promise<void> => {
    if (hasRestoredSession) {
      return;
    }

    hasRestoredSession = true;
    const rememberedSession = await sessionState.readSession();
    const rememberedPath = rememberedSession?.selectedRepositoryPath;

    if (rememberedPath === undefined) {
      return;
    }

    const outcome = await knowledgeRepository.openAt(rememberedPath);

    if (
      outcome.outcome === "opened" ||
      outcome.outcome === "read-only-compatible"
    ) {
      const contextReadOutcome = restoreRememberedContext(
        await readWorkbenchContext(outcome.repositoryPath),
        rememberedSession?.selectedContext,
      );
      setSelectedRepository(outcome, contextReadOutcome);
      restoreRememberedWorkspace(
        rememberedSession?.activeWorkspace,
        contextReadOutcome,
      );
      restoreRememberedPosition(
        rememberedSession?.readingPosition,
        contextReadOutcome,
      );
      await restoreRememberedAnnotation(
        outcome.repositoryPath,
        contextReadOutcome,
      );
      return;
    }

    if (
      outcome.outcome === "invalid-format" ||
      outcome.outcome === "unsafe-target" ||
      outcome.outcome === "target-unavailable" ||
      outcome.outcome === "unsupported-format" ||
      outcome.outcome === "operation-failed"
    ) {
      repositoryResumeFailure = outcome;
    }
  };

  const selectRepository = async (
    outcome: Extract<
      RepositoryOperationOutcome,
      { outcome: "created" | "opened" | "read-only-compatible" }
    >,
  ): Promise<RepositoryOperationOutcome> => {
    try {
      await sessionState.writeSession({
        selectedRepositoryPath: outcome.repositoryPath,
        activeWorkspace: "atlas",
      });
    } catch {
      return {
        outcome: "operation-failed",
        detail: "The Workbench session could not be saved.",
      };
    }

    const contextReadOutcome = await readWorkbenchContext(
      outcome.repositoryPath,
    );
    setSelectedRepository(outcome, contextReadOutcome);
    activeWorkspace = "atlas";
    readingPosition = undefined;
    repositoryResumeFailure = undefined;

    return outcome;
  };

  const transitionToWorkspace = async (
    workspace: WorkbenchWorkspace,
  ): Promise<WorkspaceTransitionOutcome> => {
    const repository = selectedRepository;

    if (repository === undefined) {
      return {
        outcome: "context-unavailable",
        detail: "A Knowledge Repository must be selected first.",
      };
    }

    const workbench: WorkbenchState = {
      activeWorkspace: workspace,
      repositoryStatus: "selected",
      repositoryPath: repository.path,
      repositoryAccess: repository.access,
      repositorySelection: repository.selection,
    };

    if (repository.context !== undefined) {
      workbench.context = repository.context;
    }

    await ensureSourceAnnotation(repository, workspace);

    if (
      isContextualWorkspace(workspace) &&
      repository.sourceAnnotation !== undefined
    ) {
      workbench.sourceAnnotation = repository.sourceAnnotation;
    }

    if (
      readingPosition !== undefined &&
      readingPosition.sourceRecordId === repository.context?.sourceRecord.id
    ) {
      workbench.readingPosition = readingPosition;
    }

    if (workspace !== "atlas" && workbench.context === undefined) {
      return {
        outcome: "context-unavailable",
        detail:
          repository.contextReadFailure?.detail ??
          "The selected workspace context is not available.",
      };
    }

    const selectedContext = selectedContextFor(repository);

    try {
      await sessionState.writeSession({
        selectedRepositoryPath: repository.path,
        activeWorkspace: workspace,
        ...(selectedContext === undefined ? {} : { selectedContext }),
        ...(readingPosition === undefined ? {} : { readingPosition }),
      });
    } catch {
      return {
        outcome: "operation-failed",
        detail: "The Workbench session could not be saved.",
      };
    }

    activeWorkspace = workspace;

    return { outcome: "transitioned", workbench };
  };

  // Keep the Module framework-independent so the same Interface can be used
  // by Electron and deterministic behavior tests.
  return {
    openFreshWorkbench: async (): Promise<FreshWorkbench> => {
      await restoreSelectedRepository();

      const workbench: FreshWorkbench = {
        // A new session begins in Atlas unless meaningful work was restored.
        activeWorkspace,
        repositoryStatus:
          selectedRepository === undefined ? "not-selected" : "selected",
      };

      if (selectedRepository !== undefined) {
        workbench.repositoryPath = selectedRepository.path;
        workbench.repositoryAccess = selectedRepository.access;
        workbench.repositorySelection = selectedRepository.selection;

        if (selectedRepository.context !== undefined) {
          workbench.context = selectedRepository.context;
        }

        if (selectedRepository.contextOptions !== undefined) {
          workbench.contextOptions = selectedRepository.contextOptions;
        }

        if (selectedRepository.sourceAnnotation !== undefined) {
          workbench.sourceAnnotation = selectedRepository.sourceAnnotation;
        }

        if (
          readingPosition !== undefined &&
          readingPosition.sourceRecordId ===
            selectedRepository.context?.sourceRecord.id
        ) {
          workbench.readingPosition = readingPosition;
        }
      }

      if (repositoryResumeFailure !== undefined) {
        workbench.repositoryResumeFailure = repositoryResumeFailure;
      }

      return workbench;
    },
    createRepository: async (repositoryPath) => {
      const outcome = await knowledgeRepository.createAt(repositoryPath);

      if (outcome.outcome === "created") {
        return selectRepository(outcome);
      }

      return outcome;
    },
    openRepository: async (repositoryPath) => {
      const outcome = await knowledgeRepository.openAt(repositoryPath);

      if (
        outcome.outcome === "opened" ||
        outcome.outcome === "read-only-compatible"
      ) {
        return selectRepository(outcome);
      }

      return outcome;
    },
    selectWorkbenchContext: async (
      selection,
    ): Promise<WorkbenchContextSelectionOutcome> => {
      const repository = selectedRepository;
      const context = repository?.contextOptions?.find(
        (candidate) =>
          candidate.topic.id === selection.topicId &&
          candidate.sourceRecord.id === selection.sourceRecordId,
      );

      if (repository === undefined || context === undefined) {
        return {
          outcome: "context-unavailable",
          detail: "The selected Workbench context is not available.",
        };
      }

      try {
        await sessionState.writeSession({
          selectedRepositoryPath: repository.path,
          activeWorkspace: "atlas",
          selectedContext: selection,
        });
      } catch {
        return {
          outcome: "operation-failed",
          detail: "The Workbench session could not be saved.",
        };
      }

      delete repository.contextOptions;
      repository.context = context;
      activeWorkspace = "atlas";
      readingPosition = undefined;

      return {
        outcome: "selected",
        workbench: {
          activeWorkspace,
          repositoryStatus: "selected",
          repositoryPath: repository.path,
          repositoryAccess: repository.access,
          repositorySelection: repository.selection,
          context,
        },
      };
    },
    openTopicInStudio: async (topicId): Promise<WorkspaceTransitionOutcome> => {
      const repository = selectedRepository;

      if (
        repository === undefined ||
        repository.context === undefined ||
        repository.context.topic.id !== topicId
      ) {
        return {
          outcome: "context-unavailable",
          detail: "The selected topic is not available in this Workbench.",
        };
      }

      return transitionToWorkspace("studio");
    },
    openSourceRecordInPaperDesk: async (
      sourceRecordId,
    ): Promise<WorkspaceTransitionOutcome> => {
      const repository = selectedRepository;

      if (
        repository === undefined ||
        repository.context === undefined ||
        repository.context.sourceRecord.id !== sourceRecordId
      ) {
        return {
          outcome: "context-unavailable",
          detail:
            "The selected Source Record is not available in this Workbench.",
        };
      }

      return transitionToWorkspace("paper-desk");
    },
    switchWorkspace: (workspace) => transitionToWorkspace(workspace),
    openSavedAnnotation: async (): Promise<ReadingPositionOutcome> => {
      const repository = selectedRepository;

      if (
        repository === undefined ||
        repository.context === undefined ||
        repository.sourceAnnotation === undefined
      ) {
        return {
          outcome: "context-unavailable",
          detail: "The saved source annotation is not available.",
        };
      }

      const nextReadingPosition: ReadingPosition = {
        sourceRecordId: repository.sourceAnnotation.sourceRecord.id,
        page: repository.sourceAnnotation.sourceLocator.page,
        characterOffset: repository.sourceAnnotation.sourceLocator.start,
      };

      const selectedContext = selectedContextFor(repository);

      try {
        await sessionState.writeSession({
          selectedRepositoryPath: repository.path,
          activeWorkspace: "paper-desk",
          ...(selectedContext === undefined ? {} : { selectedContext }),
          readingPosition: nextReadingPosition,
        });
      } catch {
        return {
          outcome: "operation-failed",
          detail: "The Workbench session could not be saved.",
        };
      }

      readingPosition = nextReadingPosition;
      activeWorkspace = "paper-desk";

      return {
        outcome: "position-restored",
        workbench: {
          activeWorkspace: "paper-desk",
          repositoryStatus: "selected",
          repositoryPath: repository.path,
          repositoryAccess: repository.access,
          repositorySelection: repository.selection,
          context: repository.context,
          sourceAnnotation: repository.sourceAnnotation,
          readingPosition: nextReadingPosition,
        },
      };
    },
  };
};
