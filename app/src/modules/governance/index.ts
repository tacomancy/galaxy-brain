/** A governed knowledge target and its portable repository path. */
export interface GovernedTarget {
  id: string;
  title: string;
  path: string;
}

/** One retained governed version for a target. */
export interface GovernedVersion {
  id: string;
  target: GovernedTarget;
  content: string;
  parentVersionId?: string;
}

/** A Working Material draft that has not become Governed Knowledge. */
export interface WorkingMaterialDraft {
  id: string;
  state: "working-material";
  target: GovernedTarget;
  baseVersionId: string;
  content: string;
}

/** One literal replacement in a governed target. */
export interface ExactChange {
  path: string;
  before: string;
  after: string;
}

/** One labeled exact change in a Proposal and its local prerequisites. */
export interface ProposalChange {
  id: string;
  exactChange: ExactChange;
  dependsOn: string[];
}

/** A manually authored Proposal awaiting Judgment. */
export interface Proposal {
  id: string;
  fingerprint: string;
  state: "draft";
  target: GovernedTarget;
  baseVersionId: string;
  workingMaterialId: string;
  changes: ProposalChange[];
}

/** An explicit Judgment bound to one exact Proposal fingerprint. */
export interface Judgment {
  id: string;
  proposalId: string;
  proposalFingerprint: string;
  baseVersionId: string;
  decision: "accepted";
  acceptedChangeIds: string[];
  rejectedChangeIds: string[];
  deferredChangeIds: string[];
}

/** Immutable identity and provenance for one applied Proposal. */
export interface AppliedRecord {
  id: string;
  proposalId: string;
  judgmentId: string;
  targetId: string;
  previousVersionId: string;
  newVersionId: string;
  decision: "accepted";
}

/** Caller input for a manually authored Proposal. */
export interface CreateProposalInput {
  proposalId: string;
  proposalFingerprint: string;
  target: GovernedTarget;
  baseVersionId: string;
  workingMaterial: WorkingMaterialDraft;
  changes: ProposalChange[];
}

/** Caller input for an explicit Judgment. */
export interface RecordJudgmentInput {
  judgmentId: string;
  proposalId: string;
  proposalFingerprint: string;
  decision: "accepted";
  acceptedChangeIds: string[];
  rejectedChangeIds: string[];
  deferredChangeIds: string[];
}

/** Caller input for applying one reviewed Proposal. */
export interface ApplyProposalInput {
  proposalId: string;
  judgmentId: string;
}

/** The in-memory storage Adapter's version-creation request. */
export interface ApplyVersionInput {
  target: GovernedTarget;
  content: string;
  parentVersionId: string;
  expectedBaseContent: string;
  proposal: Proposal;
  judgment: Judgment;
  appliedRecordId: string;
}

/** Result returned by a version storage Adapter after a successful application. */
export interface ApplyVersionResult {
  previousVersion: GovernedVersion;
  currentVersion: GovernedVersion;
}

/** A caller-visible result for one persisted transaction recovery. */
export type GovernanceRecoveryOutcome =
  | { outcome: "none" }
  | {
      outcome: "recovered";
      action: "completed" | "restored" | "discarded";
    };

/** Signals that a governed target changed outside the expected application. */
export class GovernanceExternalChangeError extends Error {}

/** Storage seam for current and retained governed versions. */
export interface GovernanceVersionStore {
  recoverTransactions(): Promise<GovernanceRecoveryOutcome>;
  readCurrentVersion(targetId: string): Promise<GovernedVersion | undefined>;
  readVersion(
    targetId: string,
    versionId: string,
  ): Promise<GovernedVersion | undefined>;
  applyVersion(input: ApplyVersionInput): Promise<ApplyVersionResult>;
}

/** S2 result for loading the current governed version. */
export type LoadCurrentVersionOutcome =
  | { outcome: "found"; version: GovernedVersion }
  | {
      outcome: "found";
      version: GovernedVersion;
      recovery: Exclude<GovernanceRecoveryOutcome, { outcome: "none" }>;
    }
  | { outcome: "not-found"; detail: string };

