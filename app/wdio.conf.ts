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

// Keep an isolated session-state file for each workflow run so a reload
// exercises persistence while separate specs remain independent.
const testSessionStateRoot = mkdtempSync(join(tmpdir(), "galaxy-brain-wdio-"));
const testSessionStatePath = join(
  testSessionStateRoot,
  "workbench-session.json",
);

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
        appArgs: [`--galaxy-brain-session-state=${testSessionStatePath}`],
      },
    ],
  ],
  logLevel: "warn",
  beforeSession: () => {
    rmSync(testSessionStatePath, { force: true });
  },
  onComplete: () => {
    rmSync(testSessionStateRoot, { recursive: true, force: true });
  },
  mochaOpts: {
    ui: "bdd",
    timeout: 30_000,
  },
};
