import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "src/**/*.d.ts",
        "src/main/**",
        "src/preload/**",
        "src/renderer/**",
      ],
      reporter: ["text", "html", "lcov", "json"],
      reportsDirectory: "./coverage",
      thresholds: {
        // Baseline measured on 2026-08-28 after the TB7 merge: lines 68.64,
        // functions 89.16, branches 61.96, and statements 68.73.
        lines: 68,
        functions: 89,
        branches: 61,
        statements: 68,
        "src/**/*.ts": {
          lines: 38,
          functions: 58,
          branches: 16,
          statements: 38,
          perFile: true,
        },
        "src/**/*.tsx": {
          lines: 38,
          functions: 58,
          branches: 16,
          statements: 38,
          perFile: true,
        },
      },
    },
  },
});
