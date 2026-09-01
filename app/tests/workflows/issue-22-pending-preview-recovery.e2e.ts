/** S1 behavior test for invalidating a pending Synthesis preview on repository change. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, realpath, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { $, browser } from "@wdio/globals";
import "@wdio/electron-service";

import { openDiscovery } from "./discovery-helper";

describe("Recover a pending Synthesis review", () => {
  it("clears a preview when the selected Knowledge Repository changes", async () => {
    const fixtureRepositoryPath = join(
      process.cwd(),
      "tests",
      "fixtures",
      "knowledge-repository",
    );
    const firstRepositoryPath = await mkdtemp(
      join(tmpdir(), "galaxy-brain-issue-22-first-"),
    );
    const secondRepositoryPath = await mkdtemp(
      join(tmpdir(), "galaxy-brain-issue-22-second-"),
    );
    const canonicalSecondRepositoryPath = await realpath(secondRepositoryPath);
    await Promise.all([
      cp(fixtureRepositoryPath, firstRepositoryPath, { recursive: true }),
      cp(fixtureRepositoryPath, secondRepositoryPath, { recursive: true }),
    ]);

    try {
      const dialog = await browser.electron.mock("dialog", "showOpenDialog");
      await dialog.mockResolvedValueOnce({
        canceled: false,
        filePaths: [firstRepositoryPath],
      });
      await dialog.mockResolvedValueOnce({
        canceled: false,
        filePaths: [secondRepositoryPath],
      });

      await $("#open-repository").click();
      await $("#repository-status-heading").waitForDisplayed();
      await openDiscovery();
      await $("#discovery-mode-ask").click();
      await $("#discovery-ask-context-bayesian-statistics").click();
      await $("#discovery-input").setValue(
        "What does the fixture say about Bayesian inference?",
      );
      await $("#discovery-submit").click();
      await $("#discovery-ask-preview").waitForDisplayed();
      await $("#discovery-close").click();
      await $("#atlas-topic-open-studio").click();
      await $("#studio-synthesis-prepare").click();
      await $("#studio-synthesis-preview").waitForDisplayed();

      await $("#workspace-switcher-atlas").click();
      await $("#repository-status-heading").waitForDisplayed();
      await $("#open-repository").click();
      await $("#repository-status-heading").waitForDisplayed();
      assert.equal(
        await $("#repository-location").getText(),
        canonicalSecondRepositoryPath,
      );

      await $("#workspace-switcher-studio").click();
      await $("#studio-heading").waitForDisplayed();
      assert.equal(await $("#studio-synthesis-preview").isExisting(), false);
      assert.equal(await $("#studio-synthesis-outcome").isExisting(), false);
      assert.equal(await $("#discovery-ask-preview").isExisting(), false);
      assert.equal(await $("#discovery-ask-outcome").isExisting(), false);
    } finally {
      await Promise.all([
        rm(firstRepositoryPath, { recursive: true, force: true }),
        rm(secondRepositoryPath, { recursive: true, force: true }),
      ]);
    }
  });
});
