import { readFile } from "node:fs/promises";

import {
  evaluateMCDC,
  findChangedDecisionIds,
  formatMCDCReport,
  type MCDCManifest,
} from "./mcdc";
import { findMissingImplementationFiles } from "./mcdc-files";
import { readChangedFiles } from "./mcdc-git";

const manifestPath = "tools/mcdc-decisions.json";

const parseBaseRef = (arguments_: string[]): string | undefined => {
  const baseRefIndex = arguments_.indexOf("--base-ref");
  if (baseRefIndex === -1) {
    return undefined;
  }

  const baseRef = arguments_[baseRefIndex + 1];
  if (baseRef === undefined || baseRef.length === 0) {
    throw new Error("--base-ref requires a Git revision.");
  }
  return baseRef;
};

async function main(): Promise<void> {
  const baseRef = parseBaseRef(process.argv.slice(2));
  const manifest = JSON.parse(
    await readFile(manifestPath, "utf8"),
  ) as MCDCManifest;
  const result = evaluateMCDC(manifest);

  console.log(formatMCDCReport(result));
  const missingImplementationFiles =
    await findMissingImplementationFiles(manifest);
  if (missingImplementationFiles.length > 0) {
    console.error(
      [
        "Registered MC/DC decisions reference missing implementation files:",
        ...missingImplementationFiles.map((file) => `  - ${file}`),
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  if (baseRef !== undefined) {
    const changedFiles = await readChangedFiles(baseRef);
    const changedDecisionIds = findChangedDecisionIds(manifest, changedFiles);
    const changedDecisionResults = result.decisions.filter((decision) =>
      changedDecisionIds.includes(decision.decisionId),
    );

    console.log(
      changedDecisionIds.length === 0
        ? "Changed registered decisions: none"
        : `Changed registered decisions: ${changedDecisionIds.join(", ")}`,
    );
    if (changedDecisionResults.some((decision) => !decision.mcdcCoverage)) {
      console.error(
        "Changed registered decisions require independently authored MC/DC witnesses.",
      );
      process.exitCode = 1;
      return;
    }
  }

  if (!result.mcdcCoverage) {
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
