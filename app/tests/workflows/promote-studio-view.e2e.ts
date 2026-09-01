/** S1 behavior test for the promoted Studio topic surface. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Promote the Studio view", () => {
  it("presents the topic, supporting Working Material, and Paper Desk action", async () => {
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
    await $("#studio-topic-surface").waitForDisplayed();

    assert.equal(
      await browser.execute(
        () =>
          Array.from(
            document.querySelectorAll(
              "#studio-topic-surface .card-kicker, #studio-topic-surface h2",
            ),
          ).filter((heading) => heading.textContent?.trim() === "Current topic")
            .length,
        [],
      ),
      1,
    );

    assert.equal(
      await $("#studio-topic-title").getText(),
      "Bayesian statistics",
    );
    assert.equal(
      await $("#studio-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );
    assert.equal(
      await $("#studio-source-claim-text").getText(),
      "Bayesian inference updates prior belief with evidence.",
    );
    assert.equal(
      await $("#studio-source-claim-state").getText(),
      "Working Material",
    );

    const action = await $("#studio-source-record-open-paper-desk");
    assert.equal(await action.getText(), "Open Source Record in Paper Desk");
    assert.equal(await action.isEnabled(), true);
    await action.click();

    await $("#paper-desk-heading").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );
  });
});
