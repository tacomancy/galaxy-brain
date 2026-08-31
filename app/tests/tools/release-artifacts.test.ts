import { strict as assert } from "node:assert";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it } from "vitest";

import {
  createReleaseManifest,
  verifyReleaseManifest,
} from "../../tools/release-artifacts";

async function createFixture(): Promise<{
  appRoot: string;
  artifactPath: string;
  lockfilePath: string;
}> {
  const appRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-release-test-"));
  const artifactPath = join(
    appRoot,
    "out",
    "Galaxy Brain-darwin-arm64",
    "Galaxy Brain.app",
  );
  const lockfilePath = join(appRoot, "package-lock.json");
  await mkdir(join(artifactPath, "Contents", "Resources"), { recursive: true });
  await mkdir(join(artifactPath, "Contents", "Frameworks"), {
    recursive: true,
  });
  await writeFile(
    join(artifactPath, "Contents", "Info.plist"),
    "version=0.13.1\n",
  );
  await writeFile(
    join(artifactPath, "Contents", "Resources", "app.asar"),
    "bundled application\n",
  );
  await writeFile(
    join(artifactPath, "Contents", "Frameworks", "Electron Framework"),
    "/private/var/run is a vendor literal\n",
  );
  await writeFile(lockfilePath, '{"name":"galaxy-brain"}\n');
  return { appRoot, artifactPath, lockfilePath };
}

describe("release artifact contract", () => {
  it("creates and verifies a deterministic developer-only manifest", async () => {
    const fixture = await createFixture();

    const manifest = await createReleaseManifest({
      appRoot: fixture.appRoot,
      artifactPath: fixture.artifactPath,
      packageVersion: "0.13.1",
      sourceCommit: "0123456789abcdef0123456789abcdef01234567",
      nodeVersion: "24.19.0",
      lockfilePath: fixture.lockfilePath,
      platform: "darwin",
      architecture: "arm64",
    });

    assert.equal(manifest.distribution, "developer-only");
    assert.equal(manifest.signed, false);
    assert.equal(manifest.notarized, false);
    assert.equal(manifest.version, "0.13.1");
    assert.equal(
      manifest.artifacts[0]?.path,
      "out/Galaxy Brain-darwin-arm64/Galaxy Brain.app",
    );
    assert.equal(
      (await verifyReleaseManifest(manifest, fixture.appRoot)).valid,
      true,
    );
  });

  it("rejects an artifact that changes after manifest creation", async () => {
    const fixture = await createFixture();
    const manifest = await createReleaseManifest({
      appRoot: fixture.appRoot,
      artifactPath: fixture.artifactPath,
      packageVersion: "0.13.1",
      sourceCommit: "0123456789abcdef0123456789abcdef01234567",
      nodeVersion: "24.19.0",
      lockfilePath: fixture.lockfilePath,
      platform: "darwin",
      architecture: "arm64",
    });

    await writeFile(
      join(fixture.artifactPath, "Contents", "Info.plist"),
      "version=changed\n",
    );

    const result = await verifyReleaseManifest(manifest, fixture.appRoot);
    assert.equal(result.valid, false);
    assert.match(result.errors.join("\n"), /sha256|bytes/i);
  });

  it("rejects private or fixture material in the artifact", async () => {
    const fixture = await createFixture();
    await writeFile(
      join(fixture.artifactPath, "Contents", "Resources", "app.asar"),
      "OPENAI_API_KEY=not-a-real-key\n",
    );

    await assert.rejects(
      createReleaseManifest({
        appRoot: fixture.appRoot,
        artifactPath: fixture.artifactPath,
        packageVersion: "0.13.1",
        sourceCommit: "0123456789abcdef0123456789abcdef01234567",
        nodeVersion: "24.19.0",
        lockfilePath: fixture.lockfilePath,
        platform: "darwin",
        architecture: "arm64",
      }),
      /private|credential|fixture/i,
    );
  });

  it("does not make the manifest depend on its output location", async () => {
    const fixture = await createFixture();
    const first = await createReleaseManifest({
      appRoot: fixture.appRoot,
      artifactPath: fixture.artifactPath,
      packageVersion: "0.13.1",
      sourceCommit: "0123456789abcdef0123456789abcdef01234567",
      nodeVersion: "24.19.0",
      lockfilePath: fixture.lockfilePath,
      platform: "darwin",
      architecture: "arm64",
    });
    await writeFile(
      join(fixture.appRoot, "release-manifest.json"),
      JSON.stringify(first),
    );
    const second = await createReleaseManifest({
      appRoot: fixture.appRoot,
      artifactPath: fixture.artifactPath,
      packageVersion: "0.13.1",
      sourceCommit: "0123456789abcdef0123456789abcdef01234567",
      nodeVersion: "24.19.0",
      lockfilePath: fixture.lockfilePath,
      platform: "darwin",
      architecture: "arm64",
    });

    assert.deepEqual(second, first);
    assert.match(
      await readFile(join(fixture.appRoot, "release-manifest.json"), "utf8"),
      /developer-only/,
    );
  });
});
