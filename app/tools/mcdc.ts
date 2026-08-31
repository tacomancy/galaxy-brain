export interface MCDCDecisionCase {
  id: string;
  conditions: boolean[];
  outcome: boolean;
}

export interface MCDCWitness {
  conditionIndex: number;
  falseCaseId: string;
  trueCaseId: string;
}

export interface MCDCDecision {
  id: string;
  owner: string;
  description: string;
  conditions: string[];
  cases: MCDCDecisionCase[];
  witnesses: MCDCWitness[];
}

export interface MCDCManifest {
  version: 1;
  decisions: MCDCDecision[];
}

export interface MCDCDecisionResult {
  decisionId: string;
  conditionCoverage: boolean;
  decisionCoverage: boolean;
  mcdcCoverage: boolean;
  errors: string[];
}

export interface MCDCResult {
  conditionCoverage: boolean;
  decisionCoverage: boolean;
  mcdcCoverage: boolean;
  decisions: MCDCDecisionResult[];
}

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const pairDiffersOnlyAt = (
  falseCase: MCDCDecisionCase,
  trueCase: MCDCDecisionCase,
  conditionIndex: number,
): boolean =>
  falseCase.conditions.length === trueCase.conditions.length &&
  falseCase.conditions.every(
    (value, index) =>
      index === conditionIndex || value === trueCase.conditions[index],
  ) &&
  falseCase.conditions[conditionIndex] === false &&
  trueCase.conditions[conditionIndex] === true &&
  falseCase.outcome !== trueCase.outcome;

const evaluateDecision = (decision: MCDCDecision): MCDCDecisionResult => {
  const errors: string[] = [];
  const expectedConditionCount = decision.conditions.length;
  const casesById = new Map<string, MCDCDecisionCase>();

  if (decision.id.length === 0) {
    errors.push("Decision id must not be empty.");
  }
  if (decision.owner.length === 0) {
    errors.push("Decision owner must not be empty.");
  }
  if (decision.description.length === 0) {
    errors.push("Decision description must not be empty.");
  }
  if (expectedConditionCount < 2) {
    errors.push("MC/DC requires at least two atomic conditions.");
  }

  for (const condition of decision.conditions) {
    if (condition.length === 0) {
      errors.push("Condition names must not be empty.");
    }
  }

  for (const testCase of decision.cases) {
    if (testCase.id.length === 0 || casesById.has(testCase.id)) {
      errors.push(`Case id is empty or duplicated: ${testCase.id}.`);
    }
    casesById.set(testCase.id, testCase);

    if (
      testCase.conditions.length !== expectedConditionCount ||
      !testCase.conditions.every(isBoolean) ||
      !isBoolean(testCase.outcome)
    ) {
      errors.push(
        `Case ${testCase.id} does not match the decision condition shape.`,
      );
    }
  }

  const conditionCoverage = decision.conditions.every(
    (_, conditionIndex) =>
      decision.cases.some((testCase) => testCase.conditions[conditionIndex]) &&
      decision.cases.some((testCase) => !testCase.conditions[conditionIndex]),
  );
  if (!conditionCoverage) {
    errors.push("Every condition must be observed as true and false.");
  }

  const decisionCoverage =
    decision.cases.some((testCase) => testCase.outcome) &&
    decision.cases.some((testCase) => !testCase.outcome);
  if (!decisionCoverage) {
    errors.push("The decision must be observed as true and false.");
  }

  const witnessedConditions = new Set<number>();
  for (const witness of decision.witnesses) {
    const falseCase = casesById.get(witness.falseCaseId);
    const trueCase = casesById.get(witness.trueCaseId);

    if (
      falseCase === undefined ||
      trueCase === undefined ||
      !Number.isInteger(witness.conditionIndex) ||
      witness.conditionIndex < 0 ||
      witness.conditionIndex >= expectedConditionCount ||
      !pairDiffersOnlyAt(falseCase, trueCase, witness.conditionIndex)
    ) {
      errors.push(
        `Witness for condition ${witness.conditionIndex} is not an independent outcome pair.`,
      );
      continue;
    }

    witnessedConditions.add(witness.conditionIndex);
  }

  if (witnessedConditions.size !== expectedConditionCount) {
    errors.push("Every condition must have an independent outcome witness.");
  }

  return {
    decisionId: decision.id,
    conditionCoverage,
    decisionCoverage,
    mcdcCoverage: errors.length === 0,
    errors,
  };
};

export const evaluateMCDC = (manifest: MCDCManifest): MCDCResult => {
  const decisions = manifest.decisions.map(evaluateDecision);

  return {
    conditionCoverage:
      decisions.length > 0 &&
      decisions.every((result) => result.conditionCoverage),
    decisionCoverage:
      decisions.length > 0 &&
      decisions.every((result) => result.decisionCoverage),
    mcdcCoverage:
      decisions.length > 0 && decisions.every((result) => result.mcdcCoverage),
    decisions,
  };
};

export const formatMCDCReport = (result: MCDCResult): string => {
  const lines = [
    `Condition coverage: ${result.conditionCoverage ? "PASS" : "FAIL"}`,
    `Decision coverage: ${result.decisionCoverage ? "PASS" : "FAIL"}`,
    `MC/DC coverage: ${result.mcdcCoverage ? "PASS" : "FAIL"}`,
  ];

  for (const decision of result.decisions) {
    lines.push(
      `${decision.decisionId}: condition=${decision.conditionCoverage ? "PASS" : "FAIL"}, decision=${decision.decisionCoverage ? "PASS" : "FAIL"}, mcdc=${decision.mcdcCoverage ? "PASS" : "FAIL"}`,
    );
    lines.push(...decision.errors.map((error) => `  - ${error}`));
  }

  return lines.join("\n");
};
