/**
 * S1 behavior test for rejecting an invalid target without changing the
 * fresh Workbench selection.
 */
import { strict as assert } from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Reject an invalid Knowledge Repository target", () => {
  let invalidRepositoryPath: string;

  before(async () => {
    invalidRepositoryPath = await mkdtemp(
      join(tmpdir(), "galaxy-brain-tb2-invalid-"),
    );
    await writeFile(join(invalidRepositoryPath, "not-a-repository.txt"), "x");
  });

  after(async () => {
    await rm(invalidRepositoryPath, { recursive: true, force: true });
  });

  it("rejects an invalid target and preserves the fresh state", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [invalidRepositoryPath],
    });

    const openButton = await $("#open-repository");

    await openButton.waitForDisplayed();
    await openButton.click();

    const repositoryError = await $("#repository-error");

    await repositoryError.waitForDisplayed();

    assert.equal(await repositoryError.isDisplayed(), true);
    assert.equal(await $("#atlas-empty-state").isExisting(), true);
    assert.equal(await $("#repository-status").isExisting(), false);
  });
});
