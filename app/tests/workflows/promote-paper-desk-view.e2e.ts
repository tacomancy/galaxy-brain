/** S1 behavior test for the promoted Paper Desk reading surface. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Promote the Paper Desk view", () => {
  it("presents the source-first reading surface and preserves the saved position action", async () => {
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
    await $("#atlas-topic-open-studio").click();
    await $("#studio-source-record-open-paper-desk").click();
    await $("#paper-desk-reading-surface").waitForDisplayed();

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

    const action = await $("#paper-desk-open-saved-annotation");
    assert.equal(await action.getText(), "Open saved annotation");
    assert.equal(await action.isEnabled(), true);
    await action.click();
    await browser.waitUntil(
      async () =>
        (await $("#paper-desk-reading-position").getText()) ===
        "Page 2, character 0",
      {
        timeout: 5_000,
        timeoutMsg: "The saved reading position did not become visible.",
      },
    );
  });
});
