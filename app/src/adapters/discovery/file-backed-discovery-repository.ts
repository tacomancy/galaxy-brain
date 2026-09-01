/**
 * Filesystem seam rationale: this Adapter reads only the selected repository's
 * allow-listed portable directories and never exposes paths through Module outcomes.
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";

import type {
  DiscoveryAuthority,
  DiscoveryItem,
  DiscoveryItemKind,
  DiscoveryRepositoryReadOutcome,
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
  entries.sort((left, right) => left.name.localeCompare(right.name));
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(path)));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".md") || entry.name.endsWith(".json"))
    ) {
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
  fallbackId: string,
): DiscoveryItem | undefined => {
  const frontMatter = frontMatterFor(text);
  const id = frontMatter.id ?? fallbackId;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sourceFromSavedResult = (
  provenance: Record<string, unknown> | undefined,
): DiscoveryItem["source"] => {
  const sourceContext = provenance?.sourceContext;
  const firstSource = Array.isArray(sourceContext)
    ? sourceContext.find(
        (entry): entry is Record<string, unknown> =>
          isRecord(entry) && isRecord(entry.sourceRecord),
      )
    : undefined;
  const sourceRecord = firstSource?.sourceRecord;
  return isRecord(sourceRecord) &&
    typeof sourceRecord.id === "string" &&
    typeof sourceRecord.title === "string" &&
    typeof firstSource?.sourceLocator === "string"
    ? {
        sourceRecordId: sourceRecord.id,
        sourceRecordTitle: sourceRecord.title,
        locator: firstSource.sourceLocator,
      }
    : undefined;
};

const targetTopicFromSavedResult = (
  value: Record<string, unknown>,
): DiscoveryItem["targetTopic"] => {
  const targetTopic = value.targetTopic;
  return isRecord(targetTopic) &&
    typeof targetTopic.id === "string" &&
    typeof targetTopic.title === "string"
    ? { id: targetTopic.id, title: targetTopic.title }
    : undefined;
};

const savedResultFrom = (text: string): DiscoveryItem | undefined => {
  try {
    const value: unknown = JSON.parse(text);
    if (
      !isRecord(value) ||
      typeof value.id !== "string" ||
      typeof value.title !== "string" ||
      typeof value.text !== "string"
    ) {
      return undefined;
    }

    const provenance = isRecord(value.provenance)
      ? value.provenance
      : undefined;
    const source = sourceFromSavedResult(provenance);
    const targetTopic = targetTopicFromSavedResult(value);

    return {
      id: value.id,
      title: value.title,
      kind: "saved-synthesis-result",
      authority: "working-material",
      text: value.text,
      ...(source === undefined ? {} : { source }),
      ...(targetTopic === undefined ? {} : { targetTopic }),
    };
  } catch {
    return undefined;
  }
};

const readItemsFrom = async (
  repositoryRoot: string,
): Promise<DiscoveryRepositoryReadOutcome> => {
  const directories: Array<{ path: string; kind: DiscoveryItemKind }> = [
    { path: join(repositoryRoot, "knowledge"), kind: "topic" },
    { path: join(repositoryRoot, "sources", "books"), kind: "source-record" },
    {
      path: join(repositoryRoot, "sources", "courses"),
      kind: "source-record",
    },
    { path: join(repositoryRoot, "sources", "papers"), kind: "source-record" },
    { path: join(repositoryRoot, "sources", "web"), kind: "source-record" },
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
        const text = await readFile(path, "utf8");
        const item =
          directory.kind === "saved-synthesis-result"
            ? savedResultFrom(text)
            : itemFrom(directory.kind, text, basename(path, ".md"));
        if (item !== undefined) {
          items.push(item);
        }
      }
    } catch (cause: unknown) {
      if (isRecord(cause) && cause.code === "ENOENT") {
        continue;
      }
      return {
        outcome: "unavailable",
        detail: "The selected Knowledge Repository could not be read.",
      };
    }
  }
  return { outcome: "available", items };
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
