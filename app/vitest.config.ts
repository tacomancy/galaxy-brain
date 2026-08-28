import { createCoverageConfig } from "./vitest.coverage-config";

export default createCoverageConfig({
  // Baseline measured on 2026-08-28 after the TB7 merge: lines 68.64,
  // functions 89.16, branches 61.96, and statements 68.73.
  lines: 68,
  functions: 89,
  branches: 61,
  statements: 68,
});