/** S2 result for creating a Proposal. */
export type CreateProposalOutcome =
  | { outcome: "proposal-created"; proposal: Proposal }
  | { outcome: "invalid-proposal"; detail: string }
  | { outcome: "not-found"; detail: string };

/** S2 result for recording a Judgment. */
export type RecordJudgmentOutcome =
  | { outcome: "judgment-recorded"; judgment: Judgment }
  | { outcome: "invalid-judgment"; detail: string }
  | { outcome: "not-found"; detail: string };

/** S2 result for applying a Proposal. */
export type ApplyProposalOutcome =
  | {
      outcome: "applied";
      currentVersion: GovernedVersion;
      previousVersion: GovernedVersion;
      appliedRecord: AppliedRecord;
    }
  | { outcome: "judgment-required"; detail: string }
  | { outcome: "not-eligible"; detail: string }
  | { outcome: "stale-judgment"; detail: string }
  | { outcome: "invalid-dependency-subset"; detail: string }
  | { outcome: "external-change"; detail: string }
  | { outcome: "not-found"; detail: string }
  | { outcome: "operation-failed"; detail: string };

/** S2 result for retrieving one retained version. */
export type GetVersionOutcome =
  | { outcome: "found"; version: GovernedVersion }
  | { outcome: "not-found"; detail: string };

/** Public Governance Interface for Proposal, Judgment, and application policy. */
export interface Governance {
  /** Loads the current version and reports any transaction recovery performed. */
  loadCurrentVersion(targetId: string): Promise<LoadCurrentVersionOutcome>;
  /** Validates and stores a manually authored Proposal without applying it. */
  createProposal(input: CreateProposalInput): Promise<CreateProposalOutcome>;
  /** Records an exact-version-bound accepted Judgment. */
  recordJudgment(input: RecordJudgmentInput): Promise<RecordJudgmentOutcome>;
  /** Applies a Proposal only when its matching accepted Judgment is eligible. */
  applyProposal(input: ApplyProposalInput): Promise<ApplyProposalOutcome>;
  /** Retrieves a retained version through the same public Interface. */
  getVersion(targetId: string, versionId: string): Promise<GetVersionOutcome>;
}

export interface GovernanceDependencies {
  store: GovernanceVersionStore;
}

const copyTarget = (target: GovernedTarget): GovernedTarget => ({ ...target });

const copyVersion = (version: GovernedVersion): GovernedVersion => ({
  ...version,
  target: copyTarget(version.target),
});

const copyProposal = (proposal: Proposal): Proposal => ({
  ...proposal,
  target: copyTarget(proposal.target),
  changes: proposal.changes.map((change) => ({
    ...change,
    exactChange: { ...change.exactChange },
    dependsOn: [...change.dependsOn],
  })),
});

const copyJudgment = (judgment: Judgment): Judgment => ({
  ...judgment,
  acceptedChangeIds: [...judgment.acceptedChangeIds],
  rejectedChangeIds: [...judgment.rejectedChangeIds],
  deferredChangeIds: [...judgment.deferredChangeIds],
});

const isSameTarget = (left: GovernedTarget, right: GovernedTarget): boolean =>
  left.id === right.id &&
  left.title === right.title &&
  left.path === right.path;

const replaceExactOnce = (
  content: string,
  change: ExactChange,
): string | undefined => {
  const firstIndex = content.indexOf(change.before);

  if (firstIndex < 0 || content.indexOf(change.before, firstIndex + 1) >= 0) {
    return undefined;
  }

  return `${content.slice(0, firstIndex)}${change.after}${content.slice(firstIndex + change.before.length)}`;
};

const invalidProposal = (detail: string): CreateProposalOutcome => ({
  outcome: "invalid-proposal",
  detail,
});

const hasValidProposalIdentity = (input: CreateProposalInput): boolean =>
  input.proposalId.length > 0 &&
  input.proposalFingerprint.length > 0 &&
  input.baseVersionId.length > 0;

