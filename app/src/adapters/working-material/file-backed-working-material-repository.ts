/**
 * Filesystem persistence Adapter. It canonicalizes repository paths, checks
 * the target fingerprint before replacement, and preserves external edits
 * while translating storage failures into caller-facing outcomes.
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
  SourceLocator,
  StructuredAnnotation,
  WorkingMaterialReadOutcome,
  WorkingMaterialListReadOutcome,
  WorkingMaterialRepository,
} from "../../modules/source-processing";

/**
 * Sanitized operational metadata retained by the main-process diagnostic sink.
 * The optional cause is available only to that sink for internal diagnostics;
 * it is never part of a caller outcome or serialized record.
 */
export type WorkingMaterialDiagnostic = {
  category: "filesystem";
  operation:
    | "read-repository"
    | "read-annotation"
    | "read-annotation-for-source"
    | "read-annotations-for-source";
};

/** Internal sink for sanitized metadata that must not enter caller outcomes. */
export interface WorkingMaterialDiagnostics {
  record(diagnostic: WorkingMaterialDiagnostic, cause?: unknown): void;
}

const annotationDirectoryName = join("sources", "annotations");

class InvalidAnnotationError extends Error {}

class UnsafeAnnotationTargetError extends Error {}

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

const annotationFileName = (annotationId: string): string => {
  if (!/^[a-z0-9-]+$/.test(annotationId)) {
    throw new InvalidAnnotationError("The annotation identity is invalid.");
  }

  return `${annotationId}.md`;
};

const quote = (value: string): string => JSON.stringify(value);

const logicalLocatorFor = (
  locator: Pick<SourceLocator, "page" | "start" | "end">,
): string => `page:${locator.page}#chars=${locator.start}-${locator.end}`;

const compareStrings = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const isReadableAnnotationEntry = (entry: {
  name: string;
  kind: RepositoryArtifactEntry["kind"];
}): boolean => {
  if (!entry.name.endsWith(".md")) {
    return false;
  }

  if (entry.kind === "symbolic-link") {
    throw new UnsafeAnnotationTargetError(
      "The annotation directory contains a symbolic link.",
    );
  }

  return entry.kind === "file";
};

const isValidLocator = (locator: SourceLocator): boolean =>
  Number.isInteger(locator.page) &&
  locator.page > 0 &&
  Number.isInteger(locator.start) &&
  locator.start >= 0 &&
  Number.isInteger(locator.end) &&
  locator.end > locator.start &&
  locator.logical === logicalLocatorFor(locator);

type ReadAnnotation = (
  annotationId: string,
) => Promise<WorkingMaterialReadOutcome>;

const findAnnotationForSourceRecord = async (
  entries: ReadonlyArray<RepositoryArtifactEntry>,
  sourceRecordId: string,
  readAnnotation: ReadAnnotation,
): Promise<WorkingMaterialReadOutcome | undefined> => {
  for (const entry of entries) {
    if (entry.kind !== "file" || !entry.name.endsWith(".md")) {
      continue;
    }

    const outcome = await readAnnotation(entry.name.slice(0, -3));

    if (outcome.outcome === "unavailable") {
      return outcome;
    }

    if (
      outcome.outcome === "found" &&
      outcome.annotation.sourceRecord.id === sourceRecordId
    ) {
      return outcome;
    }
  }

  return undefined;
};

const collectAnnotationsForSourceRecord = async (
  entries: ReadonlyArray<RepositoryArtifactEntry>,
  sourceRecordId: string,
  readAnnotation: ReadAnnotation,
): Promise<
  | StructuredAnnotation[]
  | Extract<WorkingMaterialReadOutcome, { outcome: "unavailable" }>
> => {
  const annotations: StructuredAnnotation[] = [];

  for (const entry of entries) {
    if (!isReadableAnnotationEntry(entry)) {
      continue;
    }

    const outcome = await readAnnotation(entry.name.slice(0, -3));

    if (outcome.outcome === "unavailable") {
      return outcome;
    }

    if (
      outcome.outcome === "found" &&
      outcome.annotation.sourceRecord.id === sourceRecordId
    ) {
      annotations.push(outcome.annotation);
    }
  }

  return annotations;
};

const serializeAnnotation = (annotation: StructuredAnnotation): string =>
  [
    "---",
    `id: ${quote(annotation.id)}`,
    'type: "structured-annotation"',
    `state: ${quote(annotation.state)}`,
    `source_record_id: ${quote(annotation.sourceRecord.id)}`,
    `source_record_title: ${quote(annotation.sourceRecord.title)}`,
    `source_locator: ${quote(annotation.sourceLocator.logical)}`,
    `page: ${annotation.sourceLocator.page}`,
    `start: ${annotation.sourceLocator.start}`,
    `end: ${annotation.sourceLocator.end}`,
    `attribution: ${quote(annotation.attribution)}`,
    `classification: ${quote(annotation.classification)}`,
    "---",
    annotation.text,
  ].join("\n");

