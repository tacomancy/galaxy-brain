/**
 * Filesystem seam rationale: this Adapter enumerates only canonical repository
 * roots, rejects symbolic links, and translates portable files into sanitized
 * repository-relative navigation entries.
 */
import { lstat, open, readdir } from "node:fs/promises";
import { join, sep } from "node:path";

import type {
  RepositoryNavigationEntry,
  RepositoryNavigationOpenOutcome,
  RepositoryNavigationReadOutcome,
  RepositoryNavigationSource,
} from "../../modules/repository-navigation";

const canonicalRoots = [
  "assets",
  "knowledge",
  "projects",
  "proposals",
  "scratch",
  "sources",
  "templates",
] as const;

const hiddenSegments = new Set([
  ".git",
  ".galaxy-brain",
  ".transactions",
  "node_modules",
]);

type FrontMatter = {
  id?: string;
  title?: string;
};

const parseFrontMatter = (contents: string): FrontMatter => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(contents);
  if (match?.[1] === undefined) return {};

  const result: FrontMatter = {};
  for (const line of match[1].split(/\r?\n/u)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/gu, "");
    if (key === "id" || key === "title") {
      result[key] = value;
    }
  }
  return result;
};

const titleFrom = (contents: string, fallback: string): string => {
  const frontMatter = parseFrontMatter(contents);
  if (frontMatter.title !== undefined && frontMatter.title.length > 0) {
    return frontMatter.title;
  }

  const heading = /^#\s+(.+)$/mu.exec(
    contents.replace(/^---[\s\S]*?---\s*/u, ""),
  );
  return heading?.[1]?.trim() ?? fallback;
};

const identityFrom = (contents: string, path: string): string =>
  parseFrontMatter(contents).id ?? path;

const isHiddenPath = (path: string): boolean =>
  path.split(sep).some((segment) => hiddenSegments.has(segment));

const isCanonicalPath = (path: string): boolean =>
  canonicalRoots.some(
    (root) => path === root || path.startsWith(`${root}${sep}`),
  );

const isMarkdownUnder = (path: string, directory: string): boolean =>
  path.startsWith(`${directory}${sep}`) && path.endsWith(".md");

const hasIdentity = (frontMatter: FrontMatter): boolean =>
  frontMatter.id !== undefined && frontMatter.title !== undefined;

const synthesisResultSupportFor = (contents: string): boolean => {
  try {
    // The JSON shape is validated immediately after parsing; no repository
    // content is treated as a typed object before these checks succeed.
    const parsed = JSON.parse(contents) as { id?: unknown; title?: unknown };
    return typeof parsed.id === "string" && typeof parsed.title === "string";
  } catch {
    return false;
  }
};

const markdownSupportFor = (
  path: string,
  frontMatter: FrontMatter,
): RepositoryNavigationEntry["support"] | undefined => {
  const supportByDirectory: ReadonlyArray<
    readonly [string, RepositoryNavigationEntry["support"]]
  > = [
    ["knowledge", "topic"],
    [`sources${sep}annotations`, "structured-annotation"],
    ["sources", "source-record"],
  ];
  const match = supportByDirectory.find(([directory]) =>
    isMarkdownUnder(path, directory),
  );
  if (match === undefined) return undefined;
  return hasIdentity(frontMatter) ? match[1] : "unsupported";
};

const supportFor = (
  path: string,
  contents: string | undefined,
): RepositoryNavigationEntry["support"] => {
  if (contents === undefined) return "directory";
  if (!path.includes(sep)) return "unsupported";
  const frontMatter = parseFrontMatter(contents);
  const markdownSupport = markdownSupportFor(path, frontMatter);
  if (markdownSupport !== undefined) return markdownSupport;
  if (
    path.startsWith(`scratch${sep}synthesis-results${sep}`) &&
    path.endsWith(".json")
  ) {
    return synthesisResultSupportFor(contents)
      ? "saved-synthesis-result"
      : "unsupported";
  }
  if (isMarkdownUnder(path, "scratch") && frontMatter.title !== undefined) {
    return "working-material";
  }
  return "unsupported";
};

