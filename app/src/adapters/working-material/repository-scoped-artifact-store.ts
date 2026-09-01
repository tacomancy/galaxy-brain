/**
 * Shared repository-scoped storage mechanics for portable Working Material
 * artifacts. Format-specific Adapters retain their own codecs and caller
 * outcomes; this Module owns only safe filesystem access and durability.
 */
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, realpath } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import {
  defaultAtomicFileSystem,
  discardAbandonedTemporaryFiles,
  type AtomicFileSystem,
  writeFileAtomically,
} from "../file-backed-atomic-write";

/** An entry returned by a repository-scoped artifact directory listing. */
export interface RepositoryArtifactEntry {
  name: string;
  kind: "file" | "symbolic-link" | "other";
}

/** Input for the internal repository-scoped Artifact Store. */
export interface RepositoryScopedArtifactStoreOptions {
  artifactDirectory: string;
  externalChangeDetail: string;
  filesystem?: AtomicFileSystem;
  requiredDirectory: string;
  unsafeDirectoryDetail: string;
  unsafeFileDetail: string;
  unsafeRepositoryDetail: string;
  repositoryPath: string;
}

/** Internal storage Interface shared by format-specific file Adapters. */
export interface RepositoryScopedArtifactStore {
  fingerprint(fileName: string): Promise<string | undefined>;
  readDirectory(
    legacyTemporaryFileName: string,
  ): Promise<ReadonlyArray<RepositoryArtifactEntry> | undefined>;
  readFile(fileName: string): Promise<Buffer>;
  writeFile(input: {
    contents: string;
    expectedFingerprint: string | undefined;
    fileName: string;
  }): Promise<void>;
}

class UnsafeRepositoryArtifactError extends Error {}

class RepositoryScopedArtifactStoreRepositoryError extends Error {}

/**
 * Identifies failures raised while validating the repository root rather than
 * while reading or writing one format-specific artifact.
 * @param error The storage failure to classify.
 * @returns Whether the failure represents an unavailable repository root.
 */
export const isRepositoryScopedArtifactStoreRepositoryError = (
  error: unknown,
): boolean => error instanceof RepositoryScopedArtifactStoreRepositoryError;

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

const isDescendant = (directoryPath: string, filePath: string): boolean => {
  const childPath = relative(directoryPath, filePath);
  return (
    childPath.length > 0 &&
    !childPath.startsWith(`..${sep}`) &&
    childPath !== ".." &&
    !isAbsolute(childPath)
  );
};

const createStoreFileSystem = (filesystem: AtomicFileSystem) => ({
  ...defaultAtomicFileSystem,
  lstat,
  mkdir,
  open,
  realpath,
  ...filesystem,
});

/**
 * Creates a narrow storage Module rooted at one validated repository artifact
 * directory. The directory is configured by the owning format Adapter, while
 * all path, symlink, fingerprint, and atomic-write policy is shared.
 * @param options Repository path, artifact directory, diagnostics, and file system.
 * @returns The internal repository-scoped storage Interface.
 * @throws The underlying filesystem error when a safety check cannot complete.
 */
