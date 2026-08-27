/** S1 behavior test for resuming the exact previously selected repository. */
import { strict as assert } from "node:assert";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Resume the selected Knowledge Repository", () => {
  let temporaryRoot: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb3-resume-"));
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("resumes the exact repository selected before relaunch", async () => {
    const repositoryPath = join(
      await realpath(temporaryRoot),
      "resumed-repository",
    );
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
    });

    await $("#create-repository").click();
    await $("#repository-status-heading").waitForDisplayed();

    await browser.reloadSession();

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
