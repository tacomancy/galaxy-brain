/** S1 behavior test for the approved UI intuitiveness changes. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("V1 UI intuitiveness", () => {
  it("opens Discovery on demand and safely resets transient state", async () => {
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

    const trigger = await $("#discovery-trigger");
    await trigger.waitForDisplayed();
    assert.equal(
      await $("#open-repository").getText(),
      "Switch Knowledge Repository",
    );
    assert.equal(
      await $("#create-repository").getText(),
      "Create a new Knowledge Repository",
    );
    assert.equal(
      await $("#atlas-topic-open-studio").getText(),
      "Open topic in Studio",
    );
    assert.equal(await trigger.getText(), "Discovery");
    assert.equal(await trigger.getAttribute("aria-label"), "Open Discovery");
    assert.equal(await $("#discovery-surface").isDisplayed(), false);

    await trigger.click();
    const surface = await $("#discovery-surface");
    await surface.waitForDisplayed();
    assert.equal(await surface.getAttribute("role"), "dialog");
    assert.equal(await surface.getAttribute("aria-modal"), "true");
    assert.equal(
      await browser.execute(() => document.activeElement?.id),
      "discovery-input",
    );

    await $("#discovery-mode-jump").click();
    await $("#discovery-input").setValue("Studio");
    await $("#discovery-close").click();
    assert.equal(await surface.isDisplayed(), false);
    assert.equal(
      await browser.execute(() => document.activeElement?.id),
      "discovery-trigger",
    );

    await trigger.click();
    await surface.waitForDisplayed();
    assert.equal(
      await $("#discovery-mode-search").getAttribute("aria-selected"),
      "true",
    );
    assert.equal(await $("#discovery-input").getValue(), "");
    await $("#discovery-close").click();
  });

  it("uses functional side navigation for existing workspaces", async () => {
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

    const navigation = await $("#workspace-side-navigation");
    await navigation.waitForDisplayed();
    assert.equal(await navigation.getAttribute("aria-label"), "Workspaces");
    assert.equal(await $("#side-nav-atlas").getText(), "Atlas");
    assert.equal(await $("#side-nav-studio").getText(), "Studio");
    assert.equal(await $("#side-nav-paper-desk").getText(), "Paper Desk");
    assert.equal(
      await $("#side-nav-atlas").getAttribute("aria-current"),
      "page",
    );

    await $("#side-nav-studio").click();
    await $("#studio-heading").waitForDisplayed();
    assert.equal(
      await $("#side-nav-studio").getAttribute("aria-current"),
      "page",
    );
    assert.equal(
      await $("#studio-topic-title").getText(),
      "Bayesian statistics",
    );

    await $("#side-nav-atlas").click();
    await $("#atlas-heading").waitForDisplayed();
    assert.equal(
      await $("#side-nav-atlas").getAttribute("aria-current"),
      "page",
    );
  });

  it("uses expanded window space without changing the visible workspace", async () => {
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
    await $("#atlas-heading").waitForDisplayed();

    const resizeWindow = async (
      width: number,
      height: number,
    ): Promise<void> => {
      if (width === 1024 && height === 900) {
        await browser.electron.execute((electron) => {
          electron.BrowserWindow.getAllWindows()[0]?.setSize(1024, 900);
        });
      } else {
        await browser.electron.execute((electron) => {
          electron.BrowserWindow.getAllWindows()[0]?.setSize(1600, 900);
        });
      }
      await browser.pause(100);
    };

    await resizeWindow(1024, 900);
    const narrow = await browser.execute(() => {
      const main = document.querySelector<HTMLElement>("#workbench-main");
      const content = document.querySelector<HTMLElement>(".workspace-content");
      return {
        mainWidth: main?.getBoundingClientRect().width ?? 0,
        contentWidth: content?.getBoundingClientRect().width ?? 0,
        viewportWidth: window.innerWidth,
        scrollWidth: Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        ),
        heading: document.querySelector("#atlas-heading")?.textContent,
      };
    });

    await resizeWindow(1600, 900);
    const wide = await browser.execute(() => {
      const main = document.querySelector<HTMLElement>("#workbench-main");
      const content = document.querySelector<HTMLElement>(".workspace-content");
      return {
        mainWidth: main?.getBoundingClientRect().width ?? 0,
        contentWidth: content?.getBoundingClientRect().width ?? 0,
        viewportWidth: window.innerWidth,
        scrollWidth: Math.max(
          document.documentElement.scrollWidth,
          document.body.scrollWidth,
        ),
        heading: document.querySelector("#atlas-heading")?.textContent,
      };
    });

    assert.ok(wide.mainWidth > narrow.mainWidth);
    assert.ok(wide.contentWidth > narrow.contentWidth);
    assert.ok(narrow.scrollWidth <= narrow.viewportWidth);
    assert.ok(wide.scrollWidth <= wide.viewportWidth);
    assert.equal(narrow.heading, wide.heading);
    assert.match(wide.heading ?? "", /Atlas/);
  });

  it("keeps the Studio editor and Paper Desk viewer primary", async () => {
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

    await $("#side-nav-studio").click();
    await $("#studio-authoring-surface").waitForDisplayed();
    assert.equal(
      await $("#studio-supporting-sidebar").getAttribute("aria-label"),
      "Supporting context",
    );
    const studioLayout = await browser.execute(() => {
      const editor = document.querySelector<HTMLElement>(
        "#studio-authoring-surface",
      );
      const sidebar = document.querySelector<HTMLElement>(
        "#studio-supporting-sidebar",
      );
      if (editor === null || sidebar === null) {
        return undefined;
      }
      const editorRect = editor.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      return {
        editorLeft: editorRect.left,
        editorWidth: editorRect.width,
        sidebarLeft: sidebarRect.left,
        sidebarWidth: sidebarRect.width,
      };
    });
    assert.ok(studioLayout !== undefined);
    assert.ok(studioLayout.editorLeft < studioLayout.sidebarLeft);
    assert.ok(studioLayout.editorWidth > studioLayout.sidebarWidth);

    await $("#side-nav-paper-desk").click();
    await $("#paper-desk-source-preview").waitForDisplayed();
    assert.equal(
      await $("#paper-desk-supporting-sidebar").getAttribute("aria-label"),
      "Supporting context",
    );
    assert.equal(
      await browser.execute(
        () =>
          document.querySelector("#paper-desk-source-status")?.parentElement
            ?.id,
      ),
      "paper-desk-supporting-sidebar",
    );
    const paperDeskLayout = await browser.execute(() => {
      const viewer = document.querySelector<HTMLElement>(
        "#paper-desk-source-preview",
      );
      const sidebar = document.querySelector<HTMLElement>(
        "#paper-desk-supporting-sidebar",
      );
      if (viewer === null || sidebar === null) {
        return undefined;
      }
      const viewerRect = viewer.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      return {
        viewerLeft: viewerRect.left,
        viewerWidth: viewerRect.width,
        sidebarLeft: sidebarRect.left,
        sidebarWidth: sidebarRect.width,
      };
    });
    assert.ok(paperDeskLayout !== undefined);
    assert.ok(paperDeskLayout.viewerLeft < paperDeskLayout.sidebarLeft);
    assert.ok(paperDeskLayout.viewerWidth > paperDeskLayout.sidebarWidth);
  });

  it("uses one shared page and panel palette in both themes", async () => {
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
    await $("#workbench-theme").selectByAttribute("value", "light");
    await $("#side-nav-atlas").click();
    await $("#atlas-continue-surface").waitForDisplayed();
    await $("#open-repository").click();

    const readCurrentPalette = async (): Promise<{
      pageBackground: string;
      pageColor: string;
      panelBackground: string;
      panelColor: string;
    }> =>
      await browser.execute(() => {
        const page = document.querySelector<HTMLElement>(".workspace-page");
        const panel = document.querySelector<HTMLElement>(
          "#repository-status, #studio-authoring-surface, #paper-desk-source-preview",
        );
        if (page === null || panel === null) {
          return {
            pageBackground: "",
            pageColor: "",
            panelBackground: "",
            panelColor: "",
          };
        }
        const pageStyle = getComputedStyle(page);
        const panelStyle = getComputedStyle(panel);
        return {
          pageBackground: pageStyle.backgroundColor,
          pageColor: pageStyle.color,
          panelBackground: panelStyle.backgroundColor,
          panelColor: panelStyle.color,
        };
      });

    const lightAtlas = await readCurrentPalette();
    await $("#side-nav-studio").click();
    await $("#studio-authoring-surface").waitForDisplayed();
    const lightStudio = await readCurrentPalette();
    await $("#side-nav-paper-desk").click();
    await $("#paper-desk-source-preview").waitForDisplayed();
    const lightPaperDesk = await readCurrentPalette();

    await $("#workbench-theme").selectByAttribute("value", "dark");
    const darkPaperDesk = await readCurrentPalette();
    const darkReadability = await browser.execute(() => {
      const navigation = document.querySelector<HTMLElement>(
        "#workspace-switcher-studio",
      );
      const viewer = document.querySelector<HTMLElement>(".source-page");
      if (navigation === null || viewer === null) {
        return { navigationColor: "", viewerBackground: "", viewerColor: "" };
      }
      return {
        navigationColor: getComputedStyle(navigation).color,
        viewerBackground: getComputedStyle(viewer).backgroundColor,
        viewerColor: getComputedStyle(viewer).color,
      };
    });
    assert.deepEqual(darkReadability, {
      navigationColor: "rgb(137, 154, 144)",
      viewerBackground: "rgb(74, 85, 80)",
      viewerColor: "rgb(238, 242, 237)",
    });
    await $("#side-nav-studio").click();
    await $("#studio-authoring-surface").waitForDisplayed();
    const darkStudio = await readCurrentPalette();
    await $("#side-nav-atlas").click();
    await $("#atlas-continue-surface").waitForDisplayed();
    const darkAtlas = await readCurrentPalette();

    for (const palette of [lightStudio, lightPaperDesk]) {
      assert.deepEqual(palette, lightAtlas);
    }
    for (const palette of [darkStudio, darkAtlas]) {
      assert.deepEqual(palette, darkPaperDesk);
    }
    assert.notDeepEqual(lightAtlas, darkAtlas);
  });
});
