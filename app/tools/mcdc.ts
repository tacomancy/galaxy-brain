import { isAbsolute } from "node:path";

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

/**
 * Independently authored evidence for one registered high-risk decision.
 * Implementation files are nonempty paths relative to the app package and
 * must exist when the release gate runs; they identify which decisions a
 * repository diff may affect.
 */
export interface MCDCDecision {
  id: string;
  owner: string;
  description: string;
  implementationFiles: string[];
  conditions: string[];
  cases: MCDCDecisionCase[];
  witnesses: MCDCWitness[];
}

/** Versioned manifest containing the registered decisions for a release gate. */
export interface MCDCManifest {
  version: 2;
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

const normalizeRepositoryPath = (value: string): string => {
  const normalized = value.replaceAll("\\", "/");
  return normalized.startsWith("app/")
    ? normalized.slice("app/".length)
    : normalized;
};

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
  if (decision.implementationFiles.length === 0) {
    errors.push("At least one implementation file must be registered.");
  }
  for (const implementationFile of decision.implementationFiles) {
    if (implementationFile.length === 0) {
      errors.push("Implementation file paths must not be empty.");
    } else if (
      isAbsolute(implementationFile) ||
      implementationFile.split(/[\\/]/).includes("..")
    ) {
      errors.push(
        `Implementation file paths must be app-relative: ${implementationFile}.`,
      );
    }
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

/**
 * Finds manifest decisions affected by repository files changed from a base
 * revision. Paths may be repository-relative or relative to the app package.
 * A manifest change selects every current decision so evidence cannot be
 * changed without the release gate reviewing it.
 */
export const findChangedDecisionIds = (
  manifest: MCDCManifest,
  changedFiles: string[],
): string[] => {
  const normalizedChangedFiles = new Set(
    changedFiles.map(normalizeRepositoryPath),
  );
  const manifestChanged = normalizedChangedFiles.has(
    "tools/mcdc-decisions.json",
  );

  return manifest.decisions
    .filter(
      (decision) =>
        manifestChanged ||
        decision.implementationFiles.some((implementationFile) =>
          normalizedChangedFiles.has(
            normalizeRepositoryPath(implementationFile),
          ),
        ),
    )
    .map((decision) => decision.id);
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
