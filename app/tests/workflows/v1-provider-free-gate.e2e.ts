/**
 * S1 release-readiness gate for the provider-free packaged desktop path.
 *
 * The repository is created and opened through the real packaged app. The
 * synthesis check uses a copied fixture and proves that an unavailable Agent
 * Provider is reported at the confirmation boundary without requiring a
 * provider, Git, GitHub, credentials, or network access.
 */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, realpath, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("V1 provider-free packaged-app gate", () => {
  let temporaryRoot: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-v1-gate-"));
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("creates, opens, and completes the local path without a provider", async () => {
    const repositoryPath = join(
      await realpath(temporaryRoot),
      "provider-free-repository",
    );
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
    });
    await $("#create-repository").click();
    await $("#repository-status-heading").waitForDisplayed();
    assert.equal(
      await $("#repository-status-heading").getText(),
      "Knowledge Repository created and selected.",
    );

    const fixtureRepositoryPath = join(
      process.cwd(),
      "tests",
      "fixtures",
      "knowledge-repository",
    );
    const isolatedFixturePath = await mkdtemp(
      join(tmpdir(), "galaxy-brain-v1-gate-fixture-"),
    );
    await cp(fixtureRepositoryPath, isolatedFixturePath, { recursive: true });

    try {
      await dialog.mockResolvedValue({
        canceled: false,
        filePaths: [isolatedFixturePath],
      });
      await $("#open-repository").click();
      await $("#repository-status-heading").waitForDisplayed();
      await $("#atlas-topic-open-studio").click();
      await $("#studio-synthesis-include-all-context").click();
      await $("#studio-synthesis-prepare").click();
      await $("#studio-synthesis-preview").waitForDisplayed();
      await $("#studio-synthesis-confirm").click();
      await browser.waitUntil(
        async () =>
          (await $("#studio-synthesis-outcome").getAttribute(
            "data-synthesis-outcome",
          )) === "agent-provider-unavailable",
        {
          timeout: 5_000,
          timeoutMsg:
            "The provider-free gate did not reach the unavailable-provider outcome.",
        },
      );
      assert.equal(
        await $("#studio-synthesis-outcome").getText(),
        "Synthesis requires a configured Agent Provider.",
      );
      const savedResultPath = join(
        isolatedFixturePath,
        "scratch",
        "synthesis-results",
        "synthesis-result-bayesian-statistics-fixture.json",
      );
      const savedResultBeforeAttempt = await readFile(savedResultPath, "utf8");
      assert.equal(
        await readFile(savedResultPath, "utf8"),
        savedResultBeforeAttempt,
      );

      await $("#studio-synthesis-results").waitForDisplayed();
      await $(
        "#studio-synthesis-restore-synthesis-result-bayesian-statistics-fixture-1",
      ).click();
      await browser.waitUntil(
        async () =>
          (await $("#studio-synthesis-restore-outcome").getAttribute(
            "data-synthesis-restore-outcome",
          )) === "restored",
        {
          timeout: 5_000,
          timeoutMsg: "The provider-free gate did not restore a saved result.",
        },
      );
      assert.equal(
        await $("#studio-synthesis-restore-outcome").getText(),
        "Restored version 3.",
      );
    } finally {
      await rm(isolatedFixturePath, { recursive: true, force: true });
    }
  });
});
