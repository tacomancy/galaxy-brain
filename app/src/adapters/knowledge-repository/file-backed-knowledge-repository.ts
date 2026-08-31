/**
 * Filesystem transaction Adapter. It copies a starter into a temporary
 * sibling, validates the complete skeleton, and renames only into a new or
 * explicitly empty destination, so failed creation cannot overwrite data.
 */
import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  mkdtemp,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";

import { createFileBackedWorkingMaterialRepository } from "../working-material/file-backed-working-material-repository";
import type {
  KnowledgeRepository,
  RepositoryOperationOutcome,
  WorkbenchContext,
  WorkbenchContextReadOutcome,
} from "../../modules/workbench-session";
import type { WorkingMaterialReadOutcome } from "../../modules/source-processing";

const canonicalRoots = [
  "assets",
  "knowledge",
  "projects",
  "proposals",
  "scratch",
  "sources",
  "templates",
] as const;

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error && "code" in error;

class InvalidRepositoryFormatError extends Error {}

class UnsafeRepositoryTargetError extends Error {}

class UnsupportedRepositoryFormatError extends Error {}

/**
 * Narrow external-filesystem seam used to verify transaction recovery. The
 * application composition uses the real fs/promises operations by default.
 */
export interface KnowledgeRepositoryFileSystem {
  rename: typeof rename;
  rm: typeof rm;
}

const defaultFileSystem: KnowledgeRepositoryFileSystem = { rename, rm };

const readStarterFile = async (sourcePath: string): Promise<Buffer> => {
  // Open and validate the same descriptor so a starter-path replacement
  // cannot turn the prior safety check into a read of a different file.
  const fileHandle = await open(
    sourcePath,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );

  try {
    if (!(await fileHandle.stat()).isFile()) {
      throw new UnsafeRepositoryTargetError(
        "The starter skeleton contains an unsafe non-file entry.",
      );
    }

    return await fileHandle.readFile();
  } finally {
    await fileHandle.close();
  }
};

const copyStarterEntry = async (
  sourcePath: string,
  destinationPath: string,
): Promise<void> => {
  const sourceStats = await lstat(sourcePath);

  if (sourceStats.isSymbolicLink()) {
    throw new UnsafeRepositoryTargetError(
      "The starter skeleton contains an unsafe symbolic link.",
    );
  }

  if (sourceStats.isDirectory()) {
    await mkdir(destinationPath);

    for (const entry of await readdir(sourcePath)) {
      await copyStarterEntry(
        join(sourcePath, entry),
        join(destinationPath, entry),
      );
    }

    return;
  }

  await writeFile(destinationPath, await readStarterFile(sourcePath));
};

const copyStarterContents = async (
  sourceRoot: string,
  destinationRoot: string,
): Promise<void> => {
  for (const entry of await readdir(sourceRoot)) {
    await copyStarterEntry(
      join(sourceRoot, entry),
      join(destinationRoot, entry),
    );
  }
};

type Quote = "single" | "double";

const isQuoteStart = (
  character: string | undefined,
  quote: Quote | undefined,
  previousCharacter: string | undefined,
): boolean =>
  quote === undefined &&
  (character === "'" || character === '"') &&
  (previousCharacter === undefined || /\s|:/.test(previousCharacter));

const isCommentStart = (
  character: string | undefined,
  previousCharacter: string | undefined,
): boolean =>
  character === "#" &&
  (previousCharacter === undefined || /\s/.test(previousCharacter));

const readQuotedCharacter = (
  line: string,
  index: number,
  quote: Quote,
): { quote: Quote | undefined; nextIndex: number } | undefined => {
  const character = line[index];

  if (quote === "double" && character === "\\") {
    return { quote, nextIndex: index + 1 };
  }

  if (quote === "single" && character === "'") {
    return {
      quote: line[index + 1] === "'" ? quote : undefined,
      nextIndex: line[index + 1] === "'" ? index + 1 : index,
    };
  }

  if (quote === "double" && character === '"') {
    return { quote: undefined, nextIndex: index };
  }

  return undefined;
};

