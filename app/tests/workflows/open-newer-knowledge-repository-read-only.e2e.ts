/**
 * S1 behavior test for opening a newer recognizable repository read-only.
 */
import { strict as assert } from "node:assert";
import {
  cp,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Open a newer Knowledge Repository read-only", () => {
  let temporaryRoot: string;
  let repositoryPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb2-newer-"));
    repositoryPath = join(await realpath(temporaryRoot), "newer-repository");
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    const manifestPath = join(repositoryPath, "galaxy-brain.yaml");
    const manifest = await readFile(manifestPath, "utf8");
    await writeFile(
      manifestPath,
      manifest.replace("format_version: 1", "format_version: 2"),
    );
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("opens the repository and discloses read-only access", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
    });

    const openButton = await $("#open-repository");

    await openButton.waitForDisplayed();
    await openButton.click();

    const repositoryStatus = await $("#repository-status-heading");
    const repositoryAccess = await $("#repository-access");

    await repositoryStatus.waitForDisplayed();
    await repositoryAccess.waitForDisplayed();

    assert.equal(
      await repositoryStatus.getText(),
      "Knowledge Repository opened read-only.",
    );
    assert.equal(
      await repositoryAccess.getText(),
      "Read-only: this repository uses a newer format version.",
    );
    assert.equal(await $("#repository-location").getText(), repositoryPath);
  });
});
