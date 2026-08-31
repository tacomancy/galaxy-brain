import { defineConfig } from "vitest/config";

const coverageOptions = {
  provider: "v8" as const,
  include: ["src/**/*.ts", "src/**/*.tsx", "tools/mcdc.ts"],
  exclude: [
    "src/**/*.d.ts",
    "src/main/**",
    "src/preload/**",
    "src/renderer/**",
  ],
  reporter: ["text", "html", "lcov", "json"],
  reportsDirectory: "./coverage",
};

export const createCoverageConfig = (thresholds: {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
  perFile?: boolean;
}) =>
  defineConfig({
    test: {
      coverage: {
        ...coverageOptions,
        thresholds,
      },
    },
  });