const stripYamlComment = (line: string): string => {
  let quote: Quote | undefined;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const previousCharacter = line[index - 1];

    if (quote !== undefined) {
      const quotedCharacter = readQuotedCharacter(line, index, quote);

      if (quotedCharacter !== undefined) {
        quote = quotedCharacter.quote;
        index = quotedCharacter.nextIndex;
      }

      continue;
    }

    if (isQuoteStart(character, quote, previousCharacter)) {
      quote = character === "'" ? "single" : "double";
      continue;
    }

    if (isCommentStart(character, previousCharacter)) {
      return line.slice(0, index);
    }
  }

  if (quote !== undefined) {
    throw new InvalidRepositoryFormatError(
      "The repository manifest contains an unterminated scalar.",
    );
  }

  return line;
};

const parseYamlScalar = (value: string): string => {
  const trimmedValue = value.trim();

  if (
    trimmedValue === "" ||
    trimmedValue.startsWith("[") ||
    trimmedValue.startsWith("{") ||
    trimmedValue.startsWith("&") ||
    trimmedValue.startsWith("*") ||
    trimmedValue.startsWith("!") ||
    trimmedValue.startsWith("|") ||
    trimmedValue.startsWith(">")
  ) {
    throw new InvalidRepositoryFormatError(
      "The repository manifest contains a non-scalar value.",
    );
  }

  if (trimmedValue.startsWith("'")) {
    if (!trimmedValue.endsWith("'") || trimmedValue.length < 2) {
      throw new InvalidRepositoryFormatError(
        "The repository manifest contains an invalid quoted scalar.",
      );
    }

    return trimmedValue.slice(1, -1).replace(/''/g, "'");
  }

  if (trimmedValue.startsWith('"')) {
    try {
      const parsedValue: unknown = JSON.parse(trimmedValue);

      if (typeof parsedValue !== "string") {
        throw new Error("The quoted value is not a string.");
      }

      return parsedValue;
    } catch {
      throw new InvalidRepositoryFormatError(
        "The repository manifest contains an invalid quoted scalar.",
      );
    }
  }

  return trimmedValue;
};

const parseManifest = (
  manifest: string,
): {
  format: string;
  formatVersion: number;
} => {
  const entries = new Map<string, string>();
  const manifestWithoutBom = manifest.replace(/^\uFEFF/, "");

  for (const line of manifestWithoutBom.split(/\r?\n/)) {
    const content = stripYamlComment(line).trim();

    if (content === "") {
      continue;
    }

    if (content === "---" || content === "...") {
      throw new InvalidRepositoryFormatError(
        "The repository manifest contains multiple YAML documents.",
      );
    }

    const match =
      /^(?<key>[A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]+(?<value>.*))?$/.exec(content);

    if (match?.groups?.key === undefined || match.groups.value === undefined) {
      throw new InvalidRepositoryFormatError(
        "The repository manifest is malformed.",
      );
    }

    if (entries.has(match.groups.key)) {
      throw new InvalidRepositoryFormatError(
        "The repository manifest contains a duplicate key.",
      );
    }

    entries.set(match.groups.key, parseYamlScalar(match.groups.value));
  }

  const format = entries.get("format");
  const formatVersionValue = entries.get("format_version");

  if (format === undefined || formatVersionValue === undefined) {
    throw new InvalidRepositoryFormatError(
      "The repository manifest is missing a required declaration.",
    );
  }

  if (!/^\d+$/.test(formatVersionValue)) {
    throw new InvalidRepositoryFormatError(
      "The repository format version is not a positive integer.",
    );
  }

  const formatVersion = Number(formatVersionValue);

  if (!Number.isSafeInteger(formatVersion) || formatVersion < 1) {
    throw new InvalidRepositoryFormatError(
      "The repository format version is not a positive integer.",
    );
  }

  return { format, formatVersion };
};

