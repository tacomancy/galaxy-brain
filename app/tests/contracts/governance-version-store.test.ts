import { strict as assert } from "node:assert";
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, it } from "vitest";

import {
  createFileBackedGovernanceStore,
  defaultGovernanceFileSystem,
  type GovernanceFileSystem,
} from "../../src/adapters/governance/file-backed-governance-store";
import {
  createGovernance,
  type Governance,
  type GovernedTarget,
  type GovernedVersion,
  type WorkingMaterialDraft,
} from "../../src/modules/governance";

const fixtureRepositoryPath = join(
  process.cwd(),
  "tests/fixtures/knowledge-repository",
);

const target: GovernedTarget = {
  id: "bayesian-statistics",
  title: "Bayesian statistics",
  path: "knowledge/bayesian-statistics.md",
};

const currentContent = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
---

# Bayesian statistics

This fixture topic gives the S1 workflow a stable item to carry between
workspaces.
`;

const proposedContent = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
---

# Bayesian statistics

Bayesian statistics uses evidence to update prior belief.
`;

const currentVersion: GovernedVersion = {
  id: "bayesian-statistics-v1",
  target,
  content: currentContent,
};

const workingMaterial: WorkingMaterialDraft = {
  id: "working-material-tb8-bayesian-statistics-evidence",
  state: "working-material",
  target,
  baseVersionId: "bayesian-statistics-v1",
  content: proposedContent,
};

const temporaryRepositories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRepositories
      .splice(0)
      .map((repositoryPath) =>
        rm(repositoryPath, { recursive: true, force: true }),
      ),
  );
});

const createGovernanceFor = async (
  filesystem: GovernanceFileSystem = defaultGovernanceFileSystem,
) => {
  const repositoryPath = await mkdtemp(join(tmpdir(), "galaxy-brain-tb8-"));
  temporaryRepositories.push(repositoryPath);
  await cp(fixtureRepositoryPath, repositoryPath, { recursive: true });

  return {
    repositoryPath,
    governance: createGovernance({
      store: createFileBackedGovernanceStore({
        repositoryPath,
        target,
        initialVersionId: "bayesian-statistics-v1",
        nextVersionId: "bayesian-statistics-v2",
        filesystem,
      }),
    }),
  };
};

const prepareAcceptedProposal = async (
  governance: Governance,
): Promise<void> => {
  await governance.createProposal({
    proposalId: "proposal-tb8-bayesian-statistics-evidence",
    proposalFingerprint:
      "proposal-fingerprint-tb8-bayesian-statistics-evidence",
    target,
    baseVersionId: "bayesian-statistics-v1",
    workingMaterial,
    changes: [
      {
        id: "change-tb8-bayesian-statistics-evidence",
        exactChange: {
          path: target.path,
          before:
            "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
          after: "Bayesian statistics uses evidence to update prior belief.",
        },
        dependsOn: [],
      },
    ],
  });
  await governance.recordJudgment({
    judgmentId: "judgment-tb8-bayesian-statistics-evidence",
    proposalId: "proposal-tb8-bayesian-statistics-evidence",
    proposalFingerprint:
      "proposal-fingerprint-tb8-bayesian-statistics-evidence",
    decision: "accepted",
    acceptedChangeIds: ["change-tb8-bayesian-statistics-evidence"],
    rejectedChangeIds: [],
    deferredChangeIds: [],
  });
};

