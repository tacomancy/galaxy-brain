/**
 * Machine-local linked Source Asset persistence Adapter. It keeps absolute
 * paths and PDF bytes outside the portable repository, verifies replacement
 * content before commit, and atomically preserves the previous link on save
 * failure.
 */
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";

import type {
  RelinkSourceInput,
  PdfAdapter,
  SourceAssetAdapter,
  SourceAssetIdentityOutcome,
  SourceAssetRelinkOutcome,
} from "../../modules/source-processing";

const STORE_FORMAT = "galaxy-brain-source-assets";
const STORE_VERSION = 1;

interface SourceAssetLinkRecord {
  mode: "linked-local";
  path: string;
  source_identity: string;
  content_identity: string;
}

interface SourceAssetStore {
  format: typeof STORE_FORMAT;
  format_version: typeof STORE_VERSION;
  links: Record<string, SourceAssetLinkRecord>;
}

/** Filesystem boundary used by the production linked-file Adapter. */
export interface SourceAssetFileSystem {
  lstat: typeof lstat;
  mkdir: typeof mkdir;
  readFile: typeof readFile;
  realpath: typeof realpath;
  rename: typeof rename;
  rm: typeof rm;
  writeFile: typeof writeFile;
}

const defaultFileSystem: SourceAssetFileSystem = {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
};

/** Options for the machine-local source-asset link Adapter. */
export interface FileBackedSourceAssetAdapterOptions {
  configurationPath: string;
  pdf?: PdfAdapter;
  filesystem?: SourceAssetFileSystem;
}

/**
 * Production Adapter surface used by the main process before relink. It keeps
 * machine-local paths behind the main-process boundary and translates storage
 * failures into Source Processing outcomes.
 */
