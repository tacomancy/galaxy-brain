import type { KnowledgeRepository } from "../../modules/workbench-session";

/**
 * Creates the deterministic repository Adapter used by the first Workbench
 * path. It intentionally contains no selected repository or demonstration
 * data, so the fresh-session behavior cannot accidentally depend on fixtures.
 */
export const createInMemoryKnowledgeRepository = (): KnowledgeRepository => ({
  // The first tracer bullet only needs to distinguish a fresh session from a
  // resumed one; file-backed repository behavior arrives in a later slice.
  getSelectionStatus: () => "not-selected",
});
