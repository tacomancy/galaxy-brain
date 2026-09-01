/**
 * Filesystem persistence Adapter. It keeps explicitly saved result versions
 * and provenance in portable Working Material while validating repository
 * containment and reporting only sanitized storage-failure metadata to
 * main-process diagnostics.
 */
import { join } from "node:path";

import {
  defaultAtomicFileSystem,
  type AtomicFileSystem,
} from "../file-backed-atomic-write";
import {
  createRepositoryScopedArtifactStore,
  isRepositoryScopedArtifactStoreRepositoryError,
} from "./repository-scoped-artifact-store";
import type { RepositoryArtifactEntry } from "./repository-scoped-artifact-store";
import type {
  SynthesisContextSnapshot,
  SynthesisHumanEdit,
  SynthesisResultReadOutcome,
  SynthesisResultListReadOutcome,
  SynthesisResultRepository,
  SynthesisSavedResult,
} from "../../modules/source-processing";

/**
 * Sanitized operational metadata retained by the main-process diagnostic sink.
 * The optional cause is available only to that sink for internal diagnostics;
 * it is never part of a caller outcome or serialized record.
 */
export type SynthesisResultDiagnostic = {
  category: "filesystem";
  operation: "read-repository" | "read-result" | "read-results";
};

/** Internal sink for sanitized metadata that must not enter caller outcomes. */
export interface SynthesisResultDiagnostics {
  record(diagnostic: SynthesisResultDiagnostic, cause?: unknown): void;
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

const resultFileName = (resultId: string): string => {
  if (!/^[a-z0-9-]+$/.test(resultId)) {
    throw new InvalidSynthesisResultError("The result identity is invalid.");
  }

  return `${resultId}.json`;
};

const serializeResult = (result: SynthesisSavedResult): string =>
  `${JSON.stringify(result, null, 2)}\n`;

const readResultFile = async (
  resultId: string,
  readFile: () => Promise<Buffer>,
): Promise<SynthesisSavedResult> => {
  const contents = (await readFile()).toString("utf8");
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
  const artifactStore = createRepositoryScopedArtifactStore({
    artifactDirectory: resultDirectoryName,
    externalChangeDetail:
      "The Synthesis result changed while it was being saved.",
    filesystem,
    requiredDirectory: "scratch",
    repositoryPath,
    unsafeDirectoryDetail: "The Synthesis result directory is unsafe.",
    unsafeFileDetail: "The Synthesis result target is unsafe.",
    unsafeRepositoryDetail:
      "The selected Knowledge Repository is not a safe directory.",
  });

  const readResult = async (
    resultId: string,
  ): Promise<SynthesisResultReadOutcome> => {
    try {
      const entries = await artifactStore.readDirectory("result.json");

      if (entries === undefined) {
        return {
          outcome: "not-found",
          detail: "The Synthesis result was not found.",
        };
      }

      const result = await readResultFile(resultId, () =>
        artifactStore.readFile(resultFileName(resultId)),
      );
      return { outcome: "found", result };
    } catch (cause: unknown) {
      if (isErrnoException(cause) && cause.code === "ENOENT") {
        return {
          outcome: "not-found",
          detail: "The Synthesis result was not found.",
        };
      }

      diagnostics?.record(
        {
          category: "filesystem",
          operation: isRepositoryScopedArtifactStoreRepositoryError(cause)
            ? "read-repository"
            : "read-result",
        },
        cause,
      );
      return {
        outcome: "unavailable",
        detail: isRepositoryScopedArtifactStoreRepositoryError(cause)
          ? "The Knowledge Repository could not be read."
          : "The Synthesis result could not be read.",
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

      await artifactStore.writeFile({
        contents: serializeResult(result),
        expectedFingerprint: await artifactStore.fingerprint(
          resultFileName(result.id),
        ),
        fileName: resultFileName(result.id),
      });
    },
    readResult,
    readResults: async (): Promise<SynthesisResultListReadOutcome> => {
      let entries: ReadonlyArray<RepositoryArtifactEntry> | undefined;

      try {
        entries = await artifactStore.readDirectory("result.json");

        if (entries === undefined) {
          return { outcome: "found", results: [] };
        }
      } catch (cause: unknown) {
        diagnostics?.record(
          {
            category: "filesystem",
            operation: isRepositoryScopedArtifactStoreRepositoryError(cause)
              ? "read-repository"
              : "read-results",
          },
          cause,
        );
        return {
          outcome: "unavailable",
          detail: isRepositoryScopedArtifactStoreRepositoryError(cause)
            ? "The Knowledge Repository could not be read."
            : "The Synthesis results could not be read.",
        };
      }

      const results: SynthesisSavedResult[] = [];

      for (const entry of entries) {
        if (!entry.name.endsWith(".json")) {
          continue;
        }

        if (entry.kind === "symbolic-link") {
          diagnostics?.record(
            {
              category: "filesystem",
              operation: "read-result",
            },
            new UnsafeSynthesisResultTargetError(
              "The Synthesis result directory contains a symbolic link.",
            ),
          );
          return {
            outcome: "unavailable",
            detail: "The Synthesis results could not be read.",
          };
        }

        if (entry.kind !== "file") {
          continue;
        }

        const resultId = entry.name.slice(0, -5);
        try {
          results.push(
            await readResultFile(resultId, () =>
              artifactStore.readFile(resultFileName(resultId)),
            ),
          );
        } catch (cause: unknown) {
          diagnostics?.record(
            {
              category: "filesystem",
              operation: "read-result",
            },
            cause,
          );
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
