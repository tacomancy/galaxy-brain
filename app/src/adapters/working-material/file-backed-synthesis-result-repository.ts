/**
 * Filesystem persistence Adapter for append-only Synthesis history.
 * Current results are addressed by a small pointer file; every full result
 * version is immutable and stored beside it. Legacy nested results remain
 * readable and are flattened only when an explicit write migrates them.
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
  SynthesisHumanEdit,
  SynthesisResultReadOutcome,
  SynthesisResultListReadOutcome,
  SynthesisResultRepository,
  SynthesisResultVersionSummary,
  SynthesisSavedResult,
} from "../../modules/source-processing";

/** Sanitized filesystem operation metadata sent to the main diagnostic sink. */
export type SynthesisResultDiagnostic = {
  category: "filesystem";
  operation: "read-repository" | "read-result" | "read-results";
};

/** Receives internal storage failures without exposing paths to callers. */
export interface SynthesisResultDiagnostics {
  record(diagnostic: SynthesisResultDiagnostic, cause?: unknown): void;
}

const resultDirectoryName = join("scratch", "synthesis-results");
const pointerSchema = "galaxy-brain-synthesis-result-pointer";

class InvalidSynthesisResultError extends Error {}
class UnsafeSynthesisResultTargetError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isSourceRecord = (value: unknown): boolean =>
  isRecord(value) &&
  isNonEmptyString(value.id) &&
  isNonEmptyString(value.title);

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

const isVersionSummary = (
  value: unknown,
): value is SynthesisResultVersionSummary =>
  isRecord(value) &&
  isPositiveInteger(value.version) &&
  isNonEmptyString(value.generatedAt) &&
  isNonEmptyString(value.title) &&
  (value.humanAuthorship === undefined ||
    value.humanAuthorship === "human-authored");

const isValidContextSnapshots = (
  value: Record<string, unknown>,
  sourceContext: unknown[],
): boolean => {
  if (value.contextSnapshot === undefined) return true;
  if (!Array.isArray(value.contextSnapshot)) return false;
  return value.contextSnapshot.every((snapshot) => {
    if (
      !isRecord(snapshot) ||
      !isNonEmptyString(snapshot.annotationId) ||
      !isSourceRecord(snapshot.sourceRecord) ||
      !isNonEmptyString(snapshot.sourceLocator) ||
      !isNonEmptyString(snapshot.sourceIdentity) ||
      !isNonEmptyString(snapshot.contentIdentity) ||
      !isNonEmptyString(snapshot.summary)
    ) {
      return false;
    }
    return sourceContext.some(
      (source) =>
        isRecord(source) && source.annotationId === snapshot.annotationId,
    );
  });
};

