import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readlink, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

const MANIFEST_VERSION = 1 as const;
const DISTRIBUTION = "developer-only" as const;
const MAX_MARKER_LENGTH = 80;
const FORBIDDEN_PATH_PARTS = new Set([
  ".ci-artifacts",
  ".env",
  "coverage",
  "fixtures",
  "test-results",
  "tests",
]);
const FORBIDDEN_CONTENT_MARKERS = [
  "OPENAI_API_KEY=",
  "ANTHROPIC_API_KEY=",
  "sk-proj-",
  "sk-ant-",
  "/Users/",
  "/private/var/",
  "/tmp/galaxy-brain",
  "tests/fixtures/knowledge-repository",
];
const CONTENT_SCAN_PATHS = new Set([
  "Contents/Info.plist",
  "Contents/Resources/app.asar",
]);

export interface ReleaseArtifact {
  path: string;
  kind: "directory";
  bytes: number;
  fileCount: number;
  sha256: string;
}

export interface ReleaseManifest {
  schemaVersion: typeof MANIFEST_VERSION;
  application: "Galaxy Brain";
  distribution: typeof DISTRIBUTION;
  version: string;
  sourceCommit: string;
  nodeVersion: string;
  platform: "darwin";
  architecture: "arm64";
  signed: false;
  notarized: false;
  lockfile: {
    path: "package-lock.json";
    sha256: string;
  };
  artifacts: ReleaseArtifact[];
}

export interface ReleaseManifestInput {
  appRoot: string;
  artifactPath: string;
  packageVersion: string;
  sourceCommit: string;
  nodeVersion: string;
  lockfilePath: string;
  platform: string;
  architecture: string;
}

export interface ReleaseVerificationResult {
  valid: boolean;
  errors: string[];
}

interface HashResult {
  bytes: number;
  fileCount: number;
  sha256: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isSafeNonNegativeInteger = (
  value: unknown,
  minimum = 0,
): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= minimum;

const pathWithin = (root: string, candidate: string): boolean => {
  const pathFromRoot = relative(resolve(root), resolve(candidate));
  return (
    pathFromRoot === "" ||
    (!pathFromRoot.startsWith(`..${sep}`) &&
      pathFromRoot !== ".." &&
      !isAbsolute(pathFromRoot))
  );
};

const toPosixPath = (value: string): string => value.replaceAll(sep, "/");

const checkPathSafety = (relativePath: string): void => {
  const parts = relativePath.split("/").map((part) => part.toLowerCase());
  const forbiddenPart = parts.find((part) => FORBIDDEN_PATH_PARTS.has(part));
  if (forbiddenPart !== undefined) {
    throw new Error(
      `Artifact contains forbidden ${forbiddenPart} material: ${relativePath}`,
    );
  }
};

const hashFile = async (
  filePath: string,
  hash: ReturnType<typeof createHash>,
  scanContent: boolean,
): Promise<number> => {
  const stream = createReadStream(filePath);
  let bytes = 0;
  let carry = "";
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += buffer.length;
    hash.update(buffer);
    if (scanContent) {
      const text = `${carry}${buffer.toString("utf8")}`;
      const marker = FORBIDDEN_CONTENT_MARKERS.find((candidate) =>
        text.includes(candidate),
      );
      if (marker !== undefined) {
        throw new Error(
          `Artifact contains forbidden private or credential marker: ${marker}`,
        );
      }
      carry = text.slice(-MAX_MARKER_LENGTH);
    }
  }
  return bytes;
};

const hashDirectory = async (directoryPath: string): Promise<HashResult> => {
  const hash = createHash("sha256");
  let bytes = 0;
  let fileCount = 0;

  const visit = async (currentPath: string): Promise<void> => {
    const entries = await readdir(currentPath, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const entryPath = resolve(currentPath, entry.name);
      const entryRelativePath = toPosixPath(relative(directoryPath, entryPath));
      checkPathSafety(entryRelativePath);
      if (entry.isSymbolicLink()) {
        const target = await readlink(entryPath);
        const resolvedTarget = resolve(dirname(entryPath), target);
        if (isAbsolute(target) || !pathWithin(directoryPath, resolvedTarget)) {
          throw new Error(
            `Artifact contains an unsafe symbolic link: ${entryRelativePath}`,
          );
        }
        hash.update(`symlink:${entryRelativePath}->${toPosixPath(target)}\n`);
        fileCount += 1;
        continue;
      }
      if (entry.isDirectory()) {
        await visit(entryPath);
        continue;
      }
      if (!entry.isFile()) {
        throw new Error(
          `Artifact contains an unsupported filesystem entry: ${entryRelativePath}`,
        );
      }
      hash.update(`file:${entryRelativePath}\n`);
      bytes += await hashFile(
        entryPath,
        hash,
        CONTENT_SCAN_PATHS.has(entryRelativePath),
      );
      fileCount += 1;
    }
  };

  await visit(directoryPath);
  return { bytes, fileCount, sha256: hash.digest("hex") };
};

const validateInput = (input: ReleaseManifestInput): void => {
  if (!pathWithin(input.appRoot, input.artifactPath)) {
    throw new Error("Release artifact must be inside the application root.");
  }
  if (!pathWithin(input.appRoot, input.lockfilePath)) {
    throw new Error("Release lockfile must be inside the application root.");
  }
  if (!isNonEmptyString(input.packageVersion)) {
    throw new Error("Release version must not be empty.");
  }
  if (!/^[0-9a-f]{40}$/i.test(input.sourceCommit)) {
    throw new Error("Release source commit must be a full 40-character SHA.");
  }
  if (input.platform !== "darwin" || input.architecture !== "arm64") {
    throw new Error(
      "Developer-only V1 release artifacts must target macOS arm64.",
    );
  }
};

