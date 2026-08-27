/**
 * The caller-visible state a fresh Workbench session returns to its shell.
 * The literal values make the first tracer bullet's behavior explicit while
 * leaving room for richer repository and workspace states later.
 */
export interface FreshWorkbench {
  activeWorkspace: "atlas";
  repositoryStatus: "not-selected" | "selected";
  repositoryPath?: string;
  repositoryAccess?: "read-write" | "read-only";
  repositorySelection?: "created" | "opened" | "read-only-compatible";
}

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

/**
 * The Knowledge Repository behavior required by the current Workbench
 * Session. The Adapter owns filesystem details; the Module owns selection
 * state and caller-facing outcomes.
 */
export interface KnowledgeRepository {
  createAt(repositoryPath: string): Promise<RepositoryOperationOutcome>;
  openAt(repositoryPath: string): Promise<RepositoryOperationOutcome>;
}

/**
 * Machine-local convenience state for the last explicitly selected root.
 * Implementations must not store this state in the portable repository.
 */
export interface WorkbenchSessionState {
  readSelectedRepository(): Promise<string | undefined>;
  writeSelectedRepository(repositoryPath: string): Promise<void>;
}

/**
 * Opens and describes the current Workbench session and creates a repository
 * for its callers. Implementations hide repository selection and session
 * state decisions from the renderer.
 */
export interface WorkbenchSession {
  openFreshWorkbench(): Promise<FreshWorkbench>;
  createRepository(repositoryPath: string): Promise<RepositoryOperationOutcome>;
  openRepository(repositoryPath: string): Promise<RepositoryOperationOutcome>;
}

export const createWorkbenchSession = (
  knowledgeRepository: KnowledgeRepository,
  sessionState: WorkbenchSessionState,
): WorkbenchSession => {
  let selectedRepository:
    | {
        path: string;
        access: "read-write" | "read-only";
        selection: "created" | "opened" | "read-only-compatible";
      }
    | undefined;

  let hasRestoredSession = false;

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
      selectedRepository = {
        path: outcome.repositoryPath,
        access: outcome.outcome === "opened" ? "read-write" : "read-only",
        selection: outcome.outcome,
      };
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

    selectedRepository = {
      path: outcome.repositoryPath,
      access:
        outcome.outcome === "read-only-compatible" ? "read-only" : "read-write",
      selection: outcome.outcome,
    };

    return outcome;
  };

  // Keep the Module framework-independent so the same Interface can be used
  // by Electron and deterministic behavior tests.
  return {
    openFreshWorkbench: async () => {
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
  };
};