const hasValidWorkingMaterial = (input: CreateProposalInput): boolean =>
  input.workingMaterial.id.length > 0 &&
  input.workingMaterial.state === "working-material" &&
  input.workingMaterial.baseVersionId === input.baseVersionId &&
  isSameTarget(input.workingMaterial.target, input.target);

const hasValidExactChange = (
  change: ProposalChange,
  target: GovernedTarget,
  changeIds: Set<string>,
): boolean =>
  change.id.length > 0 &&
  change.exactChange.path === target.path &&
  change.exactChange.before.length > 0 &&
  change.exactChange.after.length > 0 &&
  change.exactChange.before !== change.exactChange.after &&
  change.dependsOn.every(
    (dependencyId) => dependencyId !== change.id && changeIds.has(dependencyId),
  );

const hasValidProposalInput = (input: CreateProposalInput): boolean =>
  hasValidProposalIdentity(input) &&
  hasValidWorkingMaterial(input) &&
  input.changes.length > 0 &&
  new Set(input.changes.map((change) => change.id)).size ===
    input.changes.length &&
  input.changes.every((change) =>
    hasValidExactChange(
      change,
      input.target,
      new Set(input.changes.map((candidate) => candidate.id)),
    ),
  );

const hasValidChangeClassification = (
  proposal: Proposal,
  acceptedChangeIds: string[],
  rejectedChangeIds: string[],
  deferredChangeIds: string[],
): boolean => {
  const changeIds = new Set(proposal.changes.map((change) => change.id));
  const accepted = new Set(acceptedChangeIds);
  const rejected = new Set(rejectedChangeIds);
  const deferred = new Set(deferredChangeIds);
  const classified = new Set([
    ...acceptedChangeIds,
    ...rejectedChangeIds,
    ...deferredChangeIds,
  ]);

  return (
    accepted.size > 0 &&
    new Set(acceptedChangeIds).size === acceptedChangeIds.length &&
    rejected.size === rejectedChangeIds.length &&
    deferred.size === deferredChangeIds.length &&
    acceptedChangeIds.every((changeId) => changeIds.has(changeId)) &&
    rejectedChangeIds.every((changeId) => changeIds.has(changeId)) &&
    deferredChangeIds.every((changeId) => changeIds.has(changeId)) &&
    accepted.size + rejected.size + deferred.size === classified.size &&
    classified.size === changeIds.size
  );
};

const applyChanges = (
  content: string,
  changes: ProposalChange[],
): string | undefined => {
  let nextContent = content;

  for (const change of changes) {
    const replaced = replaceExactOnce(nextContent, change.exactChange);

    if (replaced === undefined) {
      return undefined;
    }

    nextContent = replaced;
  }

  return nextContent;
};

const applySingleProposalChange = (
  content: string,
  proposal: Proposal,
  acceptedChangeIds: string[],
): string | undefined => {
  const accepted = new Set(acceptedChangeIds);
  const changes = proposal.changes.filter((change) => accepted.has(change.id));

  return changes.length > 0 ? applyChanges(content, changes) : undefined;
};

const hasClosedDependencySubset = (
  proposal: Proposal,
  acceptedChangeIds: string[],
): boolean => {
  const changesById = new Map(
    proposal.changes.map((change) => [change.id, change]),
  );
  const accepted = new Set(acceptedChangeIds);
  const required = new Set(acceptedChangeIds);
  const pending = [...acceptedChangeIds];

  while (pending.length > 0) {
    const changeId = pending.pop();
    const change =
      changeId === undefined ? undefined : changesById.get(changeId);

    if (change === undefined) {
      return false;
    }

    for (const dependencyId of change.dependsOn) {
      if (!required.has(dependencyId)) {
        required.add(dependencyId);
        pending.push(dependencyId);
      }
    }
  }

  return [...required].every((changeId) => accepted.has(changeId));
};

