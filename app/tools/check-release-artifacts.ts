import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join, resolve } from "node:path";

import {
  parseReleaseManifest,
  verifyReleaseManifest,
} from "./release-artifacts";

const execFileAsync = promisify(execFile);
const appRoot = resolve(process.cwd());
const manifestPath = resolve(
  process.argv[2] ?? join(appRoot, "out", "release-manifest.json"),
);

async function main(): Promise<void> {
  const manifest = parseReleaseManifest(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );
  const result = await verifyReleaseManifest(manifest, appRoot);
  const { stdout: currentCommit } = await execFileAsync(
    "git",
    ["rev-parse", "HEAD"],
    { cwd: appRoot },
  );
  const packageMetadata: unknown = JSON.parse(
    await readFile(join(appRoot, "package.json"), "utf8"),
  );
  const packageVersion =
    typeof packageMetadata === "object" &&
    packageMetadata !== null &&
    "version" in packageMetadata &&
    typeof packageMetadata.version === "string"
      ? packageMetadata.version
      : undefined;
  if (currentCommit.trim() !== manifest.sourceCommit) {
    result.errors.push("Current source commit does not match the manifest.");
  }
  if (packageVersion !== manifest.version) {
    result.errors.push("Current package version does not match the manifest.");
  }
  if (result.errors.length > 0) {
    console.error(result.errors.join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(
    `Verified developer-only ${manifest.version} macOS arm64 artifact.`,
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
