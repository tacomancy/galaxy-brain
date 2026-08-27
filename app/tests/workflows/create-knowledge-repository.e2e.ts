/**
 * S1 behavior test for creating a Knowledge Repository at a new path.
 *
 * The dialog is controlled at the native Electron seam so the workflow can
 * choose an isolated destination without depending on a developer's machine.
 * The assertion remains at the visible desktop seam: the Workbench reports
 * that the newly created repository is selected.
 */
import { strict as assert } from "node:assert";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Create a local Knowledge Repository", () => {
  let temporaryRoot: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb2-"));
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("creates and selects a repository at a new path", async () => {
    const repositoryPath = join(
      await realpath(temporaryRoot),
      "new-repository",
    );
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
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
    assert.equal(await $("#repository-location").getText(), repositoryPath);
    assert.equal(await $("#atlas-empty-state").isExisting(), false);
  });
});
