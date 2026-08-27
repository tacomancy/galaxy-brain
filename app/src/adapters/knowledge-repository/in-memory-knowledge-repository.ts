import { resolve } from "node:path";

import type {
  KnowledgeRepository,
  RepositoryOperationOutcome,
} from "../../modules/workbench-session";

/**
 * Creates the deterministic repository Adapter used by the first Workbench
 * path. It intentionally contains no selected repository or demonstration
 * data, so the fresh-session behavior cannot accidentally depend on fixtures.
 */
export const createInMemoryKnowledgeRepository = (): KnowledgeRepository => {
  const repositories = new Set<string>();

  return {
    createAt: async (repositoryPath): Promise<RepositoryOperationOutcome> => {
      const canonicalPath = resolve(repositoryPath);

      if (repositories.has(canonicalPath)) {
        return {
          outcome: "operation-failed",
          detail: "The Knowledge Repository could not be created.",
        };
      }

      repositories.add(canonicalPath);
      return { outcome: "created", repositoryPath: canonicalPath };
    },
    openAt: async (repositoryPath): Promise<RepositoryOperationOutcome> => {
      const canonicalPath = resolve(repositoryPath);

      if (!repositories.has(canonicalPath)) {
        return {
          outcome: "target-unavailable",
          detail: "The selected Knowledge Repository is unavailable.",
        };
      }

      return { outcome: "opened", repositoryPath: canonicalPath };
    },
    readWorkbenchContext: async () => ({
      outcome: "not-found",
      detail: "No contextual topic is available.",
    }),
    readWorkbenchAnnotation: async () => ({
      outcome: "not-found",
      detail: "The source annotation was not found.",
    }),
  };
};
