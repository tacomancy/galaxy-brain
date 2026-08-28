import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, realpath } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

import {
  discardAbandonedTemporaryFiles,
  defaultAtomicFileSystem,
  type AtomicFileSystem,
  writeFileAtomically,
} from "../file-backed-atomic-write";
import type {
  SourceLocator,
  StructuredAnnotation,
  WorkingMaterialReadOutcome,
  WorkingMaterialListReadOutcome,
  WorkingMaterialRepository,
} from "../../modules/source-processing";

/** Internal sink for causes that must not enter caller-visible outcomes. */
export interface WorkingMaterialDiagnostics {
  record(cause: unknown): void;
}

const annotationDirectoryName = join("sources", "annotations");

class InvalidAnnotationError extends Error {}

class UnsafeAnnotationTargetError extends Error {}

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

const annotationFilePath = (
  canonicalRepositoryPath: string,
  annotationId: string,
): string => {
  if (!/^[a-z0-9-]+$/.test(annotationId)) {
    throw new InvalidAnnotationError("The annotation identity is invalid.");
  }

  const annotationDirectory = resolve(
    canonicalRepositoryPath,
    annotationDirectoryName,
  );
  const filePath = resolve(annotationDirectory, `${annotationId}.md`);

  if (!filePath.startsWith(`${annotationDirectory}${sep}`)) {
    throw new InvalidAnnotationError(
      "The annotation path escapes the Knowledge Repository.",
    );
  }

  return filePath;
};

const quote = (value: string): string => JSON.stringify(value);

const logicalLocatorFor = (
  locator: Pick<SourceLocator, "page" | "start" | "end">,
): string => `page:${locator.page}#chars=${locator.start}-${locator.end}`;

const isValidLocator = (locator: SourceLocator): boolean =>
  Number.isInteger(locator.page) &&
  locator.page > 0 &&
  Number.isInteger(locator.start) &&
  locator.start >= 0 &&
  Number.isInteger(locator.end) &&
  locator.end > locator.start &&
  locator.logical === logicalLocatorFor(locator);

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

const canonicalRepositoryPath = async (
  repositoryPath: string,
): Promise<string> => {
  const stats = await lstat(repositoryPath);

  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new UnsafeAnnotationTargetError(
      "The selected Knowledge Repository is not a safe directory.",
    );
  }

  const canonicalPath = await realpath(repositoryPath);
  const sourcesStats = await lstat(join(canonicalPath, "sources"));

  if (sourcesStats.isSymbolicLink() || !sourcesStats.isDirectory()) {
    throw new UnsafeAnnotationTargetError(
      "The Knowledge Repository sources directory is unsafe.",
    );
  }

  return canonicalPath;
};

const ensureAnnotationDirectory = async (
  canonicalPath: string,
): Promise<string> => {
  const directoryPath = resolve(canonicalPath, annotationDirectoryName);

  try {
    const stats = await lstat(directoryPath);

    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new UnsafeAnnotationTargetError(
        "The source annotation directory is unsafe.",
      );
    }
  } catch (cause: unknown) {
    if (!isErrnoException(cause) || cause.code !== "ENOENT") {
      throw cause;
    }

    await mkdir(directoryPath);
  }

  return directoryPath;
};

const readAnnotationDirectory = async (
  canonicalPath: string,
): Promise<string | undefined> => {
  const directoryPath = resolve(canonicalPath, annotationDirectoryName);

  try {
    const stats = await lstat(directoryPath);

    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new UnsafeAnnotationTargetError(
        "The source annotation directory is unsafe.",
      );
    }

    return directoryPath;
  } catch (cause: unknown) {
    if (isErrnoException(cause) && cause.code === "ENOENT") {
      return undefined;
    }

    throw cause;
  }
};

type FileFingerprint = string | undefined;

