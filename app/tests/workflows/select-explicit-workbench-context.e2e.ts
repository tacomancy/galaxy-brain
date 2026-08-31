/** S1 behavior test for explicit context selection and relaunch resume. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Select an explicit Workbench context", () => {
  let temporaryRoot: string;
  let repositoryPath: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-context-"));
    repositoryPath = join(temporaryRoot, "ambiguous-repository");
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );
    await writeFile(
      join(repositoryPath, "knowledge", "zeta-topic.md"),
      `---
id: zeta-topic
title: Zeta topic
type: topic
source_record: sources/papers/zeta-source.md
---
`,
      "utf8",
    );
    await writeFile(
      join(repositoryPath, "sources", "papers", "zeta-source.md"),
      `---
id: zeta-source
title: Zeta source
type: source
---
`,
      "utf8",
    );
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("requires a choice, carries it into the Workbench, and restores it", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
    });

    await $("#open-repository").click();

    const selection = await $("#atlas-context-selection");
    await selection.waitForDisplayed();
    assert.equal(
      await $("#atlas-context-selection-heading").getText(),
      "Select a Workbench context",
    );
    assert.equal(
      await $("#atlas-context-option-bayesian-statistics").isDisplayed(),
      true,
    );
    assert.equal(
      await $("#atlas-context-option-zeta-topic").isDisplayed(),
      true,
    );
    assert.equal(await $("#atlas-continue-surface").isExisting(), false);

    const selectContext = await $("#atlas-context-select-bayesian-statistics");
    assert.equal(await selectContext.getText(), "Use this context");
    await selectContext.click();

    await $("#atlas-continue-surface").waitForDisplayed();
    assert.equal(
      await $("#atlas-topic-title").getText(),
      "Bayesian statistics",
    );
    assert.equal(await $("#atlas-context-selection").isExisting(), false);
    await browser.waitUntil(async () => {
      return (
        (await browser.execute(() => document.activeElement?.id)) ===
        "atlas-topic-open-studio"
      );
    });

    await browser.reloadSession();

    await $("#atlas-continue-surface").waitForDisplayed();
    assert.equal(
      await $("#atlas-topic-title").getText(),
      "Bayesian statistics",
    );
    assert.equal(
      await $("#atlas-topic-source-record-title").getText(),
      "Bayesian statistics fixture source",
    );
  });
});
