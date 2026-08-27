/** WebdriverIO configuration for S1 packaged Electron workflow tests. */
import { join } from "node:path";

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
      },
    ],
  ],
  logLevel: "warn",
  mochaOpts: {
    ui: "bdd",
    timeout: 30_000,
  },
};
