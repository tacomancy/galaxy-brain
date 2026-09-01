/**
 * Filesystem persistence Adapter. It keeps explicitly saved result versions
 * and provenance in portable Working Material while validating repository
 * containment and reporting only sanitized storage-failure metadata to
 * main-process diagnostics.
 */
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, realpath } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

import {
  discardAbandonedTemporaryFiles,
  defaultAtomicFileSystem,
  type AtomicFileSystem,
  writeFileAtomically,
} from "../file-backed-atomic-write";
import type {
  SynthesisContextSnapshot,
  SynthesisHumanEdit,
  SynthesisResultReadOutcome,
  SynthesisResultListReadOutcome,
  SynthesisResultRepository,
  SynthesisSavedResult,
} from "../../modules/source-processing";

/** Sanitized operational metadata retained by the main-process diagnostic sink. */
export type SynthesisResultDiagnostic = {
  category: "filesystem";
  operation: "read-repository" | "read-result" | "read-results";
};

/** Internal sink for sanitized metadata that must not enter caller outcomes. */
export interface SynthesisResultDiagnostics {
  record(diagnostic: SynthesisResultDiagnostic): void;
}

const resultDirectoryName = join("scratch", "synthesis-results");

class InvalidSynthesisResultError extends Error {}

class UnsafeSynthesisResultTargetError extends Error {}

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

const isSourceContextReference = (value: unknown): boolean =>
  isRecord(value) &&
  isNonEmptyString(value.annotationId) &&
  isSourceRecord(value.sourceRecord) &&
  isNonEmptyString(value.sourceLocator) &&
  value.attribution === "source-claim" &&
  value.classification === "source-claim";

const isHumanEdit = (value: unknown): value is SynthesisHumanEdit =>
  isRecord(value) &&
  value.attribution === "human-authored" &&
  isNonEmptyString(value.editedAt) &&
  Array.isArray(value.changedFields) &&
  value.changedFields.length > 0 &&
  value.changedFields.every((field) => field === "title" || field === "text");

const isPositiveInteger = (value: unknown): boolean =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;

const isOptionalNonEmptyString = (value: unknown): boolean =>
  value === undefined || isNonEmptyString(value);

const isValidContextSnapshot = (
  value: unknown,
  sourceContext: unknown[],
): boolean => {
  if (value === undefined) {
    return true;
  }

  if (!Array.isArray(value) || !value.every(isContextSnapshot)) {
    return false;
  }

  return value.every((snapshot) =>
    sourceContext.some(
      (source) =>
        isRecord(source) && source.annotationId === snapshot.annotationId,
    ),
  );
};

const isValidSynthesisResultCore = (
  value: Record<string, unknown>,
  provenance: Record<string, unknown>,
  sourceContext: unknown[],
): boolean =>
  isNonEmptyString(value.id) &&
  value.state === "working-material" &&
  isNonEmptyString(value.title) &&
  isNonEmptyString(value.text) &&
  isRecord(value.targetTopic) &&
  isNonEmptyString(value.targetTopic.id) &&
  isNonEmptyString(value.targetTopic.title) &&
  provenance.attribution === "agent-generated" &&
  isNonEmptyString(provenance.provider) &&
  isNonEmptyString(provenance.model) &&
  isNonEmptyString(provenance.generatedAt) &&
  provenance.operation === "synthesize-into-topic" &&
  sourceContext.every(isSourceContextReference);

const isValidSynthesisResultMetadata = (
  value: Record<string, unknown>,
  sourceContext: unknown[],
): boolean =>
  isOptionalNonEmptyString(value.prompt) &&
  isValidContextSnapshot(value.contextSnapshot, sourceContext) &&
  (value.contextSnapshotVersion === undefined ||
    isPositiveInteger(value.contextSnapshotVersion)) &&
  isOptionalNonEmptyString(value.contextSnapshotRefreshedAt) &&
  (value.humanAuthorship === undefined ||
    value.humanAuthorship === "human-authored") &&
  (value.humanEdits === undefined ||
    (Array.isArray(value.humanEdits) && value.humanEdits.every(isHumanEdit))) &&
  (value.resultVersion === undefined ||
    isPositiveInteger(value.resultVersion)) &&
  (value.priorResults === undefined ||
    (Array.isArray(value.priorResults) &&
      value.priorResults.every(isSynthesisSavedResult)));

