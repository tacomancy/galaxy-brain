/**
 * Filesystem seam rationale: this Adapter keeps authored notes in the selected
 * repository's scratch root, validates portable frontmatter, and uses the
 * shared atomic/fingerprint store so external edits are never overwritten.
 */
import { createHash } from "node:crypto";

import {
  createRepositoryScopedArtifactStore,
  isRepositoryScopedArtifactStoreRepositoryError,
} from "./repository-scoped-artifact-store";
import type {
  WorkingMaterialNoteOutcome,
  WorkingMaterialNoteRepository,
  WorkingMaterialNoteSaveInput,
} from "../../modules/working-material-authoring";

const notePathFor = (title: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, 64);
  return `scratch/tb17-${slug || "working-material"}.md`;
};

const serialize = (title: string, body: string, date: string): string =>
  [
    "---",
    `title: ${title}`,
    "type: scratch",
    "status: active",
    `created: ${date}`,
    `reviewed: ${date}`,
    "tags: []",
    "candidate_tags: []",
    "aliases: []",
    "---",
    "",
    `# ${title}`,
    "",
    body,
    "",
  ].join("\n");

const frontMatter = (
  source: string,
): { title: string; body: string } | undefined => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u.exec(source);
  if (match?.[1] === undefined || match[2] === undefined) return undefined;
  const titleLine = match[1]
    .split(/\r?\n/u)
    .find((line) => line.startsWith("title:"));
  const title = titleLine
    ?.slice("title:".length)
    .trim()
    .replace(/^['"]|['"]$/gu, "");
  if (title === undefined || title.length === 0) return undefined;
  const body = match[2].replace(new RegExp(`^\\s*# ${title}\\r?\\n?`, "u"), "");
  return { title, body: body.trim() };
};

const outcomeFor = (
  path: string,
  source: string,
  fingerprint: string | undefined,
  saved: boolean,
): WorkingMaterialNoteOutcome => {
  const parsed = frontMatter(source);
  if (parsed === undefined) {
    return {
      outcome: "invalid",
      detail: "The Working Material note has invalid frontmatter.",
    };
  }
  return {
    outcome: "available",
    note: {
      path,
      title: parsed.title,
      body: parsed.body,
      source,
      ...(fingerprint === undefined ? {} : { fingerprint }),
      saved,
    },
  };
};

const unavailable = (): WorkingMaterialNoteOutcome => ({
  outcome: "unavailable",
  detail: "The selected Knowledge Repository could not save Working Material.",
});

const externalChangeDetail =
  "The Working Material note changed outside Galaxy Brain; no edit was overwritten.";

const externalChange = (): WorkingMaterialNoteOutcome => ({
  outcome: "external-change",
  detail: externalChangeDetail,
});

/**
 * Creates the production Adapter for notes in one selected repository.
 * @param repositoryPath The already-selected Knowledge Repository root.
 * @returns A durable Working Material note repository scoped to that root.
 */
export const createFileBackedWorkingMaterialNoteRepository = (
  repositoryPath: string,
): WorkingMaterialNoteRepository => {
  const store = createRepositoryScopedArtifactStore({
    artifactDirectory: "scratch",
    externalChangeDetail,
    requiredDirectory: "scratch",
    unsafeDirectoryDetail: "The repository scratch directory is unsafe.",
    unsafeFileDetail: "The Working Material note target is unsafe.",
    unsafeRepositoryDetail: "The selected Knowledge Repository is unsafe.",
    repositoryPath,
  });

  const readAt = async (path: string): Promise<WorkingMaterialNoteOutcome> => {
    if (!/^scratch\/[a-z0-9-]+\.md$/u.test(path)) {
      return {
        outcome: "invalid",
        detail: "The Working Material note path is invalid.",
      };
    }
    const fileName = path.slice("scratch/".length);
    try {
      const source = (await store.readFile(fileName)).toString("utf8");
      return outcomeFor(path, source, await store.fingerprint(fileName), true);
    } catch (cause: unknown) {
      if (isRepositoryScopedArtifactStoreRepositoryError(cause))
        return unavailable();
      return {
        outcome: "not-found",
        detail: "The Working Material note was not found.",
      };
    }
  };

  return {
    createNote: async ({
      title,
      body,
      date,
    }): Promise<WorkingMaterialNoteOutcome> => {
      const path = notePathFor(title);
      const fileName = path.slice("scratch/".length);
      const source = serialize(title, body, date);
      try {
        if ((await store.fingerprint(fileName)) !== undefined) {
          return {
            outcome: "unavailable",
            detail: "A Working Material note with that name already exists.",
          };
        }
        await store.writeFile({
          contents: source,
          expectedFingerprint: undefined,
          fileName,
        });
        return outcomeFor(
          path,
          source,
          createHash("sha256").update(source).digest("hex"),
          true,
        );
      } catch {
        return unavailable();
      }
    },
    readNote: readAt,
    saveNote: async ({
      path,
      title,
      body,
      expectedFingerprint,
    }: WorkingMaterialNoteSaveInput) => {
      if (!/^scratch\/[a-z0-9-]+\.md$/u.test(path)) {
        return {
          outcome: "invalid",
          detail: "The Working Material note path is invalid.",
        };
      }
      const fileName = path.slice("scratch/".length);
      const source = serialize(
        title,
        body,
        new Date().toISOString().slice(0, 10),
      );
      try {
        await store.writeFile({
          contents: source,
          expectedFingerprint,
          fileName,
        });
        return outcomeFor(
          path,
          source,
          await store.fingerprint(fileName),
          true,
        );
      } catch (cause: unknown) {
        if (cause instanceof Error && cause.message.includes("changed"))
          return externalChange();
        return unavailable();
      }
    },
  };
};