const fingerprint = async (filePath: string): Promise<FileFingerprint> => {
  try {
    const stats = await lstat(filePath);

    if (stats.isSymbolicLink() || !stats.isFile()) {
      throw new UnsafeAnnotationTargetError(
        "The source annotation target is unsafe.",
      );
    }

    const contents = await readFile(filePath);
    return createHash("sha256").update(contents).digest("hex");
  } catch (cause: unknown) {
    if (isErrnoException(cause) && cause.code === "ENOENT") {
      return undefined;
    }

    throw cause;
  }
};

/**
 * Persists source annotations as portable Markdown Working Material. The
 * adapter canonicalizes and checks the repository path, protects the target
 * against external changes, and preserves read failures for diagnostics.
 */
export const createFileBackedWorkingMaterialRepository = (
  repositoryPath: string,
  diagnostics?: WorkingMaterialDiagnostics,
  filesystem: AtomicFileSystem = defaultAtomicFileSystem,
): WorkingMaterialRepository => {
  const readAnnotation = async (
    annotationId: string,
  ): Promise<WorkingMaterialReadOutcome> => {
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
      const annotationDirectory = await readAnnotationDirectory(canonicalPath);

      if (annotationDirectory === undefined) {
        return {
          outcome: "not-found",
          detail: "The source annotation was not found.",
        };
      }

      await discardAbandonedTemporaryFiles(
        annotationDirectory,
        annotationFilePath(canonicalPath, annotationId),
        filesystem,
      );

      const contents = await readFile(
        annotationFilePath(canonicalPath, annotationId),
        "utf8",
      );
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

      diagnostics?.record(cause);

      return {
        outcome: "unavailable",
        detail: "The source annotation could not be read.",
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

      const canonicalPath = await canonicalRepositoryPath(repositoryPath);
      await ensureAnnotationDirectory(canonicalPath);
      const filePath = annotationFilePath(canonicalPath, annotation.id);
      const existingFingerprint = await fingerprint(filePath);
      await writeFileAtomically({
        contents: serializeAnnotation(annotation),
        externalChangeDetail:
          "The source annotation changed while it was being saved.",
        expectedFingerprint: existingFingerprint,
        filePath,
        filesystem,
        readFingerprint: () => fingerprint(filePath),
      });
    },
    readAnnotation,
    readAnnotationForSourceRecord: async (
      sourceRecordId,
    ): Promise<WorkingMaterialReadOutcome> => {
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
        const annotationDirectory =
          await readAnnotationDirectory(canonicalPath);

        if (annotationDirectory === undefined) {
          return {
            outcome: "not-found",
            detail: "The source annotation was not found.",
          };
        }

        await discardAbandonedTemporaryFiles(
          annotationDirectory,
          resolve(annotationDirectory, "annotation.md"),
          filesystem,
        );

        const entries = await readdir(annotationDirectory, {
          encoding: "utf8",
          withFileTypes: true,
        });

        for (const entry of entries) {
          if (!entry.isFile() || !entry.name.endsWith(".md")) {
            continue;
          }

          const annotationId = entry.name.slice(0, -3);
          const outcome = await readAnnotation(annotationId);

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

        diagnostics?.record(cause);
        return {
          outcome: "unavailable",
          detail: "The source annotation could not be read.",
        };
      }
    },
    readAnnotationsForSourceRecord: async (
      sourceRecordId,
    ): Promise<WorkingMaterialListReadOutcome> => {
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
        const annotationDirectory =
          await readAnnotationDirectory(canonicalPath);

        if (annotationDirectory === undefined) {
          return {
            outcome: "not-found",
            detail: "The source annotation was not found.",
          };
        }

        await discardAbandonedTemporaryFiles(
          annotationDirectory,
          resolve(annotationDirectory, "annotation.md"),
          filesystem,
        );

        const entries = await readdir(annotationDirectory, {
          encoding: "utf8",
          withFileTypes: true,
        });
        const annotations: StructuredAnnotation[] = [];

        for (const entry of entries) {
          if (!entry.isFile() || !entry.name.endsWith(".md")) {
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

        diagnostics?.record(cause);
        return {
          outcome: "unavailable",
          detail: "The source annotation could not be read.",
        };
      }
    },
  };
};
