import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  writeFile,
} from "node:fs/promises";
import { join, resolve, sep } from "node:path";

import type {
  SynthesisContextSnapshot,
  SynthesisHumanEdit,
  SynthesisResultReadOutcome,
  SynthesisResultListReadOutcome,
  SynthesisResultRepository,
  SynthesisSavedResult,
} from "../../modules/source-processing";

/** Internal sink for causes that must not enter caller-visible outcomes. */
export interface SynthesisResultDiagnostics {
  record(cause: unknown): void;
}

const resultDirectoryName = join("scratch", "synthesis-results");

class InvalidSynthesisResultError extends Error {}

class UnsafeSynthesisResultTargetError extends Error {}

class ExternalSynthesisResultChangeError extends Error {}

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isSourceRecord = (value: unknown): boolean =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.title);

const isContextSnapshot = (value: unknown): value is SynthesisContextSnapshot =>
  isRecord(value) &&
  isNonEmptyString(value.annotationId) &&
  isSourceRecord(value.sourceRecord) &&
  isNonEmptyString(value.sourceLocator) &&
  isNonEmptyString(value.sourceIdentity) &&
  isNonEmptyString(value.contentIdentity) &&
  isNonEmptyString(value.summary);

const isHumanEdit = (value: unknown): value is SynthesisHumanEdit =>
  isRecord(value) &&
  value.attribution === "human-authored" &&
  isNonEmptyString(value.editedAt) &&
  Array.isArray(value.changedFields) &&
  value.changedFields.length > 0 &&
  value.changedFields.every((field) => field === "title" || field === "text");

const isSynthesisSavedResult = (
  value: unknown,
): value is SynthesisSavedResult => {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    value.state !== "working-material" ||
    !isNonEmptyString(value.title) ||
    !isNonEmptyString(value.text) ||
    !isRecord(value.targetTopic) ||
    !isNonEmptyString(value.targetTopic.id) ||
    !isNonEmptyString(value.targetTopic.title) ||
    !isRecord(value.provenance) ||
    value.provenance.attribution !== "agent-generated" ||
    !isNonEmptyString(value.provenance.provider) ||
    !isNonEmptyString(value.provenance.model) ||
    !isNonEmptyString(value.provenance.generatedAt) ||
    value.provenance.operation !== "synthesize-into-topic" ||
    !Array.isArray(value.provenance.sourceContext)
  ) {
    return false;
  }

  if (
    value.prompt !== undefined &&
    (typeof value.prompt !== "string" || value.prompt.length === 0)
  ) {
    return false;
  }

  if (
    value.contextSnapshot !== undefined &&
    (!Array.isArray(value.contextSnapshot) ||
      !value.contextSnapshot.every(isContextSnapshot))
  ) {
    return false;
  }

  if (
    value.contextSnapshotVersion !== undefined &&
    (typeof value.contextSnapshotVersion !== "number" ||
      !Number.isSafeInteger(value.contextSnapshotVersion) ||
      value.contextSnapshotVersion <= 0)
  ) {
    return false;
  }

  if (
    value.contextSnapshotRefreshedAt !== undefined &&
    !isNonEmptyString(value.contextSnapshotRefreshedAt)
  ) {
    return false;
  }

  if (
    value.humanAuthorship !== undefined &&
    value.humanAuthorship !== "human-authored"
  ) {
    return false;
  }

  if (
    value.humanEdits !== undefined &&
    (!Array.isArray(value.humanEdits) || !value.humanEdits.every(isHumanEdit))
  ) {
    return false;
  }

  if (
    value.resultVersion !== undefined &&
    (typeof value.resultVersion !== "number" ||
      !Number.isSafeInteger(value.resultVersion) ||
      value.resultVersion <= 0)
  ) {
    return false;
  }

  if (
    value.priorResults !== undefined &&
    (!Array.isArray(value.priorResults) ||
      !value.priorResults.every(isSynthesisSavedResult))
  ) {
    return false;
  }

  return true;
};

const resultFilePath = (
  canonicalRepositoryPath: string,
  resultId: string,
): string => {
  if (!/^[a-z0-9-]+$/.test(resultId)) {
    throw new InvalidSynthesisResultError("The result identity is invalid.");
  }

  const resultDirectory = resolve(canonicalRepositoryPath, resultDirectoryName);
  const filePath = resolve(resultDirectory, `${resultId}.json`);

  if (!filePath.startsWith(`${resultDirectory}${sep}`)) {
    throw new InvalidSynthesisResultError(
      "The result path escapes the Knowledge Repository.",
    );
  }

  return filePath;
};

const serializeResult = (result: SynthesisSavedResult): string =>
  `${JSON.stringify(result, null, 2)}\n`;

const canonicalRepositoryPath = async (
  repositoryPath: string,
): Promise<string> => {
  const stats = await lstat(repositoryPath);

  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new UnsafeSynthesisResultTargetError(
      "The selected Knowledge Repository is not a safe directory.",
    );
  }

  const canonicalPath = await realpath(repositoryPath);
  const scratchStats = await lstat(join(canonicalPath, "scratch"));

  if (scratchStats.isSymbolicLink() || !scratchStats.isDirectory()) {
    throw new UnsafeSynthesisResultTargetError(
      "The Knowledge Repository scratch directory is unsafe.",
    );
  }

  return canonicalPath;
};