const isValidResultMetadata = (
  value: Record<string, unknown>,
  sourceContext: unknown[],
): boolean => {
  if (!isValidContextSnapshots(value, sourceContext)) return false;
  if (
    value.contextSnapshotVersion !== undefined &&
    !isPositiveInteger(value.contextSnapshotVersion)
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
  return isValidHistoryMetadata(value);
};

const isValidHistoryMetadata = (value: Record<string, unknown>): boolean => {
  if (
    value.humanEdits !== undefined &&
    (!Array.isArray(value.humanEdits) || !value.humanEdits.every(isHumanEdit))
  ) {
    return false;
  }
  if (
    value.resultVersion !== undefined &&
    !isPositiveInteger(value.resultVersion)
  ) {
    return false;
  }
  if (
    value.priorVersions !== undefined &&
    (!Array.isArray(value.priorVersions) ||
      !value.priorVersions.every(isVersionSummary))
  ) {
    return false;
  }
  return (
    value.priorResults === undefined ||
    (Array.isArray(value.priorResults) &&
      value.priorResults.every(isSynthesisSavedResult))
  );
};

const isValidResultCore = (
  value: Record<string, unknown>,
  sourceContext: unknown[],
): boolean => {
  const targetTopic = isRecord(value.targetTopic) ? value.targetTopic : {};
  const provenance = isRecord(value.provenance) ? value.provenance : {};
  return [
    isNonEmptyString(value.id),
    value.state === "working-material",
    isNonEmptyString(value.title),
    isNonEmptyString(value.text),
    isRecord(value.targetTopic),
    isNonEmptyString(targetTopic.id),
    isNonEmptyString(targetTopic.title),
    provenance.attribution === "agent-generated",
    isNonEmptyString(provenance.provider),
    isNonEmptyString(provenance.model),
    isNonEmptyString(provenance.generatedAt),
    provenance.operation === "synthesize-into-topic",
    sourceContext.every(isSourceContextReference),
  ].every(Boolean);
};

const isSynthesisSavedResult = (
  value: unknown,
): value is SynthesisSavedResult => {
  if (!isRecord(value) || !isRecord(value.provenance)) return false;
  const sourceContext = value.provenance.sourceContext;
  if (!Array.isArray(sourceContext)) return false;
  return (
    isValidResultCore(value, sourceContext) &&
    (value.prompt === undefined || isNonEmptyString(value.prompt)) &&
    isValidResultMetadata(value, sourceContext)
  );
};

const resultFileName = (resultId: string): string => {
  if (!/^[a-z0-9-]+$/u.test(resultId)) {
    throw new InvalidSynthesisResultError("The result identity is invalid.");
  }
  return `${resultId}.json`;
};

const versionFileName = (resultId: string, version: number): string => {
  if (!isPositiveInteger(version)) {
    throw new InvalidSynthesisResultError("The result version is invalid.");
  }
  return `${resultId}--version-${version}.json`;
};

const serialize = (value: unknown): string =>
  `${JSON.stringify(value, null, 2)}\n`;

const versionSummaryFor = (
  result: SynthesisSavedResult,
): SynthesisResultVersionSummary => ({
  version: result.resultVersion ?? 1,
  generatedAt: result.provenance.generatedAt,
  title: result.title,
  ...(result.humanAuthorship === undefined
    ? {}
    : { humanAuthorship: result.humanAuthorship }),
});

const withoutHistory = (
  result: SynthesisSavedResult,
  version: number,
): SynthesisSavedResult => {
  const current = { ...result };
  delete current.priorResults;
  delete current.priorVersions;
  return { ...current, resultVersion: version };
};

const legacyHistory = (
  result: SynthesisSavedResult,
): SynthesisResultVersionSummary[] => [
  ...(result.priorVersions ?? []),
  ...(result.priorResults ?? []).map(versionSummaryFor),
];

const normalizeLegacy = (
  result: SynthesisSavedResult,
): SynthesisSavedResult => {
  const currentVersion = result.resultVersion ?? 1;
  const current = { ...result };
  delete current.priorResults;
  const history = legacyHistory(result).filter(
    (summary) => summary.version !== currentVersion,
  );
  return {
    ...current,
    resultVersion: currentVersion,
    ...(history.length === 0 ? {} : { priorVersions: history }),
  };
};

type Pointer = {
  schema: typeof pointerSchema;
  schema_version: 1;
  id: string;
  current_version: number;
};

const readJson = async (readFile: () => Promise<Buffer>): Promise<unknown> => {
  try {
    return JSON.parse((await readFile()).toString("utf8")) as unknown;
  } catch {
    throw new InvalidSynthesisResultError(
      "The Synthesis result JSON is invalid.",
    );
  }
};

const readPointer = async (
  resultId: string,
  readFile: () => Promise<Buffer>,
): Promise<Pointer> => {
  const parsed = await readJson(readFile);
  if (
    !isRecord(parsed) ||
    parsed.schema !== pointerSchema ||
    parsed.schema_version !== 1 ||
    parsed.id !== resultId ||
    !isPositiveInteger(parsed.current_version)
  ) {
    throw new InvalidSynthesisResultError(
      "The Synthesis result pointer is invalid.",
    );
  }
  return {
    schema: pointerSchema,
    schema_version: 1,
    id: resultId,
    current_version: Number(parsed.current_version),
  };
};

const readResultPayload = async (
  readFile: () => Promise<Buffer>,
): Promise<SynthesisSavedResult> => {
  const parsed = await readJson(readFile);
  if (!isSynthesisSavedResult(parsed)) {
    throw new InvalidSynthesisResultError(
      "The Synthesis result metadata is invalid.",
    );
  }
  return parsed;
};

/**
 * Creates a repository-scoped Adapter for append-only Synthesis results.
 * @param repositoryPath Selected Knowledge Repository root.
 * @param diagnostics Optional sanitized diagnostic sink.
 * @param filesystem Atomic filesystem Adapter used for safe persistence.
 * @returns The Synthesis result persistence Interface.
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

  const readDirectory = async (): Promise<
    ReadonlyArray<RepositoryArtifactEntry> | undefined
  > => artifactStore.readDirectory("result.json");

  const readCurrent = async (
    resultId: string,
    entries: ReadonlyArray<RepositoryArtifactEntry>,
  ): Promise<SynthesisSavedResult> => {
    const name = resultFileName(resultId);
    const entry = entries.find((candidate) => candidate.name === name);
    if (entry?.kind === "symbolic-link") {
      throw new UnsafeSynthesisResultTargetError(
        "The Synthesis result target is unsafe.",
      );
    }
    if (entry === undefined || entry.kind !== "file") {
      throw new InvalidSynthesisResultError(
        "The Synthesis result was not found.",
      );
    }

    const parsed = await readJson(() => artifactStore.readFile(name));
    if (isRecord(parsed) && parsed.schema === pointerSchema) {
      const pointer = await readPointer(resultId, () =>
        artifactStore.readFile(name),
      );
      const version = await readResultPayload(() =>
        artifactStore.readFile(
          versionFileName(resultId, pointer.current_version),
        ),
      );
      if (
        version.id !== resultId ||
        (version.resultVersion ?? 1) !== pointer.current_version
      ) {
        throw new InvalidSynthesisResultError(
          "The Synthesis result metadata is invalid.",
        );
      }
      return withoutHistory(version, pointer.current_version);
    }
    if (!isSynthesisSavedResult(parsed) || parsed.id !== resultId) {
      throw new InvalidSynthesisResultError(
        "The Synthesis result metadata is invalid.",
      );
    }
    return normalizeLegacy(parsed);
  };

  const readCurrentWithHistory = async (
    resultId: string,
    entries: ReadonlyArray<RepositoryArtifactEntry>,
  ): Promise<SynthesisSavedResult> => {
    const current = await readCurrent(resultId, entries);
    if (current.priorVersions !== undefined) return current;
    const summaries: SynthesisResultVersionSummary[] = [];
    for (const entry of entries) {
      if (
        entry.kind !== "file" ||
        !entry.name.startsWith(`${resultId}--version-`) ||
        !entry.name.endsWith(".json")
      ) {
        continue;
      }
      const match = entry.name.match(/--version-(\d+)\.json$/u);
      if (match === null) continue;
      const version = Number(match[1]);
      const prior = await readResultPayload(() =>
        artifactStore.readFile(entry.name),
      );
      if ((prior.resultVersion ?? 1) !== version) {
        throw new InvalidSynthesisResultError(
          "The Synthesis result metadata is invalid.",
        );
      }
      if (version !== (current.resultVersion ?? 1)) {
        summaries.push(versionSummaryFor(withoutHistory(prior, version)));
      }
    }
    return summaries.length === 0
      ? current
      : {
          ...current,
          priorVersions: summaries.sort((a, b) => a.version - b.version),
        };
  };

  const readResult = async (
    resultId: string,
  ): Promise<SynthesisResultReadOutcome> => {
    try {
      const entries = await readDirectory();
      if (
        entries === undefined ||
        !entries.some((entry) => entry.name === resultFileName(resultId))
      ) {
        return {
          outcome: "not-found",
          detail: "The Synthesis result was not found.",
        };
      }
      return {
        outcome: "found",
        result: await readCurrentWithHistory(resultId, entries),
      };
    } catch (cause: unknown) {
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

  const readLegacyResultVersion = async (
    resultId: string,
    version: number,
    entries: ReadonlyArray<RepositoryArtifactEntry>,
  ): Promise<SynthesisResultReadOutcome> => {
    const legacyEntry = entries.find(
      (entry) =>
        entry.name === resultFileName(resultId) && entry.kind === "file",
    );
    if (legacyEntry === undefined) {
      return {
        outcome: "not-found",
        detail: "The Synthesis result was not found.",
      };
    }
    const raw = await readJson(() =>
      artifactStore.readFile(resultFileName(resultId)),
    );
    if (!isSynthesisSavedResult(raw) || raw.id !== resultId) {
      throw new InvalidSynthesisResultError(
        "The Synthesis result metadata is invalid.",
      );
    }
    const legacy = [...(raw.priorResults ?? []), raw].find(
      (candidate) => (candidate.resultVersion ?? 1) === version,
    );
    return legacy === undefined
      ? {
          outcome: "not-found",
          detail: "The Synthesis result version was not found.",
        }
      : { outcome: "found", result: withoutHistory(legacy, version) };
  };

  const readResultVersion = async (
    resultId: string,
    version: number,
  ): Promise<SynthesisResultReadOutcome> => {
    try {
      const entries = await readDirectory();
      if (entries === undefined) {
        return {
          outcome: "not-found",
          detail: "The Synthesis result was not found.",
        };
      }
      const versionName = versionFileName(resultId, version);
      const versionEntry = entries.find((entry) => entry.name === versionName);
      if (versionEntry?.kind === "symbolic-link") {
        throw new UnsafeSynthesisResultTargetError(
          "The Synthesis result target is unsafe.",
        );
      }
      if (versionEntry?.kind === "file") {
        const result = await readResultPayload(() =>
          artifactStore.readFile(versionName),
        );
        if (result.id !== resultId || (result.resultVersion ?? 1) !== version) {
          throw new InvalidSynthesisResultError(
            "The Synthesis result metadata is invalid.",
          );
        }
        return { outcome: "found", result: withoutHistory(result, version) };
      }
      return readLegacyResultVersion(resultId, version, entries);
    } catch (cause: unknown) {
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

  const writeImmutable = async (
    fileName: string,
    contents: string,
  ): Promise<void> => {
    const existing = await artifactStore.fingerprint(fileName);
    if (existing !== undefined) {
      if (
        (await artifactStore.readFile(fileName)).toString("utf8") === contents
      )
        return;
      throw new Error("The Synthesis result version is immutable.");
    }
    await artifactStore.writeFile({
      contents,
      expectedFingerprint: undefined,
      fileName,
    });
  };

  const saveResult = async (result: SynthesisSavedResult): Promise<void> => {
    if (!isSynthesisSavedResult(result)) {
      throw new InvalidSynthesisResultError("The Synthesis result is invalid.");
    }
    const resultName = resultFileName(result.id);
    const currentVersion = result.resultVersion ?? 1;
    const pointerFingerprint = await artifactStore.fingerprint(resultName);
    let legacyPriorResults = result.priorResults ?? [];

    if (pointerFingerprint !== undefined) {
      const existing = await readJson(() => artifactStore.readFile(resultName));
      if (isRecord(existing) && existing.schema === pointerSchema) {
        await readPointer(result.id, () => artifactStore.readFile(resultName));
      } else if (isSynthesisSavedResult(existing)) {
        legacyPriorResults = existing.priorResults ?? legacyPriorResults;
      } else {
        throw new InvalidSynthesisResultError(
          "The Synthesis result pointer is invalid.",
        );
      }
    }

    for (const prior of legacyPriorResults) {
      const version = prior.resultVersion ?? 1;
      await writeImmutable(
        versionFileName(result.id, version),
        serialize(withoutHistory(prior, version)),
      );
    }
    await writeImmutable(
      versionFileName(result.id, currentVersion),
      serialize(withoutHistory(result, currentVersion)),
    );
    await artifactStore.writeFile({
      contents: serialize({
        schema: pointerSchema,
        schema_version: 1,
        id: result.id,
        current_version: currentVersion,
      }),
      expectedFingerprint: pointerFingerprint,
      fileName: resultName,
    });
  };

  const readVersionSummaries = async (
    id: string,
    current: SynthesisSavedResult,
    entries: ReadonlyArray<RepositoryArtifactEntry>,
  ): Promise<SynthesisResultVersionSummary[]> => {
    const summaries: SynthesisResultVersionSummary[] = [];
    const versionEntries = entries.filter(
      (entry) =>
        entry.kind === "file" &&
        entry.name.startsWith(`${id}--version-`) &&
        entry.name.endsWith(".json"),
    );
    for (const entry of versionEntries) {
      const match = entry.name.match(/--version-(\d+)\.json$/u);
      if (match === null) continue;
      const version = Number(match[1]);
      if (version === (current.resultVersion ?? 1)) continue;
      const older = await readResultVersion(id, version);
      if (older.outcome === "found")
        summaries.push(versionSummaryFor(older.result));
    }
    return summaries.sort((a, b) => a.version - b.version);
  };

  const readResultsFromEntries = async (
    entries: ReadonlyArray<RepositoryArtifactEntry>,
  ): Promise<SynthesisSavedResult[]> => {
    const resultEntries = entries.filter(
      (entry) =>
        entry.name.endsWith(".json") && !entry.name.includes("--version-"),
    );
    if (resultEntries.some((entry) => entry.kind === "symbolic-link")) {
      throw new UnsafeSynthesisResultTargetError(
        "The Synthesis result target is unsafe.",
      );
    }
    const results: SynthesisSavedResult[] = [];
    for (const entry of resultEntries) {
      if (entry.kind !== "file") continue;
      const id = entry.name.slice(0, -5);
      const current = await readCurrent(id, entries);
      const versionSummaries = await readVersionSummaries(id, current, entries);
      const legacySummaries = current.priorVersions ?? [];
      results.push({
        ...current,
        priorVersions:
          versionSummaries.length > 0 ? versionSummaries : legacySummaries,
      });
    }
    return results;
  };

  return {
    saveResult,
    readResult,
    readResultVersion,
    readResults: async (): Promise<SynthesisResultListReadOutcome> => {
      try {
        const entries = await readDirectory();
        if (entries === undefined) return { outcome: "found", results: [] };
        return {
          outcome: "found",
          results: await readResultsFromEntries(entries),
        };
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
    },
  };
};
