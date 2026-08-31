/** WebdriverIO configuration for S1 packaged Electron workflow tests. */
import { join } from "node:path";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

import { browser } from "@wdio/globals";
import type { Capabilities, Options } from "@wdio/types";

const packagedBinary = join(
  process.cwd(),
  "out",
  `Galaxy Brain-${process.platform}-${process.arch}`,
  "Galaxy Brain.app",
  "Contents",
  "MacOS",
  "Galaxy Brain",
);

// Keep isolated session-state files for each workflow worker so a reload
// exercises persistence while parallel specs remain independent.
const testSessionStateRoot = mkdtempSync(join(tmpdir(), "galaxy-brain-wdio-"));
const sessionStateArgumentPrefix = "--galaxy-brain-session-state=";
const silentTestModeArgument = "--galaxy-brain-test-mode=silent";
const desktopArtifactDirectory =
  process.env.GALAXY_BRAIN_WDIO_ARTIFACT_DIR ??
  mkdtempSync(join(tmpdir(), "galaxy-brain-wdio-artifacts-"));
const screenshotDirectory = join(desktopArtifactDirectory, "screenshots");

mkdirSync(screenshotDirectory, { recursive: true });

const safeScreenshotName = (parent: string, title: string) => {
  const name = `${parent}-${title}`
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return name.length > 0 ? name : "failed-test";
};

/** Captures a failed desktop test without masking the original test failure. */
export async function saveDesktopFailureScreenshot(
  saveScreenshot: (path: string) => Promise<void>,
  screenshotPath: string,
  warn: (message: string) => void = console.warn,
): Promise<void> {
  try {
    await saveScreenshot(screenshotPath);
  } catch (error) {
    warn(`Unable to save desktop failure screenshot: ${String(error)}`);
  }
}

// S1 launches the unsigned macOS package produced by Electron Forge so the
// test covers packaging, preload loading, and the real desktop composition.
export const config: Options.Testrunner &
  Capabilities.WithRequestedTestrunnerCapabilities = {
  runner: "local",
  specs: ["./tests/workflows/**/*.e2e.ts"],
  maxInstances: 1,
  capabilities: [
    {
      browserName: "electron",
    },
  ],
  framework: "mocha",
  services: [
    [
      "electron",
      {
        appBinaryPath: packagedBinary,
        appArgs: [
          silentTestModeArgument,
          `${sessionStateArgumentPrefix}${join(
            testSessionStateRoot,
            "workbench-session.json",
          )}`,
        ],
      },
    ],
  ],
  outputDir: desktopArtifactDirectory,
  logLevel: "warn",
  beforeSession: (_config, capabilities, _specs, cid) => {
    const workerSessionStatePath = join(
      testSessionStateRoot,
      `workbench-session-${cid}.json`,
    );

    rmSync(workerSessionStatePath, { force: true });

    // WDIO's requested capability type omits the Electron service's converted
    // Chrome options, so this assertion is limited to the field we mutate.
    const chromeOptions = (
      capabilities as Capabilities.W3CCapabilities & {
        "goog:chromeOptions"?: { args?: string[] };
      }
    )["goog:chromeOptions"];
    if (chromeOptions !== undefined) {
      chromeOptions.args = (chromeOptions.args ?? []).map((argument) =>
        argument.startsWith(sessionStateArgumentPrefix)
          ? `${sessionStateArgumentPrefix}${workerSessionStatePath}`
          : argument,
      );
    }
  },
  afterTest: async (test, _context, result) => {
    if (result.passed) {
      return;
    }

    await saveDesktopFailureScreenshot(
      async (path) => {
        await browser.saveScreenshot(path);
      },
      join(
        screenshotDirectory,
        `${safeScreenshotName(test.parent, test.title)}.png`,
      ),
    );
  },
  onComplete: () => {
    rmSync(testSessionStateRoot, { recursive: true, force: true });
  },
  mochaOpts: {
    ui: "bdd",
    timeout: 30_000,
  },
};
