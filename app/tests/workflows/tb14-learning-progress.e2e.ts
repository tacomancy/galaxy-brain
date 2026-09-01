/** S1 behavior test for human-owned TB14 learning progress. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Keep learning progress human-owned", () => {
  it("explains evidence and advances only after explicit confirmation", async () => {
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

    if (process.env.GALAXY_BRAIN_WDIO_TEST_MODE === "provider-unavailable") {
      assert.equal(
        await $("#atlas-learning-progress").getAttribute(
          "data-learning-outcome",
        ),
        "agent-provider-unavailable",
      );
      assert.equal(
        await $("#atlas-learning-progress-unavailable").getText(),
        "Learning progress suggestions require a configured Agent Provider.",
      );
      assert.equal(
        await $("#atlas-learning-current-stage").getText(),
        "Current stage remains: Evidence updates",
      );
      await $("#atlas-topic-open-studio").click();
      await $("#studio-heading").waitForDisplayed();
      await $("#studio-source-record-open-paper-desk").click();
      await $("#paper-desk-reading-surface").waitForDisplayed();
      await $("#workspace-switcher-atlas").click();
      await $("#atlas-proposal-review").click();
      await $("#proposal-review-heading").waitForDisplayed();
      return;
    }

    assert.equal(
      await $("#atlas-learning-current-stage").getText(),
      "Current stage: Evidence updates",
    );
    assert.equal(
      await $("#atlas-learning-suggested-stage").getText(),
      "Suggested next stage: Posterior belief",
    );
    assert.equal(
      await $("#atlas-learning-progress-status").getText(),
      "Awaiting your confirmation",
    );
    assert.equal(
      (await $("#atlas-learning-progress-explanation").getText()).includes(
        "Both saved source annotations",
      ),
      true,
    );
    const evidence = await $("#atlas-learning-progress-evidence").getText();
    assert.equal(evidence.includes("characters 0–54"), true);
    assert.equal(evidence.includes("characters 55–83"), true);
    assert.equal(evidence.includes("Bayesian statistics fixture source"), true);
    await $(
      "#atlas-learning-progress-evidence-annotation-bayesian-statistics-fixture-source-page-2-0-54",
    ).click();
    await $("#paper-desk-reading-surface").waitForDisplayed();
    await $("#workspace-switcher-atlas").click();
    await $("#atlas-learning-progress").waitForDisplayed();

    await $("#atlas-topic-open-studio").click();
    await $("#studio-heading").waitForDisplayed();
    await $("#studio-source-record-open-paper-desk").click();
    await $("#paper-desk-reading-surface").waitForDisplayed();
    await $("#workspace-switcher-atlas").click();
    await $("#atlas-learning-progress").waitForDisplayed();
    assert.equal(
      await $("#atlas-learning-current-stage").getText(),
      "Current stage: Evidence updates",
    );

    await browser.refresh();
    await $("#atlas-learning-progress").waitForDisplayed();
    assert.equal(
      await $("#atlas-learning-current-stage").getText(),
      "Current stage: Evidence updates",
    );

    await browser.execute(() => {
      document.getElementById("atlas-learning-progress-confirm")?.focus();
    });
    assert.equal(
      await browser.execute(() => document.activeElement?.id),
      "atlas-learning-progress-confirm",
    );
    await browser.keys("Enter");
    await browser.waitUntil(
      async () =>
        (await $("#atlas-learning-progress-status").getText()) ===
        "Confirmed by you",
      {
        timeout: 5_000,
        timeoutMsg: "The learning suggestion was not confirmed.",
      },
    );
    assert.equal(
      await $("#atlas-learning-current-stage").getText(),
      "Current stage: Posterior belief",
    );
    assert.equal(
      await $("#atlas-learning-progress-confirm").isDisplayed(),
      false,
    );
  });
});