const ensureResultDirectory = async (
  canonicalPath: string,
): Promise<string> => {
  const resultDirectory = resolve(canonicalPath, resultDirectoryName);

  try {
    const stats = await lstat(resultDirectory);

    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new UnsafeSynthesisResultTargetError(
        "The Synthesis result directory is unsafe.",
      );
    }
  } catch (cause: unknown) {
    if (!isErrnoException(cause) || cause.code !== "ENOENT") {
      throw cause;
    }

    await mkdir(resultDirectory);
  }

  return resultDirectory;
};

const readResultDirectory = async (
  canonicalPath: string,
): Promise<string | undefined> => {
  const resultDirectory = resolve(canonicalPath, resultDirectoryName);

  try {
    const stats = await lstat(resultDirectory);

    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new UnsafeSynthesisResultTargetError(
        "The Synthesis result directory is unsafe.",
      );
    }

    return resultDirectory;
  } catch (cause: unknown) {
    if (isErrnoException(cause) && cause.code === "ENOENT") {
      return undefined;
    }

    throw cause;
  }
};

type FileFingerprint = { digest: string } | undefined;

const fingerprint = async (filePath: string): Promise<FileFingerprint> => {
  try {
    const stats = await lstat(filePath);

    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new UnsafeSynthesisResultTargetError(
        "The Synthesis result target is unsafe.",
      );
    }

    const contents = await readFile(filePath);
    return { digest: createHash("sha256").update(contents).digest("hex") };
  } catch (cause: unknown) {
    if (isErrnoException(cause) && cause.code === "ENOENT") {
      return undefined;
    }

    throw cause;
  }
};

const sameFingerprint = (
  left: FileFingerprint,
  right: FileFingerprint,
): boolean => left?.digest === right?.digest;

const readResultFile = async (
  filePath: string,
  resultId: string,
): Promise<SynthesisSavedResult> => {
  const contents = await readFile(filePath, "utf8");
  let parsed: unknown;

  try {
    parsed = JSON.parse(contents) as unknown;
  } catch {
    throw new InvalidSynthesisResultError(
      "The Synthesis result JSON is invalid.",
    );
  }

  if (!isSynthesisSavedResult(parsed) || parsed.id !== resultId) {
    throw new InvalidSynthesisResultError(
      "The Synthesis result metadata is invalid.",
    );
  }

  return parsed;
};

/** Persists explicitly saved Synthesis results as portable Working Material. */
export const createFileBackedSynthesisResultRepository = (
  repositoryPath: string,
  diagnostics?: SynthesisResultDiagnostics,
): SynthesisResultRepository => {
  const readResult = async (
    resultId: string,
  ): Promise<SynthesisResultReadOutcome> => {
    let canonicalPath: string;

    try {
      canonicalPath = await canonicalRepositoryPath(repositoryPath);
    } catch (cause: unknown) {
      diagnostics?.record(cause);
      return {
        outcome: "unavailable",
        detail: "The Knowledge Repository could not be read.",
      };
    }

    try {
      const resultDirectory = await readResultDirectory(canonicalPath);

      if (resultDirectory === undefined) {
        return {
          outcome: "not-found",
          detail: "The Synthesis result was not found.",
        };
      }

      const result = await readResultFile(
        resultFilePath(canonicalPath, resultId),
        resultId,
      );
      return { outcome: "found", result };
    } catch (cause: unknown) {
      if (isErrnoException(cause) && cause.code === "ENOENT") {
        return {
          outcome: "not-found",
          detail: "The Synthesis result was not found.",
        };
      }

      diagnostics?.record(cause);
      return {
        outcome: "unavailable",
        detail: "The Synthesis result could not be read.",
      };
    }
  };

  return {
    saveResult: async (result): Promise<void> => {
      if (!isSynthesisSavedResult(result)) {
        throw new InvalidSynthesisResultError(
          "The Synthesis result is invalid.",
        );
      }

      const canonicalPath = await canonicalRepositoryPath(repositoryPath);
      await ensureResultDirectory(canonicalPath);
      const filePath = resultFilePath(canonicalPath, result.id);
      const existingFingerprint = await fingerprint(filePath);
      const recheckedFingerprint = await fingerprint(filePath);

      if (!sameFingerprint(existingFingerprint, recheckedFingerprint)) {
        throw new ExternalSynthesisResultChangeError(
          "The Synthesis result changed while it was being saved.",
        );
      }

      await writeFile(filePath, serializeResult(result), "utf8");
    },
    readResult,
    readResults: async (): Promise<SynthesisResultListReadOutcome> => {
      let canonicalPath: string;

      try {
        canonicalPath = await canonicalRepositoryPath(repositoryPath);
      } catch (cause: unknown) {
        diagnostics?.record(cause);
        return {
          outcome: "unavailable",
          detail: "The Knowledge Repository could not be read.",
        };
      }

      let entries: { name: string; isFile(): boolean }[];

      try {
        const resultDirectory = await readResultDirectory(canonicalPath);

        if (resultDirectory === undefined) {
          return { outcome: "found", results: [] };
        }

        entries = await readdir(resultDirectory, {
          encoding: "utf8",
          withFileTypes: true,
        });
      } catch (cause: unknown) {
        diagnostics?.record(cause);
        return {
          outcome: "unavailable",
          detail: "The Synthesis results could not be read.",
        };
      }

      const results: SynthesisSavedResult[] = [];

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".json")) {
          continue;
        }

        const resultId = entry.name.slice(0, -5);
        try {
          results.push(
            await readResultFile(
              resultFilePath(canonicalPath, resultId),
              resultId,
            ),
          );
        } catch (cause: unknown) {
          diagnostics?.record(cause);
          return {
            outcome: "unavailable",
            detail: "The Synthesis results could not be read.",
          };
        }
      }

      return { outcome: "found", results };
    },
  };
};
