/** S1 behavior test for correcting a TB14 learning-progress suggestion. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Correct a learning progress suggestion", () => {
  it("keeps the current stage when a human corrects the suggestion", async () => {
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
    await $("#atlas-learning-progress").waitForDisplayed();
    await browser.execute(() => {
      document.getElementById("atlas-learning-progress-correct")?.focus();
    });
    assert.equal(
      await browser.execute(() => document.activeElement?.id),
      "atlas-learning-progress-correct",
    );
    await browser.keys("Enter");
    await $("#atlas-learning-progress-correction").setValue(
      "Keep Evidence updates as the current stage",
    );
    await browser.execute(() => {
      document
        .getElementById("atlas-learning-progress-save-correction")
        ?.focus();
    });
    assert.equal(
      await browser.execute(() => document.activeElement?.id),
      "atlas-learning-progress-save-correction",
    );
    await browser.keys("Enter");
    await $("#atlas-learning-progress-correction-result").waitForDisplayed();

    assert.equal(
      await $("#atlas-learning-current-stage").getText(),
      "Current stage: Evidence updates",
    );
    assert.equal(
      await $("#atlas-learning-progress-status").getText(),
      "Corrected by you",
    );
    assert.equal(
      await $("#atlas-learning-progress-correction-result").getText(),
      "Correction: Keep Evidence updates as the current stage",
    );
  });
});
