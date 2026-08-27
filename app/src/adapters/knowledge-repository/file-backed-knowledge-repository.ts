import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import type {
  KnowledgeRepository,
  RepositoryOperationOutcome,
} from "../../modules/workbench-session";

const repositoryFormat = "format: galaxy-brain\nformat_version: 1\n";
const canonicalRoots = [
  "assets",
  "knowledge",
  "projects",
  "proposals",
  "scratch",
  "sources",
  "templates",
] as const;

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

class InvalidRepositoryFormatError extends Error {}

class UnsafeRepositoryTargetError extends Error {}

const copyStarterEntry = async (
  sourcePath: string,
  destinationPath: string,
): Promise<void> => {
  const sourceStats = await lstat(sourcePath);

  if (sourceStats.isSymbolicLink()) {
    throw new UnsafeRepositoryTargetError(
      "The starter skeleton contains an unsafe symbolic link.",
    );
  }

  if (sourceStats.isDirectory()) {
    await mkdir(destinationPath);

    for (const entry of await readdir(sourcePath)) {
      await copyStarterEntry(
        join(sourcePath, entry),
        join(destinationPath, entry),
      );
    }

    return;
  }

  await writeFile(destinationPath, await readFile(sourcePath));
};

const copyStarterContents = async (
  sourceRoot: string,
  destinationRoot: string,
): Promise<void> => {
  for (const entry of await readdir(sourceRoot)) {
    await copyStarterEntry(
      join(sourceRoot, entry),
      join(destinationRoot, entry),
    );
  }
};

const validateStagedRepository = async (stagedPath: string): Promise<void> => {
  let manifest: string;

  try {
    manifest = await readFile(join(stagedPath, "galaxy-brain.yaml"), "utf8");
  } catch {
    throw new InvalidRepositoryFormatError(
      "The repository manifest is missing or unreadable.",
    );
  }

  if (manifest !== repositoryFormat) {
    throw new InvalidRepositoryFormatError(
      "The starter skeleton has an invalid repository manifest.",
    );
  }

  for (const root of canonicalRoots) {
    let stats: Awaited<ReturnType<typeof lstat>>;

    try {
      stats = await lstat(join(stagedPath, root));
    } catch {
      throw new InvalidRepositoryFormatError(
        "A canonical repository root is missing or unreadable.",
      );
    }

    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new InvalidRepositoryFormatError(
        "The starter skeleton has an invalid canonical root.",
      );
    }
  }
};

const validateNoSymlinks = async (repositoryPath: string): Promise<void> => {
  const stats = await lstat(repositoryPath);

  if (stats.isSymbolicLink()) {
    throw new UnsafeRepositoryTargetError(
      "The selected repository contains an unsafe symbolic link.",
    );
  }

  if (stats.isDirectory()) {
    for (const entry of await readdir(repositoryPath)) {
      await validateNoSymlinks(join(repositoryPath, entry));
    }
  }
};

const operationFailed = (): RepositoryOperationOutcome => ({
  outcome: "operation-failed",
  detail: "The Knowledge Repository could not be created.",
});

const invalidFormat = (): RepositoryOperationOutcome => ({
  outcome: "invalid-format",
  detail: "The selected target is not a valid Knowledge Repository.",
});

const unsafeTarget = (): RepositoryOperationOutcome => ({
  outcome: "unsafe-target",
  detail: "The selected target contains unsafe filesystem entries.",
});

const targetUnavailable = (): RepositoryOperationOutcome => ({
  outcome: "target-unavailable",
  detail: "The selected Knowledge Repository is unavailable.",
});

/**
 * Creates Knowledge Repositories from the bundled empty starter skeleton.
 * Creation is staged in a temporary sibling and selects the destination only
 * after validation and the final rename succeed.
 */
