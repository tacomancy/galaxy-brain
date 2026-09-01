/** In-memory Adapter used by S4 tests without widening the Module entry. */
import type {
  DiscoveryItem,
  DiscoveryRepository,
  DiscoveryRepositoryReadOutcome,
} from "../../modules/discovery";

const copiedItem = (item: DiscoveryItem): DiscoveryItem => ({
  ...item,
  ...(item.source === undefined ? {} : { source: { ...item.source } }),
  ...(item.targetTopic === undefined
    ? {}
    : { targetTopic: { ...item.targetTopic } }),
});

/**
 * Creates a deterministic read-only Discovery repository Adapter.
 * @param items Items exposed to the Discovery Module.
 * @returns An in-memory repository Adapter.
 */
export const createInMemoryDiscoveryRepository = (
  items: DiscoveryItem[],
): DiscoveryRepository => ({
  readDiscoverableItems: async (): Promise<DiscoveryRepositoryReadOutcome> => ({
    outcome: "available",
    items: items.map(copiedItem),
  }),
});
