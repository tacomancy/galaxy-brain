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
    await $("#workbench-theme").selectByAttribute("value", "dark");
    await browser.refresh();
    await $("#workbench-theme").waitForDisplayed();
    assert.equal(await $("#workbench-theme").getValue(), "dark");

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

    const highlightContrast = await browser.execute(() => {
      const highlight = document.querySelector("#studio-rich-highlight");
      if (!(highlight instanceof Element)) {
        return 0;
      }
      const luminance = (value: string): number => {
        const channels = (value.match(/\d+(?:\.\d+)?/g) ?? [])
          .slice(0, 3)
          .map((channel) => Number(channel) / 255)
          .map((channel) =>
            channel <= 0.03928
              ? channel / 12.92
              : ((channel + 0.055) / 1.055) ** 2.4,
          );
        return (
          0.2126 * (channels[0] ?? 0) +
          0.7152 * (channels[1] ?? 0) +
          0.0722 * (channels[2] ?? 0)
        );
      };
      const foreground = luminance(getComputedStyle(highlight).color);
      const background = luminance(getComputedStyle(highlight).backgroundColor);
      return (
        (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05)
      );
    });

    assert.ok(highlightContrast >= 4.5);
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

  it("keeps dark theme contrast and shell controls usable", async () => {
    await $("#workspace-switcher-atlas").click();
    await $("#atlas-continue-surface").waitForDisplayed();

    const atlasContrast = await browser.execute(() => {
      const parseColor = (value: string): [number, number, number] => {
        const channels = value.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
        return [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0];
      };
      const luminance = (value: string): number => {
        const channels = parseColor(value).map((channel) => channel / 255);
        const linear = channels.map((channel) =>
          channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4,
        );
        return (
          0.2126 * (linear[0] ?? 0) +
          0.7152 * (linear[1] ?? 0) +
          0.0722 * (linear[2] ?? 0)
        );
      };
      const contrast = (selector: string, backgroundSelector: string) => {
        const element = document.querySelector(selector);
        const background = document.querySelector(backgroundSelector);
        if (!(element instanceof Element) || !(background instanceof Element)) {
          return 0;
        }
        const foregroundLuminance = luminance(getComputedStyle(element).color);
        const backgroundLuminance = luminance(
          getComputedStyle(background).backgroundColor,
        );
        const lighter = Math.max(foregroundLuminance, backgroundLuminance);
        const darker = Math.min(foregroundLuminance, backgroundLuminance);
        return (lighter + 0.05) / (darker + 0.05);
      };
      const rectangles = [
        document.querySelector(".workspace-header"),
        document.querySelector("#workspace-label"),
        document.querySelector("#appearance-controls"),
        document.querySelector("#workspace-switcher"),
      ].map((element) => {
        if (!(element instanceof HTMLElement)) {
          return undefined;
        }
        const rect = element.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top,
        };
      });
      const [header, label, appearance, switcher] = rectangles;
      const overlaps = (
        first:
          | { bottom: number; left: number; right: number; top: number }
          | undefined,
        second:
          | { bottom: number; left: number; right: number; top: number }
          | undefined,
      ): boolean =>
        first !== undefined &&
        second !== undefined &&
        first.left < second.right &&
        first.right > second.left &&
        first.top < second.bottom &&
        first.bottom > second.top;

      return {
        continueButton: contrast(
          "#atlas-topic-open-studio",
          "#atlas-topic-open-studio",
        ),
        judgmentHeading: contrast(
          "#atlas-needs-judgment-heading",
          "#atlas-needs-judgment",
        ),
        judgmentKicker: contrast(
          "#atlas-needs-judgment .card-kicker",
          "#atlas-needs-judgment",
        ),
        selectedNav: contrast(
          "#workspace-switcher-atlas",
          "#workspace-switcher-atlas",
        ),
        shellControlsOverlap:
          overlaps(label, appearance) ||
          overlaps(label, switcher) ||
          overlaps(appearance, switcher),
        shellControlsBelowHeader:
          header !== undefined &&
          appearance !== undefined &&
          switcher !== undefined &&
          appearance.top >= header.bottom &&
          switcher.top >= header.bottom,
      };
    });

    assert.ok(atlasContrast.continueButton >= 4.5);
    assert.ok(atlasContrast.judgmentHeading >= 4.5);
    assert.ok(atlasContrast.judgmentKicker >= 4.5);
    assert.ok(atlasContrast.selectedNav >= 4.5);
    assert.equal(atlasContrast.shellControlsOverlap, false);
    assert.equal(atlasContrast.shellControlsBelowHeader, true);

    await $("#workspace-switcher-paper-desk").click();
    await $("#paper-desk-reading-surface").waitForDisplayed();
    const paperDeskContrast = await browser.execute(() => {
      const contrast = (
        selector: string,
        backgroundSelector: string,
      ): number => {
        const element = document.querySelector(selector);
        const background = document.querySelector(backgroundSelector);
        if (!(element instanceof Element) || !(background instanceof Element)) {
          return 0;
        }
        const parse = (value: string): number[] =>
          value.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
        const luminance = (value: string): number => {
          const channels = parse(value)
            .slice(0, 3)
            .map((channel) => channel / 255);
          return channels.reduce(
            (total, channel, index) =>
              total +
              [0.2126, 0.7152, 0.0722][index]! *
                (channel <= 0.03928
                  ? channel / 12.92
                  : ((channel + 0.055) / 1.055) ** 2.4),
            0,
          );
        };
        const foreground = luminance(getComputedStyle(element).color);
        const surface = luminance(getComputedStyle(background).backgroundColor);
        return (
          (Math.max(foreground, surface) + 0.05) /
          (Math.min(foreground, surface) + 0.05)
        );
      };

      return {
        sourceRecordHeading: contrast(
          "#paper-desk-source-record-heading",
          ".source-identity-card",
        ),
        workingMaterialHeading: contrast(
          "#paper-desk-annotation-heading",
          ".annotation-card",
        ),
        sourceRecordKicker: contrast(
          ".source-identity-card .card-kicker",
          ".source-identity-card",
        ),
        workingMaterialKicker: contrast(
          ".annotation-card .card-kicker",
          ".annotation-card",
        ),
      };
    });

    assert.ok(paperDeskContrast.sourceRecordHeading >= 4.5);
    assert.ok(paperDeskContrast.workingMaterialHeading >= 4.5);
    assert.ok(paperDeskContrast.sourceRecordKicker >= 4.5);
    assert.ok(paperDeskContrast.workingMaterialKicker >= 4.5);
  });

  it("keeps the critical Studio surface usable at narrow and enlarged scales", async () => {
    await $("#workspace-switcher-studio").click();
    await $("#studio-authoring-surface").waitForDisplayed();

    const puppeteer = await browser.getPuppeteer();
    const [page] = await puppeteer.pages();
    assert.ok(page !== undefined);

    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    try {
      assert.equal(
        await browser.execute(
          () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
        true,
      );

      await $("#workspace-switcher-atlas").click();
      await $("#atlas-continue-surface").waitForDisplayed();
      await $("#workspace-switcher-studio").click();
      await $("#studio-authoring-surface").waitForDisplayed();

      await browser.execute(() => {
        document.body.style.zoom = "2";
      });

      const scaleEvidence = await browser.execute(() => {
        const requiredSelectors = [
          "#studio-heading",
          "#studio-rich-edit",
          "#studio-rich-undo",
          "#workspace-switcher",
          "#appearance-controls",
        ];
        const rectangles = requiredSelectors.map((selector) => {
          const element = document.querySelector(selector);
          if (!(element instanceof HTMLElement)) {
            return undefined;
          }
          const rect = element.getBoundingClientRect();
          return {
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            top: rect.top,
          };
        });
        const visibleRectangles = rectangles.filter(
          (rectangle): rectangle is NonNullable<typeof rectangle> =>
            rectangle !== undefined,
        );
        const overlaps = (
          first: NonNullable<(typeof rectangles)[number]>,
          second: NonNullable<(typeof rectangles)[number]>,
        ): boolean =>
          first.left < second.right &&
          first.right > second.left &&
          first.top < second.bottom &&
          first.bottom > second.top;
        const [heading, edit, undo, switcher, appearance] = rectangles;

        return {
          allRequiredControlsVisible:
            visibleRectangles.length === rectangles.length,
          allRequiredControlsWithinViewport: visibleRectangles.every(
            (rectangle) =>
              rectangle.left >= 0 && rectangle.right <= window.innerWidth,
          ),
          noHorizontalOverflow:
            Math.max(
              document.documentElement.scrollWidth,
              document.body.scrollWidth,
            ) <= window.innerWidth,
          noCriticalOverlap:
            heading !== undefined &&
            edit !== undefined &&
            undo !== undefined &&
            switcher !== undefined &&
            appearance !== undefined &&
            !overlaps(heading, edit) &&
            !overlaps(edit, undo) &&
            !overlaps(switcher, appearance),
        };
      });

      assert.equal(scaleEvidence.allRequiredControlsVisible, true);
      assert.equal(scaleEvidence.allRequiredControlsWithinViewport, true);
      assert.equal(scaleEvidence.noHorizontalOverflow, true);
      assert.equal(scaleEvidence.noCriticalOverlap, true);
    } finally {
      await browser.execute(() => {
        document.body.style.zoom = "";
      });
      await page.emulateMediaFeatures([]);
    }
  });
});
