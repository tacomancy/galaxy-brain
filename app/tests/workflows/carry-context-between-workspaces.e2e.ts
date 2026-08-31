/** S1 behavior test for carrying a topic from Atlas into Studio. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Carry context between workspaces", () => {
  it("opens the selected topic in Studio with its context preserved", async () => {
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

    const topicAction = await $("#atlas-topic-open-studio");

    await topicAction.waitForDisplayed();
    assert.equal(
      await $("#atlas-topic-title").getText(),
      "Bayesian statistics",
    );

    await topicAction.click();

    await $("#studio-heading").waitForDisplayed();
    assert.equal(await $("#studio-heading").getText(), "Studio");
    assert.equal(
      await $("#studio-topic-title").getText(),
      "Bayesian statistics",
    );
    assert.equal(
      await $("#studio-topic-context").getText(),
      "Topic context preserved in this session",
    );

    await $("#workspace-switcher-atlas").click();
    await $("#atlas-heading").waitForDisplayed();
  });

  it("opens the associated Source Record in Paper Desk with the topic relationship", async () => {
    await browser.refresh();

    const topicAction = await $("#atlas-topic-open-studio");

    await topicAction.waitForDisplayed();
    await topicAction.click();

    const sourceRecordAction = await $("#studio-source-record-open-paper-desk");

    await sourceRecordAction.waitForDisplayed();
    assert.equal(
      await $("#studio-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );

    await sourceRecordAction.click();

    await $("#paper-desk-heading").waitForDisplayed();
    assert.equal(await $("#paper-desk-heading").getText(), "Paper Desk");
    assert.equal(
      await $("#paper-desk-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );
    assert.equal(
      await $("#paper-desk-topic-relationship").getText(),
      "Related topic: Bayesian statistics",
    );

    await $("#workspace-switcher-atlas").click();
    await $("#atlas-heading").waitForDisplayed();
  });

  it("switches workspaces without dropping the active context", async () => {
    await browser.refresh();

    const switcher = await $("#workspace-switcher");

    await switcher.waitForDisplayed();
    assert.equal(await switcher.getAttribute("aria-label"), "Workspaces");
    await $("#workspace-switcher-studio").click();
    await $("#studio-heading").waitForDisplayed();
    assert.equal(await $("#studio-heading").getText(), "Studio");
    assert.equal(
      await $("#workspace-switcher-studio").getAttribute("aria-current"),
      "page",
    );
    assert.equal(
      await $("#studio-topic-context").getText(),
      "Topic context preserved in this session",
    );

    await $("#workspace-switcher-paper-desk").click();
    await $("#paper-desk-heading").waitForDisplayed();
    assert.equal(await $("#paper-desk-heading").getText(), "Paper Desk");
    assert.equal(
      await $("#workspace-switcher-paper-desk").getAttribute("aria-current"),
      "page",
    );
    assert.equal(
      await $("#paper-desk-topic-relationship").getText(),
      "Related topic: Bayesian statistics",
    );

    await $("#workspace-switcher-atlas").click();
    await $("#atlas-heading").waitForDisplayed();
    assert.equal(await $("#atlas-heading").getText(), "Atlas");
    assert.equal(
      await $("#workspace-switcher-atlas").getAttribute("aria-current"),
      "page",
    );
    assert.equal(
      await $("#atlas-topic-title").getText(),
      "Bayesian statistics",
    );
  });
});
