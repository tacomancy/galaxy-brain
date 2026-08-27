import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { WorkbenchSessionState } from "../../modules/workbench-session";

interface PersistedWorkbenchSession {
  selectedRepositoryPath: string;
}

const isPersistedWorkbenchSession = (
  value: unknown,
): value is PersistedWorkbenchSession => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // The object check above narrows only to object; this local structural
  // assertion is the smallest shape needed to validate untrusted JSON.
  const selectedRepositoryPath = (value as { selectedRepositoryPath?: unknown })
    .selectedRepositoryPath;

  return (
    typeof selectedRepositoryPath === "string" &&
    selectedRepositoryPath.length > 0
  );
};

/**
 * Stores only the explicitly selected repository root outside the portable
 * Knowledge Repository. Malformed or unavailable state behaves like a first
 * launch; Workbench Session validates a readable path before selecting it.
 */
export const createFileBackedWorkbenchSessionState = (
  sessionStatePath: string,
): WorkbenchSessionState => ({
  readSelectedRepository: async () => {
    try {
      const parsed: unknown = JSON.parse(
        await readFile(sessionStatePath, "utf8"),
      );

      return isPersistedWorkbenchSession(parsed)
        ? parsed.selectedRepositoryPath
        : undefined;
    } catch {
      return undefined;
    }
  },
  writeSelectedRepository: async (repositoryPath) => {
    await mkdir(dirname(sessionStatePath), { recursive: true });
    const temporaryPath = `${sessionStatePath}.tmp`;

    await writeFile(
      temporaryPath,
      `${JSON.stringify({ selectedRepositoryPath: repositoryPath })}\n`,
      "utf8",
    );
    await rename(temporaryPath, sessionStatePath);
  },
});