const readManifest = async (
  repositoryPath: string,
): Promise<{
  format: string;
  formatVersion: number;
}> => {
  try {
    return parseManifest(
      await readFile(join(repositoryPath, "galaxy-brain.yaml"), "utf8"),
    );
  } catch (error: unknown) {
    if (error instanceof InvalidRepositoryFormatError) {
      throw error;
    }

    throw new InvalidRepositoryFormatError(
      "The repository manifest is missing or unreadable.",
    );
  }
};

const readMarkdownMetadata = async (
  markdownPath: string,
): Promise<Map<string, string> | undefined> => {
  const markdown = await readFile(markdownPath, "utf8");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);

  if (frontmatter?.[1] === undefined) {
    return undefined;
  }

  const entries = new Map<string, string>();

  for (const line of frontmatter[1].split(/\r?\n/)) {
    const content = stripYamlComment(line).trim();

    if (content === "") {
      continue;
    }

    const match =
      /^(?<key>[A-Za-z_][A-Za-z0-9_-]*):(?:[ \t]+(?<value>.*))?$/.exec(content);

    if (match?.groups?.key === undefined || match.groups.value === undefined) {
      return undefined;
    }

    if (entries.has(match.groups.key)) {
      return undefined;
    }

    try {
      entries.set(match.groups.key, parseYamlScalar(match.groups.value));
    } catch {
      return undefined;
    }
  }

  return entries;
};

const findMarkdownMetadata = async (
  root: string,
  type: string,
): Promise<Map<string, string>[]> => {
  const entries = await readdir(root, {
    encoding: "utf8",
    withFileTypes: true,
  });
  const metadataEntries: Map<string, string>[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || extname(entry.name) !== ".md") {
      continue;
    }

    const metadata = await readMarkdownMetadata(join(root, entry.name));

    if (metadata?.get("type") === type) {
      metadataEntries.push(metadata);
    }
  }

  return metadataEntries;
};

const compareStrings = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const completeTopicMetadata = (
  metadata: Map<string, string> | undefined,
): { id: string; title: string; sourceReference: string } | undefined => {
  const id = metadata?.get("id");
  const title = metadata?.get("title");
  const sourceReference = metadata?.get("source_record");

  if (
    id === undefined ||
    title === undefined ||
    sourceReference === undefined ||
    isAbsolute(sourceReference)
  ) {
    return undefined;
  }

  return { id, title, sourceReference };
};

const isRepositoryRelativePath = (path: string): boolean =>
  path !== "" && !path.startsWith("..") && !isAbsolute(path);

const completeSourceMetadata = (
  metadata: Map<string, string> | undefined,
): { id: string; title: string } | undefined => {
  const id = metadata?.get("id");
  const title = metadata?.get("title");

  if (
    metadata?.get("type") !== "source" ||
    id === undefined ||
    title === undefined
  ) {
    return undefined;
  }

  return { id, title };
};

const readWorkbenchContexts = async (
  repositoryPath: string,
): Promise<WorkbenchContext[]> => {
  const topicMetadataEntries = await findMarkdownMetadata(
    join(repositoryPath, "knowledge"),
    "topic",
  );
  const contexts: WorkbenchContext[] = [];
  let sourceReadFailure: unknown;

  for (const topicMetadata of topicMetadataEntries) {
    const topic = completeTopicMetadata(topicMetadata);

    if (topic === undefined) {
      continue;
    }

    const sourcePath = resolve(repositoryPath, topic.sourceReference);
    const relativeSourcePath = relative(repositoryPath, sourcePath);

    if (!isRepositoryRelativePath(relativeSourcePath)) {
      continue;
    }

    let sourceMetadata: Map<string, string> | undefined;

    try {
      sourceMetadata = await readMarkdownMetadata(sourcePath);
    } catch (cause: unknown) {
      sourceReadFailure ??= cause;
      continue;
    }

    const source = completeSourceMetadata(sourceMetadata);

    if (source === undefined) {
      continue;
    }

    contexts.push({
      topic: { id: topic.id, title: topic.title },
      sourceRecord: source,
    });
  }

  if (contexts.length === 0 && sourceReadFailure !== undefined) {
    throw sourceReadFailure;
  }

  return contexts.sort(
    (left, right) =>
      compareStrings(left.topic.id, right.topic.id) ||
      compareStrings(left.sourceRecord.id, right.sourceRecord.id),
  );
};

