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

test("rejects a parameter tag without substantive text", () => {
  const result = runChecker("missing-param-description.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /param.*description|malformed.*TSDoc/i);
});

test("rejects a return tag without substantive text", () => {
  const result = runChecker("missing-return-description.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /returns?.*description|malformed.*TSDoc/i);
});

test("rejects a thrown error without an error-mode tag", () => {
  const result = runChecker("missing-throws-documentation.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /thrown error.*@throws/i);
});

test("rejects malformed inline TSDoc", () => {
  const result = runChecker("malformed-tsdoc.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /malformed TSDoc|not closed/i);
});

test("rejects an unsupported TSDoc tag", () => {
  const result = runChecker("unknown-tsdoc-tag.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /unsupported or malformed TSDoc/i);
});

test("rejects transaction code without an invariant rationale", () => {
  const result = runChecker("missing-transaction-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /transaction.*rationale/i);
});

test("rejects preload bridge code without a boundary rationale", () => {
  const result = runChecker("missing-preload-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /preload.*rationale/i);
});

test("rejects an external-system seam without a translation rationale", () => {
  const result = runChecker("missing-external-system-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /external-system.*rationale/i);
});

test("requires an external Adapter interface to explain its boundary", () => {
  const result = runChecker("missing-external-adapter-documentation.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /external-system seam.*boundary/i);
});

test("does not accept an unrelated distant rationale", () => {
  const result = runChecker("stale-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /assertion.*rationale/i);
});

test("rejects an IPC seam without an explanatory comment", () => {
  const result = runChecker("missing-ipc-rationale.ts");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /IPC.*rationale/i);
});
