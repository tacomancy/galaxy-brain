import { isAbsolute, relative, resolve, sep } from "node:path";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const CHANGED_LINES_THRESHOLD_PERCENT = 80;

export type ChangedLines = ReadonlyMap<string, ReadonlySet<number>>;
export type LcovLines = ReadonlyMap<string, ReadonlyMap<number, number>>;

export type LcovPathOptions = {
  repositoryRoot: string;
  coverageRoot: string;
};

export class LcovParseError extends Error {
  constructor(detail: string) {
    super(`Malformed LCOV: ${detail}`);
    this.name = "LcovParseError";
  }
}

export class DiffParseError extends Error {
  constructor(detail: string) {
    super(`Malformed Git diff: ${detail}`);
    this.name = "DiffParseError";
  }
}

export type ChangedLinesCoverageResult = {
  status: "pass" | "fail" | "not-applicable";
  applicableLines: number;
  coveredLines: number;
  coveragePercent: number | null;
  thresholdPercent: typeof CHANGED_LINES_THRESHOLD_PERCENT;
  uncoveredLines: string[];
};

export type CoverageSummaryContext = {
  baseRef: string;
  headRef: string;
  mergeBase: string;
};

export type ChangedLinesCoverageOptions = {
  lcovPath: string;
  baseRef: string;
  headRef: string;
  repositoryRoot: string;
  coverageRoot: string;
};

export type ProcessOutput = {
  stdout: string;
  stderr: string;
};

export type GitRunner = (args: readonly string[]) => Promise<ProcessOutput>;

export type ChangedLinesCoverageDependencies = {
  runGit?: GitRunner;
  writeSummary?: (summary: string) => Promise<void>;
};

export type ChangedLinesCoverageRunResult =
  | {
      outcome: "checked";
      result: ChangedLinesCoverageResult;
      mergeBase: string;
      summary: string;
    }
  | {
      outcome: "infrastructure-error";
      detail: string;
      summary: string;
    };

/**
 * Reads the line records used by changed-line coverage. Checksums and other
 * LCOV records are accepted but do not affect line coverage.
 */
export function parseLcov(contents: string): Map<string, Map<number, number>> {
  const files = new Map<string, Map<number, number>>();
  let currentFile: string | undefined;
  let currentLines: Map<number, number> | undefined;
  let recordOpen = false;

  for (const [index, rawLine] of contents.split(/\r?\n/).entries()) {
    const line = rawLine.replace(/^\uFEFF/, "");
    if (line.startsWith("SF:")) {
      if (recordOpen) {
        throw new LcovParseError(`record at line ${index + 1} was not closed`);
      }
      currentFile = line.slice(3);
      if (currentFile.length === 0) {
        throw new LcovParseError(`empty source file at line ${index + 1}`);
      }
      currentLines = files.get(currentFile) ?? new Map<number, number>();
      files.set(currentFile, currentLines);
      recordOpen = true;
      continue;
    }

    if (line.startsWith("DA:")) {
      if (!recordOpen || !currentLines) {
        throw new LcovParseError(
          `line record without a source file at line ${index + 1}`,
        );
      }
      const [lineNumberText, hitsText] = line.slice(3).split(",");
      const lineNumber = Number(lineNumberText);
      const hits = Number(hitsText);
      if (
        !Number.isSafeInteger(lineNumber) ||
        lineNumber < 1 ||
        !Number.isSafeInteger(hits) ||
        hits < 0
      ) {
        throw new LcovParseError(`invalid line record at line ${index + 1}`);
      }
      const previousHits = currentLines.get(lineNumber) ?? 0;
      currentLines.set(lineNumber, Math.max(previousHits, hits));
      continue;
    }

    if (line === "end_of_record") {
      if (!recordOpen) {
        throw new LcovParseError(
          `record terminator without a source file at line ${index + 1}`,
        );
      }
      currentFile = undefined;
      currentLines = undefined;
      recordOpen = false;
    }
  }

  if (recordOpen) {
    throw new LcovParseError("final record was not closed");
  }

  return files;
}

