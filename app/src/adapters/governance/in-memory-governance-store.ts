import type {
  ApplyVersionInput,
  ApplyVersionResult,
  GovernedVersion,
  GovernanceVersionStore,
} from "../../modules/governance";

/** Seed and identity configuration for the deterministic Governance Adapter. */
export interface InMemoryGovernanceStoreInput {
  currentVersion: GovernedVersion;
  nextVersionId: string;
}

const copyVersion = (version: GovernedVersion): GovernedVersion => ({
  ...version,
  target: { ...version.target },
});

/**
 * Creates a deterministic S2 storage Adapter for one seeded governed version.
 * @param input The initial version and next-version identity.
 * @returns The in-memory Governance version store.
 */
export const createInMemoryGovernanceStore = ({
  currentVersion,
  nextVersionId,
}: InMemoryGovernanceStoreInput): GovernanceVersionStore => {
  const versions = new Map<string, GovernedVersion>();
  const currentVersionIds = new Map<string, string>();

  const versionKey = (targetId: string, versionId: string): string =>
    `${targetId}:${versionId}`;

  versions.set(
    versionKey(currentVersion.target.id, currentVersion.id),
    copyVersion(currentVersion),
  );
  currentVersionIds.set(currentVersion.target.id, currentVersion.id);

  const readCurrentVersion = async (
    targetId: string,
  ): Promise<GovernedVersion | undefined> => {
    const versionId = currentVersionIds.get(targetId);
    return versionId === undefined
      ? undefined
      : versions.get(versionKey(targetId, versionId)) === undefined
        ? undefined
        : copyVersion(versions.get(versionKey(targetId, versionId))!);
  };

  const readVersion = async (
    targetId: string,
    versionId: string,
  ): Promise<GovernedVersion | undefined> => {
    const version = versions.get(versionKey(targetId, versionId));
    return version === undefined ? undefined : copyVersion(version);
  };

  // Recovery rationale: the deterministic S2 Adapter has no durable journal,
  // so recovery reports no persisted transaction rather than inventing one.
  const recoverTransactions = async () => ({ outcome: "none" as const });

  const applyVersion = async (
    input: ApplyVersionInput,
  ): Promise<ApplyVersionResult> => {
    const previousVersion = await readCurrentVersion(input.target.id);

    if (
      previousVersion === undefined ||
      previousVersion.id !== input.parentVersionId
    ) {
      throw new Error(
        "The current governed version changed before application.",
      );
    }

    const currentVersion: GovernedVersion = {
      id: nextVersionId,
      target: { ...input.target },
      content: input.content,
      parentVersionId: input.parentVersionId,
    };

    versions.set(
      versionKey(currentVersion.target.id, currentVersion.id),
      copyVersion(currentVersion),
    );
    currentVersionIds.set(currentVersion.target.id, currentVersion.id);

    return {
      previousVersion: copyVersion(previousVersion),
      currentVersion: copyVersion(currentVersion),
    };
  };

  return {
    recoverTransactions,
    readCurrentVersion,
    readVersion,
    applyVersion,
  };
};
