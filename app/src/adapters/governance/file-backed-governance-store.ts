/**
 * Filesystem transaction and rollback Adapter. It journals staged target,
 * audit, and exact prior bytes, rechecks the target before installation, and
 * restores those bytes during recovery without overwriting an external edit.
 */
import { createHash } from "node:crypto";
import {
  mkdir,
  lstat,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

import {
  GovernanceExternalChangeError,
  type ApplyVersionInput,
  type ApplyVersionResult,
  type GovernedTarget,
  type GovernedVersion,
  type GovernanceRecoveryOutcome,
  type GovernanceVersionStore,
  type Judgment,
  type Proposal,
} from "../../modules/governance";

/** Filesystem operations required by the file-backed Governance Adapter. */
export interface GovernanceFileSystem {
  lstat: typeof lstat;
  mkdir: typeof mkdir;
  readFile: typeof readFile;
  readdir: typeof readdir;
  rename: typeof rename;
  rm: typeof rm;
  writeFile: typeof writeFile;
}

/** Default filesystem Adapter used by file-backed Governance. */
export const defaultGovernanceFileSystem: GovernanceFileSystem = {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
};

/** Configuration for the file-backed Governance storage Adapter. */
export interface FileBackedGovernanceStoreInput {
  repositoryPath: string;
  target: GovernedTarget;
  initialVersionId: string;
  nextVersionId: string;
  filesystem?: GovernanceFileSystem;
}

interface PersistedProposal {
  id: string;
  fingerprint: string;
  target: GovernedTarget;
  base_version_id: string;
  working_material_id: string;
  exact_change: {
    path: string;
    before: string;
    after: string;
  };
}

interface PersistedJudgment {
  id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  base_version_id: string;
  decision: "accepted";
}

interface PersistedAppliedRecord {
  id: string;
  proposal: PersistedProposal;
  judgment: PersistedJudgment;
  target: GovernedTarget;
  previous_version: {
    id: string;
    fingerprint: string;
  };
  new_version: {
    id: string;
    fingerprint: string;
  };
  rollback_path: string;
}

interface TransactionJournal {
  applied_record_id: string;
  expected_fingerprint: string;
  new_fingerprint: string;
  target_path: string;
  state: "prepared" | "target-replaced";
}

class GovernanceStorageError extends Error {}

class ExternalGovernedFileChangeError extends GovernanceExternalChangeError {}

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

const copyTarget = (target: GovernedTarget): GovernedTarget => ({ ...target });

const copyVersion = (version: GovernedVersion): GovernedVersion => ({
  ...version,
  target: copyTarget(version.target),
});

const isSameTarget = (left: GovernedTarget, right: GovernedTarget): boolean =>
  left.id === right.id &&
  left.title === right.title &&
  left.path === right.path;

const fingerprint = (contents: Buffer | string): string =>
  createHash("sha256").update(contents).digest("hex");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isVersionFingerprint = (value: unknown): value is string =>
  isString(value) && /^[a-f0-9]{64}$/.test(value);

const serialize = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

const pathInside = (root: string, candidate: string): boolean =>
  candidate === root || candidate.startsWith(`${root}${sep}`);

const sameBuffer = (left: Buffer, right: Buffer): boolean =>
  left.length === right.length && left.equals(right);

const targetBuffer = (content: string): Buffer => Buffer.from(content, "utf8");

const replaceExactOnce = (
  content: string,
  before: string,
  after: string,
): string | undefined => {
  const firstIndex = content.indexOf(before);

  if (firstIndex < 0 || content.indexOf(before, firstIndex + 1) >= 0) {
    return undefined;
  }

  return `${content.slice(0, firstIndex)}${after}${content.slice(firstIndex + before.length)}`;
};

const relativePath = (root: string, absolutePath: string): string => {
  const value = relative(root, absolutePath);

  if (value.startsWith("..") || value.includes(`..${sep}`)) {
    throw new GovernanceStorageError("The repository path is unsafe.");
  }

  return value;
};

const targetContentPath = (
  repositoryPath: string,
  target: GovernedTarget,
): string => {
  const root = resolve(repositoryPath);
  const targetPath = resolve(root, target.path);

  if (!pathInside(root, targetPath) || target.path.startsWith(sep)) {
    throw new GovernanceStorageError("The governed target path is unsafe.");
  }

  return targetPath;
};

const appliedDirectoryPath = (root: string): string =>
  join(root, "proposals", "applied");

const appliedRecordPath = (root: string, appliedRecordId: string): string =>
  join(appliedDirectoryPath(root), `${appliedRecordId}.json`);

const rollbackPath = (
  root: string,
  appliedRecordId: string,
  targetPath: string,
): string =>
  join(appliedDirectoryPath(root), appliedRecordId, "rollback", targetPath);

const transactionsDirectoryPath = (root: string): string =>
  join(appliedDirectoryPath(root), ".transactions");

const transactionPath = (root: string, appliedRecordId: string): string =>
  join(transactionsDirectoryPath(root), appliedRecordId);

const isSameTargetRecord = (
  value: unknown,
  target: GovernedTarget,
): value is GovernedTarget =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.title) &&
  isString(value.path) &&
  value.id === target.id &&
  value.title === target.title &&
  value.path === target.path;

