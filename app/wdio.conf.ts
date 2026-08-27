/** WebdriverIO configuration for S1 packaged Electron workflow tests. */
import { join } from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

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
          `${sessionStateArgumentPrefix}${join(
            testSessionStateRoot,
            "workbench-session.json",
          )}`,
        ],
      },
    ],
  ],
  logLevel: "warn",
  beforeSession: (_config, capabilities, _specs, cid) => {
    const workerSessionStatePath = join(
      testSessionStateRoot,
      `workbench-session-${cid}.json`,
    );

    rmSync(workerSessionStatePath, { force: true });

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
  onComplete: () => {
    rmSync(testSessionStateRoot, { recursive: true, force: true });
  },
  mochaOpts: {
    ui: "bdd",
    timeout: 30_000,
  },
};
