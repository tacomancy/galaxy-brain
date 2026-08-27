/**
 * S1 behavior test for creating a Knowledge Repository in an explicitly
 * empty directory.
 */
import { strict as assert } from "node:assert";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Create a local Knowledge Repository in an empty directory", () => {
  let emptyDirectory: string;

  before(async () => {
    emptyDirectory = await mkdtemp(join(tmpdir(), "galaxy-brain-tb2-empty-"));
  });

  after(async () => {
    await rm(emptyDirectory, { recursive: true, force: true });
  });

  it("creates and selects a repository in the chosen empty directory", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [emptyDirectory],
    });

    const createButton = await $("#create-repository");

    await createButton.waitForDisplayed();
    await createButton.click();

    const repositoryStatus = await $("#repository-status-heading");

    await repositoryStatus.waitForDisplayed();

    assert.equal(
      await repositoryStatus.getText(),
      "Knowledge Repository created and selected.",
    );
    assert.equal(
      await $("#repository-location").getText(),
      await realpath(emptyDirectory),
    );
    assert.equal(await $("#atlas-empty-state").isExisting(), false);
  });
});