const isPersistedProposal = (
  value: unknown,
  target: GovernedTarget,
): value is PersistedProposal => {
  if (!isRecord(value) || !isRecord(value.exact_change)) {
    return false;
  }

  return (
    isString(value.id) &&
    isString(value.fingerprint) &&
    isSameTargetRecord(value.target, target) &&
    isString(value.base_version_id) &&
    isString(value.working_material_id) &&
    isString(value.exact_change.path) &&
    isString(value.exact_change.before) &&
    isString(value.exact_change.after)
  );
};

const isPersistedJudgment = (value: unknown): value is PersistedJudgment =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.proposal_id) &&
  isString(value.proposal_fingerprint) &&
  isString(value.base_version_id) &&
  value.decision === "accepted";

const isPersistedVersion = (
  value: unknown,
): value is { id: string; fingerprint: string } =>
  isRecord(value) &&
  isString(value.id) &&
  isVersionFingerprint(value.fingerprint);

const parseAppliedRecord = (
  contents: string,
  target: GovernedTarget,
): PersistedAppliedRecord => {
  let value: unknown;

  try {
    value = JSON.parse(contents);
  } catch {
    throw new GovernanceStorageError("The applied Proposal record is invalid.");
  }

  if (!isRecord(value)) {
    throw new GovernanceStorageError("The applied Proposal record is invalid.");
  }

  const proposal = value.proposal;
  const judgment = value.judgment;
  const previousVersion = value.previous_version;
  const newVersion = value.new_version;

  if (
    !isString(value.id) ||
    !isSameTargetRecord(value.target, target) ||
    !isString(value.rollback_path) ||
    !isPersistedProposal(proposal, target) ||
    !isPersistedJudgment(judgment) ||
    !isPersistedVersion(previousVersion) ||
    !isPersistedVersion(newVersion)
  ) {
    throw new GovernanceStorageError("The applied Proposal record is invalid.");
  }

  // Rationale: the preceding type guard validates every persisted field before
  // this narrow conversion to the internal snake_case representation.
  return value as unknown as PersistedAppliedRecord;
};

const persistedProposal = (proposal: Proposal): PersistedProposal => ({
  id: proposal.id,
  fingerprint: proposal.fingerprint,
  target: copyTarget(proposal.target),
  base_version_id: proposal.baseVersionId,
  working_material_id: proposal.workingMaterialId,
  exact_change: {
    path: proposal.exactChange.path,
    before: proposal.exactChange.before,
    after: proposal.exactChange.after,
  },
});

const persistedJudgment = (judgment: Judgment): PersistedJudgment => ({
  id: judgment.id,
  proposal_id: judgment.proposalId,
  proposal_fingerprint: judgment.proposalFingerprint,
  base_version_id: judgment.baseVersionId,
  decision: judgment.decision,
});