const readQuotedString = (
  fields: ReadonlyMap<string, string>,
  fieldName: string,
): string => {
  const rawValue = fields.get(fieldName);

  if (rawValue === undefined) {
    throw new InvalidAnnotationError(
      `The annotation is missing ${fieldName} metadata.`,
    );
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);

    if (typeof parsed !== "string") {
      throw new Error("The value is not a string.");
    }

    return parsed;
  } catch {
    throw new InvalidAnnotationError(
      `The annotation has invalid ${fieldName} metadata.`,
    );
  }
};

const readInteger = (
  fields: ReadonlyMap<string, string>,
  fieldName: string,
): number => {
  const rawValue = fields.get(fieldName);

  if (rawValue === undefined || !/^\d+$/.test(rawValue)) {
    throw new InvalidAnnotationError(
      `The annotation has invalid ${fieldName} metadata.`,
    );
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value)) {
    throw new InvalidAnnotationError(
      `The annotation has invalid ${fieldName} metadata.`,
    );
  }

  return value;
};

const parseAnnotation = (contents: string): StructuredAnnotation => {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(
    contents,
  );

  if (frontmatter?.[1] === undefined || frontmatter[2] === undefined) {
    throw new InvalidAnnotationError("The annotation frontmatter is invalid.");
  }

  const fields = new Map<string, string>();

  for (const line of frontmatter[1].split(/\r?\n/)) {
    const match = /^(?<key>[a-z_]+): (?<value>.+)$/.exec(line);

    if (match?.groups?.key === undefined || match.groups.value === undefined) {
      throw new InvalidAnnotationError("The annotation metadata is invalid.");
    }

    if (fields.has(match.groups.key)) {
      throw new InvalidAnnotationError("The annotation metadata is ambiguous.");
    }

    fields.set(match.groups.key, match.groups.value);
  }

  const id = readQuotedString(fields, "id");
  const sourceRecordId = readQuotedString(fields, "source_record_id");
  const sourceRecordTitle = readQuotedString(fields, "source_record_title");
  const logical = readQuotedString(fields, "source_locator");
  const page = readInteger(fields, "page");
  const start = readInteger(fields, "start");
  const end = readInteger(fields, "end");
  const sourceLocator: SourceLocator = { page, start, end, logical };

  if (
    readQuotedString(fields, "type") !== "structured-annotation" ||
    readQuotedString(fields, "state") !== "working-material" ||
    readQuotedString(fields, "attribution") !== "source-claim" ||
    readQuotedString(fields, "classification") !== "source-claim" ||
    !isValidLocator(sourceLocator)
  ) {
    throw new InvalidAnnotationError("The annotation metadata is invalid.");
  }

  const text = frontmatter[2].replace(/^\r?\n/, "").replace(/\r?\n$/, "");

  return {
    id,
    state: "working-material",
    sourceRecord: { id: sourceRecordId, title: sourceRecordTitle },
    sourceLocator,
    text,
    attribution: "source-claim",
    classification: "source-claim",
  };
};

/**
 * Persists source annotations as portable Markdown Working Material. The
 * adapter canonicalizes and checks the repository path, protects the target
 * against external changes, and reports only sanitized read-failure metadata
 * to an optional diagnostic sink.
 * @param repositoryPath The selected Knowledge Repository path.
 * @param diagnostics Optional sink for sanitized operational metadata.
 * @param filesystem The filesystem Adapter used for safe persistence.
 * @returns The Working Material repository Adapter.
 */
