/** S1 behavior test for preserving selection after a failed replacement. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Preserve the selected repository after a failed replacement", () => {
  let temporaryRoot: string;
  let validRepositoryPath: string;
  let missingRepositoryPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb2-replace-"));
    const canonicalRoot = await realpath(temporaryRoot);
    validRepositoryPath = join(canonicalRoot, "valid-repository");
    missingRepositoryPath = join(canonicalRoot, "missing-repository");
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      validRepositoryPath,
      { recursive: true },
    );
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("keeps the selected repository visible after a failed open", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");
    await dialog.mockResolvedValueOnce({
      canceled: false,
      filePaths: [validRepositoryPath],
    });
    await dialog.mockResolvedValueOnce({
      canceled: false,
      filePaths: [missingRepositoryPath],
    });

    await $("#open-repository").click();
    await $("#repository-status-heading").waitForDisplayed();
    await $("#open-repository").click();

    const repositoryError = await $("#repository-error");
    await repositoryError.waitForDisplayed();

    assert.equal(
      await $("#repository-status-heading").getText(),
      "Knowledge Repository opened and selected.",
    );
    assert.equal(
      await $("#repository-location").getText(),
      validRepositoryPath,
    );
    assert.equal(
      await repositoryError.getText(),
      "The selected Knowledge Repository is unavailable.",
    );
    assert.equal(await $("#atlas-empty-state").isExisting(), false);
  });
});
