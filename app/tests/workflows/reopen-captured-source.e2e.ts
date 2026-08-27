/** S1 behavior test for reopening a saved source claim and reading position. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Reopen a captured source claim", () => {
  it("restores the saved annotation and reading position after relaunch", async () => {
    const fixtureRepositoryPath = join(
      process.cwd(),
      "tests",
      "fixtures",
      "knowledge-repository",
    );
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [fixtureRepositoryPath],
    });

    await $("#open-repository").click();
    await $("#atlas-topic-open-studio").waitForDisplayed();
    await $("#atlas-topic-open-studio").click();
    await $("#studio-source-record-open-paper-desk").waitForDisplayed();
    await $("#studio-source-record-open-paper-desk").click();

    await $("#paper-desk-saved-annotation").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );
    assert.equal(
      await $("#paper-desk-annotation-text").getText(),
      "Bayesian inference updates prior belief with evidence.",
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
    assert.equal(
      await $("#paper-desk-annotation-state").getText(),
      "State: working-material",
    );

    await $("#paper-desk-open-saved-annotation").click();
    assert.equal(
      await $("#paper-desk-reading-position").getText(),
      "Page 2, character 0",
    );

    await browser.reloadSession();

    await $("#paper-desk-heading").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );
    assert.equal(
      await $("#paper-desk-annotation-text").getText(),
      "Bayesian inference updates prior belief with evidence.",
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
    assert.equal(
      await $("#paper-desk-annotation-state").getText(),
      "State: working-material",
    );
    assert.equal(
      await $("#paper-desk-reading-position").getText(),
      "Page 2, character 0",
    );
  });
});