describe("file-backed Governance version storage", () => {
  it("persists one accepted application and reopens current and prior versions", async () => {
    const { repositoryPath, governance } = await createGovernanceFor();

    assert.deepEqual(await governance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: currentVersion,
    });

    assert.deepEqual(
      await governance.createProposal({
        proposalId: "proposal-tb8-bayesian-statistics-evidence",
        proposalFingerprint:
          "proposal-fingerprint-tb8-bayesian-statistics-evidence",
        target,
        baseVersionId: "bayesian-statistics-v1",
        workingMaterial,
        changes: [
          {
            id: "change-tb8-bayesian-statistics-evidence",
            exactChange: {
              path: target.path,
              before:
                "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
              after:
                "Bayesian statistics uses evidence to update prior belief.",
            },
            dependsOn: [],
          },
        ],
      }),
      {
        outcome: "proposal-created",
        proposal: {
          id: "proposal-tb8-bayesian-statistics-evidence",
          fingerprint: "proposal-fingerprint-tb8-bayesian-statistics-evidence",
          state: "draft",
          target,
          baseVersionId: "bayesian-statistics-v1",
          workingMaterialId:
            "working-material-tb8-bayesian-statistics-evidence",
          changes: [
            {
              id: "change-tb8-bayesian-statistics-evidence",
              exactChange: {
                path: target.path,
                before:
                  "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
                after:
                  "Bayesian statistics uses evidence to update prior belief.",
              },
              dependsOn: [],
            },
          ],
        },
      },
    );

    assert.deepEqual(
      await governance.recordJudgment({
        judgmentId: "judgment-tb8-bayesian-statistics-evidence",
        proposalId: "proposal-tb8-bayesian-statistics-evidence",
        proposalFingerprint:
          "proposal-fingerprint-tb8-bayesian-statistics-evidence",
        decision: "accepted",
        acceptedChangeIds: ["change-tb8-bayesian-statistics-evidence"],
        rejectedChangeIds: [],
        deferredChangeIds: [],
      }),
      {
        outcome: "judgment-recorded",
        judgment: {
          id: "judgment-tb8-bayesian-statistics-evidence",
          proposalId: "proposal-tb8-bayesian-statistics-evidence",
          proposalFingerprint:
            "proposal-fingerprint-tb8-bayesian-statistics-evidence",
          baseVersionId: "bayesian-statistics-v1",
          decision: "accepted",
          acceptedChangeIds: ["change-tb8-bayesian-statistics-evidence"],
          rejectedChangeIds: [],
          deferredChangeIds: [],
        },
      },
    );

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: "proposal-tb8-bayesian-statistics-evidence",
        judgmentId: "judgment-tb8-bayesian-statistics-evidence",
      }),
      {
        outcome: "applied",
        currentVersion: {
          id: "bayesian-statistics-v2",
          target,
          content: proposedContent,
          parentVersionId: "bayesian-statistics-v1",
        },
        previousVersion: currentVersion,
        appliedRecord: {
          id: "applied-proposal-tb8-bayesian-statistics-evidence",
          proposalId: "proposal-tb8-bayesian-statistics-evidence",
          judgmentId: "judgment-tb8-bayesian-statistics-evidence",
          targetId: "bayesian-statistics",
          previousVersionId: "bayesian-statistics-v1",
          newVersionId: "bayesian-statistics-v2",
          decision: "accepted",
        },
      },
    );

    const reopenedGovernance = createGovernance({
      store: createFileBackedGovernanceStore({
        repositoryPath,
        target,
        initialVersionId: "bayesian-statistics-v1",
        nextVersionId: "bayesian-statistics-v2",
      }),
    });

    assert.deepEqual(await reopenedGovernance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: {
        id: "bayesian-statistics-v2",
        target,
        content: proposedContent,
        parentVersionId: "bayesian-statistics-v1",
      },
    });
    assert.deepEqual(
      await reopenedGovernance.getVersion(target.id, "bayesian-statistics-v1"),
      { outcome: "found", version: currentVersion },
    );

    assert.equal(
      await readFile(join(repositoryPath, target.path), "utf8"),
      proposedContent,
    );
    assert.equal(
      await readFile(
        join(repositoryPath, "knowledge/registries/glossary.yaml"),
        "utf8",
      ),
      await readFile(
        join(fixtureRepositoryPath, "knowledge/registries/glossary.yaml"),
        "utf8",
      ),
    );
    assert.equal(
      await readFile(
        join(
          repositoryPath,
          "proposals/applied/applied-proposal-tb8-bayesian-statistics-evidence/rollback/knowledge/bayesian-statistics.md",
        ),
        "utf8",
      ),
      currentContent,
    );

    const appliedRecord = JSON.parse(
      await readFile(
        join(
          repositoryPath,
          "proposals/applied/applied-proposal-tb8-bayesian-statistics-evidence.json",
        ),
        "utf8",
      ),
    );
    assert.deepEqual(appliedRecord, {
      id: "applied-proposal-tb8-bayesian-statistics-evidence",
      proposal: {
        id: "proposal-tb8-bayesian-statistics-evidence",
        fingerprint: "proposal-fingerprint-tb8-bayesian-statistics-evidence",
        target,
        base_version_id: "bayesian-statistics-v1",
        working_material_id:
          "working-material-tb8-bayesian-statistics-evidence",
        exact_change: {
          path: target.path,
          before:
            "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
          after: "Bayesian statistics uses evidence to update prior belief.",
        },
      },
      judgment: {
        id: "judgment-tb8-bayesian-statistics-evidence",
        proposal_id: "proposal-tb8-bayesian-statistics-evidence",
        proposal_fingerprint:
          "proposal-fingerprint-tb8-bayesian-statistics-evidence",
        base_version_id: "bayesian-statistics-v1",
        decision: "accepted",
      },
      target,
      previous_version: {
        id: "bayesian-statistics-v1",
        fingerprint:
          "5fb3de504a1d39faaa32c199f9b8209dabb9abb4deb419633b2679de242c41df",
      },
      new_version: {
        id: "bayesian-statistics-v2",
        fingerprint:
          "e2f8bbc083c57de5e4c01ad7c92fc965cc54d05061b0b85b06fa8b8e3ec504d1",
      },
      rollback_path:
        "proposals/applied/applied-proposal-tb8-bayesian-statistics-evidence/rollback/knowledge/bayesian-statistics.md",
    });
  });

  it("rejects an external edit without overwriting it", async () => {
    const { repositoryPath, governance } = await createGovernanceFor();
    await prepareAcceptedProposal(governance);

    const externallyEditedContent = `${currentContent}External edit.\n`;
    await writeFile(
      join(repositoryPath, target.path),
      externallyEditedContent,
      "utf8",
    );

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: "proposal-tb8-bayesian-statistics-evidence",
        judgmentId: "judgment-tb8-bayesian-statistics-evidence",
      }),
      {
        outcome: "external-change",
        detail: "The governed target changed before application.",
      },
    );
    assert.equal(
      await readFile(join(repositoryPath, target.path), "utf8"),
      externallyEditedContent,
    );
  });

  it("recovers and completes an application interrupted after target replacement", async () => {
    const repositoryPath = await mkdtemp(join(tmpdir(), "galaxy-brain-tb8-"));
    temporaryRepositories.push(repositoryPath);
    await cp(fixtureRepositoryPath, repositoryPath, { recursive: true });

    const targetPath = join(repositoryPath, target.path);
    let targetReplacementInterrupted = false;
    const filesystem: GovernanceFileSystem = {
      ...defaultGovernanceFileSystem,
      rename: async (from, to) => {
        await defaultGovernanceFileSystem.rename(from, to);

        if (to === targetPath && !targetReplacementInterrupted) {
          targetReplacementInterrupted = true;
          throw new Error("simulated interruption after target replacement");
        }
      },
    };
    const governance = createGovernance({
      store: createFileBackedGovernanceStore({
        repositoryPath,
        target,
        initialVersionId: "bayesian-statistics-v1",
        nextVersionId: "bayesian-statistics-v2",
        filesystem,
      }),
    });
    await prepareAcceptedProposal(governance);

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: "proposal-tb8-bayesian-statistics-evidence",
        judgmentId: "judgment-tb8-bayesian-statistics-evidence",
      }),
      {
        outcome: "operation-failed",
        detail: "The governed change could not be applied.",
      },
    );

    const reopenedGovernance = createGovernance({
      store: createFileBackedGovernanceStore({
        repositoryPath,
        target,
        initialVersionId: "bayesian-statistics-v1",
        nextVersionId: "bayesian-statistics-v2",
      }),
    });

    assert.deepEqual(await reopenedGovernance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: {
        id: "bayesian-statistics-v2",
        target,
        content: proposedContent,
        parentVersionId: "bayesian-statistics-v1",
      },
      recovery: { outcome: "recovered", action: "completed" },
    });
    assert.deepEqual(
      await readdir(
        join(repositoryPath, "proposals/applied/.transactions"),
        "utf8",
      ),
      [],
    );
  });

  it("recovers an application interrupted before the audit record is installed", async () => {
    const repositoryPath = await mkdtemp(join(tmpdir(), "galaxy-brain-tb8-"));
    temporaryRepositories.push(repositoryPath);
    await cp(fixtureRepositoryPath, repositoryPath, { recursive: true });

    let auditInstallationInterrupted = false;
    const filesystem: GovernanceFileSystem = {
      ...defaultGovernanceFileSystem,
      rename: async (from, to) => {
        if (
          to ===
            join(
              repositoryPath,
              "proposals/applied/applied-proposal-tb8-bayesian-statistics-evidence.json",
            ) &&
          !auditInstallationInterrupted
        ) {
          auditInstallationInterrupted = true;
          throw new Error("simulated interruption before audit installation");
        }

        await defaultGovernanceFileSystem.rename(from, to);
      },
    };
    const governance = createGovernance({
      store: createFileBackedGovernanceStore({
        repositoryPath,
        target,
        initialVersionId: "bayesian-statistics-v1",
        nextVersionId: "bayesian-statistics-v2",
        filesystem,
      }),
    });
    await prepareAcceptedProposal(governance);

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: "proposal-tb8-bayesian-statistics-evidence",
        judgmentId: "judgment-tb8-bayesian-statistics-evidence",
      }),
      {
        outcome: "operation-failed",
        detail: "The governed change could not be applied.",
      },
    );

    const reopenedGovernance = createGovernance({
      store: createFileBackedGovernanceStore({
        repositoryPath,
        target,
        initialVersionId: "bayesian-statistics-v1",
        nextVersionId: "bayesian-statistics-v2",
      }),
    });

    assert.deepEqual(await reopenedGovernance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: {
        id: "bayesian-statistics-v2",
        target,
        content: proposedContent,
        parentVersionId: "bayesian-statistics-v1",
      },
      recovery: { outcome: "recovered", action: "completed" },
    });
    assert.deepEqual(
      await readdir(
        join(repositoryPath, "proposals/applied/.transactions"),
        "utf8",
      ),
      [],
    );
  });

  it("restores the prior target when interrupted audit content is invalid", async () => {
    const repositoryPath = await mkdtemp(join(tmpdir(), "galaxy-brain-tb8-"));
    temporaryRepositories.push(repositoryPath);
    await cp(fixtureRepositoryPath, repositoryPath, { recursive: true });

    const filesystem: GovernanceFileSystem = {
      ...defaultGovernanceFileSystem,
      rename: async (from, to) => {
        if (
          to ===
          join(
            repositoryPath,
            "proposals/applied/applied-proposal-tb8-bayesian-statistics-evidence.json",
          )
        ) {
          await defaultGovernanceFileSystem.writeFile(
            from,
            "{ invalid audit }",
            { encoding: "utf8" },
          );
          throw new Error("simulated invalid audit interruption");
        }

        await defaultGovernanceFileSystem.rename(from, to);
      },
    };
    const governance = createGovernance({
      store: createFileBackedGovernanceStore({
        repositoryPath,
        target,
        initialVersionId: "bayesian-statistics-v1",
        nextVersionId: "bayesian-statistics-v2",
        filesystem,
      }),
    });
    await prepareAcceptedProposal(governance);

    assert.deepEqual(
      await governance.applyProposal({
        proposalId: "proposal-tb8-bayesian-statistics-evidence",
        judgmentId: "judgment-tb8-bayesian-statistics-evidence",
      }),
      {
        outcome: "operation-failed",
        detail: "The governed change could not be applied.",
      },
    );

    const reopenedGovernance = createGovernance({
      store: createFileBackedGovernanceStore({
        repositoryPath,
        target,
        initialVersionId: "bayesian-statistics-v1",
        nextVersionId: "bayesian-statistics-v2",
      }),
    });

    assert.deepEqual(await reopenedGovernance.loadCurrentVersion(target.id), {
      outcome: "found",
      version: currentVersion,
      recovery: { outcome: "recovered", action: "restored" },
    });
    await assert.rejects(
      readFile(
        join(
          repositoryPath,
          "proposals/applied/applied-proposal-tb8-bayesian-statistics-evidence.json",
        ),
        "utf8",
      ),
    );
    assert.deepEqual(
      await readdir(
        join(repositoryPath, "proposals/applied/.transactions"),
        "utf8",
      ),
      [],
    );
  });
});
