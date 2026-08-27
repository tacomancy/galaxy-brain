import type { KnowledgeRepository } from "../../modules/workbench-session";

/**
 * A fresh in-memory Knowledge Repository intentionally contains no selected
 * repository or demonstration data.
 */
export const createInMemoryKnowledgeRepository = (): KnowledgeRepository => ({
  getSelectionStatus: () => "not-selected",
});
