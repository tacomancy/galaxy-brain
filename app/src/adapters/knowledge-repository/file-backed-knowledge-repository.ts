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

class UnsupportedRepositoryFormatError extends Error {}

/**
 * Narrow external-filesystem seam used to verify transaction recovery. The
 * application composition uses the real fs/promises operations by default.
 */
export interface KnowledgeRepositoryFileSystem {
  rename: typeof rename;
  rm: typeof rm;
}

const defaultFileSystem: KnowledgeRepositoryFileSystem = { rename, rm };

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

const stripYamlComment = (line: string): string => {
  let quote: "single" | "double" | undefined;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const previousCharacter = line[index - 1];

    if (quote === "double" && character === "\\") {
      index += 1;
      continue;
    }

    if (
      character === "'" &&
      quote === undefined &&
      (previousCharacter === undefined || /\s|:/.test(previousCharacter))
    ) {
      quote = "single";
      continue;
    }

    if (
      character === '"' &&
      quote === undefined &&
      (previousCharacter === undefined || /\s|:/.test(previousCharacter))
    ) {
      quote = "double";
      continue;
    }

    if (character === "'" && quote === "single") {
      if (line[index + 1] === "'") {
        index += 1;
      } else {
        quote = undefined;
      }
      continue;
    }

    if (character === '"' && quote === "double") {
      quote = undefined;
      continue;
    }

    if (
      character === "#" &&
      (previousCharacter === undefined || /\s/.test(previousCharacter))
    ) {
      return line.slice(0, index);
    }
  }

  if (quote !== undefined) {
    throw new InvalidRepositoryFormatError(
      "The repository manifest contains an unterminated scalar.",
    );
  }

  return line;
};

const parseYamlScalar = (value: string): string => {
  const trimmedValue = value.trim();

  if (
    trimmedValue === "" ||
    trimmedValue.startsWith("[") ||
    trimmedValue.startsWith("{") ||
    trimmedValue.startsWith("&") ||
    trimmedValue.startsWith("*") ||
    trimmedValue.startsWith("!") ||
    trimmedValue.startsWith("|") ||
    trimmedValue.startsWith(">")
  ) {
    throw new InvalidRepositoryFormatError(
      "The repository manifest contains a non-scalar value.",
    );
  }

  if (trimmedValue.startsWith("'")) {
    if (!trimmedValue.endsWith("'") || trimmedValue.length < 2) {
      throw new InvalidRepositoryFormatError(
        "The repository manifest contains an invalid quoted scalar.",
      );
    }

    return trimmedValue.slice(1, -1).replace(/''/g, "'");
  }

  if (trimmedValue.startsWith('"')) {
    try {
      const parsedValue: unknown = JSON.parse(trimmedValue);

      if (typeof parsedValue !== "string") {
        throw new Error("The quoted value is not a string.");
      }

      return parsedValue;
    } catch {
      throw new InvalidRepositoryFormatError(
        "The repository manifest contains an invalid quoted scalar.",
      );
    }
  }

  return trimmedValue;
};

const parseManifest = (
  manifest: string,
): {
  format: string;
  formatVersion: number;
} => {
  const entries = new Map<string, string>();
  const manifestWithoutBom = manifest.replace(/^\uFEFF/, "");

  for (const line of manifestWithoutBom.split(/\r?\n/)) {
    const content = stripYamlComment(line).trim();

    if (content === "") {
      continue;
    }

    if (content === "---" || content === "...") {
      throw new InvalidRepositoryFormatError(
        "The repository manifest contains multiple YAML documents.",
      );
    }

    const match =
      /^(?<key>[A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]+(?<value>.*))?$/.exec(content);

    if (match?.groups?.key === undefined || match.groups.value === undefined) {
      throw new InvalidRepositoryFormatError(
        "The repository manifest is malformed.",
      );
    }

    if (entries.has(match.groups.key)) {
      throw new InvalidRepositoryFormatError(
        "The repository manifest contains a duplicate key.",
      );
    }

    entries.set(match.groups.key, parseYamlScalar(match.groups.value));
  }

  const format = entries.get("format");
  const formatVersionValue = entries.get("format_version");

  if (format === undefined || formatVersionValue === undefined) {
    throw new InvalidRepositoryFormatError(
      "The repository manifest is missing a required declaration.",
    );
  }

  if (!/^\d+$/.test(formatVersionValue)) {
    throw new InvalidRepositoryFormatError(
      "The repository format version is not a positive integer.",
    );
  }

  const formatVersion = Number(formatVersionValue);

  if (!Number.isSafeInteger(formatVersion) || formatVersion < 1) {
    throw new InvalidRepositoryFormatError(
      "The repository format version is not a positive integer.",
    );
  }

  return { format, formatVersion };
};

