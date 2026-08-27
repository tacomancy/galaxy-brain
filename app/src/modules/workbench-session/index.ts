/**
 * The caller-visible state a fresh Workbench session returns to its shell.
 * The literal values make the first tracer bullet's behavior explicit while
 * leaving room for richer repository and workspace states later.
 */
export interface FreshWorkbench {
  activeWorkspace: "atlas";
  repositoryStatus: "not-selected";
}

/**
 * The minimum Knowledge Repository behavior required to open a fresh
 * Workbench. Future file-backed and in-memory Adapters share this Interface.
 * A repository reports domain status rather than exposing storage details.
 */
export interface KnowledgeRepository {
  getSelectionStatus(): "not-selected";
}

/**
 * Opens and describes the current Workbench session for its callers.
 * Implementations hide repository selection and session-state decisions from
 * the renderer.
 */
export interface WorkbenchSession {
  openFreshWorkbench(): FreshWorkbench;
}

export const createWorkbenchSession = (
  knowledgeRepository: KnowledgeRepository,
): WorkbenchSession => {
  // Keep the Module framework-independent so the same Interface can be used
  // by Electron and deterministic behavior tests.
  return {
    openFreshWorkbench: () => ({
      // A new session always begins in Atlas for orientation.
      activeWorkspace: "atlas",
      repositoryStatus: knowledgeRepository.getSelectionStatus(),
    }),
  };
};
