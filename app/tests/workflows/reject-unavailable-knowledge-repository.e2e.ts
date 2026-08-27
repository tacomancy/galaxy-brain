/** S1 behavior test for an unavailable repository target. */
import { strict as assert } from "node:assert";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Reject an unavailable Knowledge Repository", () => {
  let temporaryRoot: string;
  let missingRepositoryPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb2-missing-"));
    missingRepositoryPath = join(
      await realpath(temporaryRoot),
      "missing-repository",
    );
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("reports the unavailable target and keeps the Workbench unselected", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");
    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [missingRepositoryPath],
    });

    await $("#open-repository").click();

    const repositoryError = await $("#repository-error");
    await repositoryError.waitForDisplayed();

    assert.equal(
      await repositoryError.getText(),
      "The selected Knowledge Repository is unavailable.",
    );
    assert.equal(await $("#atlas-empty-state").isExisting(), true);
    assert.equal(await $("#repository-status").isExisting(), false);
  });
});
