/** S1 packaged workflow for production linked-PDF status and relink. */
import { strict as assert } from "node:assert";
import { cp, lstat, readFile, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Production linked PDF status", () => {
  it("preserves the portable claim while reporting changed and verified states", async () => {
    const sourcePdfPath = process.env.GALAXY_BRAIN_TEST_SOURCE_PDF;
    assert.ok(sourcePdfPath, "The packaged test PDF path must be configured.");
    const invalidReplacementPdfPath =
      process.env.GALAXY_BRAIN_TEST_INVALID_REPLACEMENT_PDF;
    assert.ok(
      invalidReplacementPdfPath,
      "The invalid replacement PDF path must be configured.",
    );
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
    assert.equal(
      await $(".source-identity-card").getAttribute("data-source-record-id"),
      "bayesian-statistics-fixture-source",
    );
    assert.equal(
      await $("#paper-desk-saved-annotation").getAttribute(
        "data-annotation-id",
      ),
      "annotation-bayesian-statistics-fixture-source-page-2-0-54",
    );
    assert.equal(
      await $("#paper-desk-source-locator").getText(),
      "page:2#chars=0-54",
    );
    assert.equal(
      await $("#paper-desk-annotation-attribution").getText(),
      "Attribution: source-claim",
    );
    assert.equal(
      await $("#paper-desk-annotation-classification").getText(),
      "Classification: source-claim",
    );

    await cp(invalidReplacementPdfPath, sourcePdfPath);
    await $("#workspace-switcher-atlas").click();
    await $("#atlas-heading").waitForDisplayed();
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

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [invalidReplacementPdfPath],
    });
    await $("#paper-desk-relink-source").click();
    await browser.waitUntil(
      async () =>
        (await $("#paper-desk-source-status-heading").getText()) ===
        "Source status changed",
      {
        timeout: 5_000,
        timeoutMsg:
          "The invalid-locator relink outcome did not become visible.",
      },
    );
    await $("#paper-desk-relink-outcome").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-source-locator").getText(),
      "page:2#chars=0-54",
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
        "Source status changed",
      {
        timeout: 5_000,
        timeoutMsg: "The failed relink outcome did not become visible.",
      },
    );
    await $("#paper-desk-relink-outcome").waitForDisplayed();
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
        "Source available",
      {
        timeout: 5_000,
        timeoutMsg:
          "The replacement PDF availability outcome did not become visible.",
      },
    );
    assert.equal(
      await $("#paper-desk-source-status-heading").getText(),
      "Source available",
    );
    assert.equal(
      await $("#paper-desk-relink-confirmation").getText(),
      "Source relinked and verified.",
    );
    assert.equal(
      await $("#paper-desk-annotation-text").getText(),
      "Bayesian inference updates prior belief with evidence.",
    );

    await $("#workspace-switcher-atlas").click();
    await $("#atlas-heading").waitForDisplayed();
    await $("#workspace-switcher-paper-desk").click();
    await $("#paper-desk-source-status-heading").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-source-status-heading").getText(),
      "Source available",
    );

    const replacementBytes = await readFile(replacementPdfPath);
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

    const portableAnnotation = await readFile(
      join(
        fixtureRepositoryPath,
        "sources",
        "annotations",
        "annotation-bayesian-statistics-fixture-source-page-2-0-54.md",
      ),
      "utf8",
    );
    assert.equal(portableAnnotation.includes(sourcePdfPath), false);

    const portablePaths = await readdir(fixtureRepositoryPath, {
      recursive: true,
    });
    for (const portablePath of portablePaths) {
      const absolutePath = join(fixtureRepositoryPath, portablePath);
      if (!(await lstat(absolutePath)).isFile()) {
        continue;
      }

      const portableBytes = await readFile(absolutePath);
      assert.equal(portableBytes.includes(Buffer.from(sourcePdfPath)), false);
      assert.equal(
        portableBytes.includes(Buffer.from(replacementPdfPath)),
        false,
      );
      assert.equal(portableBytes.includes(replacementBytes), false);
    }
  });
});
