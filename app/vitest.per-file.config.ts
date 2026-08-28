import { createCoverageConfig } from "./vitest.coverage-config";

export default createCoverageConfig({
  // These are the lowest measured file floors from the baseline and will
  // ratchet upward with coverage.
  lines: 38,
  functions: 58,
  branches: 16,
  statements: 38,
  perFile: true,
});
