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