const hasEligibleJudgment = (
  proposal: Proposal,
  judgment: Judgment,
  appliedProposalIds: Set<string>,
): boolean =>
  judgment.proposalId === proposal.id &&
  judgment.proposalFingerprint === proposal.fingerprint &&
  judgment.baseVersionId === proposal.baseVersionId &&
  judgment.decision === "accepted" &&
  !appliedProposalIds.has(proposal.id);

/** Composes Governance policy behind the confirmed S2 Interface. */
export const createGovernance = (
  dependencies: GovernanceDependencies,
): Governance => {
  const proposals = new Map<string, Proposal>();
  const proposalBaseContents = new Map<string, string>();
  const judgments = new Map<string, Judgment>();
  const appliedProposalIds = new Set<string>();

  const loadCurrentVersion = async (
    targetId: string,
  ): Promise<LoadCurrentVersionOutcome> => {
    const recovery = await dependencies.store.recoverTransactions();
    const version = await dependencies.store.readCurrentVersion(targetId);

    if (version === undefined) {
      return {
        outcome: "not-found",
        detail: "The governed target was not found.",
      };
    }

    return recovery.outcome === "none"
      ? { outcome: "found", version: copyVersion(version) }
      : {
          outcome: "found",
          version: copyVersion(version),
          recovery,
        };
  };

  const createProposal = async (
    input: CreateProposalInput,
  ): Promise<CreateProposalOutcome> => {
    if (!hasValidProposalInput(input)) {
      return invalidProposal(
        "The Working Material draft or exact change is invalid.",
      );
    }

    if (proposals.has(input.proposalId)) {
      return invalidProposal("The Proposal identity is already in use.");
    }

    const currentVersion = await dependencies.store.readCurrentVersion(
      input.target.id,
    );

    if (currentVersion === undefined) {
      return {
        outcome: "not-found",
        detail: "The governed target was not found.",
      };
    }

    if (
      currentVersion.id !== input.baseVersionId ||
      !isSameTarget(currentVersion.target, input.target)
    ) {
      return invalidProposal(
        "The Working Material draft is not based on the current governed version.",
      );
    }

    const proposedContent = applyChanges(currentVersion.content, input.changes);

    if (
      proposedContent === undefined ||
      proposedContent !== input.workingMaterial.content
    ) {
      return invalidProposal(
        "The Working Material draft does not match the exact governed change.",
      );
    }

    const proposal: Proposal = {
      id: input.proposalId,
      fingerprint: input.proposalFingerprint,
      state: "draft",
      target: copyTarget(input.target),
      baseVersionId: input.baseVersionId,
      workingMaterialId: input.workingMaterial.id,
      changes: input.changes.map((change) => ({
        ...change,
        exactChange: { ...change.exactChange },
        dependsOn: [...change.dependsOn],
      })),
    };

    proposals.set(proposal.id, copyProposal(proposal));
    proposalBaseContents.set(proposal.id, currentVersion.content);
    return { outcome: "proposal-created", proposal: copyProposal(proposal) };
  };

  const recordJudgment = async (
    input: RecordJudgmentInput,
  ): Promise<RecordJudgmentOutcome> => {
    const proposal = proposals.get(input.proposalId);

    if (proposal === undefined) {
      return {
        outcome: "not-found",
        detail: "The Proposal was not found.",
      };
    }

    if (
      input.judgmentId.length === 0 ||
      input.proposalFingerprint !== proposal.fingerprint ||
      input.decision !== "accepted"
    ) {
      return {
        outcome: "invalid-judgment",
        detail: "The Judgment is not bound to the exact Proposal.",
      };
    }

    if (
      !hasValidChangeClassification(
        proposal,
        input.acceptedChangeIds,
        input.rejectedChangeIds,
        input.deferredChangeIds,
      )
    ) {
      return {
        outcome: "invalid-judgment",
        detail:
          "The Judgment must classify every Proposal change exactly once.",
      };
    }

    if (judgments.has(input.judgmentId)) {
      return {
        outcome: "invalid-judgment",
        detail: "The Judgment identity is already in use.",
      };
    }

    const judgment: Judgment = {
      id: input.judgmentId,
      proposalId: proposal.id,
      proposalFingerprint: proposal.fingerprint,
      baseVersionId: proposal.baseVersionId,
      decision: input.decision,
      acceptedChangeIds: [...input.acceptedChangeIds],
      rejectedChangeIds: [...input.rejectedChangeIds],
      deferredChangeIds: [...input.deferredChangeIds],
    };

    judgments.set(judgment.id, copyJudgment(judgment));
    return {
      outcome: "judgment-recorded",
      judgment: copyJudgment(judgment),
    };
  };

  const applyProposal = async (
    input: ApplyProposalInput,
  ): Promise<ApplyProposalOutcome> => {
    const proposal = proposals.get(input.proposalId);

    if (proposal === undefined) {
      return {
        outcome: "not-found",
        detail: "The Proposal was not found.",
      };
    }

    const judgment = judgments.get(input.judgmentId);

    if (judgment === undefined) {
      return {
        outcome: "judgment-required",
        detail: "An accepted Judgment is required before application.",
      };
    }

    if (!hasEligibleJudgment(proposal, judgment, appliedProposalIds)) {
      return {
        outcome: "not-eligible",
        detail:
          "The Proposal does not have an eligible exact-version Judgment.",
      };
    }

    const currentVersion = await dependencies.store.readCurrentVersion(
      proposal.target.id,
    );

    if (currentVersion === undefined) {
      return {
        outcome: "not-found",
        detail: "The governed target was not found.",
      };
    }

    if (currentVersion.id !== proposal.baseVersionId) {
      return {
        outcome: "stale-judgment",
        detail:
          "The Judgment is stale because the current governed version changed after review.",
      };
    }

    if (!isSameTarget(currentVersion.target, proposal.target)) {
      return {
        outcome: "not-eligible",
        detail: "The Proposal is not based on the current governed version.",
      };
    }

    if (!hasClosedDependencySubset(proposal, judgment.acceptedChangeIds)) {
      return {
        outcome: "invalid-dependency-subset",
        detail: "The accepted change subset omits a required dependency.",
      };
    }

    const proposedContent = applySingleProposalChange(
      currentVersion.content,
      proposal,
      judgment.acceptedChangeIds,
    );

    if (proposedContent === undefined) {
      return {
        outcome: "not-eligible",
        detail: "The exact governed change no longer matches the target.",
      };
    }

    try {
      const applied = await dependencies.store.applyVersion({
        target: proposal.target,
        content: proposedContent,
        parentVersionId: currentVersion.id,
        expectedBaseContent: proposalBaseContents.get(proposal.id) ?? "",
        proposal: copyProposal(proposal),
        judgment: copyJudgment(judgment),
        appliedRecordId: `applied-${proposal.id}`,
      });
      const appliedRecord: AppliedRecord = {
        id: `applied-${proposal.id}`,
        proposalId: proposal.id,
        judgmentId: judgment.id,
        targetId: proposal.target.id,
        previousVersionId: applied.previousVersion.id,
        newVersionId: applied.currentVersion.id,
        decision: judgment.decision,
      };

      appliedProposalIds.add(proposal.id);
      return {
        outcome: "applied",
        currentVersion: copyVersion(applied.currentVersion),
        previousVersion: copyVersion(applied.previousVersion),
        appliedRecord,
      };
    } catch (error: unknown) {
      if (error instanceof GovernanceExternalChangeError) {
        return { outcome: "external-change", detail: error.message };
      }

      return {
        outcome: "operation-failed",
        detail: "The governed change could not be applied.",
      };
    }
  };

  const getVersion = async (
    targetId: string,
    versionId: string,
  ): Promise<GetVersionOutcome> => {
    const version = await dependencies.store.readVersion(targetId, versionId);

    return version === undefined
      ? {
          outcome: "not-found",
          detail: "The governed version was not found.",
        }
      : { outcome: "found", version: copyVersion(version) };
  };

  return {
    loadCurrentVersion,
    createProposal,
    recordJudgment,
    applyProposal,
    getVersion,
  };
};
