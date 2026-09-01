/** S1 behavior test for a saved result disappearing before restoration. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { $, browser } from "@wdio/globals";
import "@wdio/electron-service";

describe("Recover a missing saved Synthesis result", () => {
  it("reports a recoverable missing-result outcome without exposing filesystem details", async () => {
    const fixtureRepositoryPath = join(
      process.cwd(),
      "tests",
      "fixtures",
      "knowledge-repository",
    );
    const repositoryPath = await mkdtemp(
      join(tmpdir(), "galaxy-brain-issue-22-missing-result-"),
    );
    await cp(fixtureRepositoryPath, repositoryPath, { recursive: true });
    const resultPath = join(
      repositoryPath,
      "scratch",
      "synthesis-results",
      "synthesis-result-bayesian-statistics-fixture.json",
    );

    try {
      const dialog = await browser.electron.mock("dialog", "showOpenDialog");
      await dialog.mockResolvedValue({
        canceled: false,
        filePaths: [repositoryPath],
      });

      await $("#open-repository").click();
      await $("#repository-status-heading").waitForDisplayed();
      await $("#atlas-topic-open-studio").click();
      await $(
        "#studio-synthesis-result-synthesis-result-bayesian-statistics-fixture",
      ).waitForDisplayed();

      await rm(resultPath);
      await $(
        "#studio-synthesis-restore-synthesis-result-bayesian-statistics-fixture-1",
      ).click();

      const outcome = await $("#studio-synthesis-restore-outcome");
      await outcome.waitForDisplayed();
      assert.equal(
        await outcome.getAttribute("data-synthesis-restore-outcome"),
        "operation-failed",
      );
      assert.equal(await outcome.getAttribute("role"), "alert");
      assert.equal(
        await outcome.getText(),
        "The Synthesis result was not found.",
      );
    } finally {
      await rm(repositoryPath, { recursive: true, force: true });
    }
  });
});
