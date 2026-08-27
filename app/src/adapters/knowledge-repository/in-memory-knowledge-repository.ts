import type {
  KnowledgeRepository,
  RepositoryOperationOutcome,
} from "../../modules/workbench-session";

/**
 * Creates the deterministic repository Adapter used by the first Workbench
 * path. It intentionally contains no selected repository or demonstration
 * data, so the fresh-session behavior cannot accidentally depend on fixtures.
 */
export const createInMemoryKnowledgeRepository = (): KnowledgeRepository => ({
  // This Adapter remains useful for session behavior that does not require
  // durable files. The first file-backed cycle uses the production Adapter.
  createAt: async (repositoryPath): Promise<RepositoryOperationOutcome> => ({
    outcome: "created",
    repositoryPath,
  }),
  openAt: async (repositoryPath): Promise<RepositoryOperationOutcome> => ({
    outcome: "opened",
    repositoryPath,
  }),
});
