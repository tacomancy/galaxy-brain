/**
 * Filesystem transaction Adapter. It stages a unique sibling, rechecks the
 * target fingerprint immediately before rename, and removes the staged file
 * on failure so an interrupted write cannot silently replace the target.
 */
import { randomUUID } from "node:crypto";
import { readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

/** Filesystem operations required to stage and atomically replace one file. */
export interface AtomicFileSystem {
  readdir: (
    path: string,
    options: { encoding: "utf8"; withFileTypes: true },
  ) => Promise<ReadonlyArray<{ name: string; isFile(): boolean }>>;
  rename: typeof rename;
  rm: typeof rm;
  writeFile: typeof writeFile;
}

/** Default filesystem Adapter used by atomic repository writes. */
export const defaultAtomicFileSystem: AtomicFileSystem = {
  readdir,
  rename,
  rm,
  writeFile,
};

class ExternalFileChangeError extends Error {}

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

const temporaryFilePrefix = ".galaxy-brain-atomic-";

/**
 * Removes abandoned atomic-write temporary files for one target.
 * @param directoryPath The directory containing the target.
 * @param targetFilePath The target whose temporary files should be removed.
 * @param filesystem The filesystem Adapter used for discovery and cleanup.
 * @returns The completed cleanup operation.
 * @throws The underlying filesystem error when discovery fails unexpectedly.
 */
export const discardAbandonedTemporaryFiles = async (
  directoryPath: string,
  targetFilePath: string,
  filesystem: AtomicFileSystem = defaultAtomicFileSystem,
): Promise<void> => {
  let entries: ReadonlyArray<{ name: string; isFile(): boolean }>;

  try {
    entries = await filesystem.readdir(directoryPath, {
      encoding: "utf8",
      withFileTypes: true,
    });
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return;
    }

    throw error;
  }

  const prefix = temporaryFilePrefix;
  const legacyTemporaryName = `${basename(targetFilePath)}.tmp`;

  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() &&
          (entry.name.startsWith(prefix) || entry.name === legacyTemporaryName),
      )
      .map((entry) =>
        filesystem
          .rm(join(directoryPath, entry.name), { force: true })
          .catch(() => undefined),
      ),
  );
};

/** Inputs for one optimistic, atomic file replacement. */
export interface AtomicFileWriteOptions {
  contents: string;
  externalChangeDetail?: string;
  expectedFingerprint: string | undefined;
  filePath: string;
  filesystem?: AtomicFileSystem;
  readFingerprint: () => Promise<string | undefined>;
}

/**
 * Stages UTF-8 content in a unique sibling file and atomically replaces the
 * destination after the caller's final external-change check. A failed write
 * or replacement leaves the previous destination untouched; a recognized
 * temporary file can be discarded on the next read.
 * @param input The content, target, expected fingerprint, and filesystem Adapter.
 * @returns The completed atomic replacement.
 * @throws The external-change or filesystem error that prevents replacement.
 */
export const writeFileAtomically = async ({
  contents,
  externalChangeDetail = "The file changed while it was being saved.",
  expectedFingerprint,
  filePath,
  filesystem = defaultAtomicFileSystem,
  readFingerprint,
}: AtomicFileWriteOptions): Promise<void> => {
  const temporaryPath = join(
    dirname(filePath),
    `${temporaryFilePrefix}${randomUUID()}.tmp`,
  );

  try {
    await filesystem.writeFile(temporaryPath, contents, {
      encoding: "utf8",
      flag: "wx",
    });

    if ((await readFingerprint()) !== expectedFingerprint) {
      throw new ExternalFileChangeError(externalChangeDetail);
    }

    await filesystem.rename(temporaryPath, filePath);
  } catch (error: unknown) {
    await filesystem.rm(temporaryPath, { force: true }).catch(() => undefined);
    throw error;
  }
};
