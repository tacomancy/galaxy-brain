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
  /** The remembered root could not be validated; recovery stays unselected. */
  repositoryResumeFailure?: RepositoryResumeFailure;
}

/** The launch Interface always begins in Atlas. */
export interface FreshWorkbench extends WorkbenchState {
  activeWorkspace: "atlas";
}

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
  | { outcome: "context-unavailable"; detail: string };

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
}

/**
 * Machine-local convenience state for the last explicitly selected root.
 * Implementations must not store this state in the portable repository.
 */
export interface WorkbenchSessionState {
  /** Missing, malformed, or unreadable state is treated as first launch. */
  readSelectedRepository(): Promise<string | undefined>;
  /** Rejecting this write means the current selection is not changed. */
  writeSelectedRepository(repositoryPath: string): Promise<void>;
}

/**
 * Opens and describes the current Workbench session and creates a repository
 * for its callers. Implementations hide repository selection and session
 * state decisions from the renderer.
 */
export interface WorkbenchSession {
  /** Validates the remembered root once, then returns Atlas-facing state. */
  openFreshWorkbench(): Promise<FreshWorkbench>;
  /** A session-state write failure returns operation-failed and preserves selection. */
  createRepository(repositoryPath: string): Promise<RepositoryOperationOutcome>;
  /** A session-state write failure returns operation-failed and preserves selection. */
  openRepository(repositoryPath: string): Promise<RepositoryOperationOutcome>;
  /** Carries a known topic into Studio without persisting launch state. */
  openTopicInStudio(topicId: string): Promise<WorkspaceTransitionOutcome>;
  /** Carries the selected Source Record and its topic into Paper Desk. */
  openSourceRecordInPaperDesk(
    sourceRecordId: string,
  ): Promise<WorkspaceTransitionOutcome>;
  /** Changes the visible workspace while retaining the selected context. */
  switchWorkspace(
    workspace: WorkbenchWorkspace,
  ): Promise<WorkspaceTransitionOutcome>;
}

/**
 * Composes repository and machine-local session Adapters behind the
 * Workbench Session Interface. It keeps selection and in-session context in
 * memory and does not persist active workspace navigation.
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
      }
    | undefined;

  let hasRestoredSession = false;
  let repositoryResumeFailure: RepositoryResumeFailure | undefined;

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
    const rememberedPath = await sessionState.readSelectedRepository();

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
      await sessionState.writeSelectedRepository(outcome.repositoryPath);
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

    if (workspace !== "atlas" && workbench.context === undefined) {
      return {
        outcome: "context-unavailable",
        detail:
          repository.contextReadFailure?.detail ??
          "The selected workspace context is not available.",
      };
    }

    return { outcome: "transitioned", workbench };
  };

  // Keep the Module framework-independent so the same Interface can be used
  // by Electron and deterministic behavior tests.
  return {
    openFreshWorkbench: async (): Promise<FreshWorkbench> => {
      await restoreSelectedRepository();

      const workbench: FreshWorkbench = {
        // A new session always begins in Atlas for orientation.
        activeWorkspace: "atlas",
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
  };
};
