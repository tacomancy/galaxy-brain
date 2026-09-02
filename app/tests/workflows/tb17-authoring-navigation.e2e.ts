/** S1 packaged-app workflow for TB17 repository navigation and authoring. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $, browser } from "@wdio/globals";
import "@wdio/electron-service";

describe("TB17 authoring and repository navigation", () => {
  let temporaryRoot: string;
  let repositoryPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-tb17-workflow-"),
    );
    repositoryPath = join(temporaryRoot, "repository");
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("navigates the tree, saves a note, and recovers it after relaunch", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");
    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
    });

    await $("#open-repository").waitForDisplayed();
    await $("#open-repository").click();
    await $("#knowledge-repository-tree").waitForDisplayed();
    await $(
      "button[aria-label='Expand or collapse knowledge']",
    ).waitForDisplayed();
    await $("button[aria-label='knowledge/README.md']").waitForDisplayed();

    await $("button[aria-label='knowledge/bayesian-statistics.md']").click();
    await $("#studio-heading").waitForDisplayed();
    await $("#studio-new-working-material").click();

    await $("#studio-working-material-note-title").setValue(
      "Bayesian statistics working note",
    );
    await $("#studio-working-material-note-body").setValue(
      "Prior belief needs evidence.",
    );
    await $("#studio-working-material-note-save-button").click();
    await $("#studio-working-material-note-save").waitForDisplayed();
    await browser.waitUntil(
      async () =>
        (await $("#studio-working-material-note-save").getText()) ===
        "Saved locally",
      { timeout: 10_000, timeoutMsg: "Working Material note was not saved." },
    );
    assert.match(
      await $("#studio-working-material-note-path").getText(),
      /scratch\/tb17-bayesian-statistics-working-note\.md/u,
    );
    assert.equal(
      await $(
        "button[aria-label='scratch/tb17-bayesian-statistics-working-note.md']",
      ).isDisplayed(),
      true,
    );

    await $(
      "button[aria-label='scratch/tb17-bayesian-statistics-working-note.md']",
    ).click();
    assert.equal(
      await $("#studio-working-material-note-title").getValue(),
      "Bayesian statistics working note",
    );
    assert.equal(
      await $("#studio-working-material-note-body").getValue(),
      "Prior belief needs evidence.",
    );

    await browser.reloadSession();
    await $("#studio-working-material-note").waitForDisplayed();
    assert.equal(
      await $("#studio-working-material-note-title").getValue(),
      "Bayesian statistics working note",
    );
    assert.equal(
      await $("#studio-working-material-note-body").getValue(),
      "Prior belief needs evidence.",
    );
  });
});
