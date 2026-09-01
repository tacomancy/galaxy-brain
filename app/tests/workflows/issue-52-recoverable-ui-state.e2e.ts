/** S1 recovery workflows for Issue #52's packaged Workbench boundary. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $, browser } from "@wdio/globals";
import "@wdio/electron-service";

const failure = process.env.GALAXY_BRAIN_WDIO_FAILURE;

const waitForAtlas = async (): Promise<void> => {
  await $("#atlas-heading").waitForDisplayed();
};

describe("Issue 52 recoverable Workbench failures", () => {
  const temporaryRoots: string[] = [];

  after(async () => {
    await Promise.all(
      temporaryRoots.map((root) => rm(root, { recursive: true, force: true })),
    );
  });

  if (failure === "bootstrap") {
    it("renders a keyboard-operable startup recovery and retries bootstrap", async () => {
      const recovery = await $("#workbench-startup-failure");

      await recovery.waitForDisplayed();
      assert.equal(
        await recovery.getAttribute("data-workbench-outcome"),
        "startup-failed",
      );
      assert.equal(
        await $("#workbench-startup-failure-heading").getText(),
        "Galaxy Brain couldn't start",
      );

      const retry = await $("#retry-workbench-bootstrap");
      assert.equal(await retry.getText(), "Retry loading Workbench");
      await browser.execute(() => {
        document.getElementById("retry-workbench-bootstrap")?.focus();
      });
      assert.equal(
        await browser.execute(() => document.activeElement?.id),
        "retry-workbench-bootstrap",
      );
      await browser.keys("Enter");
      await waitForAtlas();
      assert.equal(await $("#workbench-startup-failure").isExisting(), false);
    });
  }

  if (failure === "synthesis-results-read") {
    it("keeps Workbench visible when the initial results read rejects", async () => {
      await waitForAtlas();
      const recovery = await $("#bridge-operation-failed");
      await recovery.waitForDisplayed();
      assert.equal(await $("#atlas-empty-state").isExisting(), true);
      assert.doesNotMatch(
        await recovery.getText(),
        /Injected|Error|exception/i,
      );
      await $("#retry-bridge-operation").click();
      await waitForAtlas();
      assert.equal(await $("#bridge-operation-failed").isExisting(), false);
    });
  }

  if (failure === "repository-open") {
    it("keeps the empty Atlas state and retries a failed repository open", async () => {
      const root = await realpath(
        await mkdtemp(join(tmpdir(), "galaxy-brain-issue-52-")),
      );
      temporaryRoots.push(root);
      const repositoryPath = join(root, "repository");
      await cp(
        join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
        repositoryPath,
        { recursive: true },
      );
      const dialog = await browser.electron.mock("dialog", "showOpenDialog");
      await dialog.mockResolvedValueOnce({
        canceled: false,
        filePaths: [repositoryPath],
      });

      await $("#open-repository").click();
      const recovery = await $("#bridge-operation-failed");
      await recovery.waitForDisplayed();
      assert.equal(
        await recovery.getAttribute("data-workbench-outcome"),
        "bridge-operation-failed",
      );
      assert.doesNotMatch(
        await recovery.getText(),
        /Injected|Error|exception/i,
      );
      assert.equal(await $("#atlas-empty-state").isExisting(), true);
      await $("#retry-bridge-operation").click();
      await $("#repository-status-heading").waitForDisplayed();
    });
  }

  if (failure === "workspace-transition") {
    it("preserves Atlas after a failed transition and retries the same destination", async () => {
      const root = await realpath(
        await mkdtemp(join(tmpdir(), "galaxy-brain-issue-52-")),
      );
      temporaryRoots.push(root);
      const repositoryPath = join(root, "repository");
      await cp(
        join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
        repositoryPath,
        { recursive: true },
      );
      const dialog = await browser.electron.mock("dialog", "showOpenDialog");
      await dialog.mockResolvedValue({
        canceled: false,
        filePaths: [repositoryPath],
      });

      await $("#open-repository").click();
      await $("#repository-status-heading").waitForDisplayed();
      await $("#atlas-topic-open-studio").click();
      await $("#bridge-operation-failed").waitForDisplayed();
      assert.equal(await $("#atlas-heading").isExisting(), true);
      await $("#retry-bridge-operation").click();
      await $("#studio-heading").waitForDisplayed();
    });
  }

  if (failure === "discovery-jump-transition") {
    it("retries a failed Discovery transition without repeating the Jump", async () => {
      const root = await realpath(
        await mkdtemp(join(tmpdir(), "galaxy-brain-issue-52-")),
      );
      temporaryRoots.push(root);
      const repositoryPath = join(root, "repository");
      await cp(
        join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
        repositoryPath,
        { recursive: true },
      );
      const dialog = await browser.electron.mock("dialog", "showOpenDialog");
      await dialog.mockResolvedValue({
        canceled: false,
        filePaths: [repositoryPath],
      });

      await $("#open-repository").click();
      await $("#discovery-surface").waitForDisplayed();
      await $("#discovery-mode-jump").click();
      await $("#discovery-input").setValue("Studio");
      await $("#discovery-submit").click();
      await $("#bridge-operation-failed").waitForDisplayed();
      assert.equal(await $("#atlas-heading").isExisting(), true);
      await $("#retry-bridge-operation").click();
      await $("#studio-heading").waitForDisplayed();
    });
  }
});
