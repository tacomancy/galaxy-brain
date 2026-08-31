/** S1 packaged workflow for production linked-PDF status and relink. */
import { strict as assert } from "node:assert";
import { cp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Production linked PDF status", () => {
  it("preserves the portable claim while reporting changed and verified states", async () => {
    const sourcePdfPath = process.env.GALAXY_BRAIN_TEST_SOURCE_PDF;
    assert.ok(sourcePdfPath, "The packaged test PDF path must be configured.");
    const replacementPdfPath = sourcePdfPath.replace(
      ".pdf",
      "-replacement.pdf",
    );
    await cp(sourcePdfPath, replacementPdfPath);

    const dialog = await browser.electron.mock("dialog", "showOpenDialog");
    const fixtureRepositoryPath = join(
      process.cwd(),
      "tests",
      "fixtures",
      "knowledge-repository",
    );
    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [fixtureRepositoryPath],
    });

    await $("#open-repository").click();
    await $("#atlas-topic-open-studio").waitForDisplayed();
    await $("#atlas-topic-open-studio").click();
    await $("#studio-source-record-open-paper-desk").waitForDisplayed();
    await $("#studio-source-record-open-paper-desk").click();
    await $("#paper-desk-source-status-heading").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-source-status-heading").getText(),
      "Source available",
    );

    await writeFile(sourcePdfPath, "changed source bytes", "utf8");
    await $("#workspace-switcher-atlas").click();
    await $("#workspace-switcher-paper-desk").click();
    await $("#paper-desk-source-status-heading").waitForDisplayed();
    await browser.waitUntil(
      async () =>
        (await $("#paper-desk-source-status-heading").getText()) ===
        "Source status changed",
      {
        timeout: 5_000,
        timeoutMsg: "The changed linked-PDF status did not become visible.",
      },
    );
    assert.equal(
      await $("#paper-desk-source-status-heading").getText(),
      "Source status changed",
    );
    assert.equal(
      await $("#paper-desk-annotation-text").getText(),
      "Bayesian inference updates prior belief with evidence.",
    );

    const missingReplacementPdfPath = sourcePdfPath.replace(
      ".pdf",
      "-missing.pdf",
    );
    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [missingReplacementPdfPath],
    });
    await $("#paper-desk-relink-source").click();
    await browser.waitUntil(
      async () =>
        (await $("#paper-desk-source-status-heading").getText()) ===
        "Source status unavailable",
      {
        timeout: 5_000,
        timeoutMsg: "The failed relink outcome did not become visible.",
      },
    );
    assert.equal(
      await $("#paper-desk-annotation-text").getText(),
      "Bayesian inference updates prior belief with evidence.",
    );

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [replacementPdfPath],
    });
    await $("#paper-desk-relink-source").click();
    await browser.waitUntil(
      async () =>
        (await $("#paper-desk-source-status-heading").getText()) ===
        "Source relinked and verified.",
      {
        timeout: 5_000,
        timeoutMsg:
          "The replacement PDF relink outcome did not become visible.",
      },
    );
    assert.equal(
      await $("#paper-desk-source-status-heading").getText(),
      "Source relinked and verified.",
    );
    assert.equal(
      await $("#paper-desk-annotation-text").getText(),
      "Bayesian inference updates prior belief with evidence.",
    );

    await $("#workspace-switcher-atlas").click();
    await $("#workspace-switcher-paper-desk").click();
    await $("#paper-desk-source-status-heading").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-source-status-heading").getText(),
      "Source available",
    );

    await rm(replacementPdfPath);
    await $("#workspace-switcher-atlas").click();
    await $("#workspace-switcher-paper-desk").click();
    await browser.waitUntil(
      async () =>
        (await $("#paper-desk-source-status-heading").getText()) ===
        "Source status unavailable",
      {
        timeout: 5_000,
        timeoutMsg: "The unavailable linked-PDF status did not become visible.",
      },
    );
    assert.equal(
      await $("#paper-desk-annotation-text").getText(),
      "Bayesian inference updates prior belief with evidence.",
    );
  });
});
