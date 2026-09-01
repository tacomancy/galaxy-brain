import { access } from "node:fs/promises";

import type { MCDCManifest } from "./mcdc";

/**
 * Checks one app-relative path. It returns false only for a missing path and
 * rejects for other filesystem failures so callers retain meaningful errors.
 */
export type FileExists = (path: string) => Promise<boolean>;

const isMissingFileError = (error: unknown): error is { code: string } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: unknown }).code === "ENOENT";

const fileExists: FileExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch (error: unknown) {
    if (isMissingFileError(error)) {
      return false;
    }
    throw error;
  }
};

/**
 * Returns decision/path pairs whose declared implementation files are absent.
 * The default checks the local filesystem; tests may provide a narrow file
 * existence Adapter without reproducing filesystem behavior.
 */
export const findMissingImplementationFiles = async (
  manifest: MCDCManifest,
  exists: FileExists = fileExists,
): Promise<string[]> => {
  const missing: string[] = [];
  for (const decision of manifest.decisions) {
    for (const implementationFile of decision.implementationFiles) {
      if (!(await exists(implementationFile))) {
        missing.push(`${decision.id}: ${implementationFile}`);
      }
    }
  }
  return missing;
};
