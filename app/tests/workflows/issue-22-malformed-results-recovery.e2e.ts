/** S1 behavior test for recovering from malformed saved-result history. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { $, browser } from "@wdio/globals";
import "@wdio/electron-service";

describe("Recover malformed saved-result history", () => {
  it("keeps Atlas usable and restores focus after the history is repaired", async () => {
    const fixtureRepositoryPath = join(
      process.cwd(),
      "tests",
      "fixtures",
      "knowledge-repository",
    );
    const repositoryPath = await mkdtemp(
      join(tmpdir(), "galaxy-brain-issue-22-malformed-results-"),
    );
    await cp(fixtureRepositoryPath, repositoryPath, { recursive: true });
    const resultPath = join(
      repositoryPath,
      "scratch",
      "synthesis-results",
      "synthesis-result-bayesian-statistics-fixture.json",
    );
    await writeFile(resultPath, "{ malformed saved result\n", "utf8");

    try {
      const dialog = await browser.electron.mock("dialog", "showOpenDialog");
      await dialog.mockResolvedValue({
        canceled: false,
        filePaths: [repositoryPath],
      });

      await $("#open-repository").click();
      const recovery = await $("#bridge-operation-failed");
      await recovery.waitForDisplayed();
      assert.equal(await recovery.getAttribute("role"), "alert");
      assert.equal(
        await recovery.getAttribute("data-workbench-outcome"),
        "bridge-operation-failed",
      );

      await rm(resultPath);
      await $("#retry-bridge-operation").click();
      await browser.waitUntil(
        async () => !(await $("#bridge-operation-failed").isExisting()),
        {
          timeout: 5_000,
          timeoutMsg: "Saved-result recovery did not clear the alert.",
        },
      );
      await browser.waitUntil(
        async () =>
          (await browser.execute(() => document.activeElement?.id)) ===
          "atlas-heading",
        {
          timeout: 5_000,
          timeoutMsg: "Retry did not restore focus to the Atlas heading.",
        },
      );
      assert.equal(await $("#atlas-heading").isDisplayed(), true);
    } finally {
      await rm(repositoryPath, { recursive: true, force: true });
    }
  });
});