function decodeLcovPath(sourceFile: string): string {
  if (sourceFile.startsWith("file://")) {
    try {
      return fileURLToPath(sourceFile);
    } catch (error) {
      throw new LcovParseError(
        `invalid file URL ${sourceFile}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  try {
    return decodeURIComponent(sourceFile);
  } catch (error) {
    throw new LcovParseError(
      `invalid encoded path ${sourceFile}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function isWithinRoot(root: string, candidate: string): boolean {
  const pathFromRoot = relative(root, candidate);
  return (
    pathFromRoot === "" ||
    (!pathFromRoot.startsWith("..") && !isAbsolute(pathFromRoot))
  );
}

/**
 * Converts an LCOV source path into a repository-relative POSIX path and
 * rejects paths that would escape the selected repository root.
 */
export function normalizeLcovPath(
  sourceFile: string,
  options: LcovPathOptions,
): string {
  const repositoryRoot = resolve(options.repositoryRoot);
  const coverageRoot = resolve(options.coverageRoot);
  if (!isWithinRoot(repositoryRoot, coverageRoot)) {
    throw new LcovParseError("coverage root escapes repository root");
  }
  const decodedPath = decodeLcovPath(sourceFile).replaceAll("\\", sep);
  const coverageRootRelativePath = relative(repositoryRoot, coverageRoot);
  const normalizedCoveragePrefix = coverageRootRelativePath.replaceAll(
    sep,
    "/",
  );
  const repositoryRelativePath = decodedPath.replaceAll("\\", "/");

  let absolutePath: string;
  if (isAbsolute(decodedPath)) {
    absolutePath = resolve(decodedPath);
  } else if (
    normalizedCoveragePrefix.length > 0 &&
    (repositoryRelativePath === normalizedCoveragePrefix ||
      repositoryRelativePath.startsWith(`${normalizedCoveragePrefix}/`))
  ) {
    absolutePath = resolve(repositoryRoot, repositoryRelativePath);
  } else {
    absolutePath = resolve(coverageRoot, decodedPath);
  }

  if (!isWithinRoot(repositoryRoot, absolutePath)) {
    throw new LcovParseError(
      `source path escapes repository root: ${sourceFile}`,
    );
  }

  return relative(repositoryRoot, absolutePath).replaceAll(sep, "/");
}

function normalizeLcovLines(
  rawLcovLines: ReadonlyMap<string, ReadonlyMap<number, number>>,
  options: LcovPathOptions,
): Map<string, Map<number, number>> {
  const normalizedLines = new Map<string, Map<number, number>>();
  for (const [sourceFile, lines] of rawLcovLines) {
    const filePath = normalizeLcovPath(sourceFile, options);
    const targetLines =
      normalizedLines.get(filePath) ?? new Map<number, number>();
    for (const [lineNumber, hits] of lines) {
      targetLines.set(
        lineNumber,
        Math.max(targetLines.get(lineNumber) ?? 0, hits),
      );
    }
    normalizedLines.set(filePath, targetLines);
  }
  return normalizedLines;
}

function defaultGitRunner(repositoryRoot: string): GitRunner {
  return (args) =>
    new Promise<ProcessOutput>((resolveOutput, reject) => {
      execFile(
        "git",
        [...args],
        { cwd: repositoryRoot, maxBuffer: 10 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
            return;
          }
          resolveOutput({ stdout, stderr });
        },
      );
    });
}

function infrastructureSummary(
  options: ChangedLinesCoverageOptions,
  detail: string,
): string {
  const singleLineDetail = detail.replace(/\s+/g, " ").trim();
  return [
    "## Changed-lines coverage",
    "",
    "- Status: ERROR",
    `- Base ref: ${options.baseRef}`,
    `- Head ref: ${options.headRef}`,
    "- Merge base: unavailable",
    `- Detail: ${singleLineDetail}`,
    "",
  ].join("\n");
}

/**
 * Runs the complete changed-lines check. Git and summary writing are the only
 * external adapters, keeping merge-base/diff failures explicit and testable.
 */
export async function runChangedLinesCoverage(
  options: ChangedLinesCoverageOptions,
  dependencies: ChangedLinesCoverageDependencies = {
    runGit: defaultGitRunner(resolve(options.repositoryRoot)),
  },
): Promise<ChangedLinesCoverageRunResult> {
  const runGit =
    dependencies.runGit ?? defaultGitRunner(resolve(options.repositoryRoot));
  try {
    const mergeBaseOutput = await runGit([
      "merge-base",
      options.baseRef,
      options.headRef,
    ]);
    const mergeBase = mergeBaseOutput.stdout.trim();
    if (mergeBase.length === 0 || mergeBase.includes("\n")) {
      throw new Error("Git returned no unique merge base.");
    }

    const diffOutput = await runGit([
      "diff",
      "--unified=0",
      "--no-color",
      "--find-renames",
      "--no-ext-diff",
      mergeBase,
      options.headRef,
      "--",
    ]);
    const changedLines = parseUnifiedDiff(diffOutput.stdout);
    const rawLcovLines = parseLcov(await readFile(options.lcovPath, "utf8"));
    const lcovLines = normalizeLcovLines(rawLcovLines, {
      repositoryRoot: options.repositoryRoot,
      coverageRoot: options.coverageRoot,
    });
    const result = evaluateChangedLinesCoverage(changedLines, lcovLines);
    const summary = formatChangedLinesCoverageSummary(result, {
      baseRef: options.baseRef,
      headRef: options.headRef,
      mergeBase,
    });
    if (dependencies.writeSummary) {
      await dependencies.writeSummary(summary);
    }
    return { outcome: "checked", result, mergeBase, summary };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const summary = infrastructureSummary(options, detail);
    if (dependencies.writeSummary) {
      try {
        await dependencies.writeSummary(summary);
      } catch {
        // The caller still receives the infrastructure result through stdout.
      }
    }
    return { outcome: "infrastructure-error", detail, summary };
  }
}

function decodeGitQuotedPath(value: string): string {
  const path = value.trim();
  if (!path.startsWith('"') || !path.endsWith('"')) {
    return path;
  }

  const encoded = path.slice(1, -1);
  const bytes: number[] = [];
  for (let index = 0; index < encoded.length; index += 1) {
    const character = encoded[index];
    if (character !== "\\") {
      bytes.push(character?.charCodeAt(0) ?? 0);
      continue;
    }

    const escaped = encoded[index + 1];
    if (escaped === undefined) {
      throw new DiffParseError("unterminated quoted path");
    }
    if (/^[0-7]$/.test(escaped)) {
      const octal = encoded.slice(index + 1, index + 4);
      if (!/^\\[0-7]{1,3}$/.test(`\\${octal}`)) {
        throw new DiffParseError(`invalid quoted path escape ${path}`);
      }
      bytes.push(Number.parseInt(octal, 8));
      index += octal.length;
      continue;
    }

    const escapedCharacter = { n: "\n", r: "\r", t: "\t" }[escaped] ?? escaped;
    bytes.push(escapedCharacter.charCodeAt(0));
    index += 1;
  }
  return Buffer.from(bytes).toString("utf8");
}

function parseDiffPath(value: string): string | undefined {
  const path = decodeGitQuotedPath(value);
  if (path === "/dev/null") {
    return undefined;
  }
  if (!path.startsWith("b/")) {
    throw new DiffParseError(`unexpected destination path ${path}`);
  }
  return path.slice(2);
}

/**
 * Extracts added destination line numbers from a zero-context unified diff.
 * Deleted lines, binary files, and pure renames therefore have no executable
 * changed-line surface.
 */
export function parseUnifiedDiff(contents: string): Map<string, Set<number>> {
  const changedLines = new Map<string, Set<number>>();
  let currentFile: string | undefined;
  let nextNewLine: number | undefined;
  let inHunk = false;
  let hasDestinationHeader = false;

  for (const [index, line] of contents.split(/\r?\n/).entries()) {
    if (line.startsWith("diff --git ")) {
      currentFile = undefined;
      nextNewLine = undefined;
      inHunk = false;
      hasDestinationHeader = false;
      continue;
    }

    if (!inHunk && line.startsWith("+++ ")) {
      currentFile = parseDiffPath(line.slice(4));
      hasDestinationHeader = true;
      continue;
    }

    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
    if (hunk) {
      if (!hasDestinationHeader) {
        throw new DiffParseError(
          `hunk without a destination path at line ${index + 1}`,
        );
      }
      nextNewLine = Number(hunk[1]);
      inHunk = true;
      continue;
    }

    if (!inHunk) {
      continue;
    }

    if (line.startsWith("+")) {
      if (nextNewLine === undefined || currentFile === undefined) {
        throw new DiffParseError(
          `added line without a hunk at line ${index + 1}`,
        );
      }
      const fileLines = changedLines.get(currentFile) ?? new Set<number>();
      fileLines.add(nextNewLine);
      changedLines.set(currentFile, fileLines);
      nextNewLine += 1;
      continue;
    }

    if (line.startsWith("-")) {
      continue;
    }

    if (line.startsWith(" ")) {
      if (nextNewLine === undefined) {
        throw new DiffParseError(
          `context line without a hunk at line ${index + 1}`,
        );
      }
      nextNewLine += 1;
      continue;
    }

    if (line.startsWith("\\ No newline at end of file")) {
      continue;
    }

    if (line.length === 0) {
      inHunk = false;
      nextNewLine = undefined;
      continue;
    }

    throw new DiffParseError(`unexpected hunk line at line ${index + 1}`);
  }

  return changedLines;
}

/**
 * Evaluates executable changed lines using the LCOV line surface as the
 * authority for applicability. The integer comparison preserves an exact
 * threshold without floating-point rounding at the boundary.
 */
export function evaluateChangedLinesCoverage(
  changedLines: ChangedLines,
  lcovLines: LcovLines,
): ChangedLinesCoverageResult {
  let applicableLines = 0;
  let coveredLines = 0;
  const uncoveredLines: string[] = [];

  for (const [filePath, lines] of changedLines) {
    const fileCoverage = lcovLines.get(filePath);
    if (!fileCoverage) {
      continue;
    }

    for (const lineNumber of lines) {
      const hits = fileCoverage.get(lineNumber);
      if (hits === undefined) {
        continue;
      }

      applicableLines += 1;
      if (hits > 0) {
        coveredLines += 1;
      } else {
        uncoveredLines.push(`${filePath}:${lineNumber}`);
      }
    }
  }

  uncoveredLines.sort();
  if (applicableLines === 0) {
    return {
      status: "not-applicable",
      applicableLines,
      coveredLines,
      coveragePercent: null,
      thresholdPercent: CHANGED_LINES_THRESHOLD_PERCENT,
      uncoveredLines,
    };
  }

  const coveragePercent = (coveredLines / applicableLines) * 100;
  return {
    status:
      coveredLines * 100 >= applicableLines * CHANGED_LINES_THRESHOLD_PERCENT
        ? "pass"
        : "fail",
    applicableLines,
    coveredLines,
    coveragePercent,
    thresholdPercent: CHANGED_LINES_THRESHOLD_PERCENT,
    uncoveredLines,
  };
}

/** Formats the human-readable CI summary without embedding source content. */
export function formatChangedLinesCoverageSummary(
  result: ChangedLinesCoverageResult,
  context: CoverageSummaryContext,
): string {
  const status =
    result.status === "not-applicable"
      ? "NOT APPLICABLE"
      : result.status.toUpperCase();
  const coverage =
    result.coveragePercent === null
      ? "not applicable"
      : `${result.coveragePercent.toFixed(2)}%`;
  const sortedUncoveredLines = [...result.uncoveredLines].sort();
  const uncovered =
    sortedUncoveredLines.length === 0
      ? []
      : [
          "",
          "Uncovered lines:",
          "",
          ...sortedUncoveredLines.map((line) => `- ${line}`),
        ];

  return [
    "## Changed-lines coverage",
    "",
    `- Status: ${status}`,
    `- Base ref: ${context.baseRef}`,
    `- Head ref: ${context.headRef}`,
    `- Merge base: ${context.mergeBase}`,
    `- Applicable changed executable lines: ${result.applicableLines}`,
    `- Covered changed executable lines: ${result.coveredLines}`,
    `- Coverage: ${coverage}`,
    `- Threshold: ${result.thresholdPercent.toFixed(2)}%`,
    ...uncovered,
    "",
  ].join("\n");
}
