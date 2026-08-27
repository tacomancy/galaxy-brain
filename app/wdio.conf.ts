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
