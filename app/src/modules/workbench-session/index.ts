/** The fresh-session state the Workbench shell needs to render Atlas. */
export interface FreshWorkbench {
  activeWorkspace: "atlas";
  repositoryStatus: "not-selected";
}

/**
 * The minimum Knowledge Repository behavior required to open a fresh
 * Workbench. Future file-backed and in-memory adapters share this Interface.
 */
export interface KnowledgeRepository {
  getSelectionStatus(): "not-selected";
}

/** Opens and describes the current Workbench session for its callers. */
export interface WorkbenchSession {
  openFreshWorkbench(): FreshWorkbench;
}

export const createWorkbenchSession = (
  knowledgeRepository: KnowledgeRepository,
): WorkbenchSession => ({
  openFreshWorkbench: () => ({
    activeWorkspace: "atlas",
    repositoryStatus: knowledgeRepository.getSelectionStatus(),
  }),
});