const validateRepositoryRoots = async (
  repositoryPath: string,
): Promise<void> => {
  for (const root of canonicalRoots) {
    let stats: Awaited<ReturnType<typeof lstat>>;

    try {
      stats = await lstat(join(repositoryPath, root));
    } catch {
      throw new InvalidRepositoryFormatError(
        "A canonical repository root is missing or unreadable.",
      );
    }

    if (!stats.isDirectory() || stats.isSymbolicLink()) {
      throw new InvalidRepositoryFormatError(
        "The repository has an invalid canonical root.",
      );
    }
  }
};

const validateStagedRepository = async (stagedPath: string): Promise<void> => {
  const { format, formatVersion } = await readManifest(stagedPath);

  if (format !== "galaxy-brain" || formatVersion !== 1) {
    throw new InvalidRepositoryFormatError(
      "The starter skeleton has an invalid repository manifest.",
    );
  }

  await validateRepositoryRoots(stagedPath);
};

const validateNoSymlinks = async (repositoryPath: string): Promise<void> => {
  const stats = await lstat(repositoryPath);

  if (stats.isSymbolicLink()) {
    throw new UnsafeRepositoryTargetError(
      "The selected repository contains an unsafe symbolic link.",
    );
  }

  if (stats.isDirectory()) {
    for (const entry of await readdir(repositoryPath)) {
      await validateNoSymlinks(join(repositoryPath, entry));
    }
  }
};

const operationFailed = (): RepositoryOperationOutcome => ({
  outcome: "operation-failed",
  detail: "The Knowledge Repository could not be created.",
});

const invalidFormat = (): RepositoryOperationOutcome => ({
  outcome: "invalid-format",
  detail: "The selected target is not a valid Knowledge Repository.",
});

const unsafeTarget = (): RepositoryOperationOutcome => ({
  outcome: "unsafe-target",
  detail: "The selected target contains unsafe filesystem entries.",
});

const targetUnavailable = (): RepositoryOperationOutcome => ({
  outcome: "target-unavailable",
  detail: "The selected Knowledge Repository is unavailable.",
});

const unsupportedFormat = (): RepositoryOperationOutcome => ({
  outcome: "unsupported-format",
  detail: "The selected target uses an unsupported repository format.",
});

const openingFailed = (): RepositoryOperationOutcome => ({
  outcome: "operation-failed",
  detail: "The Knowledge Repository could not be opened.",
});

type CreationTarget = { canonicalParent: string; canonicalRoot: string };

const resolveCreationTarget = async (
  requestedRoot: string,
): Promise<CreationTarget | RepositoryOperationOutcome> => {
  let parentStats: Awaited<ReturnType<typeof lstat>>;

  try {
    parentStats = await lstat(dirname(requestedRoot));
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return targetUnavailable();
    }

    throw error;
  }

  if (parentStats.isSymbolicLink()) {
    return unsafeTarget();
  }

  if (!parentStats.isDirectory()) {
    return targetUnavailable();
  }

  const canonicalParent = await realpath(dirname(requestedRoot));
  const canonicalRoot = join(canonicalParent, basename(requestedRoot));

  try {
    const targetStats = await lstat(canonicalRoot);

    if (targetStats.isSymbolicLink() || !targetStats.isDirectory()) {
      return operationFailed();
    }

    if ((await readdir(canonicalRoot)).length > 0) {
      return operationFailed();
    }
  } catch (error: unknown) {
    if (!isErrnoException(error) || error.code !== "ENOENT") {
      return operationFailed();
    }
  }

  return { canonicalParent, canonicalRoot };
};