export const createFileBackedWorkingMaterialRepository = (
  repositoryPath: string,
  diagnostics?: WorkingMaterialDiagnostics,
  filesystem: AtomicFileSystem = defaultAtomicFileSystem,
): WorkingMaterialRepository => {
  const artifactStore = createRepositoryScopedArtifactStore({
    artifactDirectory: annotationDirectoryName,
    externalChangeDetail:
      "The source annotation changed while it was being saved.",
    filesystem,
    requiredDirectory: "sources",
    repositoryPath,
    unsafeDirectoryDetail: "The source annotation directory is unsafe.",
    unsafeFileDetail: "The source annotation target is unsafe.",
    unsafeRepositoryDetail:
      "The selected Knowledge Repository is not a safe directory.",
  });

  const readAnnotation = async (
    annotationId: string,
  ): Promise<WorkingMaterialReadOutcome> => {
    try {
      const entries = await artifactStore.readDirectory("annotation.md");

      if (entries === undefined) {
        return {
          outcome: "not-found",
          detail: "The source annotation was not found.",
        };
      }

      const contents = (
        await artifactStore.readFile(annotationFileName(annotationId))
      ).toString("utf8");
      const annotation = parseAnnotation(contents);

      if (annotation.id !== annotationId) {
        throw new InvalidAnnotationError(
          "The annotation identity does not match its path.",
        );
      }

      return { outcome: "found", annotation };
    } catch (cause: unknown) {
      if (isErrnoException(cause) && cause.code === "ENOENT") {
        return {
          outcome: "not-found",
          detail: "The source annotation was not found.",
        };
      }

      diagnostics?.record(
        {
          category: "filesystem",
          operation: isRepositoryScopedArtifactStoreRepositoryError(cause)
            ? "read-repository"
            : "read-annotation",
        },
        cause,
      );

      return {
        outcome: "unavailable",
        detail: isRepositoryScopedArtifactStoreRepositoryError(cause)
          ? "The Knowledge Repository could not be read."
          : "The source annotation could not be read.",
      };
    }
  };

  return {
    saveAnnotation: async (annotation): Promise<void> => {
      if (
        !/^[a-z0-9-]+$/.test(annotation.id) ||
        !isValidLocator(annotation.sourceLocator)
      ) {
        throw new InvalidAnnotationError("The source annotation is invalid.");
      }

      await artifactStore.writeFile({
        contents: serializeAnnotation(annotation),
        expectedFingerprint: await artifactStore.fingerprint(
          annotationFileName(annotation.id),
        ),
        fileName: annotationFileName(annotation.id),
      });
    },
    readAnnotation,
    readAnnotationForSourceRecord: async (
      sourceRecordId,
    ): Promise<WorkingMaterialReadOutcome> => {
      try {
        const entries = await artifactStore.readDirectory("annotation.md");

        if (entries === undefined) {
          return {
            outcome: "not-found",
            detail: "The source annotation was not found.",
          };
        }

        const sortedEntries = [...entries].sort((left, right) =>
          compareStrings(left.name, right.name),
        );

        const outcome = await findAnnotationForSourceRecord(
          sortedEntries,
          sourceRecordId,
          readAnnotation,
        );

        if (outcome !== undefined) {
          return outcome;
        }

        return {
          outcome: "not-found",
          detail: "The source annotation was not found.",
        };
      } catch (cause: unknown) {
        if (isErrnoException(cause) && cause.code === "ENOENT") {
          return {
            outcome: "not-found",
            detail: "The source annotation was not found.",
          };
        }

        diagnostics?.record(
          {
            category: "filesystem",
            operation: isRepositoryScopedArtifactStoreRepositoryError(cause)
              ? "read-repository"
              : "read-annotation-for-source",
          },
          cause,
        );
        return {
          outcome: "unavailable",
          detail: isRepositoryScopedArtifactStoreRepositoryError(cause)
            ? "The Knowledge Repository could not be read."
            : "The source annotation could not be read.",
        };
      }
    },
    readAnnotationsForSourceRecord: async (
      sourceRecordId,
    ): Promise<WorkingMaterialListReadOutcome> => {
      try {
        const entries = await artifactStore.readDirectory("annotation.md");

        if (entries === undefined) {
          return {
            outcome: "not-found",
            detail: "The source annotation was not found.",
          };
        }

        const sortedEntries = [...entries].sort((left, right) =>
          compareStrings(left.name, right.name),
        );
        const annotations = await collectAnnotationsForSourceRecord(
          sortedEntries,
          sourceRecordId,
          readAnnotation,
        );

        if (!Array.isArray(annotations)) {
          return annotations;
        }

        return annotations.length === 0
          ? {
              outcome: "not-found",
              detail: "The source annotation was not found.",
            }
          : { outcome: "found", annotations };
      } catch (cause: unknown) {
        if (isErrnoException(cause) && cause.code === "ENOENT") {
          return {
            outcome: "not-found",
            detail: "The source annotation was not found.",
          };
        }

        diagnostics?.record(
          {
            category: "filesystem",
            operation: isRepositoryScopedArtifactStoreRepositoryError(cause)
              ? "read-repository"
              : "read-annotations-for-source",
          },
          cause,
        );
        return {
          outcome: "unavailable",
          detail: isRepositoryScopedArtifactStoreRepositoryError(cause)
            ? "The Knowledge Repository could not be read."
            : "The source annotation could not be read.",
        };
      }
    },
  };
};
