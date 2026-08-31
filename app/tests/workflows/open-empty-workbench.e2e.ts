/**
 * S1 behavior test for the packaged desktop Workbench.
 *
 * The assertions intentionally use visible, accessible content rather than
 * React state, IPC details, or repository storage. The expected strings and
 * absent fixture term are independent facts about a fresh session.
 */
import { strict as assert } from "node:assert";
import { $ } from "@wdio/globals";

describe("Open the real empty Workbench", () => {
  // This is the first vertical workflow: packaged Electron app through the
  // main process, preload bridge, Workbench Session, and Atlas Adapter.
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
    assert.equal(
      await $("#open-repository").getText(),
      "Open a Knowledge Repository",
    );
    assert.equal(
      await $("#create-repository").getText(),
      "Create a Knowledge Repository",
    );
    assert.doesNotMatch(await page.getText(), /Bayesian statistics/);
  });
});
