/** S1 behavior test for the first Knowledge Authoring editing round trip. */
import { strict as assert } from "node:assert";
import { join } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

const initialDraftSource = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: working-material
base_version: bayesian-statistics-v1
---

# Bayesian statistics

Bayesian statistics updates a ==prior belief== with evidence.`;

const editedDraftSource = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: working-material
base_version: bayesian-statistics-v1
---

# Bayesian statistics

Bayesian statistics updates a ==posterior belief== with evidence.`;

describe("Edit one meaning across rich and source views", () => {
  it("preserves a highlighted edit through source inspection and same-session reopen", async () => {
    const fixtureRepositoryPath = join(
      process.cwd(),
      "tests",
      "fixtures",
      "knowledge-repository",
    );
    const dialog = await browser.electron.mock("dialog", "showOpenDialog");

    await dialog.mockResolvedValue({
      canceled: false,
      filePaths: [fixtureRepositoryPath],
    });

    await $("#open-repository").click();
    await $("#atlas-topic-open-studio").click();
    await $("#studio-authoring-surface").waitForDisplayed();

    assert.equal(
      await $("#studio-authoring-state").getText(),
      "Working Material",
    );
    assert.equal(await $("#studio-rich-view").getText(), "prior belief");
    assert.equal(
      await $("#studio-rich-highlight").getAttribute("data-highlighted"),
      "true",
    );
    await $("#studio-source-mode").click();
    assert.equal(
      await $("#studio-authoring-source").getText(),
      initialDraftSource,
    );
    await $("#studio-rich-mode").click();

    await $("#studio-rich-edit").click();
    await $("#studio-rich-edit-input").setValue("posterior belief");
    await $("#studio-rich-edit-apply").click();

    assert.equal(await $("#studio-rich-view").getText(), "posterior belief");
    assert.equal(
      await $("#studio-rich-highlight").getAttribute("data-highlighted"),
      "true",
    );

    await $("#studio-source-mode").click();
    assert.equal(
      await $("#studio-authoring-source").getText(),
      editedDraftSource,
    );

    await $("#studio-rich-mode").click();
    assert.equal(await $("#studio-rich-view").getText(), "posterior belief");
    assert.equal(
      await $("#studio-rich-highlight").getAttribute("data-highlighted"),
      "true",
    );

    await $("#studio-authoring-close").click();
    await $("#studio-authoring-open").click();
    await $("#studio-authoring-surface").waitForDisplayed();

    assert.equal(await $("#studio-rich-view").getText(), "posterior belief");
    await $("#studio-source-mode").click();
    assert.equal(
      await $("#studio-authoring-source").getText(),
      editedDraftSource,
    );
    await $("#studio-rich-mode").click();
    assert.equal(
      await $("#studio-governed-topic").getText(),
      "This fixture topic gives the S1 workflow a stable item to carry between workspaces.",
    );
  });

  it("preserves exact source for each additional supported construct", async () => {
    await browser.refresh();
    await $("#studio-authoring-surface").waitForDisplayed();

    const examples = [
      {
        construct: "link",
        initialValue: "bayesian-inference",
        editedValue: "conditional-inference",
        initialBody:
          "Bayesian statistics compares [[bayesian-inference]] with evidence.",
        editedBody:
          "Bayesian statistics compares [[conditional-inference]] with evidence.",
      },
      {
        construct: "embed",
        initialValue: "bayesian-updates#overview",
        editedValue: "bayesian-updates#human-readable-anchor",
        initialBody:
          "Bayesian statistics includes ![[bayesian-updates#overview]].",
        editedBody:
          "Bayesian statistics includes ![[bayesian-updates#human-readable-anchor]].",
      },
      {
        construct: "callout",
        initialValue: "Evidence updates confidence.",
        editedValue: "Evidence changes confidence.",
        initialBody: "> [!EVIDENCE] Evidence updates confidence.",
        editedBody: "> [!EVIDENCE] Evidence changes confidence.",
      },
      {
        construct: "equation",
        initialValue: "P(H|E)",
        editedValue: "P(E|H)",
        initialBody: "Bayesian updating uses $P(H|E)$ as its likelihood.",
        editedBody: "Bayesian updating uses $P(E|H)$ as its likelihood.",
      },
      {
        construct: "citation",
        initialValue: "bayes-1763",
        editedValue: "laplace-1812",
        initialBody: "The prior is documented in [@bayes-1763].",
        editedBody: "The prior is documented in [@laplace-1812].",
      },
    ] as const;

    const sourceFor = (body: string): string => `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: working-material
base_version: bayesian-statistics-v1
---

# Bayesian statistics

${body}`;

    for (const example of examples) {
      await $(`#studio-authoring-construct-${example.construct}`).click();
      await $("#studio-rich-semantic-object").waitForDisplayed();
      assert.equal(
        await $("#studio-rich-semantic-object").getText(),
        example.initialValue,
      );

      await $("#studio-source-mode").click();
      assert.equal(
        await $("#studio-authoring-source").getText(),
        sourceFor(example.initialBody),
      );
      await $("#studio-rich-mode").click();
      await $("#studio-rich-edit").click();
      await $("#studio-rich-edit-input").setValue(example.editedValue);
      await $("#studio-rich-edit-apply").click();
      assert.equal(
        await $("#studio-rich-semantic-object").getText(),
        example.editedValue,
      );

      await $("#studio-source-mode").click();
      assert.equal(
        await $("#studio-authoring-source").getText(),
        sourceFor(example.editedBody),
      );
      await $("#studio-rich-mode").click();
    }
  });
});
