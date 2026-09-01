import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import {
  evaluateMCDC,
  formatMCDCReport,
  findChangedDecisionIds,
  type MCDCManifest,
} from "../../tools/mcdc";
import { readChangedFiles } from "../../tools/mcdc-git";
import { findMissingImplementationFiles } from "../../tools/mcdc-files";

const validManifest: MCDCManifest = {
  version: 2,
  decisions: [
    {
      id: "decision.test",
      owner: "test",
      description: "test decision",
      implementationFiles: ["src/test-decision.ts"],
      conditions: ["first", "second"],
      cases: [
        { id: "all", conditions: [true, true], outcome: true },
        { id: "first-false", conditions: [false, true], outcome: false },
        { id: "second-false", conditions: [true, false], outcome: false },
      ],
      witnesses: [
        { conditionIndex: 0, falseCaseId: "first-false", trueCaseId: "all" },
        { conditionIndex: 1, falseCaseId: "second-false", trueCaseId: "all" },
      ],
    },
  ],
};
const validDecision = validManifest.decisions[0];

if (validDecision === undefined) {
  throw new Error("The MC/DC test fixture must define a decision.");
}
const validSecondWitness = validDecision.witnesses[1];

if (validSecondWitness === undefined) {
  throw new Error("The MC/DC test fixture must define two witnesses.");
}

describe("MC/DC evaluator", () => {
  it("reports condition, decision, and MC/DC coverage independently", () => {
    const result = evaluateMCDC(validManifest);

    assert.deepEqual(result, {
      conditionCoverage: true,
      decisionCoverage: true,
      mcdcCoverage: true,
      decisions: [
        {
          decisionId: "decision.test",
          conditionCoverage: true,
          decisionCoverage: true,
          mcdcCoverage: true,
          errors: [],
        },
      ],
    });
  });

  it("rejects a witness whose pair changes more than one condition", () => {
    const invalidManifest: MCDCManifest = {
      ...validManifest,
      decisions: [
        {
          ...validDecision,
          witnesses: [
            {
              conditionIndex: 0,
              falseCaseId: "second-false",
              trueCaseId: "all",
            },
            validSecondWitness,
          ],
        },
      ],
    };

    const result = evaluateMCDC(invalidManifest);

    assert.equal(result.conditionCoverage, true);
    assert.equal(result.decisionCoverage, true);
    assert.equal(result.mcdcCoverage, false);
    assert.match(formatMCDCReport(result), /independent outcome pair/);
  });

  it("rejects a decision without both outcomes", () => {
    const invalidManifest: MCDCManifest = {
      ...validManifest,
      decisions: [
        {
          ...validDecision,
          cases: validDecision.cases.map((testCase) => ({
            ...testCase,
            outcome: true,
          })),
        },
      ],
    };

    const result = evaluateMCDC(invalidManifest);

    assert.equal(result.conditionCoverage, true);
    assert.equal(result.decisionCoverage, false);
    assert.equal(result.mcdcCoverage, false);
    assert.match(formatMCDCReport(result), /Decision coverage: FAIL/);
  });

  it("rejects a decision without an implementation mapping", () => {
    const invalidManifest: MCDCManifest = {
      ...validManifest,
      decisions: [{ ...validDecision, implementationFiles: [] }],
    };

    const result = evaluateMCDC(invalidManifest);

    assert.equal(result.mcdcCoverage, false);
    assert.match(
      formatMCDCReport(result),
      /At least one implementation file must be registered/,
    );
  });

  it("rejects an empty implementation path", () => {
    const invalidManifest: MCDCManifest = {
      ...validManifest,
      decisions: [{ ...validDecision, implementationFiles: [""] }],
    };

    const result = evaluateMCDC(invalidManifest);

    assert.equal(result.mcdcCoverage, false);
    assert.match(
      formatMCDCReport(result),
      /Implementation file paths must not be empty/,
    );
  });

  it("rejects an implementation path outside the app package", () => {
    const invalidManifest: MCDCManifest = {
      ...validManifest,
      decisions: [
        {
          ...validDecision,
          implementationFiles: ["/tmp/not-an-app-file", "../outside.ts"],
        },
      ],
    };

    const result = evaluateMCDC(invalidManifest);

    assert.equal(result.mcdcCoverage, false);
    assert.match(
      formatMCDCReport(result),
      /Implementation file paths must be app-relative/,
    );
  });

  it("identifies registered decisions whose implementation files changed", () => {
    assert.deepEqual(
      findChangedDecisionIds(validManifest, ["src/test-decision.ts"]),
      ["decision.test"],
    );
  });

  it("does not select decisions for unrelated changes", () => {
    assert.deepEqual(
      findChangedDecisionIds(validManifest, ["src/unrelated.ts"]),
      [],
    );
  });

  it("normalizes repository-relative implementation paths", () => {
    assert.deepEqual(
      findChangedDecisionIds(validManifest, ["app/src/test-decision.ts"]),
      ["decision.test"],
    );
  });

  it("reviews every current decision when the manifest changes", () => {
    assert.deepEqual(
      findChangedDecisionIds(validManifest, ["app/tools/mcdc-decisions.json"]),
      ["decision.test"],
    );
  });

  it("reads changed files through the operation-specific Git seam", async () => {
    const changedFiles = await readChangedFiles(
      "origin/main",
      async (baseRef) => {
        assert.equal(baseRef, "origin/main");
        return "app/src/changed.ts\n\n docs/changed.md\n";
      },
    );

    assert.deepEqual(changedFiles, ["app/src/changed.ts", "docs/changed.md"]);
  });

  it("rejects a manifest mapping to a missing implementation file", async () => {
    const missingFiles = await findMissingImplementationFiles(
      validManifest,
      async (path) => path !== "src/test-decision.ts",
    );

    assert.deepEqual(missingFiles, ["decision.test: src/test-decision.ts"]);
  });

  it("preserves non-missing filesystem failures", async () => {
    await assert.rejects(
      findMissingImplementationFiles(validManifest, async () => {
        throw Object.assign(new Error("permission denied"), {
          code: "EACCES",
        });
      }),
      /permission denied/,
    );
  });
});
