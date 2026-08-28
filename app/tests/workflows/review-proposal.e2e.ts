/** S1 behavior test for reviewing and applying one governed Proposal. */
import { strict as assert } from "node:assert";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

describe("Review and apply a Proposal", () => {
  let temporaryRoot: string;
  let repositoryPath: string;
  const originalGovernedContent = `---
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

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-tb10-"));
    repositoryPath = join(temporaryRoot, "review-repository");
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("shows the exact change before explicit acceptance and the applied version after", async () => {
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [repositoryPath],
    });

    await $("#open-repository").click();
    await $("#atlas-needs-judgment").waitForDisplayed();
    assert.equal(
      await $("#atlas-proposal-title").getText(),
      "Bayesian statistics",
    );

    await $("#atlas-proposal-review").click();
    await $("#proposal-review-heading").waitForDisplayed();
    assert.equal(
      await $("#proposal-review-target").getText(),
      "Bayesian statistics",
    );
    assert.equal(
      await $("#proposal-review-base-version").getText(),
      "bayesian-statistics-v1",
    );
    assert.equal(
      await $("#proposal-review-target-path").getText(),
      "knowledge/bayesian-statistics.md",
    );
    assert.equal(
      await $("#proposal-review-evidence").getText(),
      "This fixture Source Record is associated with the Bayesian statistics topic.",
    );
    assert.match(
      await $("#proposal-review-before").getText(),
      /This fixture topic gives the S1 workflow a stable item to carry between\s+workspaces\./,
    );
    assert.equal(
      await $("#proposal-review-after").getText(),
      "Bayesian statistics uses evidence to update prior belief.",
    );
    assert.equal(
      await $("#proposal-review-current-version").getText(),
      "bayesian-statistics-v1",
    );
    assert.equal(await $("#proposal-review-outcome").isExisting(), false);

    await $("#proposal-review-back").click();
    await $("#atlas-needs-judgment").waitForDisplayed();
    assert.equal(
      await readFile(
        join(repositoryPath, "knowledge", "bayesian-statistics.md"),
        "utf8",
      ),
      originalGovernedContent,
    );
    await $("#atlas-proposal-review").click();
    await $("#proposal-review-heading").waitForDisplayed();

    await $("#proposal-review-accept-and-apply").click();
    await $("#proposal-review-outcome").waitForDisplayed();
    assert.equal(
      await $("#proposal-review-outcome").getText(),
      "Proposal applied and saved locally.",
    );
    assert.equal(
      await $("#proposal-review-new-version").getText(),
      "bayesian-statistics-v2",
    );
    assert.equal(
      await $("#proposal-review-previous-version").getText(),
      "bayesian-statistics-v1",
    );
    assert.equal(
      await $("#proposal-review-local-save").getText(),
      "Saved locally; Git commit, synchronization, and backup are external.",
    );
    assert.equal(
      await readFile(
        join(repositoryPath, "knowledge", "bayesian-statistics.md"),
        "utf8",
      ),
      `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: current
source_record: sources/papers/bayesian-statistics.md
---

# Bayesian statistics

Bayesian statistics uses evidence to update prior belief.
`,
    );
  });
});
