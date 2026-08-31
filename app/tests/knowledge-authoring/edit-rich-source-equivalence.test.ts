import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createFixtureAuthoringDraftSource } from "../../src/adapters/knowledge-authoring/fixture-authoring-draft";
import {
  authoringConstructs,
  createKnowledgeAuthoring,
  type AuthoringConstruct,
} from "../../src/modules/knowledge-authoring";

const editedSource = `---
id: bayesian-statistics
title: Bayesian statistics
type: topic
status: working-material
base_version: bayesian-statistics-v1
---

# Bayesian statistics

Bayesian statistics updates a ==posterior belief== with evidence.`;

describe("Knowledge Authoring", () => {
  it("keeps one highlight edit equivalent across its public projections", async () => {
    const authoring = createKnowledgeAuthoring(
      createFixtureAuthoringDraftSource(),
    );

    const opened = await authoring.readDraft();
    assert.equal(opened.outcome, "available");
    if (opened.outcome !== "available") {
      return;
    }

    assert.equal(opened.draft.mode, "rich");
    assert.equal(opened.draft.rich.highlightedText, "prior belief");

    const edited = await authoring.editSemanticText("posterior belief");
    assert.equal(edited.outcome, "updated");
    if (edited.outcome !== "updated") {
      return;
    }

    assert.equal(edited.draft.rich.highlighted, true);
    assert.equal(edited.draft.rich.highlightedText, "posterior belief");
    assert.equal(edited.draft.source, editedSource);

    const sourceMode = await authoring.setMode("source");
    assert.equal(sourceMode.outcome, "updated");
    if (sourceMode.outcome !== "updated") {
      return;
    }

    assert.equal(sourceMode.draft.mode, "source");
    assert.equal(sourceMode.draft.source, editedSource);

    const richMode = await authoring.setMode("rich");
    assert.equal(richMode.outcome, "updated");
    if (richMode.outcome !== "updated") {
      return;
    }

    assert.equal(richMode.draft.mode, "rich");
    assert.equal(richMode.draft.rich.highlightedText, "posterior belief");
  });

  it("undoes the most recent semantic edit without changing the construct", async () => {
    const authoring = createKnowledgeAuthoring(
      createFixtureAuthoringDraftSource(),
    );

    assert.equal(
      (await authoring.editSemanticText("posterior belief")).outcome,
      "updated",
    );
    const undone = await authoring.undoLastEdit();

    assert.equal(undone.outcome, "updated");
    if (undone.outcome !== "updated") {
      return;
    }

    assert.equal(undone.draft.rich.semanticText, "prior belief");
    assert.equal(undone.draft.source.includes("==prior belief=="), true);
    assert.equal((await authoring.undoLastEdit()).outcome, "operation-failed");
  });

  it("preserves the exact source while editing every approved TB11 construct", async () => {
    const examples: Record<
      Exclude<AuthoringConstruct, "highlight">,
      {
        initialSourceBody: string;
        editedSourceBody: string;
        initialValue: string;
        editedValue: string;
      }
    > = {
      link: {
        initialSourceBody:
          "Bayesian statistics compares [[bayesian-inference]] with evidence.",
        editedSourceBody:
          "Bayesian statistics compares [[conditional-inference]] with evidence.",
        initialValue: "bayesian-inference",
        editedValue: "conditional-inference",
      },
      embed: {
        initialSourceBody:
          "Bayesian statistics includes ![[bayesian-updates#overview]].",
        editedSourceBody:
          "Bayesian statistics includes ![[bayesian-updates#human-readable-anchor]].",
        initialValue: "bayesian-updates#overview",
        editedValue: "bayesian-updates#human-readable-anchor",
      },
      callout: {
        initialSourceBody: "> [!EVIDENCE] Evidence updates confidence.",
        editedSourceBody: "> [!EVIDENCE] Evidence changes confidence.",
        initialValue: "Evidence updates confidence.",
        editedValue: "Evidence changes confidence.",
      },
      equation: {
        initialSourceBody: "Bayesian updating uses $P(H|E)$ as its likelihood.",
        editedSourceBody: "Bayesian updating uses $P(E|H)$ as its likelihood.",
        initialValue: "P(H|E)",
        editedValue: "P(E|H)",
      },
      citation: {
        initialSourceBody: "The prior is documented in [@bayes-1763].",
        editedSourceBody: "The prior is documented in [@laplace-1812].",
        initialValue: "bayes-1763",
        editedValue: "laplace-1812",
      },
    };
    const source = createFixtureAuthoringDraftSource();

    for (const construct of authoringConstructs) {
      const authoring = createKnowledgeAuthoring(source);
      const opened = await authoring.openConstruct(construct);
      assert.equal(opened.outcome, "available");
      if (opened.outcome !== "available") {
        return;
      }

      if (construct === "highlight") {
        assert.equal(opened.draft.rich.semanticText, "prior belief");
        continue;
      }

      const example = examples[construct];
      assert.equal(opened.draft.rich.semanticText, example.initialValue);
      assert.equal(
        opened.draft.source,
        `---\nid: bayesian-statistics\ntitle: Bayesian statistics\ntype: topic\nstatus: working-material\nbase_version: bayesian-statistics-v1\n---\n\n# Bayesian statistics\n\n${example.initialSourceBody}`,
      );

      const edited = await authoring.editSemanticText(example.editedValue);
      assert.equal(edited.outcome, "updated");
      if (edited.outcome !== "updated") {
        return;
      }

      assert.equal(edited.draft.rich.semanticText.length > 0, true);
      assert.equal(
        edited.draft.source.includes(example.editedSourceBody),
        true,
      );
    }
  });
});
