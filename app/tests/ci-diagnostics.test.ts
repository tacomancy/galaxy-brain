import { strict as assert } from "node:assert";
import { access, readFile, rm, mkdtemp, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, it } from "vitest";

import { saveDesktopFailureScreenshot } from "../wdio.conf";

type CommandResult = {
  exitCode: number | null;
  output: string;
};

const appRoot = resolve(process.cwd());
const repositoryRoot = resolve(appRoot, "..");

const runCommand = (
  command: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<CommandResult> =>
  new Promise((resolveResult, reject) => {
    const child = spawn(command, args, { cwd: appRoot, env });
    let output = "";

    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.once("error", reject);
    child.once("close", (exitCode) => resolveResult({ exitCode, output }));
  });

describe("CI diagnostics failure contracts", () => {
  it("preserves a deliberate command failure and its runner log", async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), "galaxy-brain-ci-diagnostics-"),
    );
    const logPath = join(temporaryDirectory, "runner.log");

    try {
      const result = await runCommand("bash", [
        "tools/run-ci-command.sh",
        logPath,
        "node",
        "-e",
        "console.log('deliberate failure'); process.exit(17)",
      ]);

      assert.equal(result.exitCode, 17);
      assert.match(result.output, /deliberate failure/);
      assert.match(await readFile(logPath, "utf8"), /deliberate failure/);
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it("publishes reports after a deliberate failing coverage run", async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), "galaxy-brain-coverage-diagnostics-"),
    );
    const coverageDirectory = join(temporaryDirectory, "coverage");
    const probePath = join(
      appRoot,
      "tests",
      "ci-diagnostics-failure-probe.test.ts",
    );

    await writeFile(
      probePath,
      [
        'import { it } from "vitest";',
        'import { formatMCDCReport } from "../tools/mcdc";',
        'it("fails deliberately for CI diagnostics", () => {',
        "  void formatMCDCReport;",
        "});",
        "",
      ].join("\n"),
    );

    try {
      await rm(join(appRoot, "test-results/junit.xml"), { force: true });
      const result = await runCommand(
        process.execPath,
        [
          join(appRoot, "node_modules", "vitest", "vitest.mjs"),
          "run",
          "--coverage",
          "--config",
          "vitest.config.ts",
          "tests/ci-diagnostics-failure-probe.test.ts",
          "--coverage.reportsDirectory",
          coverageDirectory,
          "--coverage.thresholds.lines=100",
          "--coverage.thresholds.functions=100",
          "--coverage.thresholds.branches=100",
          "--coverage.thresholds.statements=100",
        ],
        { ...process.env, CI: "true" },
      );

      assert.notEqual(result.exitCode, 0);
      assert.match(result.output, /does not meet global threshold/);
      assert.match(
        await readFile(join(appRoot, "test-results/junit.xml"), "utf8"),
        /<testsuite/,
      );
      await access(join(coverageDirectory, "lcov.info"));
      await access(join(coverageDirectory, "coverage-final.json"));
    } finally {
      await rm(probePath, { force: true });
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it("publishes JUnit after a deliberate failing unit run", async () => {
    const probePath = join(
      appRoot,
      "tests",
      "ci-diagnostics-failure-probe.test.ts",
    );

    await writeFile(
      probePath,
      [
        'import { it } from "vitest";',
        'it("fails deliberately for CI diagnostics", () => {',
        '  throw new Error("deliberate CI diagnostics failure");',
        "});",
        "",
      ].join("\n"),
    );

    try {
      await rm(join(appRoot, "test-results/junit.xml"), { force: true });
      const result = await runCommand(
        process.execPath,
        [
          join(appRoot, "node_modules", "vitest", "vitest.mjs"),
          "run",
          "--config",
          "vitest.config.ts",
          "tests/ci-diagnostics-failure-probe.test.ts",
        ],
        { ...process.env, CI: "true" },
      );

      assert.notEqual(result.exitCode, 0);
      assert.match(result.output, /deliberate CI diagnostics failure/);
      assert.match(
        await readFile(join(appRoot, "test-results/junit.xml"), "utf8"),
        /failure/,
      );
    } finally {
      await rm(probePath, { force: true });
    }
  });

  it("captures a screenshot for a deliberate desktop test failure", async () => {
    const temporaryDirectory = await mkdtemp(
      join(tmpdir(), "galaxy-brain-desktop-diagnostics-"),
    );
    const screenshotPath = join(temporaryDirectory, "failed-test.png");

    try {
      await saveDesktopFailureScreenshot(async (path) => {
        await writeFile(path, "synthetic screenshot artifact");
      }, screenshotPath);
      assert.equal(
        await readFile(screenshotPath, "utf8"),
        "synthetic screenshot artifact",
      );
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  });

  it("keeps failure diagnostics scheduled after validation and coverage failures", async () => {
    const ciWorkflow = await readFile(
      join(repositoryRoot, ".github/workflows/ci.yml"),
      "utf8",
    );
    const coverageWorkflow = await readFile(
      join(repositoryRoot, ".github/workflows/coverage.yml"),
      "utf8",
    );
    const wdioConfig = await readFile(join(appRoot, "wdio.conf.ts"), "utf8");

    assert.match(ciWorkflow, /tools\/run-ci-command\.sh[\s\S]*npm run check/);
    assert.match(
      ciWorkflow,
      /Generate validation coverage diagnostics\n\s+if: always\(\)/,
    );
    for (const artifact of [
      "app/test-results/junit.xml",
      "app/coverage/lcov.info",
      "app/coverage/coverage-final.json",
    ]) {
      assert.match(ciWorkflow, new RegExp(artifact.replaceAll(".", "\\.")));
    }
    assert.match(
      coverageWorkflow,
      /Enforce changed-lines coverage\n\s+if: always\(\)/,
    );
    assert.match(
      coverageWorkflow,
      /tools\/run-ci-command\.sh[\s\S]*npm run test:coverage/,
    );
    assert.match(wdioConfig, /afterTest:[\s\S]*browser\.saveScreenshot/);
    assert.match(ciWorkflow, /desktop-workflow-diagnostics/);
  });
});
