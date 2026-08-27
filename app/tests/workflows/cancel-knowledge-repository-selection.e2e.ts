/** S1 behavior test for canceling repository selection. */
import { strict as assert } from "node:assert";

import { $, browser } from "@wdio/globals";
import "@wdio/electron-service";

describe("Cancel Knowledge Repository selection", () => {
  it("leaves a fresh Workbench unchanged", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");
    await dialog.mockResolvedValue({ canceled: true, filePaths: [] });

    await $("#open-repository").click();

    assert.equal(await $("#atlas-empty-state").isExisting(), true);
    assert.equal(await $("#repository-status").isExisting(), false);
    assert.equal(await $("#repository-error").isExisting(), false);
  });
});
