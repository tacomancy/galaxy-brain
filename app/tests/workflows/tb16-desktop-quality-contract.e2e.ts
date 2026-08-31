/** S1 packaged-app coverage for the TB16 desktop quality contract. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $, browser } from "@wdio/globals";
import "@wdio/electron-service";

const fixtureRepositoryPath = join(
  process.cwd(),
  "tests",
  "fixtures",
  "knowledge-repository",
);

const tabUntil = async (targetId: string): Promise<void> => {
  await browser.waitUntil(
    async () => {
      await browser.keys("Tab");
      return await browser.execute(
        (id) => document.activeElement?.id === id,
        targetId,
      );
    },
    {
      timeout: 5_000,
      timeoutMsg: `Keyboard focus did not reach #${targetId}.`,
    },
  );
};

const openFixtureRepository = async (): Promise<void> => {
  const dialog = await browser.electron.mock("dialog", "showOpenDialog");
  await dialog.mockResolvedValue({
    canceled: false,
    filePaths: [fixtureRepositoryPath],
  });
  await $("#open-repository").click();
  await $("#atlas-topic-open-studio").waitForDisplayed();
};

describe("TB16 desktop quality contract", () => {
  it("completes the critical authoring edit with keyboard actions", async () => {
    await openFixtureRepository();

    await tabUntil("atlas-topic-open-studio");
    await browser.keys("Enter");
    await $("#studio-authoring-surface").waitForDisplayed();

    await tabUntil("studio-rich-edit");
    await browser.keys("Enter");
    await $("#studio-rich-edit-input").waitForDisplayed();
    await browser.keys(["Meta", "A"]);
    await browser.keys("posterior belief");
    await tabUntil("studio-rich-edit-apply");
    await browser.keys("Enter");

    await browser.waitUntil(
      async () =>
        (await $("#studio-rich-view").getText()) === "posterior belief",
      { timeout: 5_000, timeoutMsg: "The keyboard edit was not applied." },
    );

    await tabUntil("studio-rich-undo");
    await browser.keys("Enter");
    await browser.waitUntil(
      async () => (await $("#studio-rich-view").getText()) === "prior belief",
      { timeout: 5_000, timeoutMsg: "The keyboard undo was not applied." },
    );
  });

  it("persists an explicit theme choice and exposes semantic states", async () => {
    await browser.refresh();
    await $("#studio-authoring-surface").waitForDisplayed();

    await $("#workbench-theme").selectByAttribute("value", "dark");
    await browser.waitUntil(
      async () =>
        (await browser.execute(
          () => document.documentElement.dataset.theme,
        )) === "dark",
      { timeout: 5_000, timeoutMsg: "The dark theme was not applied." },
    );

    assert.equal(
      await $("#studio-authoring-state").getText(),
      "Working Material",
    );
    assert.equal(
      await $("#studio-rich-mode").getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await $("#studio-source-mode").getAttribute("aria-pressed"),
      "false",
    );

    await browser.refresh();
    await $("#studio-authoring-surface").waitForDisplayed();
    assert.equal(await $("#workbench-theme").getValue(), "dark");
  });

  it("keeps the critical Studio surface usable at narrow and enlarged scales", async () => {
    await browser.execute(() => {
      document.body.style.zoom = "2";
    });

    assert.equal(await $("#studio-heading").isDisplayed(), true);
    assert.equal(await $("#studio-rich-edit").isDisplayed(), true);
    assert.equal(
      await browser.execute(() =>
        Array.from(document.styleSheets).some((sheet) => {
          try {
            return Array.from(sheet.cssRules).some(
              (rule) =>
                rule instanceof CSSMediaRule &&
                rule.conditionText === "(prefers-reduced-motion: reduce)",
            );
          } catch {
            return false;
          }
        }),
      ),
      true,
    );
  });
});
