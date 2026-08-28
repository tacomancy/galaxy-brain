import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const checker = join(scriptsDirectory, "check-documentation.mjs");
const fixturesDirectory = join(scriptsDirectory, "fixtures", "documentation");

const runChecker = (fixture) =>
  spawnSync(process.execPath, [checker, join(fixturesDirectory, fixture)], {
    encoding: "utf8",
  });

test("accepts documented public APIs and justified risk boundaries", () => {
  const result = runChecker("valid.ts");

  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test("rejects an undocumented exported API", () => {
  const result = runChecker("missing-public-api.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing documentation/i);
});

test("rejects an unsafe assertion without rationale", () => {
  const result = runChecker("missing-assertion-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /assertion.*rationale/i);
});

test("rejects an any escape without rationale", () => {
  const result = runChecker("missing-any-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /any.*rationale/i);
});

test("rejects a lint disable without rationale", () => {
  const result = runChecker("missing-disable-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /eslint-disable.*rationale/i);
});

test("rejects a complexity exception without rationale", () => {
  const result = runChecker("missing-complexity-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /eslint-disable.*rationale/i);
});

test("rejects a TODO without an owner or follow-up issue", () => {
  const result = runChecker("missing-todo-follow-up.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /TODO.*owner|TODO.*issue/i);
});

test("rejects a filesystem seam without an explanatory comment", () => {
  const result = runChecker("missing-filesystem-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /filesystem.*rationale/i);
});

test("rejects an IPC seam without an explanatory comment", () => {
  const result = runChecker("missing-ipc-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /IPC.*rationale/i);
});