export const createRepositoryScopedArtifactStore = ({
  artifactDirectory,
  externalChangeDetail,
  filesystem = defaultAtomicFileSystem,
  requiredDirectory,
  unsafeDirectoryDetail,
  unsafeFileDetail,
  unsafeRepositoryDetail,
  repositoryPath,
}: RepositoryScopedArtifactStoreOptions): RepositoryScopedArtifactStore => {
  const fileSystem = createStoreFileSystem(filesystem);
  const directoryParts = artifactDirectory.split(sep).filter(Boolean);
  const requiredDirectoryParts = requiredDirectory.split(sep).filter(Boolean);

  const canonicalRepositoryPath = async (): Promise<string> => {
    try {
      const stats = await fileSystem.lstat(repositoryPath);

      if (stats.isSymbolicLink() || !stats.isDirectory()) {
        throw new UnsafeRepositoryArtifactError(unsafeRepositoryDetail);
      }

      return fileSystem.realpath(repositoryPath);
    } catch (cause: unknown) {
      throw new RepositoryScopedArtifactStoreRepositoryError(
        unsafeRepositoryDetail,
        { cause },
      );
    }
  };

  const artifactDirectoryPath = async (
    createMissing: boolean,
  ): Promise<string | undefined> => {
    const canonicalPath = await canonicalRepositoryPath();
    let currentPath = canonicalPath;

    for (const [index, part] of directoryParts.entries()) {
      currentPath = join(currentPath, part);

      try {
        const stats = await fileSystem.lstat(currentPath);

        if (stats.isSymbolicLink() || !stats.isDirectory()) {
          throw new UnsafeRepositoryArtifactError(unsafeDirectoryDetail);
        }
      } catch (cause: unknown) {
        if (!isErrnoException(cause) || cause.code !== "ENOENT") {
          throw cause;
        }

        if (!createMissing) {
          return undefined;
        }

        if (index < requiredDirectoryParts.length) {
          throw new UnsafeRepositoryArtifactError(unsafeDirectoryDetail);
        }

        await fileSystem.mkdir(currentPath);
      }
    }

    return currentPath;
  };

  const filePath = async (
    fileName: string,
    createDirectory: boolean,
  ): Promise<string> => {
    const directoryPath = await artifactDirectoryPath(createDirectory);

    if (directoryPath === undefined) {
      throw new Error("The repository artifact directory is unavailable.");
    }

    const resolvedFilePath = resolve(directoryPath, fileName);

    if (!isDescendant(directoryPath, resolvedFilePath)) {
      throw new UnsafeRepositoryArtifactError(unsafeFileDetail);
    }

    return resolvedFilePath;
  };

  const readRegularFile = async (targetPath: string): Promise<Buffer> => {
    const fileHandle = await fileSystem.open(
      targetPath,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );

    try {
      if (!(await fileHandle.stat()).isFile()) {
        throw new UnsafeRepositoryArtifactError(unsafeFileDetail);
      }

      return await fileHandle.readFile();
    } finally {
      await fileHandle.close();
    }
  };

  const fingerprint = async (
    targetPath: string,
  ): Promise<string | undefined> => {
    try {
      return createHash("sha256")
        .update(await readRegularFile(targetPath))
        .digest("hex");
    } catch (cause: unknown) {
      if (isErrnoException(cause) && cause.code === "ENOENT") {
        return undefined;
      }

      throw cause;
    }
  };

  return {
    fingerprint: async (fileName): Promise<string | undefined> => {
      const directoryPath = await artifactDirectoryPath(false);

      if (directoryPath === undefined) {
        return undefined;
      }

      return fingerprint(await filePath(fileName, false));
    },
    readDirectory: async (
      legacyTemporaryFileName,
    ): Promise<ReadonlyArray<RepositoryArtifactEntry> | undefined> => {
      const directoryPath = await artifactDirectoryPath(false);

      if (directoryPath === undefined) {
        return undefined;
      }

      await discardAbandonedTemporaryFiles(
        directoryPath,
        join(directoryPath, legacyTemporaryFileName),
        fileSystem,
      );

      const entries = await fileSystem.readdir(directoryPath, {
        encoding: "utf8",
        withFileTypes: true,
      });

      return Promise.all(
        entries.map(async (entry) => {
          const stats = await fileSystem.lstat(join(directoryPath, entry.name));

          return {
            name: entry.name,
            kind: stats.isSymbolicLink()
              ? "symbolic-link"
              : stats.isFile()
                ? "file"
                : "other",
          };
        }),
      );
    },
    readFile: async (fileName): Promise<Buffer> =>
      readRegularFile(await filePath(fileName, false)),
    writeFile: async ({ contents, expectedFingerprint, fileName }) => {
      const targetPath = await filePath(fileName, true);

      await writeFileAtomically({
        contents,
        externalChangeDetail,
        expectedFingerprint,
        filePath: targetPath,
        filesystem: fileSystem,
        readFingerprint: () => fingerprint(targetPath),
      });
    },
  };
};
