/**
 * Filesystem seam rationale: this Adapter reads only the selected repository's
 * allow-listed portable directories and never exposes paths through Module outcomes.
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  DiscoveryAuthority,
  DiscoveryItem,
  DiscoveryItemKind,
  DiscoveryRepository,
  DiscoverySourceReference,
} from "../../modules/discovery";

interface FrontMatter {
  id?: string;
  title?: string;
  type?: string;
  state?: string;
  status?: string;
  source_record_id?: string;
  source_record_title?: string;
  source_locator?: string;
}

const frontMatterFor = (text: string): FrontMatter => {
  const match = text.match(/^---\n([\s\S]*?)\n---/u);
  if (match === null) {
    return {};
  }

  const result: FrontMatter = {};
  const supportedKeys = new Set([
    "id",
    "title",
    "type",
    "state",
    "status",
    "source_record_id",
    "source_record_title",
    "source_locator",
  ]);
  for (const line of (match[1] ?? "").split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/gu, "");
    if (supportedKeys.has(key)) {
      // Rationale: the parser has already restricted keys to the FrontMatter shape;
      // the assertion avoids duplicating a dynamic key-to-property switch.
      (result as Record<string, string>)[key] = value;
    }
  }
  return result;
};

const bodyFor = (text: string): string =>
  text.replace(/^---\n[\s\S]*?\n---\n?/u, "").trim();

const filesUnder = async (root: string): Promise<string[]> => {
  const entries = await readdir(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(path)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path);
    }
  }
  return files;
};

const authorityFor = (
  kind: DiscoveryItemKind,
  frontMatter: FrontMatter,
): DiscoveryAuthority => {
  if (kind === "topic" && frontMatter.status === "current") {
    return "core-knowledge";
  }
  if (kind === "source-record") {
    return "source-record";
  }
  return "working-material";
};

const sourceFor = (
  frontMatter: FrontMatter,
): DiscoverySourceReference | undefined => {
  if (
    frontMatter.source_record_id === undefined ||
    frontMatter.source_record_title === undefined
  ) {
    return undefined;
  }

  return {
    sourceRecordId: frontMatter.source_record_id,
    sourceRecordTitle: frontMatter.source_record_title,
    ...(frontMatter.source_locator === undefined
      ? {}
      : { locator: frontMatter.source_locator }),
  };
};

const itemFrom = (
  kind: DiscoveryItemKind,
  text: string,
): DiscoveryItem | undefined => {
  const frontMatter = frontMatterFor(text);
  const id = frontMatter.id;
  const title =
    frontMatter.title ??
    (kind === "structured-annotation"
      ? (frontMatter.source_record_title ?? id)
      : undefined);
  if (id === undefined || title === undefined) {
    return undefined;
  }

  const source = sourceFor(frontMatter);
  return {
    id,
    title,
    kind,
    authority: authorityFor(kind, frontMatter),
    text: bodyFor(text),
    ...(source === undefined ? {} : { source }),
  };
};

const readItemsFrom = async (
  repositoryRoot: string,
): Promise<DiscoveryItem[]> => {
  const directories: Array<{ path: string; kind: DiscoveryItemKind }> = [
    { path: join(repositoryRoot, "knowledge"), kind: "topic" },
    { path: join(repositoryRoot, "sources", "papers"), kind: "source-record" },
    {
      path: join(repositoryRoot, "sources", "annotations"),
      kind: "structured-annotation",
    },
    {
      path: join(repositoryRoot, "scratch", "synthesis-results"),
      kind: "saved-synthesis-result",
    },
  ];

  const items: DiscoveryItem[] = [];
  for (const directory of directories) {
    try {
      for (const path of await filesUnder(directory.path)) {
        const item = itemFrom(directory.kind, await readFile(path, "utf8"));
        if (item !== undefined) {
          items.push(item);
        }
      }
    } catch {
      // Optional repository roots are empty rather than a reason to block
      // provider-free navigation. The selected repository validator remains
      // responsible for reporting malformed repository roots.
    }
  }
  return items;
};

/**
 * Reads only portable discovery content from the selected Knowledge Repository.
 * @param repositoryRoot Validated root of the selected Knowledge Repository.
 * @returns Discoverable portable items in deterministic directory order.
 */
export const createFileBackedDiscoveryRepository = (
  repositoryRoot: string,
): DiscoveryRepository => ({
  readDiscoverableItems: () => readItemsFrom(repositoryRoot),
});
