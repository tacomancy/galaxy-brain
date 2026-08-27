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
  readingPosition?: ReadingPosition;
}

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
      const contextReadOutcome = await readWorkbenchContext(
        outcome.repositoryPath,
      );
      selectedRepository = {
        path: outcome.repositoryPath,
        access: outcome.outcome === "opened" ? "read-write" : "read-only",
        selection: outcome.outcome,
        ...(contextReadOutcome.outcome === "available"
          ? { context: contextReadOutcome.context }
          : {}),
        ...(contextReadOutcome.outcome === "unavailable"
          ? { contextReadFailure: contextReadOutcome }
          : {}),
      };

      const rememberedWorkspace = rememberedSession?.activeWorkspace;
      const rememberedPosition = rememberedSession?.readingPosition;

      if (
        rememberedWorkspace === "atlas" ||
        (rememberedWorkspace === "studio" &&
          contextReadOutcome.outcome === "available") ||
        (rememberedWorkspace === "paper-desk" &&
          contextReadOutcome.outcome === "available")
      ) {
        activeWorkspace = rememberedWorkspace;
      }

      if (
        rememberedPosition !== undefined &&
        contextReadOutcome.outcome === "available" &&
        rememberedPosition.sourceRecordId ===
          contextReadOutcome.context.sourceRecord.id
      ) {
        readingPosition = rememberedPosition;
      }

      if (
        (activeWorkspace === "studio" || activeWorkspace === "paper-desk") &&
        contextReadOutcome.outcome === "available"
      ) {
        const annotationOutcome =
          await knowledgeRepository.readWorkbenchAnnotation(
            outcome.repositoryPath,
            contextReadOutcome.context.sourceRecord.id,
          );

        if (annotationOutcome.outcome === "found") {
          selectedRepository.sourceAnnotation = annotationOutcome.annotation;
        } else {
          activeWorkspace = "atlas";
          readingPosition = undefined;
        }
      }
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
    selectedRepository = {
      path: outcome.repositoryPath,
      access:
        outcome.outcome === "read-only-compatible" ? "read-only" : "read-write",
      selection: outcome.outcome,
      ...(contextReadOutcome.outcome === "available"
        ? { context: contextReadOutcome.context }
        : {}),
      ...(contextReadOutcome.outcome === "unavailable"
        ? { contextReadFailure: contextReadOutcome }
        : {}),
    };
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

    if (
      (workspace === "studio" || workspace === "paper-desk") &&
      repository.context !== undefined
    ) {
      if (repository.sourceAnnotation === undefined) {
        const annotationOutcome =
          await knowledgeRepository.readWorkbenchAnnotation(
            repository.path,
            repository.context.sourceRecord.id,
          );

        if (annotationOutcome.outcome === "found") {
          repository.sourceAnnotation = annotationOutcome.annotation;
        }
      }

      if (repository.sourceAnnotation !== undefined) {
        workbench.sourceAnnotation = repository.sourceAnnotation;
      }
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

    try {
      await sessionState.writeSession({
        selectedRepositoryPath: repository.path,
        activeWorkspace: workspace,
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

      try {
        await sessionState.writeSession({
          selectedRepositoryPath: repository.path,
          activeWorkspace: "paper-desk",
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