export const createFileBackedKnowledgeRepository = (
  starterRoot: string,
): KnowledgeRepository => ({
  createAt: async (requestedPath): Promise<RepositoryOperationOutcome> => {
    const requestedRoot = resolve(requestedPath);
    let stagingRoot: string | undefined;
    let backupRoot: string | undefined;
    let existingTargetMoved = false;
    let repositoryInstalled = false;
    let preserveBackup = false;
    let canonicalRoot: string | undefined;

    try {
      const parentStats = await lstat(dirname(requestedRoot));

      if (parentStats.isSymbolicLink()) {
        return unsafeTarget();
      }

      if (!parentStats.isDirectory()) {
        return targetUnavailable();
      }

      const canonicalParent = await realpath(dirname(requestedRoot));
      canonicalRoot = join(canonicalParent, basename(requestedRoot));

      try {
        const targetStats = await lstat(canonicalRoot);

        if (targetStats.isSymbolicLink() || !targetStats.isDirectory()) {
          return operationFailed();
        }

        if ((await readdir(canonicalRoot)).length > 0) {
          return operationFailed();
        }
      } catch (error: unknown) {
        if (!isErrnoException(error) || error.code !== "ENOENT") {
          return operationFailed();
        }
      }

      stagingRoot = await mkdtemp(
        join(canonicalParent, ".galaxy-brain-create-"),
      );
      await copyStarterContents(starterRoot, stagingRoot);
      await validateStagedRepository(stagingRoot);

      try {
        const targetStats = await lstat(canonicalRoot);

        if (
          targetStats.isSymbolicLink() ||
          !targetStats.isDirectory() ||
          (await readdir(canonicalRoot)).length > 0
        ) {
          throw new Error(
            "The selected target is no longer an empty directory.",
          );
        }

        backupRoot = await mkdtemp(
          join(canonicalParent, ".galaxy-brain-create-backup-"),
        );
        await rm(backupRoot, { recursive: true, force: true });
        await rename(canonicalRoot, backupRoot);
        existingTargetMoved = true;
      } catch (error: unknown) {
        if (!isErrnoException(error) || error.code !== "ENOENT") {
          throw error;
        }
      }

      await rename(stagingRoot, canonicalRoot);
      stagingRoot = undefined;
      repositoryInstalled = true;

      if (backupRoot !== undefined) {
        await rm(backupRoot, { recursive: true, force: true });
        backupRoot = undefined;
      }

      return { outcome: "created", repositoryPath: canonicalRoot };
    } catch {
      if (
        existingTargetMoved &&
        !repositoryInstalled &&
        backupRoot !== undefined &&
        canonicalRoot !== undefined
      ) {
        try {
          await rename(backupRoot, canonicalRoot);
          backupRoot = undefined;
        } catch {
          // Keep the backup in place rather than deleting user content when
          // restoration itself cannot complete.
          preserveBackup = true;
        }
      }

      return operationFailed();
    } finally {
      if (stagingRoot !== undefined) {
        await rm(stagingRoot, { recursive: true, force: true });
      }

      if (backupRoot !== undefined && !preserveBackup) {
        await rm(backupRoot, { recursive: true, force: true });
      }
    }
  },
  openAt: async (requestedPath): Promise<RepositoryOperationOutcome> => {
    const requestedRoot = resolve(requestedPath);

    try {
      const parentStats = await lstat(dirname(requestedRoot));

      if (parentStats.isSymbolicLink()) {
        return unsafeTarget();
      }

      if (!parentStats.isDirectory()) {
        return targetUnavailable();
      }

      const canonicalParent = await realpath(dirname(requestedRoot));
      const canonicalRoot = join(canonicalParent, basename(requestedRoot));

      const targetStats = await lstat(canonicalRoot);

      if (targetStats.isSymbolicLink()) {
        return unsafeTarget();
      }

      if (!targetStats.isDirectory()) {
        return invalidFormat();
      }

      await validateNoSymlinks(canonicalRoot);
      await validateStagedRepository(canonicalRoot);

      return { outcome: "opened", repositoryPath: canonicalRoot };
    } catch (error: unknown) {
      if (error instanceof UnsafeRepositoryTargetError) {
        return unsafeTarget();
      }

      if (error instanceof InvalidRepositoryFormatError) {
        return invalidFormat();
      }

      if (isErrnoException(error) && error.code === "ENOENT") {
        return targetUnavailable();
      }

      return operationFailed();
    }
  },
});
