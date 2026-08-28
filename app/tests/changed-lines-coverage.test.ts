import { strict as assert } from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it } from "vitest";

import {
  evaluateChangedLinesCoverage,
  formatChangedLinesCoverageSummary,
  normalizeLcovPath,
  parseUnifiedDiff,
  parseLcov,
  runChangedLinesCoverage,
} from "../tools/changed-lines-coverage";

describe("Changed-lines coverage", () => {
  it("runs the checker through Git and emits a passing summary", async () => {
    const repositoryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-coverage-"),
    );
    const lcovPath = join(repositoryRoot, "lcov.info");
    const gitArguments: string[][] = [];
    const summaries: string[] = [];

    await writeFile(
      lcovPath,
      [
        "TN:",
        "SF:src/example.ts",
        "DA:10,1",
        "DA:11,1",
        "DA:12,1",
        "DA:13,1",
        "DA:14,0",
        "end_of_record",
      ].join("\n") + "\n",
    );

    try {
      const outcome = await runChangedLinesCoverage(
        {
          lcovPath,
          baseRef: "origin/main",
          headRef: "HEAD",
          repositoryRoot,
          coverageRoot: repositoryRoot,
        },
        {
          runGit: async (args) => {
            gitArguments.push([...args]);
            if (args[0] === "merge-base") {
              return { stdout: "abc1234\n", stderr: "" };
            }
            return {
              stdout: [
                "diff --git a/src/example.ts b/src/example.ts",
                "--- a/src/example.ts",
                "+++ b/src/example.ts",
                "@@ -10,0 +10,5 @@",
                "+one",
                "+two",
                "+three",
                "+four",
                "+five",
              ].join("\n"),
              stderr: "",
            };
          },
          writeSummary: async (summary) => {
            summaries.push(summary);
          },
        },
      );

      assert.deepEqual(gitArguments, [
        ["merge-base", "origin/main", "HEAD"],
        [
          "diff",
          "--unified=0",
          "--no-color",
          "--find-renames",
          "--no-ext-diff",
          "abc1234",
          "HEAD",
          "--",
        ],
      ]);
      assert.equal(outcome.outcome, "checked");
      if (outcome.outcome === "checked") {
        assert.equal(outcome.result.status, "pass");
        assert.equal(outcome.result.coveragePercent, 80);
      }
      assert.equal(summaries.length, 1);
      assert.match(summaries[0] ?? "", /Status: PASS/);
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it("normalizes relative, repository-relative, absolute, and file URL paths", () => {
    const options = {
      repositoryRoot: "/workspace/galaxy-brain",
      coverageRoot: "/workspace/galaxy-brain/app",
    };

    assert.equal(
      normalizeLcovPath("src/example.ts", options),
      "app/src/example.ts",
    );
    assert.equal(
      normalizeLcovPath("app/src/example.ts", options),
      "app/src/example.ts",
    );
    assert.equal(
      normalizeLcovPath("/workspace/galaxy-brain/app/src/example.ts", options),
      "app/src/example.ts",
    );
    assert.equal(
      normalizeLcovPath(
        "file:///workspace/galaxy-brain/app/src/example%20file.ts",
        options,
      ),
      "app/src/example file.ts",
    );
    assert.throws(
      () => normalizeLcovPath("../../outside.ts", options),
      /escapes repository root/,
    );
    assert.throws(
      () =>
        normalizeLcovPath("src/example.ts", {
          ...options,
          coverageRoot: "/workspace/outside",
        }),
      /coverage root escapes repository root/,
    );
  });

  it("reports an unavailable merge base as infrastructure failure", async () => {
    const summaries: string[] = [];
    const outcome = await runChangedLinesCoverage(
      {
        lcovPath: "/tmp/unused-lcov.info",
        baseRef: "origin/main",
        headRef: "HEAD",
        repositoryRoot: "/workspace/galaxy-brain",
        coverageRoot: "/workspace/galaxy-brain/app",
      },
      {
        runGit: async () => {
          throw new Error("fatal: Not a valid object name origin/main");
        },
        writeSummary: async (summary) => {
          summaries.push(summary);
        },
      },
    );

    assert.deepEqual(outcome, {
      outcome: "infrastructure-error",
      detail: "fatal: Not a valid object name origin/main",
      summary: [
        "## Changed-lines coverage",
        "",
        "- Status: ERROR",
        "- Base ref: origin/main",
        "- Head ref: HEAD",
        "- Merge base: unavailable",
        "- Detail: fatal: Not a valid object name origin/main",
        "",
      ].join("\n"),
    });
    assert.deepEqual(summaries, [outcome.summary]);
  });

  it("collects added lines from zero-context diff hunks", () => {
    const result = parseUnifiedDiff(
      [
        "diff --git a/src/example.ts b/src/example.ts",
        "index 1111111..2222222 100644",
        "--- a/src/example.ts",
        "+++ b/src/example.ts",
        "@@ -10,2 +10,3 @@ export function example() {",
        " old line",
        "-removed line",
        "+added line",
        "+another added line",
        "diff --git a/src/new.ts b/src/new.ts",
        "new file mode 100644",
        "--- /dev/null",
        "+++ b/src/new.ts",
        "@@ -0,0 +1,2 @@",
        "+first line",
        "+second line",
        "diff --git a/src/deleted.ts b/src/deleted.ts",
        "deleted file mode 100644",
        "--- a/src/deleted.ts",
        "+++ /dev/null",
        "@@ -1,2 +0,0 @@",
        "-one",
        "-two",
        "diff --git a/src/old.ts b/src/new-name.ts",
        "similarity index 100%",
        "rename from src/old.ts",
        "rename to src/new-name.ts",
        "diff --git a/assets/image.png b/assets/image.png",
        "new file mode 100644",
        "Binary files /dev/null and b/assets/image.png differ",
        "diff --git a/src/example file.ts b/src/example file.ts",
        '--- "a/src/example file.ts"',
        '+++ "b/src/example file.ts"',
        "@@ -1,0 +1,1 @@",
        "+quoted path",
        "diff --git a/src/cafe.ts b/src/cafe.ts",
        '--- "a/src/cafe.ts"',
        '+++ "b/src/caf\\303\\251.ts"',
        "@@ -1,0 +1,1 @@",
        "+quoted UTF-8 path",
      ].join("\n") + "\n",
    );

    assert.deepEqual(
      [...result],
      [
        ["src/example.ts", new Set([11, 12])],
        ["src/new.ts", new Set([1, 2])],
        ["src/example file.ts", new Set([1])],
        ["src/café.ts", new Set([1])],
      ],
    );
  });

  it("parses LCOV line records and merges repeated file sections", () => {
    const result = parseLcov(
      [
        "TN:",
        "SF:src/example.ts",
        "DA:10,0,checksum-a",
        "DA:11,0",
        "end_of_record",
        "TN:",
        "SF:src/example.ts",
        "DA:10,1,checksum-b",
        "DA:12,2",
        "end_of_record",
      ].join("\n"),
    );

    assert.deepEqual(
      [...result],
      [
        [
          "src/example.ts",
          new Map([
            [10, 1],
            [11, 0],
            [12, 2],
          ]),
        ],
      ],
    );
  });

  it("rejects malformed LCOV line records", () => {
    assert.throws(
      () =>
        parseLcov(
          ["SF:src/example.ts", "DA:zero,1", "end_of_record"].join("\n"),
        ),
      /Malformed LCOV: invalid line record/,
    );
  });

  it("passes when exactly 80 percent of applicable changed lines are covered", () => {
    const result = evaluateChangedLinesCoverage(
      new Map([["src/example.ts", new Set([10, 11, 12, 13, 14])]]),
      new Map([
        [
          "src/example.ts",
          new Map([
            [10, 1],
            [11, 1],
            [12, 1],
            [13, 1],
            [14, 0],
          ]),
        ],
      ]),
    );

    assert.deepEqual(result, {
      status: "pass",
      applicableLines: 5,
      coveredLines: 4,
      coveragePercent: 80,
      thresholdPercent: 80,
      uncoveredLines: ["src/example.ts:14"],
    });
  });

  it("formats a stable summary with sorted uncovered lines", () => {
    const summary = formatChangedLinesCoverageSummary(
      {
        status: "fail",
        applicableLines: 5,
        coveredLines: 3,
        coveragePercent: 60,
        thresholdPercent: 80,
        uncoveredLines: ["src/z.ts:4", "src/a.ts:2"],
      },
      {
        baseRef: "origin/main",
        headRef: "HEAD",
        mergeBase: "abc1234",
      },
    );

    assert.equal(
      summary,
      [
        "## Changed-lines coverage",
        "",
        "- Status: FAIL",
        "- Base ref: origin/main",
        "- Head ref: HEAD",
        "- Merge base: abc1234",
        "- Applicable changed executable lines: 5",
        "- Covered changed executable lines: 3",
        "- Coverage: 60.00%",
        "- Threshold: 80.00%",
        "",
        "Uncovered lines:",
        "",
        "- src/a.ts:2",
        "- src/z.ts:4",
        "",
      ].join("\n"),
    );
  });

  it("fails when changed executable coverage is below the threshold", () => {
    const result = evaluateChangedLinesCoverage(
      new Map([["src/example.ts", new Set([10, 11, 12, 13, 14])]]),
      new Map([
        [
          "src/example.ts",
          new Map([
            [10, 1],
            [11, 1],
            [12, 1],
            [13, 0],
            [14, 0],
          ]),
        ],
      ]),
    );

    assert.deepEqual(result, {
      status: "fail",
      applicableLines: 5,
      coveredLines: 3,
      coveragePercent: 60,
      thresholdPercent: 80,
      uncoveredLines: ["src/example.ts:13", "src/example.ts:14"],
    });
  });

  it("passes as not applicable when no changed lines are represented in LCOV", () => {
    const result = evaluateChangedLinesCoverage(
      new Map([["src/example.ts", new Set([10, 11])]]),
      new Map(),
    );

    assert.deepEqual(result, {
      status: "not-applicable",
      applicableLines: 0,
      coveredLines: 0,
      coveragePercent: null,
      thresholdPercent: 80,
      uncoveredLines: [],
    });
  });
});
