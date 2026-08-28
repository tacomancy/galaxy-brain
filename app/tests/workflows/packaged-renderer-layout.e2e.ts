/** S1 packaged-app regression test for renderer asset delivery. */
import { strict as assert } from "node:assert";

import { $, browser } from "@wdio/globals";
import "@wdio/electron-service";

describe("Packaged renderer layout", () => {
  it("loads the packaged stylesheet and applies the card layout", async () => {
    await $("#atlas-heading").waitForDisplayed();

    const computed = await browser.execute(() => {
      const body = getComputedStyle(document.body);
      const content = document.querySelector(".workspace-content");
      const card = document.querySelector("#atlas-empty-state");
      const stylesheet = Array.from(document.styleSheets).find((sheet) =>
        sheet.href?.endsWith("/index.css"),
      );
      const contentStyle =
        content === null ? undefined : getComputedStyle(content);
      const cardStyle = card === null ? undefined : getComputedStyle(card);

      return {
        stylesheetHref: stylesheet?.href,
        cssRuleCount: (() => {
          try {
            return stylesheet?.cssRules.length;
          } catch {
            return "unreadable";
          }
        })(),
        bodyBackground: body.backgroundColor,
        contentPadding: contentStyle?.padding,
        cardPadding: cardStyle?.padding,
        cardBorder: cardStyle?.border,
        cardBackground: cardStyle?.backgroundColor,
      };
    });

    assert.match(computed.stylesheetHref ?? "", /\/index\.css$/);
    assert.equal(
      typeof computed.cssRuleCount === "number" && computed.cssRuleCount > 0,
      true,
    );
    assert.equal(computed.bodyBackground, "rgb(247, 244, 236)");
    assert.notEqual(computed.contentPadding, "0px");
    assert.notEqual(computed.cardPadding, "0px");
    assert.notEqual(computed.cardBorder, "0px none rgb(0, 0, 0)");
    assert.notEqual(computed.cardBackground, "rgba(0, 0, 0, 0)");
  });
});
