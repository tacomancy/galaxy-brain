/** S1 behavior test for the explicit Synthesis confirmation presentation. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Review a Synthesis request", () => {
  it("shows the exact request and preserves the confirmation boundary", async () => {
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
    await $("#studio-synthesis-include-all-context").click();
    await $("#studio-synthesis-prepare").click();
    await $("#studio-synthesis-preview").waitForDisplayed();

    assert.equal(
      await $("#studio-synthesis-summary").getText(),
      'Synthesize 2 selected source claims into "Bayesian statistics" using model "fixture-pinned-model" via OpenAI API; 82 source characters selected.',
    );
    assert.equal(
      await $("#studio-synthesis-destination").getText(),
      "OpenAI API",
    );
    assert.equal(
      await $("#studio-synthesis-model").getText(),
      "fixture-pinned-model",
    );
    await $("details summary").click();
    await $("#studio-synthesis-payload").waitForDisplayed();
    assert.match(
      await $("#studio-synthesis-payload").getText(),
      /"operation": "synthesize-into-topic"/,
    );
    assert.match(
      await $("#studio-synthesis-payload").getText(),
      /Bayesian inference updates prior belief with evidence\./,
    );
    assert.match(
      await $("#studio-synthesis-payload").getText(),
      /Evidence updates confidence\./,
    );

    await $(
      "#studio-synthesis-remove-annotation-bayesian-statistics-fixture-source-page-2-55-83",
    ).click();
    await browser.waitUntil(
      async () =>
        (await $("#studio-synthesis-summary").getText()) ===
        'Synthesize 1 selected source claim into "Bayesian statistics" using model "fixture-pinned-model" via OpenAI API; 54 source characters selected.',
      {
        timeout: 5_000,
        timeoutMsg: "The Synthesis preview did not regenerate after removal.",
      },
    );
    assert.doesNotMatch(
      await $("#studio-synthesis-payload").getText(),
      /Evidence updates confidence\./,
    );

    await $("#studio-synthesis-decline").click();
    await browser.waitUntil(
      async () =>
        (await $("#studio-synthesis-outcome").getAttribute(
          "data-synthesis-outcome",
        )) === "declined",
      {
        timeout: 5_000,
        timeoutMsg: "The Synthesis decline outcome did not appear.",
      },
    );

    await $("#studio-synthesis-prepare").click();
    await $("#studio-synthesis-preview").waitForDisplayed();
    await $("#studio-synthesis-cancel").click();
    await browser.waitUntil(
      async () =>
        (await $("#studio-synthesis-outcome").getAttribute(
          "data-synthesis-outcome",
        )) === "canceled",
      {
        timeout: 5_000,
        timeoutMsg: "The Synthesis cancel outcome did not appear.",
      },
    );
    assert.equal(
      await $("#studio-synthesis-outcome").getAttribute(
        "data-synthesis-outcome",
      ),
      "canceled",
    );

    await $("#studio-synthesis-prepare").click();
    await $("#studio-synthesis-preview").waitForDisplayed();
    await $("#studio-synthesis-confirm").click();
    await browser.waitUntil(
      async () =>
        (await $("#studio-synthesis-outcome").getAttribute(
          "data-synthesis-outcome",
        )) === "agent-provider-unavailable",
      {
        timeout: 5_000,
        timeoutMsg: "The Synthesis provider outcome did not appear.",
      },
    );
    assert.equal(
      await $("#studio-synthesis-outcome").getText(),
      "Synthesis requires a configured Agent Provider.",
    );

    await $("#studio-synthesis-results").waitForDisplayed();
    assert.equal(
      await $(
        "#studio-synthesis-result-title-synthesis-result-bayesian-statistics-fixture",
      ).getText(),
      "Bayesian statistics synthesis",
    );
    assert.equal(
      await $(
        "#studio-synthesis-restore-synthesis-result-bayesian-statistics-fixture-1",
      ).getText(),
      "Restore version 1",
    );
    assert.equal(
      await $(
        "#studio-synthesis-restore-synthesis-result-bayesian-statistics-fixture-1",
      ).isEnabled(),
      true,
    );

    await $(
      "#studio-synthesis-restore-synthesis-result-bayesian-statistics-fixture-1",
    ).click();
    await browser.waitUntil(
      async () =>
        (await $("#studio-synthesis-restore-outcome").getAttribute(
          "data-synthesis-restore-outcome",
        )) === "restored",
      {
        timeout: 5_000,
        timeoutMsg: "The saved result restore outcome did not appear.",
      },
    );
    assert.equal(
      await $("#studio-synthesis-restore-outcome").getText(),
      "Restored version 3.",
    );
  });
});
