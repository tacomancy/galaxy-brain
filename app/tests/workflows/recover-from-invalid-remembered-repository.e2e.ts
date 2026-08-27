/** S1 behavior test for an invalid remembered repository root. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Recover from an invalid remembered Knowledge Repository", () => {
  let temporaryRoot: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb3-invalid-"));
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("keeps the Workbench unselected and offers recovery choices", async () => {
    const repositoryPath = join(
      await realpath(temporaryRoot),
      "remembered-repository",
    );
    const siblingRepositoryPath = join(
      await realpath(temporaryRoot),
      "sibling-repository",
    );
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
    });

    await $("#create-repository").click();
    await $("#repository-status-heading").waitForDisplayed();
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      siblingRepositoryPath,
      { recursive: true },
    );
    await writeFile(
      join(repositoryPath, "galaxy-brain.yaml"),
      "not a repository\n",
    );

    await browser.reloadSession();

    const repositoryError = await $("#repository-error");

    await repositoryError.waitForDisplayed();
    assert.equal(
      await repositoryError.getAttribute("data-workbench-outcome"),
      "invalid-format",
    );
    assert.equal(await $("#atlas-empty-state").isExisting(), true);
    assert.equal(await $("#repository-status").isExisting(), false);
    assert.equal(await $("#open-repository").isDisplayed(), true);
    assert.equal(await $("#create-repository").isDisplayed(), true);
  });
});
