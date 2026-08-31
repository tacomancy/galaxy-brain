/**
 * S1 behavior test for opening an existing valid V1 Knowledge Repository.
 */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Open an existing Knowledge Repository", () => {
  let temporaryRoot: string;
  let repositoryPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb2-open-"));
    repositoryPath = join(await realpath(temporaryRoot), "valid-repository");
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("opens and selects an existing valid repository", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
    });

    const openButton = await $("#open-repository");

    await openButton.waitForDisplayed();
    assert.equal(await openButton.getText(), "Open a Knowledge Repository");
    await openButton.click();

    const repositoryStatus = await $("#repository-status-heading");

    await repositoryStatus.waitForDisplayed();

    assert.equal(
      await repositoryStatus.getText(),
      "Knowledge Repository opened and selected.",
    );
    assert.equal(await $("#repository-location").getText(), repositoryPath);
    assert.equal(await $("#atlas-empty-state").isExisting(), false);
  });
});
