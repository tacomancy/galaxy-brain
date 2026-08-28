/** Filesystem persistence Adapter; comments preserve recoverable session writes. */
import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  discardAbandonedTemporaryFiles,
  defaultAtomicFileSystem,
  type AtomicFileSystem,
  writeFileAtomically,
} from "../file-backed-atomic-write";
import type {
  ReadingPosition,
  WorkbenchContextSelection,
  WorkbenchSessionSnapshot,
  WorkbenchSessionState,
  WorkbenchWorkspace,
} from "../../modules/workbench-session";

interface PersistedWorkbenchSession {
  selectedRepositoryPath: string;
  activeWorkspace?: WorkbenchWorkspace;
  selectedContext?: WorkbenchContextSelection;
  readingPosition?: ReadingPosition;
}

/** Filesystem operations used by the session-state durability contract. */
export interface WorkbenchSessionStateFileSystem extends AtomicFileSystem {
  mkdir: typeof mkdir;
}

const defaultFileSystem: WorkbenchSessionStateFileSystem = {
  ...defaultAtomicFileSystem,
  mkdir,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isWorkbenchWorkspace = (value: unknown): value is WorkbenchWorkspace =>
  value === undefined ||
  value === "atlas" ||
  value === "studio" ||
  value === "paper-desk";

const isReadingPosition = (value: unknown): value is ReadingPosition => {
  if (value === undefined) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  const page = value.page;
  const characterOffset = value.characterOffset;

  return (
    typeof value.sourceRecordId === "string" &&
    value.sourceRecordId.length > 0 &&
    typeof page === "number" &&
    Number.isInteger(page) &&
    page > 0 &&
    typeof characterOffset === "number" &&
    Number.isInteger(characterOffset) &&
    characterOffset >= 0
  );
};

const isContextSelection = (
  value: unknown,
): value is WorkbenchContextSelection => {
  if (value === undefined) {
    return true;
  }

  return (
    isRecord(value) &&
    typeof value.topicId === "string" &&
    value.topicId.length > 0 &&
    typeof value.sourceRecordId === "string" &&
    value.sourceRecordId.length > 0
  );
};

const isPersistedWorkbenchSession = (
  value: unknown,
): value is PersistedWorkbenchSession => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.selectedRepositoryPath === "string" &&
    value.selectedRepositoryPath.length > 0 &&
    isWorkbenchWorkspace(value.activeWorkspace) &&
    isContextSelection(value.selectedContext) &&
    isReadingPosition(value.readingPosition)
  );
};

const fingerprint = async (filePath: string): Promise<string | undefined> => {
  try {
    return createHash("sha256")
      .update(await readFile(filePath))
      .digest("hex");
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
};

/**
 * Stores exact-root resume and active-work convenience state outside the
 * portable Knowledge Repository. Malformed or unavailable state behaves like
 * a first launch; Workbench Session validates a readable path before using it.
 * @param sessionStatePath The machine-local session-state file path.
 * @param filesystem The filesystem Adapter used for atomic persistence.
 * @returns The file-backed Workbench Session State Adapter.
 */
export const createFileBackedWorkbenchSessionState = (
  sessionStatePath: string,
  filesystem: WorkbenchSessionStateFileSystem = defaultFileSystem,
): WorkbenchSessionState => {
  let writeQueue = Promise.resolve();

  const readSession = async (): Promise<
    WorkbenchSessionSnapshot | undefined
  > => {
    try {
      await discardAbandonedTemporaryFiles(
        dirname(sessionStatePath),
        sessionStatePath,
        filesystem,
      );
      const parsed: unknown = JSON.parse(
        await readFile(sessionStatePath, "utf8"),
      );

      if (!isPersistedWorkbenchSession(parsed)) {
        return undefined;
      }

      return {
        selectedRepositoryPath: parsed.selectedRepositoryPath,
        ...(parsed.activeWorkspace === undefined
          ? {}
          : { activeWorkspace: parsed.activeWorkspace }),
        ...(parsed.selectedContext === undefined
          ? {}
          : { selectedContext: parsed.selectedContext }),
        ...(parsed.readingPosition === undefined
          ? {}
          : { readingPosition: parsed.readingPosition }),
      };
    } catch {
      return undefined;
    }
  };

  const persistSession = async (
    snapshot: WorkbenchSessionSnapshot,
  ): Promise<void> => {
    await filesystem.mkdir(dirname(sessionStatePath), { recursive: true });
    const expectedFingerprint = await fingerprint(sessionStatePath);

    await writeFileAtomically({
      contents: `${JSON.stringify(snapshot)}\n`,
      externalChangeDetail:
        "The Workbench session state changed while it was being saved.",
      expectedFingerprint,
      filePath: sessionStatePath,
      filesystem,
      readFingerprint: () => fingerprint(sessionStatePath),
    });
  };

  return {
    readSession,
    writeSession: (snapshot) => {
      const operation = writeQueue.then(() => persistSession(snapshot));
      writeQueue = operation.then(
        () => undefined,
        () => undefined,
      );
      return operation;
    },
  };
};
