/** S1 behavior test for an unrecognized repository format. */
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

describe("Reject an unsupported Knowledge Repository format", () => {
  let temporaryRoot: string;
  let repositoryPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-tb2-unsupported-"),
    );
    repositoryPath = join(
      await realpath(temporaryRoot),
      "unsupported-repository",
    );
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    const manifestPath = join(repositoryPath, "galaxy-brain.yaml");
    const manifest = await readFile(manifestPath, "utf8");
    await writeFile(
      manifestPath,
      manifest.replace("format: galaxy-brain", "format: other-system"),
    );
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("rejects the repository and keeps the Workbench unselected", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");
    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
    });

    await $("#open-repository").click();

    const repositoryError = await $("#repository-error");
    await repositoryError.waitForDisplayed();

    assert.equal(
      await repositoryError.getText(),
      "The selected target uses an unsupported repository format.",
    );
    assert.equal(await $("#atlas-empty-state").isExisting(), true);
    assert.equal(await $("#repository-status").isExisting(), false);
  });
});