const readSafeFile = async (path: string): Promise<string> => {
  const fileHandle = await open(path, "r");
  try {
    if (!(await fileHandle.stat()).isFile()) {
      throw new Error("The repository entry is not a regular file.");
    }
    return await fileHandle.readFile("utf8");
  } finally {
    await fileHandle.close();
  }
};

const readEntriesUnder = async (
  repositoryPath: string,
  currentPath: string,
): Promise<RepositoryNavigationEntry[]> => {
  const entries = await readdir(join(repositoryPath, currentPath), {
    withFileTypes: true,
  });
  const result: RepositoryNavigationEntry[] = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const path = join(currentPath, entry.name);
    if (isHiddenPath(path)) continue;
    const fullPath = join(repositoryPath, path);
    const stats = await lstat(fullPath);
    if (stats.isSymbolicLink()) {
      throw new Error("The repository contains an unsafe symbolic link.");
    }

    if (entry.isDirectory()) {
      result.push({
        path,
        name: entry.name,
        kind: "directory",
        support: "directory",
      });
      result.push(...(await readEntriesUnder(repositoryPath, path)));
      continue;
    }

    if (!entry.isFile()) continue;
    const contents = await readSafeFile(fullPath);
    const support = supportFor(path, contents);
    result.push({
      path,
      name: entry.name,
      kind: "file",
      support,
      ...(support === "unsupported"
        ? {}
        : {
            title: titleFrom(contents, entry.name),
            identity: identityFrom(contents, path),
          }),
    });
  }

  return result;
};

const openTargetFor = (
  path: string,
  contents: string,
): RepositoryNavigationOpenOutcome => {
  const support = supportFor(path, contents);
  const title = titleFrom(contents, path);
  const identity = identityFrom(contents, path);
  if (
    support === "topic" ||
    support === "source-record" ||
    support === "structured-annotation" ||
    support === "saved-synthesis-result"
  ) {
    return { outcome: support, path, identity, title };
  }
  if (support === "working-material") {
    return { outcome: "working-material", path, title };
  }
  return {
    outcome: "unsupported",
    path,
    detail: "This repository file has no supported Workbench view yet.",
  };
};

/**
 * Creates a safe navigation Adapter for one explicitly selected repository.
 * @param repositoryPath The already-selected Knowledge Repository root.
 * @returns A repository-relative navigation source with safe open outcomes.
 */
export const createFileBackedRepositoryNavigation = (
  repositoryPath: string,
): RepositoryNavigationSource => ({
  readEntries: async (): Promise<RepositoryNavigationReadOutcome> => {
    try {
      const entries: RepositoryNavigationEntry[] = [];
      for (const root of canonicalRoots) {
        const rootStats = await lstat(join(repositoryPath, root));
        if (rootStats.isSymbolicLink() || !rootStats.isDirectory()) {
          return {
            outcome: "unavailable",
            detail: "The selected Knowledge Repository could not be read.",
          };
        }
        entries.push({
          path: root,
          name: root,
          kind: "directory",
          support: "directory",
        });
        entries.push(...(await readEntriesUnder(repositoryPath, root)));
      }
      return { outcome: "available", entries };
    } catch {
      return {
        outcome: "unavailable",
        detail: "The selected Knowledge Repository could not be read.",
      };
    }
  },
  openEntry: async (path): Promise<RepositoryNavigationOpenOutcome> => {
    if (!isCanonicalPath(path) || isHiddenPath(path)) {
      return {
        outcome: "unavailable",
        detail: "The repository navigation target is unavailable.",
      };
    }

    try {
      const stats = await lstat(join(repositoryPath, path));
      if (stats.isSymbolicLink() || !stats.isFile()) {
        return {
          outcome: "unsupported",
          path,
          detail: "This repository entry has no supported Workbench view yet.",
        };
      }
      return openTargetFor(
        path,
        await readSafeFile(join(repositoryPath, path)),
      );
    } catch {
      return {
        outcome: "unavailable",
        detail: "The selected Knowledge Repository could not be read.",
      };
    }
  },
});