export async function createReleaseManifest(
  input: ReleaseManifestInput,
): Promise<ReleaseManifest> {
  validateInput(input);
  const artifactStats = await stat(input.artifactPath);
  if (!artifactStats.isDirectory()) {
    throw new Error(
      "Release artifact must be a packaged application directory.",
    );
  }
  const lockfileStats = await stat(input.lockfilePath);
  if (!lockfileStats.isFile()) {
    throw new Error("Release lockfile must be a file.");
  }

  const artifactHash = await hashDirectory(input.artifactPath);
  const lockfileHash = createHash("sha256");
  await hashFile(input.lockfilePath, lockfileHash, true);

  return {
    schemaVersion: MANIFEST_VERSION,
    application: "Galaxy Brain",
    distribution: DISTRIBUTION,
    version: input.packageVersion,
    sourceCommit: input.sourceCommit,
    nodeVersion: input.nodeVersion,
    platform: "darwin",
    architecture: "arm64",
    signed: false,
    notarized: false,
    lockfile: {
      path: "package-lock.json",
      sha256: lockfileHash.digest("hex"),
    },
    artifacts: [
      {
        path: toPosixPath(relative(input.appRoot, input.artifactPath)),
        kind: "directory",
        ...artifactHash,
      },
    ],
  };
}

export function parseReleaseManifest(value: unknown): ReleaseManifest {
  if (!isRecord(value)) {
    throw new Error("Release manifest must be an object.");
  }
  if (value.schemaVersion !== MANIFEST_VERSION) {
    throw new Error("Release manifest has an unsupported schema version.");
  }
  if (
    value.application !== "Galaxy Brain" ||
    value.distribution !== DISTRIBUTION ||
    value.signed !== false ||
    value.notarized !== false ||
    value.platform !== "darwin" ||
    value.architecture !== "arm64"
  ) {
    throw new Error(
      "Release manifest does not describe the developer-only macOS arm64 contract.",
    );
  }
  if (
    !isNonEmptyString(value.version) ||
    !isNonEmptyString(value.sourceCommit) ||
    !isNonEmptyString(value.nodeVersion)
  ) {
    throw new Error("Release manifest has incomplete build identity metadata.");
  }
  if (!/^[0-9a-f]{40}$/i.test(value.sourceCommit)) {
    throw new Error("Release manifest source commit is not a full SHA.");
  }
  if (
    !isRecord(value.lockfile) ||
    value.lockfile.path !== "package-lock.json" ||
    !isNonEmptyString(value.lockfile.sha256)
  ) {
    throw new Error("Release manifest has invalid lockfile metadata.");
  }
  if (!Array.isArray(value.artifacts) || value.artifacts.length !== 1) {
    throw new Error("Release manifest must contain exactly one artifact.");
  }
  const artifact = value.artifacts[0];
  if (!isRecord(artifact)) {
    throw new Error("Release manifest has invalid artifact metadata.");
  }
  if (
    !isNonEmptyString(artifact.path) ||
    artifact.kind !== "directory" ||
    !isSafeNonNegativeInteger(artifact.bytes) ||
    !isSafeNonNegativeInteger(artifact.fileCount, 1) ||
    !isNonEmptyString(artifact.sha256) ||
    !/^[0-9a-f]{64}$/i.test(artifact.sha256)
  ) {
    throw new Error("Release manifest has invalid artifact metadata.");
  }
  return {
    schemaVersion: MANIFEST_VERSION,
    application: "Galaxy Brain",
    distribution: DISTRIBUTION,
    version: value.version,
    sourceCommit: value.sourceCommit,
    nodeVersion: value.nodeVersion,
    platform: "darwin",
    architecture: "arm64",
    signed: false,
    notarized: false,
    lockfile: {
      path: "package-lock.json",
      sha256: value.lockfile.sha256,
    },
    artifacts: [
      {
        path: artifact.path,
        kind: "directory",
        bytes: artifact.bytes,
        fileCount: artifact.fileCount,
        sha256: artifact.sha256,
      },
    ],
  };
}

export async function verifyReleaseManifest(
  manifest: ReleaseManifest,
  appRoot: string,
): Promise<ReleaseVerificationResult> {
  const errors: string[] = [];
  const artifact = manifest.artifacts[0];
  if (artifact === undefined) {
    return { valid: false, errors: ["Release manifest has no artifact."] };
  }
  const artifactPath = resolve(appRoot, artifact.path);
  const lockfilePath = resolve(appRoot, manifest.lockfile.path);
  if (!pathWithin(appRoot, artifactPath)) {
    errors.push("Release artifact path escapes the application root.");
  }
  if (!pathWithin(appRoot, lockfilePath)) {
    errors.push("Release lockfile path escapes the application root.");
  }
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  try {
    const artifactHash = await hashDirectory(artifactPath);
    if (artifactHash.sha256 !== artifact.sha256) {
      errors.push("Release artifact sha256 does not match the manifest.");
    }
    if (artifactHash.bytes !== artifact.bytes) {
      errors.push("Release artifact byte count does not match the manifest.");
    }
    if (artifactHash.fileCount !== artifact.fileCount) {
      errors.push("Release artifact file count does not match the manifest.");
    }
    const lockfileHash = createHash("sha256");
    await hashFile(lockfilePath, lockfileHash, true);
    if (lockfileHash.digest("hex") !== manifest.lockfile.sha256) {
      errors.push("Package lockfile sha256 does not match the manifest.");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }

  return { valid: errors.length === 0, errors };
}