const readManifest = async (
  repositoryPath: string,
): Promise<{
  format: string;
  formatVersion: number;
}> => {
  try {
    return parseManifest(
      await readFile(join(repositoryPath, "galaxy-brain.yaml"), "utf8"),
    );
  } catch (error: unknown) {
    if (error instanceof InvalidRepositoryFormatError) {
      throw error;
    }

    throw new InvalidRepositoryFormatError(
      "The repository manifest is missing or unreadable.",
    );
  }
};

const validateRepositoryRoots = async (
  repositoryPath: string,
): Promise<void> => {
  for (const root of canonicalRoots) {
    let stats: Awaited<ReturnType<typeof lstat>>;

    try {
      stats = await lstat(join(repositoryPath, root));
    } catch {
      throw new InvalidRepositoryFormatError(
        "A canonical repository root is missing or unreadable.",
      );
    }

    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new InvalidRepositoryFormatError(
        "The repository has an invalid canonical root.",
      );
    }
  }
};

const validateStagedRepository = async (stagedPath: string): Promise<void> => {
  const { format, formatVersion } = await readManifest(stagedPath);

  if (format !== "galaxy-brain" || formatVersion !== 1) {
    throw new InvalidRepositoryFormatError(
      "The starter skeleton has an invalid repository manifest.",
    );
  }

  await validateRepositoryRoots(stagedPath);
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

const unsupportedFormat = (): RepositoryOperationOutcome => ({
  outcome: "unsupported-format",
  detail: "The selected target uses an unsupported repository format.",
});

const openingFailed = (): RepositoryOperationOutcome => ({
  outcome: "operation-failed",
  detail: "The Knowledge Repository could not be opened.",
});

/**
 * Creates Knowledge Repositories from the bundled empty starter skeleton.
 * Creation is staged in a temporary sibling and selects the destination only
 * after validation and the final rename succeed.
 */
export const createFileBackedKnowledgeRepository = (
  starterRoot: string,
  filesystem: KnowledgeRepositoryFileSystem = defaultFileSystem,
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
      let parentStats: Awaited<ReturnType<typeof lstat>>;

      try {
        parentStats = await lstat(dirname(requestedRoot));
      } catch (error: unknown) {
        if (isErrnoException(error) && error.code === "ENOENT") {
          return targetUnavailable();
        }

        throw error;
      }

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
        await filesystem.rm(backupRoot, { recursive: true, force: true });
        await filesystem.rename(canonicalRoot, backupRoot);
        existingTargetMoved = true;
      } catch (error: unknown) {
        if (!isErrnoException(error) || error.code !== "ENOENT") {
          throw error;
        }
      }

      await filesystem.rename(stagingRoot, canonicalRoot);
      stagingRoot = undefined;
      repositoryInstalled = true;

      if (backupRoot !== undefined) {
        // Placement is the commit point. Cleanup is best effort afterward;
        // reporting failure here would leave callers believing that no
        // repository was installed even though the final rename succeeded.
        const completedBackup = backupRoot;
        backupRoot = undefined;
        await filesystem
          .rm(completedBackup, { recursive: true, force: true })
          .catch(() => undefined);
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
          await filesystem.rename(backupRoot, canonicalRoot);
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
        await filesystem.rm(stagingRoot, { recursive: true, force: true });
      }

      if (backupRoot !== undefined && !preserveBackup) {
        await filesystem.rm(backupRoot, { recursive: true, force: true });
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
      const { format, formatVersion } = await readManifest(canonicalRoot);

      if (format !== "galaxy-brain") {
        throw new UnsupportedRepositoryFormatError();
      }

      await validateRepositoryRoots(canonicalRoot);

      if (formatVersion > 1) {
        return {
          outcome: "read-only-compatible",
          repositoryPath: canonicalRoot,
        };
      }

      return { outcome: "opened", repositoryPath: canonicalRoot };
    } catch (error: unknown) {
      if (error instanceof UnsafeRepositoryTargetError) {
        return unsafeTarget();
      }

      if (error instanceof InvalidRepositoryFormatError) {
        return invalidFormat();
      }

      if (error instanceof UnsupportedRepositoryFormatError) {
        return unsupportedFormat();
      }

      if (isErrnoException(error) && error.code === "ENOENT") {
        return targetUnavailable();
      }

      return openingFailed();
    }
  },
});
