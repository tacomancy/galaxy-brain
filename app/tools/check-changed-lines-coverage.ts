import { appendFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  runChangedLinesCoverage,
  type ChangedLinesCoverageOptions,
} from "./changed-lines-coverage";

const usage = `Usage: npm run check:changed-coverage -- --lcov <path> --base-ref <ref> [options]

Options:
  --lcov <path>               LCOV report path
  --base-ref <ref>            Base ref used to resolve the merge base
  --head-ref <ref>            Head ref (default: HEAD)
  --repository-root <path>    Repository root (default: current directory)
  --coverage-root <path>      LCOV relative-path root (default: current directory)
  --help                      Show this help
`;

type ParsedArguments = ChangedLinesCoverageOptions | { help: true };

function readArgument(
  args: readonly string[],
  index: number,
  name: string,
): string {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function parseArguments(args: readonly string[]): ParsedArguments {
  let lcovPath: string | undefined;
  let baseRef: string | undefined;
  let headRef = "HEAD";
  let repositoryRoot = process.cwd();
  let coverageRoot = process.cwd();

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") {
      return { help: true };
    }
    if (argument === "--lcov") {
      lcovPath = readArgument(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--base-ref") {
      baseRef = readArgument(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--head-ref") {
      headRef = readArgument(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--repository-root") {
      repositoryRoot = readArgument(args, index, argument);
      index += 1;
      continue;
    }
    if (argument === "--coverage-root") {
      coverageRoot = readArgument(args, index, argument);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!lcovPath) {
    throw new Error("--lcov is required.");
  }
  if (!baseRef) {
    throw new Error("--base-ref is required.");
  }

  return {
    lcovPath: resolve(process.cwd(), lcovPath),
    baseRef,
    headRef,
    repositoryRoot: resolve(process.cwd(), repositoryRoot),
    coverageRoot: resolve(process.cwd(), coverageRoot),
  };
}

async function main(): Promise<void> {
  let options: ParsedArguments;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(usage);
    process.exitCode = 2;
    return;
  }

  if ("help" in options) {
    console.log(usage);
    return;
  }

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  const dependencies = summaryPath
    ? {
        writeSummary: async (summary: string) => {
          await appendFile(summaryPath, summary);
        },
      }
    : {};
  const outcome = await runChangedLinesCoverage(options, dependencies);
  console.log(outcome.summary);

  if (outcome.outcome === "infrastructure-error") {
    process.exitCode = 2;
  } else if (outcome.result.status === "fail") {
    process.exitCode = 1;
  }
}

void main();
