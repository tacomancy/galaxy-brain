/** S1 behavior test for a repository containing a symbolic link. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Reject an unsafe Knowledge Repository", () => {
  let temporaryRoot: string;
  let repositoryPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb2-unsafe-"));
    repositoryPath = join(await realpath(temporaryRoot), "unsafe-repository");
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );
    await symlink("knowledge", join(repositoryPath, "unsafe-link"));
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
      "The selected target contains unsafe filesystem entries.",
    );
    assert.equal(await $("#atlas-empty-state").isExisting(), true);
    assert.equal(await $("#repository-status").isExisting(), false);
  });
});
