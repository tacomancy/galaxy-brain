import { strict as assert } from "node:assert";
import { $ } from "@wdio/globals";

describe("Open the real empty Workbench", () => {
  it("opens Atlas with the authentic empty state and no demonstration data", async () => {
    const atlas = await $('main[aria-labelledby="atlas-heading"]');

    await atlas.waitForDisplayed();

    const heading = await $("#atlas-heading");
    const emptyStateHeading = await $("#atlas-empty-heading");
    const emptyStateAction = await $("#atlas-empty-state p");
    const page = await $("body");

    assert.equal(await heading.getText(), "Atlas");
    assert.equal(
      await emptyStateHeading.getText(),
      "No Knowledge Repository is open.",
    );
    assert.equal(
      await emptyStateAction.getText(),
      "Open or create one to begin.",
    );
    assert.doesNotMatch(await page.getText(), /Bayesian statistics/);
  });
});