const readFileIfPresent = async (
  filesystem: GovernanceFileSystem,
  filePath: string,
): Promise<Buffer | undefined> => {
  try {
    return await filesystem.readFile(filePath);
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
};

const writeNewFile = async (
  filesystem: GovernanceFileSystem,
  filePath: string,
  contents: string | Buffer,
): Promise<void> => {
  await filesystem.writeFile(filePath, contents, {
    encoding: "utf8",
    flag: "wx",
  });
};

const ensureDirectory = async (
  filesystem: GovernanceFileSystem,
  directoryPath: string,
): Promise<void> => {
  await filesystem.mkdir(directoryPath, { recursive: true });
};

/**
 * Creates a file-backed Governance storage Adapter for one target.
 * @param input Repository, target, version, and filesystem configuration.
 * @returns The configured Governance version store.
 */
export const createFileBackedGovernanceStore = ({
  repositoryPath,
  target,
  initialVersionId,
  nextVersionId,
  filesystem = defaultGovernanceFileSystem,
}: FileBackedGovernanceStoreInput): GovernanceVersionStore => {
  const root = resolve(repositoryPath);

  const readTarget = async (): Promise<
    { buffer: Buffer; content: string; fingerprint: string } | undefined
  > => {
    const filePath = targetContentPath(root, target);
    let stats;

    try {
      stats = await filesystem.lstat(filePath);
    } catch (error: unknown) {
      if (isErrnoException(error) && error.code === "ENOENT") {
        return undefined;
      }

      throw error;
    }

    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new GovernanceStorageError("The governed target is unsafe.");
    }

    const buffer = await filesystem.readFile(filePath);
    return {
      buffer,
      content: buffer.toString("utf8"),
      fingerprint: fingerprint(buffer),
    };
  };

  const readRecordById = async (
    appliedRecordId: string,
  ): Promise<PersistedAppliedRecord | undefined> => {
    const contents = await readFileIfPresent(
      filesystem,
      appliedRecordPath(root, appliedRecordId),
    );

    return contents === undefined
      ? undefined
      : parseAppliedRecord(contents.toString("utf8"), target);
  };

  const readAnyAppliedRecord = async (): Promise<
    PersistedAppliedRecord | undefined
  > => {
    const directoryPath = appliedDirectoryPath(root);
    let entries;

    try {
      entries = await filesystem.readdir(directoryPath, {
        encoding: "utf8",
        withFileTypes: true,
      });
    } catch (error: unknown) {
      if (isErrnoException(error) && error.code === "ENOENT") {
        return undefined;
      }

      throw error;
    }

    const recordNames = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => entry.name)
      .sort();

    if (recordNames.length === 0) {
      return undefined;
    }

    const recordName = recordNames[recordNames.length - 1];

    if (recordName === undefined) {
      return undefined;
    }

    const contents = await filesystem.readFile(
      join(directoryPath, recordName),
      "utf8",
    );
    return parseAppliedRecord(contents, target);
  };

  const readVersionFromRecord = async (
    record: PersistedAppliedRecord,
    versionId: string,
    targetSnapshot: { buffer: Buffer; content: string; fingerprint: string },
  ): Promise<GovernedVersion | undefined> => {
    if (versionId === record.new_version.id) {
      if (targetSnapshot.fingerprint !== record.new_version.fingerprint) {
        throw new GovernanceStorageError(
          "The current governed target does not match its applied record.",
        );
      }

      return {
        id: record.new_version.id,
        target: copyTarget(target),
        content: targetSnapshot.content,
        parentVersionId: record.previous_version.id,
      };
    }

    if (versionId !== record.previous_version.id) {
      return undefined;
    }

    const rollbackAbsolutePath = resolve(root, record.rollback_path);

    if (!pathInside(root, rollbackAbsolutePath)) {
      throw new GovernanceStorageError("The rollback path is unsafe.");
    }

    const rollbackContents = await filesystem.readFile(rollbackAbsolutePath);

    if (fingerprint(rollbackContents) !== record.previous_version.fingerprint) {
      throw new GovernanceStorageError("The rollback record is invalid.");
    }

    return {
      id: record.previous_version.id,
      target: copyTarget(target),
      content: rollbackContents.toString("utf8"),
    };
  };

  const journalFor = async (
    transactionDirectory: string,
  ): Promise<TransactionJournal> => {
    const contents = await filesystem.readFile(
      join(transactionDirectory, "journal.json"),
      "utf8",
    );
    const value: unknown = JSON.parse(contents);

    if (
      !isRecord(value) ||
      !isString(value.applied_record_id) ||
      !isString(value.expected_fingerprint) ||
      !isString(value.new_fingerprint) ||
      !isString(value.target_path) ||
      (value.state !== "prepared" && value.state !== "target-replaced")
    ) {
      throw new GovernanceStorageError("The transaction journal is invalid.");
    }

    // Rationale: the preceding validation establishes the journal invariant
    // before this conversion to the internal persisted representation.
    return value as unknown as TransactionJournal;
  };

  const installImmutable = async (
    stagedPath: string,
    finalPath: string,
  ): Promise<void> => {
    const existing = await readFileIfPresent(filesystem, finalPath);

    if (existing !== undefined) {
      const staged = await readFileIfPresent(filesystem, stagedPath);

      if (staged === undefined) {
        return;
      }

      if (!sameBuffer(existing, staged)) {
        throw new GovernanceStorageError(
          "An immutable applied artifact already has different content.",
        );
      }

      await filesystem.rm(stagedPath, { force: true });
      return;
    }

    await filesystem.rename(stagedPath, finalPath);
  };

  const isTransactionAuditValid = async (
    stagedAuditPath: string,
    finalAuditPath: string,
    journal: TransactionJournal,
    finalRollbackPath: string,
  ): Promise<boolean> => {
    const auditContents =
      (await readFileIfPresent(filesystem, stagedAuditPath)) ??
      (await readFileIfPresent(filesystem, finalAuditPath));

    if (auditContents === undefined) {
      return false;
    }

    try {
      const audit = parseAppliedRecord(auditContents.toString("utf8"), target);
      return (
        audit.id === journal.applied_record_id &&
        audit.previous_version.fingerprint === journal.expected_fingerprint &&
        audit.new_version.fingerprint === journal.new_fingerprint &&
        audit.rollback_path === relativePath(root, finalRollbackPath)
      );
    } catch {
      return false;
    }
  };

  const restorePreviousTarget = async (
    transactionDirectory: string,
    targetPath: string,
    stagedRollbackPath: string,
    finalRollbackPath: string,
    journal: TransactionJournal,
  ): Promise<"restored" | "discarded"> => {
    const stagedRollback = await readFileIfPresent(
      filesystem,
      stagedRollbackPath,
    );
    const rollbackContents =
      stagedRollback ??
      (await readFileIfPresent(filesystem, finalRollbackPath));

    if (
      rollbackContents === undefined ||
      fingerprint(rollbackContents) !== journal.expected_fingerprint
    ) {
      throw new GovernanceStorageError(
        "The interrupted transaction cannot restore the target.",
      );
    }

    const latestTarget = await readTarget();

    if (latestTarget?.fingerprint === journal.expected_fingerprint) {
      await filesystem.rm(transactionDirectory, {
        recursive: true,
        force: true,
      });
      return "discarded";
    }

    if (latestTarget?.fingerprint !== journal.new_fingerprint) {
      throw new ExternalGovernedFileChangeError(
        "The governed target changed during transaction recovery.",
      );
    }

    const restorePath = join(transactionDirectory, "restore");
    await writeNewFile(filesystem, restorePath, rollbackContents);
    await filesystem.rename(restorePath, targetPath);
    await filesystem.rm(
      join(appliedDirectoryPath(root), journal.applied_record_id),
      { recursive: true, force: true },
    );
    await filesystem.rm(transactionDirectory, { recursive: true, force: true });
    return "restored";
  };

  const reconcileTransactionTarget = async (
    currentTarget: { fingerprint: string } | undefined,
    targetPath: string,
    stagedTargetPath: string,
    journal: TransactionJournal,
  ): Promise<void> => {
    if (currentTarget?.fingerprint === journal.expected_fingerprint) {
      if (journal.expected_fingerprint === journal.new_fingerprint) {
        await filesystem.rm(stagedTargetPath, { force: true });
        return;
      }

      const stagedTarget = await readFileIfPresent(
        filesystem,
        stagedTargetPath,
      );

      if (stagedTarget === undefined) {
        throw new GovernanceStorageError(
          "The interrupted transaction cannot restore the target.",
        );
      }

      const latestTarget = await readTarget();

      if (latestTarget?.fingerprint !== journal.expected_fingerprint) {
        throw new ExternalGovernedFileChangeError(
          "The governed target changed during transaction recovery.",
        );
      }

      await filesystem.rename(stagedTargetPath, targetPath);
      return;
    }

    if (currentTarget?.fingerprint === journal.new_fingerprint) {
      await filesystem.rm(stagedTargetPath, { force: true });
      return;
    }

    throw new ExternalGovernedFileChangeError(
      "The governed target changed during transaction recovery.",
    );
  };

  const recoverTransaction = async (
    transactionDirectory: string,
  ): Promise<"completed" | "restored" | "discarded"> => {
    const journal = await journalFor(transactionDirectory);

    if (journal.target_path !== target.path) {
      throw new GovernanceStorageError("The transaction target is invalid.");
    }

    const targetPath = targetContentPath(root, target);
    const stagedTargetPath = join(transactionDirectory, "target");
    const stagedRollbackPath = join(transactionDirectory, "rollback");
    const stagedAuditPath = join(transactionDirectory, "audit.json");
    const finalRollbackPath = rollbackPath(
      root,
      journal.applied_record_id,
      target.path,
    );
    const finalAuditPath = appliedRecordPath(root, journal.applied_record_id);
    const currentTarget = await readTarget();
    const auditIsValid = await isTransactionAuditValid(
      stagedAuditPath,
      finalAuditPath,
      journal,
      finalRollbackPath,
    );

    if (!auditIsValid) {
      if (currentTarget?.fingerprint === journal.new_fingerprint) {
        return restorePreviousTarget(
          transactionDirectory,
          targetPath,
          stagedRollbackPath,
          finalRollbackPath,
          journal,
        );
      } else {
        await filesystem.rm(transactionDirectory, {
          recursive: true,
          force: true,
        });
      }

      return "discarded";
    }

    await reconcileTransactionTarget(
      currentTarget,
      targetPath,
      stagedTargetPath,
      journal,
    );

    await installImmutable(stagedRollbackPath, finalRollbackPath);
    await installImmutable(stagedAuditPath, finalAuditPath);
    await filesystem.rm(transactionDirectory, { recursive: true, force: true });
    return "completed";
  };

  const recoverTransactions = async (): Promise<GovernanceRecoveryOutcome> => {
    const directoryPath = transactionsDirectoryPath(root);
    let entries;

    try {
      entries = await filesystem.readdir(directoryPath, {
        encoding: "utf8",
        withFileTypes: true,
      });
    } catch (error: unknown) {
      if (isErrnoException(error) && error.code === "ENOENT") {
        return { outcome: "none" };
      }

      throw error;
    }

    let recoveryAction: "completed" | "restored" | "discarded" | undefined;

    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      if (entry.isDirectory() && entry.name !== "." && entry.name !== "..") {
        const action = await recoverTransaction(
          join(directoryPath, entry.name),
        );
        recoveryAction =
          recoveryAction === "restored" || action === "restored"
            ? "restored"
            : action;
      }
    }

    return recoveryAction === undefined
      ? { outcome: "none" }
      : { outcome: "recovered", action: recoveryAction };
  };

  const readCurrentVersion = async (
    targetId: string,
  ): Promise<GovernedVersion | undefined> => {
    await recoverTransactions();

    if (targetId !== target.id) {
      return undefined;
    }

    const targetSnapshot = await readTarget();

    if (targetSnapshot === undefined) {
      return undefined;
    }

    const record = await readAnyAppliedRecord();

    if (record === undefined) {
      return {
        id: initialVersionId,
        target: copyTarget(target),
        content: targetSnapshot.content,
      };
    }

    return readVersionFromRecord(record, record.new_version.id, targetSnapshot);
  };

  const readVersion = async (
    targetId: string,
    versionId: string,
  ): Promise<GovernedVersion | undefined> => {
    await recoverTransactions();

    if (targetId !== target.id) {
      return undefined;
    }

    const targetSnapshot = await readTarget();

    if (targetSnapshot === undefined) {
      return undefined;
    }

    const record = await readAnyAppliedRecord();

    if (record === undefined) {
      return versionId === initialVersionId
        ? {
            id: initialVersionId,
            target: copyTarget(target),
            content: targetSnapshot.content,
          }
        : undefined;
    }

    return readVersionFromRecord(record, versionId, targetSnapshot);
  };

  const applyVersion = async (
    input: ApplyVersionInput,
  ): Promise<ApplyVersionResult> => {
    await recoverTransactions();

    if (!isSameTarget(input.target, target)) {
      throw new GovernanceStorageError(
        "The governed target is not configured.",
      );
    }

    const previousVersion = await readCurrentVersion(target.id);

    if (
      previousVersion === undefined ||
      previousVersion.id !== input.parentVersionId
    ) {
      throw new GovernanceStorageError(
        "The current governed version changed before application.",
      );
    }

    if (previousVersion.content !== input.expectedBaseContent) {
      throw new ExternalGovernedFileChangeError(
        "The governed target changed before application.",
      );
    }

    const expectedContent = replaceExactOnce(
      input.expectedBaseContent,
      input.proposal.exactChange.before,
      input.proposal.exactChange.after,
    );

    if (expectedContent === undefined || expectedContent !== input.content) {
      throw new ExternalGovernedFileChangeError(
        "The governed target changed before application.",
      );
    }

    const targetPath = targetContentPath(root, target);
    const previousBuffer = targetBuffer(previousVersion.content);
    const nextBuffer = targetBuffer(input.content);
    const previousFingerprint = fingerprint(previousBuffer);
    const nextFingerprint = fingerprint(nextBuffer);
    const appliedRecord: PersistedAppliedRecord = {
      id: input.appliedRecordId,
      proposal: persistedProposal(input.proposal),
      judgment: persistedJudgment(input.judgment),
      target: copyTarget(target),
      previous_version: {
        id: previousVersion.id,
        fingerprint: previousFingerprint,
      },
      new_version: {
        id: nextVersionId,
        fingerprint: nextFingerprint,
      },
      rollback_path: relativePath(
        root,
        rollbackPath(root, input.appliedRecordId, target.path),
      ),
    };
    const transactionDirectory = transactionPath(root, input.appliedRecordId);
    const stagedTargetPath = join(transactionDirectory, "target");
    const stagedRollbackPath = join(transactionDirectory, "rollback");
    const stagedAuditPath = join(transactionDirectory, "audit.json");
    const journalPath = join(transactionDirectory, "journal.json");

    if ((await readRecordById(input.appliedRecordId)) !== undefined) {
      throw new GovernanceStorageError(
        "The applied Proposal identity is already in use.",
      );
    }

    await ensureDirectory(filesystem, transactionDirectory);
    try {
      await writeNewFile(filesystem, stagedTargetPath, nextBuffer);
      await writeNewFile(filesystem, stagedRollbackPath, previousBuffer);
      await writeNewFile(filesystem, stagedAuditPath, serialize(appliedRecord));
      await writeNewFile(
        filesystem,
        journalPath,
        serialize({
          applied_record_id: input.appliedRecordId,
          expected_fingerprint: previousFingerprint,
          new_fingerprint: nextFingerprint,
          target_path: target.path,
          state: "prepared",
        } satisfies TransactionJournal),
      );
    } catch (error: unknown) {
      await filesystem.rm(transactionDirectory, {
        recursive: true,
        force: true,
      });
      throw error;
    }

    const latestTarget = await readTarget();

    if (latestTarget?.fingerprint !== previousFingerprint) {
      await filesystem.rm(transactionDirectory, {
        recursive: true,
        force: true,
      });
      throw new ExternalGovernedFileChangeError(
        "The governed target changed while it was being prepared.",
      );
    }

    await ensureDirectory(
      filesystem,
      dirname(rollbackPath(root, input.appliedRecordId, target.path)),
    );
    await ensureDirectory(filesystem, appliedDirectoryPath(root));
    await filesystem.rename(stagedTargetPath, targetPath);
    await filesystem.writeFile(
      journalPath,
      serialize({
        applied_record_id: input.appliedRecordId,
        expected_fingerprint: previousFingerprint,
        new_fingerprint: nextFingerprint,
        target_path: target.path,
        state: "target-replaced",
      } satisfies TransactionJournal),
      { encoding: "utf8" },
    );
    await installImmutable(
      stagedRollbackPath,
      rollbackPath(root, input.appliedRecordId, target.path),
    );
    await installImmutable(
      stagedAuditPath,
      appliedRecordPath(root, input.appliedRecordId),
    );
    await filesystem.rm(transactionDirectory, { recursive: true, force: true });

    return {
      previousVersion: copyVersion(previousVersion),
      currentVersion: {
        id: nextVersionId,
        target: copyTarget(target),
        content: input.content,
        parentVersionId: previousVersion.id,
      },
    };
  };

  return {
    recoverTransactions,
    readCurrentVersion,
    readVersion,
    applyVersion,
  };
};
