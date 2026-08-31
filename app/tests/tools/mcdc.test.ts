import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import {
  evaluateMCDC,
  formatMCDCReport,
  type MCDCManifest,
} from "../../tools/mcdc";

const validManifest: MCDCManifest = {
  version: 1,
  decisions: [
    {
      id: "decision.test",
      owner: "test",
      description: "test decision",
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
});
