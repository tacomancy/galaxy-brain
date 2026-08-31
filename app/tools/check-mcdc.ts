import { readFile } from "node:fs/promises";

import { evaluateMCDC, formatMCDCReport, type MCDCManifest } from "./mcdc";

const manifestPath = "tools/mcdc-decisions.json";

async function main(): Promise<void> {
  const manifest = JSON.parse(
    await readFile(manifestPath, "utf8"),
  ) as MCDCManifest;
  const result = evaluateMCDC(manifest);

  console.log(formatMCDCReport(result));
  if (!result.mcdcCoverage) {
    process.exitCode = 1;
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
});
