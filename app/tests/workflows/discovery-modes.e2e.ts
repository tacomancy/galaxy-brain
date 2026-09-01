/** S1 behavior test for the explicit Search, Ask, and Jump modes. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

import { openDiscovery } from "./discovery-helper";

describe("Use explicit Discovery modes", () => {
  it("keeps retrieval, synthesis review, and navigation distinct", async () => {
    const fixtureRepositoryPath = join(
      process.cwd(),
      "tests",
      "fixtures",
      "knowledge-repository",
    );
    const isolatedRepositoryPath = await mkdtemp(
      join(tmpdir(), "galaxy-brain-discovery-workflow-"),
    );
    await cp(fixtureRepositoryPath, isolatedRepositoryPath, {
      recursive: true,
    });

    try {
      const dialog = await browser.electron.mock("dialog", "showOpenDialog");
      await dialog.mockResolvedValue({
        canceled: false,
        filePaths: [isolatedRepositoryPath],
      });
      await $("#open-repository").click();
      await openDiscovery();

      assert.equal(
        await $("#discovery-mode-search").getAttribute("aria-selected"),
        "true",
      );
      await $("#discovery-input").setValue("Bayesian");
      await $("#discovery-submit").click();
      await $("#discovery-search-results").waitForDisplayed();
      assert.equal(
        await $("#discovery-search-outcome").getAttribute(
          "data-discovery-outcome",
        ),
        "found",
      );
      assert.equal(
        await $("#discovery-search-result-bayesian-statistics").getAttribute(
          "data-discovery-authority",
        ),
        "core-knowledge",
      );

      await $("#discovery-mode-ask").click();
      await browser.waitUntil(
        async () =>
          (await $("#discovery-mode-ask").getAttribute("aria-selected")) ===
          "true",
        { timeout: 5_000, timeoutMsg: "Ask mode did not become selected." },
      );
      assert.equal(await $("#discovery-search-results").isDisplayed(), false);
      await $("#discovery-ask-context-bayesian-statistics").click();
      await $(
        "#discovery-ask-context-annotation-bayesian-statistics-fixture-source-page-2-0-54",
      ).click();
      await $(
        "#discovery-ask-context-annotation-bayesian-statistics-fixture-source-page-2-55-83",
      ).click();
      await $("#discovery-input").setValue(
        "What does the fixture say about Bayesian inference?",
      );
      await $("#discovery-submit").click();
      await $("#discovery-ask-preview").waitForDisplayed();
      assert.equal(
        await $("#discovery-ask-destination").getText(),
        "OpenAI API",
      );
      assert.equal(
        await $("#discovery-ask-model").getText(),
        "fixture-pinned-model",
      );
      await $("#discovery-ask-preview details summary").click();
      await $("#discovery-ask-payload").waitForDisplayed();
      assert.match(
        await $("#discovery-ask-payload").getText(),
        /"operation": "ask"/u,
      );

      await $(
        "#discovery-ask-remove-annotation-bayesian-statistics-fixture-source-page-2-55-83",
      ).click();
      await browser.waitUntil(
        async () =>
          (await $("#discovery-ask-remove-bayesian-statistics").isExisting()) &&
          (await $(
            "#discovery-ask-remove-annotation-bayesian-statistics-fixture-source-page-2-0-54",
          ).isExisting()) &&
          !(await $(
            "#discovery-ask-remove-annotation-bayesian-statistics-fixture-source-page-2-55-83",
          ).isExisting()),
        {
          timeout: 5_000,
          timeoutMsg: "Ask context did not remain visible after regeneration.",
        },
      );
      assert.doesNotMatch(
        await $("#discovery-ask-payload").getText(),
        /Evidence updates confidence\./u,
      );
      await $("#discovery-ask-decline").click();
      await browser.waitUntil(
        async () =>
          (await $("#discovery-ask-outcome").getAttribute(
            "data-discovery-outcome",
          )) === "declined",
        { timeout: 5_000, timeoutMsg: "Ask decline outcome did not appear." },
      );

      await $("#discovery-mode-jump").click();
      await $("#discovery-input").setValue("Studio");
      await $("#discovery-submit").click();
      await browser.waitUntil(
        async () => (await $("#workspace-label").getText()).includes("Studio"),
        {
          timeout: 5_000,
          timeoutMsg: "Known Jump target did not open Studio.",
        },
      );
      assert.equal(await $("#discovery-surface").isDisplayed(), false);
    } finally {
      await rm(isolatedRepositoryPath, { recursive: true, force: true });
    }
  });
});
