/** S1 behavior test for the promoted Atlas continuation surface. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Promote the Atlas view", () => {
  it("presents real continuation context and a keyboard-operable Studio action", async () => {
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
    await $("#atlas-continue-surface").waitForDisplayed();

    assert.equal(await $("#atlas-heading").getText(), "Atlas");
    assert.equal(
      await $("#atlas-continue-heading").getText(),
      "Continue working",
    );
    assert.equal(
      await $("#atlas-topic-title").getText(),
      "Bayesian statistics",
    );
    assert.equal(
      await $("#atlas-topic-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );

    const action = await $("#atlas-topic-open-studio");
    assert.equal(await action.getText(), "Open in Studio");
    assert.equal(await action.isEnabled(), true);
    await action.click();

    await $("#studio-heading").waitForDisplayed();
    assert.equal(
      await $("#studio-topic-title").getText(),
      "Bayesian statistics",
    );
  });
});