const moveExistingCreationTarget = async (
  canonicalRoot: string,
  canonicalParent: string,
  filesystem: KnowledgeRepositoryFileSystem,
  state: CreationState,
): Promise<void> => {
  try {
    const targetStats = await lstat(canonicalRoot);

    if (
      targetStats.isSymbolicLink() ||
      !targetStats.isDirectory() ||
      (await readdir(canonicalRoot)).length > 0
    ) {
      throw new Error("The selected target is no longer an empty directory.");
    }

    state.backupRoot = await mkdtemp(
      join(canonicalParent, ".galaxy-brain-create-backup-"),
    );
    await filesystem.rm(state.backupRoot, { recursive: true, force: true });
    await filesystem.rename(canonicalRoot, state.backupRoot);
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
};

interface CreationState {
  stagingRoot: string | undefined;
  backupRoot: string | undefined;
  existingTargetMoved: boolean;
  repositoryInstalled: boolean;
  preserveBackup: boolean;
}

const restoreCreationBackup = async (
  state: CreationState,
  canonicalRoot: string,
  filesystem: KnowledgeRepositoryFileSystem,
): Promise<void> => {
  if (
    !state.existingTargetMoved ||
    state.repositoryInstalled ||
    state.backupRoot === undefined
  ) {
    return;
  }

  try {
    await filesystem.rename(state.backupRoot, canonicalRoot);
    state.backupRoot = undefined;
  } catch {
    // Keep the backup in place rather than deleting user content when
    // restoration itself cannot complete.
    state.preserveBackup = true;
  }
};

const cleanupCreation = async (
  state: CreationState,
  filesystem: KnowledgeRepositoryFileSystem,
): Promise<void> => {
  if (state.stagingRoot !== undefined) {
    await filesystem.rm(state.stagingRoot, { recursive: true, force: true });
  }

  if (state.backupRoot !== undefined && !state.preserveBackup) {
    await filesystem.rm(state.backupRoot, { recursive: true, force: true });
  }
};

const resolveOpenTarget = async (
  requestedRoot: string,
): Promise<string | RepositoryOperationOutcome> => {
  const parentStats = await lstat(dirname(requestedRoot));

  if (parentStats.isSymbolicLink()) {
    return unsafeTarget();
  }

  if (!parentStats.isDirectory()) {
    return targetUnavailable();
  }

  const canonicalParent = await realpath(dirname(requestedRoot));
  const canonicalRoot = join(canonicalParent, basename(requestedRoot));
  const targetStats = await lstat(canonicalRoot);

  if (targetStats.isSymbolicLink()) {
    return unsafeTarget();
  }

  if (!targetStats.isDirectory()) {
    return invalidFormat();
  }

  return canonicalRoot;
};

/**
 * Creates Knowledge Repositories from the bundled empty starter skeleton.
 * Creation is staged in a temporary sibling and selects the destination only
 * after validation and the final rename succeed.
 * @param starterRoot The empty starter skeleton to copy.
 * @param filesystem The filesystem Adapter used for recoverable creation.
 * @returns The file-backed Knowledge Repository Adapter.
 */
export const createFileBackedKnowledgeRepository = (
  starterRoot: string,
  filesystem: KnowledgeRepositoryFileSystem = defaultFileSystem,
): KnowledgeRepository => ({
  createAt: async (requestedPath): Promise<RepositoryOperationOutcome> => {
    const requestedRoot = resolve(requestedPath);
    let target: CreationTarget | RepositoryOperationOutcome;

    try {
      target = await resolveCreationTarget(requestedRoot);
    } catch {
      return operationFailed();
    }

    if ("outcome" in target) {
      return target;
    }

    const state: CreationState = {
      stagingRoot: undefined,
      backupRoot: undefined,
      existingTargetMoved: false,
      repositoryInstalled: false,
      preserveBackup: false,
    };

    try {
      // Store each temporary path before the next filesystem operation so the
      // transaction cleanup can recover from a failure at any later step.
      state.stagingRoot = await mkdtemp(
        join(target.canonicalParent, ".galaxy-brain-create-"),
      );
      await copyStarterContents(starterRoot, state.stagingRoot);
      await validateStagedRepository(state.stagingRoot);
      await moveExistingCreationTarget(
        target.canonicalRoot,
        target.canonicalParent,
        filesystem,
        state,
      );
      state.existingTargetMoved = state.backupRoot !== undefined;

      await filesystem.rename(state.stagingRoot, target.canonicalRoot);
      state.stagingRoot = undefined;
      state.repositoryInstalled = true;

      if (state.backupRoot !== undefined) {
        // Placement is the commit point. Cleanup is best effort afterward;
        // reporting failure here would leave callers believing that no
        // repository was installed even though the final rename succeeded.
        const completedBackup = state.backupRoot;
        state.backupRoot = undefined;
        await filesystem
          .rm(completedBackup, { recursive: true, force: true })
          .catch(() => undefined);
      }

      return { outcome: "created", repositoryPath: target.canonicalRoot };
    } catch {
      await restoreCreationBackup(state, target.canonicalRoot, filesystem);
      return operationFailed();
    } finally {
      await cleanupCreation(state, filesystem);
    }
  },
  openAt: async (requestedPath): Promise<RepositoryOperationOutcome> => {
    try {
      const target = await resolveOpenTarget(resolve(requestedPath));

      if (typeof target !== "string") {
        return target;
      }

      const canonicalRoot = target;

      await validateNoSymlinks(canonicalRoot);
      const { format, formatVersion } = await readManifest(canonicalRoot);

      if (format !== "galaxy-brain") {
        throw new UnsupportedRepositoryFormatError();
      }

      await validateRepositoryRoots(canonicalRoot);

      if (formatVersion > 1) {
        return {
          outcome: "read-only-compatible",
          repositoryPath: canonicalRoot,
        };
      }

      return { outcome: "opened", repositoryPath: canonicalRoot };
    } catch (error: unknown) {
      if (error instanceof UnsafeRepositoryTargetError) {
        return unsafeTarget();
      }

      if (error instanceof InvalidRepositoryFormatError) {
        return invalidFormat();
      }

      if (error instanceof UnsupportedRepositoryFormatError) {
        return unsupportedFormat();
      }

      if (isErrnoException(error) && error.code === "ENOENT") {
        return targetUnavailable();
      }

      return openingFailed();
    }
  },
  readWorkbenchContext: async (
    repositoryPath,
  ): Promise<WorkbenchContextReadOutcome> => {
    try {
      const contexts = await readWorkbenchContexts(repositoryPath);

      if (contexts.length === 0) {
        return {
          outcome: "not-found",
          detail: "No complete topic context is available.",
        };
      }

      if (contexts.length > 1) {
        return { outcome: "ambiguous", contexts };
      }

      const [context] = contexts;

      if (context === undefined) {
        return {
          outcome: "not-found",
          detail: "No complete topic context is available.",
        };
      }

      return { outcome: "available", context };
    } catch (cause: unknown) {
      return {
        outcome: "unavailable",
        detail: "The selected repository context could not be read.",
        cause,
      };
    }
  },
  readWorkbenchAnnotation: async (
    repositoryPath,
    sourceRecordId,
  ): Promise<WorkingMaterialReadOutcome> =>
    createFileBackedWorkingMaterialRepository(
      repositoryPath,
    ).readAnnotationForSourceRecord(sourceRecordId),
});