const isSynthesisSavedResult = (
  value: unknown,
): value is SynthesisSavedResult => {
  if (!isRecord(value) || !isRecord(value.provenance)) {
    return false;
  }

  const sourceContext = value.provenance.sourceContext;

  if (!Array.isArray(sourceContext)) {
    return false;
  }

  return (
    isValidSynthesisResultCore(value, value.provenance, sourceContext) &&
    isValidSynthesisResultMetadata(value, sourceContext)
  );
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

type FileFingerprint = string | undefined;

const readRegularFile = async (filePath: string): Promise<Buffer> => {
  // Open and validate the same descriptor so a path replacement cannot turn
  // the prior safety check into a read of a different file.
  const fileHandle = await open(
    filePath,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );

  try {
    if (!(await fileHandle.stat()).isFile()) {
      throw new UnsafeSynthesisResultTargetError(
        "The Synthesis result target is unsafe.",
      );
    }

    return await fileHandle.readFile();
  } finally {
    await fileHandle.close();
  }
};

const fingerprint = async (filePath: string): Promise<FileFingerprint> => {
  try {
    const contents = await readRegularFile(filePath);
    return createHash("sha256").update(contents).digest("hex");
  } catch (cause: unknown) {
    if (isErrnoException(cause) && cause.code === "ENOENT") {
      return undefined;
    }

    throw cause;
  }
};

const readResultFile = async (
  filePath: string,
  resultId: string,
): Promise<SynthesisSavedResult> => {
  const contents = (await readRegularFile(filePath)).toString("utf8");
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

/**
 * Creates storage for explicitly saved Synthesis results as Working Material.
 * @param repositoryPath The selected Knowledge Repository path.
 * @param diagnostics Optional sink for sanitized operational metadata.
 * @param filesystem The filesystem Adapter used for safe persistence.
 * @returns The Synthesis result repository Adapter.
 */
export const createFileBackedSynthesisResultRepository = (
  repositoryPath: string,
  diagnostics?: SynthesisResultDiagnostics,
  filesystem: AtomicFileSystem = defaultAtomicFileSystem,
): SynthesisResultRepository => {
  const readResult = async (
    resultId: string,
  ): Promise<SynthesisResultReadOutcome> => {
    let canonicalPath: string;

    try {
      canonicalPath = await canonicalRepositoryPath(repositoryPath);
    } catch {
      diagnostics?.record({
        category: "filesystem",
        operation: "read-repository",
      });
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

      await discardAbandonedTemporaryFiles(
        resultDirectory,
        resultFilePath(canonicalPath, resultId),
        filesystem,
      );

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

      diagnostics?.record({
        category: "filesystem",
        operation: "read-result",
      });
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
      await writeFileAtomically({
        contents: serializeResult(result),
        externalChangeDetail:
          "The Synthesis result changed while it was being saved.",
        expectedFingerprint: existingFingerprint,
        filePath,
        filesystem,
        readFingerprint: () => fingerprint(filePath),
      });
    },
    readResult,
    readResults: async (): Promise<SynthesisResultListReadOutcome> => {
      let canonicalPath: string;

      try {
        canonicalPath = await canonicalRepositoryPath(repositoryPath);
      } catch {
        diagnostics?.record({
          category: "filesystem",
          operation: "read-repository",
        });
        return {
          outcome: "unavailable",
          detail: "The Knowledge Repository could not be read.",
        };
      }

      let entries: {
        name: string;
        isFile(): boolean;
        isSymbolicLink(): boolean;
      }[];

      try {
        const resultDirectory = await readResultDirectory(canonicalPath);

        if (resultDirectory === undefined) {
          return { outcome: "found", results: [] };
        }

        await discardAbandonedTemporaryFiles(
          resultDirectory,
          join(resultDirectory, "result.json"),
          filesystem,
        );
        entries = await readdir(resultDirectory, {
          encoding: "utf8",
          withFileTypes: true,
        });
      } catch {
        diagnostics?.record({
          category: "filesystem",
          operation: "read-results",
        });
        return {
          outcome: "unavailable",
          detail: "The Synthesis results could not be read.",
        };
      }

      const results: SynthesisSavedResult[] = [];

      for (const entry of entries) {
        if (!entry.name.endsWith(".json")) {
          continue;
        }

        if (entry.isSymbolicLink()) {
          diagnostics?.record(
            new UnsafeSynthesisResultTargetError(
              "The Synthesis result directory contains a symbolic link.",
            ),
          );
          return {
            outcome: "unavailable",
            detail: "The Synthesis results could not be read.",
          };
        }

        if (!entry.isFile()) {
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
        } catch {
          diagnostics?.record({
            category: "filesystem",
            operation: "read-result",
          });
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
