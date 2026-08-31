/**
 * S1 release-readiness workflows for local-only governance safety.
 *
 * Each scenario uses an isolated copy of the deterministic fixture. The
 * harness may prepare an external edit or a deliberately interrupted journal,
 * but the packaged application performs the recovery and exposes the outcome
 * through the real Proposal Review surface.
 */
import { createHash } from "node:crypto";
import { strict as assert } from "node:assert";
import {
  cp,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

const fixtureRepositoryPath = join(
  process.cwd(),
  "tests",
  "fixtures",
  "knowledge-repository",
);
const governedTargetPath = "knowledge/bayesian-statistics.md";
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

const fingerprint = (contents: string): string =>
  createHash("sha256").update(contents).digest("hex");

const copyFixture = async (label: string): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), `galaxy-brain-v1-${label}-`));
  const repositoryPath = join(root, "repository");
  await cp(fixtureRepositoryPath, repositoryPath, { recursive: true });
  return repositoryPath;
};

const openRepository = async (repositoryPath: string): Promise<void> => {
  const dialog = await browser.electron.mock("dialog", "showOpenDialog");
  await dialog.mockResolvedValue({
    canceled: false,
    filePaths: [repositoryPath],
  });
  await $("#open-repository").click();
  await $("#atlas-needs-judgment").waitForDisplayed();
};

describe("V1 provider-free recovery gate", () => {
  let temporaryRoots: string[];

  before(() => {
    temporaryRoots = [];
  });

  after(async () => {
    await Promise.all(
      temporaryRoots.map((repositoryPath) =>
        rm(join(repositoryPath, ".."), { recursive: true, force: true }),
      ),
    );
  });

  it("preserves an external edit instead of overwriting it", async () => {
    const repositoryPath = await copyFixture("external-edit");
    temporaryRoots.push(repositoryPath);
    await openRepository(repositoryPath);

    await $("#atlas-proposal-review").click();
    await $("#proposal-review-heading").waitForDisplayed();

    const externalContent = `${currentContent}External work preserved by the gate.\n`;
    await writeFile(
      join(repositoryPath, governedTargetPath),
      externalContent,
      "utf8",
    );
    await $("#proposal-review-accept-and-apply").click();
    await $("#proposal-review-error").waitForDisplayed();

    assert.match(
      await $("#proposal-review-error").getText(),
      /governed target changed before application/,
    );
    assert.equal(
      await readFile(join(repositoryPath, governedTargetPath), "utf8"),
      externalContent,
    );
    assert.equal(await $("#proposal-review-outcome").isExisting(), false);
    await $("#proposal-review-back").click();
  });

  it("recovers an interrupted transaction without silent data loss", async () => {
    const repositoryPath = await copyFixture("interrupted");
    temporaryRoots.push(repositoryPath);
    const transactionId = "provider-free-interrupted-application";
    const transactionPath = join(
      repositoryPath,
      "proposals",
      "applied",
      ".transactions",
      transactionId,
    );
    await mkdir(transactionPath, { recursive: true });
    await writeFile(
      join(repositoryPath, governedTargetPath),
      proposedContent,
      "utf8",
    );
    await writeFile(join(transactionPath, "rollback"), currentContent, "utf8");
    await writeFile(
      join(transactionPath, "audit.json"),
      "{ invalid audit }\n",
      "utf8",
    );
    await writeFile(
      join(transactionPath, "journal.json"),
      `${JSON.stringify(
        {
          applied_record_id: transactionId,
          expected_fingerprint: fingerprint(currentContent),
          new_fingerprint: fingerprint(proposedContent),
          target_path: governedTargetPath,
          state: "target-replaced",
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    await openRepository(repositoryPath);
    await $("#atlas-proposal-review").click();
    await $("#proposal-review-heading").waitForDisplayed();

    assert.match(
      await $("#proposal-review-before").getText(),
      /This fixture topic gives the S1 workflow a stable item to carry between\s+workspaces\./,
    );
    assert.equal(
      await readFile(join(repositoryPath, governedTargetPath), "utf8"),
      currentContent,
    );
    assert.deepEqual(
      await readdir(
        join(repositoryPath, "proposals", "applied", ".transactions"),
      ),
      [],
    );
    await $("#proposal-review-back").click();
  });

  it("applies a governed change with truthful local-save status", async () => {
    const repositoryPath = await copyFixture("local-save");
    temporaryRoots.push(repositoryPath);
    await openRepository(repositoryPath);

    await $("#atlas-proposal-review").click();
    await $("#proposal-review-heading").waitForDisplayed();
    await $("#proposal-review-accept-and-apply").click();
    await $("#proposal-review-outcome").waitForDisplayed();

    assert.equal(
      await $("#proposal-review-outcome").getText(),
      "Proposal applied and saved locally.",
    );
    assert.equal(
      await $("#proposal-review-local-save").getText(),
      "Saved locally; Git commit, synchronization, and backup are external.",
    );
    assert.equal(
      await $("#proposal-review-previous-version").getText(),
      "bayesian-statistics-v1",
    );
  });
});
