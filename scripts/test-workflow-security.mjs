import assert from "node:assert/strict";
import test from "node:test";

import { findWorkflowSecurityIssues } from "./check-workflow-security.mjs";

test("accepts immutable external actions and local composite actions", () => {
  const content = [
    "      uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
    "      uses: ./.github/actions/setup-node",
  ].join("\n");

  assert.deepEqual(findWorkflowSecurityIssues("fixture.yml", content), []);
});

test("rejects mutable action references", () => {
  const issues = findWorkflowSecurityIssues(
    "fixture.yml",
    "      uses: actions/checkout@v7",
  );

  assert.deepEqual(issues, [
    "fixture.yml:1: external action 'actions/checkout@v7' must use a full 40-character commit SHA",
    "fixture.yml:1: immutable action 'actions/checkout@v7' must retain an inline upstream version comment",
  ]);
});

test("requires a release comment on SHA-pinned actions", () => {
  const issues = findWorkflowSecurityIssues(
    "fixture.yml",
    "      uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  );

  assert.deepEqual(issues, [
    "fixture.yml:1: immutable action 'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1' must retain an inline upstream version comment",
  ]);
});
