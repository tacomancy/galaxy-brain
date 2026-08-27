/**
 * The caller-visible state a fresh Workbench session returns to its shell.
 * The literal values make the first tracer bullet's behavior explicit while
 * leaving room for richer repository and workspace states later.
 */
export interface FreshWorkbench {
  activeWorkspace: "atlas";
  repositoryStatus: "not-selected" | "selected";
  repositoryPath?: string;
}

export type RepositoryOperationOutcome =
  | { outcome: "canceled" }
  | { outcome: "created"; repositoryPath: string }
  | { outcome: "opened"; repositoryPath: string }
  | { outcome: "invalid-format"; detail: string }
  | { outcome: "unsafe-target"; detail: string }
  | { outcome: "target-unavailable"; detail: string }
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
 * Opens and describes the current Workbench session and creates a repository
 * for its callers. Implementations hide repository selection and session
 * state decisions from the renderer.
 */
export interface WorkbenchSession {
  openFreshWorkbench(): FreshWorkbench;
  createRepository(repositoryPath: string): Promise<RepositoryOperationOutcome>;
  openRepository(repositoryPath: string): Promise<RepositoryOperationOutcome>;
}

export const createWorkbenchSession = (
  knowledgeRepository: KnowledgeRepository,
): WorkbenchSession => {
  let selectedRepositoryPath: string | undefined;

  // Keep the Module framework-independent so the same Interface can be used
  // by Electron and deterministic behavior tests.
  return {
    openFreshWorkbench: () => {
      const workbench: FreshWorkbench = {
        // A new session always begins in Atlas for orientation.
        activeWorkspace: "atlas",
        repositoryStatus:
          selectedRepositoryPath === undefined ? "not-selected" : "selected",
      };

      if (selectedRepositoryPath !== undefined) {
        workbench.repositoryPath = selectedRepositoryPath;
      }

      return workbench;
    },
    createRepository: async (repositoryPath) => {
      const outcome = await knowledgeRepository.createAt(repositoryPath);

      if (outcome.outcome === "created") {
        selectedRepositoryPath = outcome.repositoryPath;
      }

      return outcome;
    },
    openRepository: async (repositoryPath) => {
      const outcome = await knowledgeRepository.openAt(repositoryPath);

      if (outcome.outcome === "opened") {
        selectedRepositoryPath = outcome.repositoryPath;
      }

      return outcome;
    },
  };
};
