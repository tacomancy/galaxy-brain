import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { dirname, join, resolve } from "node:path";

import {
  createReleaseManifest,
  type ReleaseManifest,
} from "./release-artifacts";

const execFileAsync = promisify(execFile);
const appRoot = resolve(process.cwd());
const outputPath = resolve(appRoot, "out", "release-manifest.json");

async function findPackagedApplication(): Promise<string> {
  const { stdout } = await execFileAsync("find", [
    join(appRoot, "out"),
    "-maxdepth",
    "3",
    "-type",
    "d",
    "-name",
    "Galaxy Brain.app",
  ]);
  const candidates = stdout.trim().split("\n").filter(Boolean);
  const artifactPath = candidates[0];
  if (artifactPath === undefined || candidates.length !== 1) {
    throw new Error(
      "Expected exactly one packaged Galaxy Brain.app under app/out.",
    );
  }
  return artifactPath;
}

async function currentCommit(): Promise<string> {
  const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
    cwd: appRoot,
  });
  return stdout.trim();
}

async function writeManifest(manifest: ReleaseManifest): Promise<void> {
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, serialized, "utf8");
  const manifestHash = createHash("sha256").update(serialized).digest("hex");
  await writeFile(
    `${outputPath}.sha256`,
    `${manifestHash}  ${outputPath.split("/").at(-1)}\n`,
    "utf8",
  );
}

async function main(): Promise<void> {
  const packageMetadata: unknown = JSON.parse(
    await readFile(join(appRoot, "package.json"), "utf8"),
  );
  if (
    typeof packageMetadata !== "object" ||
    packageMetadata === null ||
    !("version" in packageMetadata) ||
    !("engines" in packageMetadata) ||
    typeof packageMetadata.version !== "string" ||
    typeof packageMetadata.engines !== "object" ||
    packageMetadata.engines === null ||
    !("node" in packageMetadata.engines) ||
    typeof packageMetadata.engines.node !== "string"
  ) {
    throw new Error(
      "app/package.json is missing version or pinned Node.js metadata.",
    );
  }
  const manifest = await createReleaseManifest({
    appRoot,
    artifactPath: await findPackagedApplication(),
    packageVersion: packageMetadata.version,
    sourceCommit: await currentCommit(),
    nodeVersion: packageMetadata.engines.node,
    lockfilePath: join(appRoot, "package-lock.json"),
    platform: process.platform,
    architecture: process.arch,
  });
  await writeManifest(manifest);
  console.log(`Wrote ${outputPath}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