export interface FileBackedSourceAssetAdapter extends SourceAssetAdapter {
  readReferenceIdentity(reference: string): Promise<SourceAssetIdentityOutcome>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const parseStore = (value: unknown): SourceAssetStore | undefined => {
  if (
    !isRecord(value) ||
    value.format !== STORE_FORMAT ||
    value.format_version !== STORE_VERSION ||
    !isRecord(value.links)
  ) {
    return undefined;
  }

  const links: Record<string, SourceAssetLinkRecord> = {};

  for (const [sourceRecordId, rawLink] of Object.entries(value.links)) {
    if (
      !isRecord(rawLink) ||
      rawLink.mode !== "linked-local" ||
      !isNonEmptyString(rawLink.path) ||
      !isNonEmptyString(rawLink.source_identity) ||
      !isNonEmptyString(rawLink.content_identity)
    ) {
      return undefined;
    }

    links[sourceRecordId] = {
      mode: "linked-local",
      path: rawLink.path,
      source_identity: rawLink.source_identity,
      content_identity: rawLink.content_identity,
    };
  }

  return {
    format: STORE_FORMAT,
    format_version: STORE_VERSION,
    links,
  };
};

const unavailable = (detail: string): SourceAssetIdentityOutcome => ({
  outcome: "unavailable",
  detail,
});

const identityFor = async (
  path: string,
  filesystem: SourceAssetFileSystem,
): Promise<SourceAssetIdentityOutcome> => {
  try {
    const canonicalPath = await filesystem.realpath(path);
    const stats = await filesystem.lstat(canonicalPath);

    if (!stats.isFile() || stats.isSymbolicLink()) {
      return unavailable("The linked Source Asset is not a regular PDF file.");
    }

    const content = await filesystem.readFile(canonicalPath);
    const digest = createHash("sha256").update(content).digest("hex");

    return {
      outcome: "available",
      recorded: {
        sourceIdentity: `file:${stats.dev}:${stats.ino}`,
        contentIdentity: `sha256:${digest}`,
      },
      current: {
        sourceIdentity: `file:${stats.dev}:${stats.ino}`,
        contentIdentity: `sha256:${digest}`,
      },
    };
  } catch {
    return unavailable("The linked Source Asset is unavailable.");
  }
};

const currentIdentityFor = async (
  path: string,
  filesystem: SourceAssetFileSystem,
): Promise<SourceAssetIdentityOutcome> => identityFor(path, filesystem);

const readStore = async (
  configurationPath: string,
  filesystem: SourceAssetFileSystem,
): Promise<SourceAssetStore | undefined> => {
  try {
    const raw = JSON.parse(
      await filesystem.readFile(configurationPath, "utf8"),
    ) as unknown;
    return parseStore(raw);
  } catch {
    return undefined;
  }
};

const writeStore = async (
  configurationPath: string,
  store: SourceAssetStore,
  filesystem: SourceAssetFileSystem,
): Promise<void> => {
  const temporaryPath = join(
    dirname(configurationPath),
    `.galaxy-brain-atomic-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );

  await filesystem.mkdir(dirname(configurationPath), { recursive: true });

  try {
    await filesystem.writeFile(
      temporaryPath,
      `${JSON.stringify(store, null, 2)}\n`,
      "utf8",
    );
    await filesystem.rename(temporaryPath, configurationPath);
  } finally {
    await filesystem.rm(temporaryPath, { force: true });
  }
};

/**
 * Creates the production machine-local linked Source Asset Adapter.
 * Filesystem paths and PDF bytes remain inside this main-process boundary.
 * @param options Configuration for the private store and verification PDF Adapter.
 * @returns A file-backed Adapter that translates filesystem failures into domain outcomes.
 */
export const createFileBackedSourceAssetAdapter = (
  options: FileBackedSourceAssetAdapterOptions,
): FileBackedSourceAssetAdapter => {
  const filesystem = options.filesystem ?? defaultFileSystem;

  const readIdentity = async (
    sourceRecordId: string,
  ): Promise<SourceAssetIdentityOutcome> => {
    const store = await readStore(options.configurationPath, filesystem);
    const link = store?.links[sourceRecordId];

    if (link === undefined || !isAbsolute(link.path)) {
      return unavailable("The linked Source Asset is unavailable.");
    }

    const current = await currentIdentityFor(link.path, filesystem);

    if (current.outcome === "unavailable") {
      return current;
    }

    return {
      outcome: "available",
      recorded: {
        sourceIdentity: link.source_identity,
        contentIdentity: link.content_identity,
      },
      current: current.current,
    };
  };

  const relink = async (
    input: RelinkSourceInput,
  ): Promise<SourceAssetRelinkOutcome> => {
    const store = await readStore(options.configurationPath, filesystem);
    const previousLink = store?.links[input.sourceRecord.id];

    if (store === undefined || previousLink === undefined) {
      return unavailable("The linked Source Asset is unavailable.");
    }

    const replacementPathCandidate = isAbsolute(input.replacementReference)
      ? resolve(input.replacementReference)
      : "";

    if (replacementPathCandidate.length === 0) {
      return unavailable("The replacement Source Asset is unavailable.");
    }

    let replacementPath: string;

    try {
      replacementPath = await filesystem.realpath(replacementPathCandidate);
    } catch {
      return unavailable("The replacement Source Asset is unavailable.");
    }

    const replacementIdentity = await currentIdentityFor(
      replacementPath,
      filesystem,
    );

    if (replacementIdentity.outcome === "unavailable") {
      return replacementIdentity;
    }

    if (options.pdf === undefined) {
      return unavailable("The replacement Source Asset could not be verified.");
    }

    const current = replacementIdentity.current;

    if (
      current.sourceIdentity !== input.expectedReplacementSourceIdentity ||
      current.contentIdentity !== input.expectedReplacementContentIdentity
    ) {
      return {
        outcome: "changed",
        recorded: {
          sourceIdentity: previousLink.source_identity,
          contentIdentity: previousLink.content_identity,
        },
        current,
      };
    }

    let selection: Awaited<ReturnType<PdfAdapter["readSelection"]>>;

    try {
      selection = await options.pdf.readSelection({
        sourceRecord: input.sourceRecord,
        sourceReference: replacementPath,
        ...input.verificationLocator,
      });
    } catch {
      return unavailable("The replacement Source Asset could not be verified.");
    }

    if (selection.outcome === "source-unavailable") {
      return unavailable(selection.detail);
    }

    if (
      selection.text.length !==
      input.verificationLocator.end - input.verificationLocator.start
    ) {
      return unavailable("The replacement Source Asset could not be verified.");
    }

    const nextStore: SourceAssetStore = {
      ...store,
      links: {
        ...store.links,
        [input.sourceRecord.id]: {
          mode: "linked-local",
          path: replacementPath,
          source_identity: current.sourceIdentity,
          content_identity: current.contentIdentity,
        },
      },
    };

    try {
      await writeStore(options.configurationPath, nextStore, filesystem);
    } catch {
      return unavailable("The replacement Source Asset could not be saved.");
    }

    return {
      outcome: "available",
      recorded: current,
      current,
    };
  };

  const readReferenceIdentity = async (
    reference: string,
  ): Promise<SourceAssetIdentityOutcome> => {
    if (!isAbsolute(reference)) {
      return unavailable("The replacement Source Asset is unavailable.");
    }

    return currentIdentityFor(resolve(reference), filesystem);
  };

  return { readIdentity, readReferenceIdentity, relink };
};
