import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type {
  ReadingPosition,
  WorkbenchSessionSnapshot,
  WorkbenchSessionState,
  WorkbenchWorkspace,
} from "../../modules/workbench-session";

interface PersistedWorkbenchSession {
  selectedRepositoryPath: string;
  activeWorkspace?: WorkbenchWorkspace;
  readingPosition?: ReadingPosition;
}

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
    isReadingPosition(value.readingPosition)
  );
};

/**
 * Stores exact-root resume and active-work convenience state outside the
 * portable Knowledge Repository. Malformed or unavailable state behaves like
 * a first launch; Workbench Session validates a readable path before using it.
 */
export const createFileBackedWorkbenchSessionState = (
  sessionStatePath: string,
): WorkbenchSessionState => ({
  readSession: async (): Promise<WorkbenchSessionSnapshot | undefined> => {
    try {
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
        ...(parsed.readingPosition === undefined
          ? {}
          : { readingPosition: parsed.readingPosition }),
      };
    } catch {
      return undefined;
    }
  },
  writeSession: async (snapshot) => {
    await mkdir(dirname(sessionStatePath), { recursive: true });
    const temporaryPath = `${sessionStatePath}.tmp`;

    await writeFile(temporaryPath, `${JSON.stringify(snapshot)}\n`, "utf8");
    await rename(temporaryPath, sessionStatePath);
  },
});
