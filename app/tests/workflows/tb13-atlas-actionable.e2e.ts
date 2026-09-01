/** S1 behavior test for the TB13 actionable Atlas slices. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Make Atlas actionable", () => {
  it("shows traceable, human-owned, and discovery-only orientation slices", async () => {
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
    await $("#atlas-traceable-metric").waitForDisplayed();

    assert.equal(await $("#atlas-metric-value").getText(), "2");
    assert.equal(
      await $("#atlas-metric-definition").getText(),
      "Saved annotations attached to the current Source Record.",
    );
    assert.equal(
      (await $("#atlas-metric-source-items").getText()).includes(
        "page 2, characters 0–54",
      ),
      true,
    );
    assert.equal(
      (await $("#atlas-metric-source-items").getText()).includes(
        "page 2, characters 55–83",
      ),
      true,
    );
    await $("#atlas-metric-open-source").click();
    await $("#paper-desk-heading").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );

    await $("#workspace-switcher-atlas").click();
    await $("#atlas-learning-route").waitForDisplayed();
    assert.equal(
      await $("#atlas-learning-route-owner").getText(),
      "Human-authored",
    );
    assert.equal(
      (await $("#atlas-learning-route-steps").getText()).includes(
        "Prior belief",
      ),
      true,
    );

    await $("#atlas-learning-route-edit").click();
    await $("#atlas-learning-route-cancel").click();
    assert.equal(
      await $("#atlas-learning-route-heading").getText(),
      "Bayesian statistics essentials",
    );

    await $("#atlas-learning-route-edit").click();
    await $("#atlas-learning-route-title").setValue(
      "Bayesian statistics review route",
    );
    await $("#atlas-learning-route-save").click();
    await $("#atlas-learning-route-outcome").waitForDisplayed();
    assert.equal(
      await $("#atlas-learning-route-heading").getText(),
      "Bayesian statistics review route",
    );
    assert.equal(
      await $("#atlas-learning-route-owner").getText(),
      "Human-authored",
    );

    assert.equal(await $("#atlas-generated-relationship").isDisplayed(), true);
    assert.equal(
      await $("#atlas-generated-relationship-type").getText(),
      "Suggested relationship: extends",
    );
    assert.equal(
      await $("#atlas-generated-relationship")
        .getText()
        .then((text) => text.includes("Not Governed Knowledge")),
      true,
    );
    assert.equal(
      (await $("#atlas-generated-relationship-evidence").getText()).includes(
        "updating a prior belief with evidence",
      ),
      true,
    );
    await $("#atlas-generated-relationship-open-source").click();
    await $("#paper-desk-heading").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );
  });
});
