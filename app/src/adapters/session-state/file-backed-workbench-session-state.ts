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

const isPersistedWorkbenchSession = (
  value: unknown,
): value is PersistedWorkbenchSession => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // The object check above narrows only to object; this local structural
  // assertion is the smallest shape needed to validate untrusted JSON.
  const persisted = value as {
    selectedRepositoryPath?: unknown;
    activeWorkspace?: unknown;
    readingPosition?: unknown;
  };
  const selectedRepositoryPath = persisted.selectedRepositoryPath;

  const activeWorkspace = persisted.activeWorkspace;
  const hasValidWorkspace =
    activeWorkspace === undefined ||
    activeWorkspace === "atlas" ||
    activeWorkspace === "studio" ||
    activeWorkspace === "paper-desk";

  const readingPosition = persisted.readingPosition;
  const hasValidReadingPosition =
    readingPosition === undefined ||
    (typeof readingPosition === "object" &&
      readingPosition !== null &&
      typeof (readingPosition as { sourceRecordId?: unknown })
        .sourceRecordId === "string" &&
      (readingPosition as { sourceRecordId: string }).sourceRecordId.length >
        0 &&
      Number.isInteger((readingPosition as { page?: unknown }).page) &&
      (readingPosition as { page: number }).page > 0 &&
      Number.isInteger(
        (readingPosition as { characterOffset?: unknown }).characterOffset,
      ) &&
      (readingPosition as { characterOffset: number }).characterOffset >= 0);

  return (
    typeof selectedRepositoryPath === "string" &&
    selectedRepositoryPath.length > 0 &&
    hasValidWorkspace &&
    hasValidReadingPosition
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
