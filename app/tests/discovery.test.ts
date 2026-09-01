import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createFixtureDiscoveryModelAdapter } from "../src/adapters/discovery/fixture-discovery-model";
import {
  createDiscovery,
  createInMemoryDiscoveryRepository,
  type AskPayload,
  type DiscoveryItem,
  type DiscoveryModelAdapter,
} from "../src/modules/discovery";

const source = {
  sourceRecordId: "bayesian-statistics-fixture-source",
  sourceRecordTitle: "Bayesian statistics fixture source",
  locator: "page:2#chars=0-54",
};

const items: DiscoveryItem[] = [
  {
    id: "bayesian-statistics",
    title: "Bayesian statistics",
    kind: "topic",
    authority: "core-knowledge",
    text: "This fixture topic explains Bayesian inference.",
  },
  {
    id: "bayesian-statistics-fixture-source",
    title: "Bayesian statistics fixture source",
    kind: "source-record",
    authority: "source-record",
    text: "This fixture Source Record is associated with the topic.",
  },
  {
    id: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
    title: "Bayesian inference claim",
    kind: "structured-annotation",
    authority: "working-material",
    text: "Bayesian inference updates prior belief with evidence.",
    source,
  },
  {
    id: "annotation-bayesian-statistics-fixture-source-page-2-55-83",
    title: "Evidence confidence claim",
    kind: "structured-annotation",
    authority: "working-material",
    text: "Evidence updates confidence.",
    source: { ...source, locator: "page:2#chars=55-83" },
  },
];

describe("Discovery Module", () => {
  it("returns literal local Search matches with authority and stable ordering", async () => {
    const discovery = createDiscovery({
      repository: createInMemoryDiscoveryRepository(items),
    });

    assert.deepEqual(await discovery.search("Bayesian"), {
      outcome: "found",
      query: "Bayesian",
      results: [
        {
          id: "bayesian-statistics",
          title: "Bayesian statistics",
          kind: "topic",
          authority: "core-knowledge",
          excerpt: "This fixture topic explains Bayesian inference.",
        },
        {
          id: "bayesian-statistics-fixture-source",
          title: "Bayesian statistics fixture source",
          kind: "source-record",
          authority: "source-record",
          excerpt: "This fixture Source Record is associated with the topic.",
        },
        {
          id: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
          title: "Bayesian inference claim",
          kind: "structured-annotation",
          authority: "working-material",
          excerpt: "Bayesian inference updates prior belief with evidence.",
          source,
        },
      ],
    });
    assert.deepEqual(await discovery.search("no such fixture term"), {
      outcome: "no-match",
      query: "no such fixture term",
    });
  });

  it("resolves known Jump targets and rejects unknown commands", async () => {
    const discovery = createDiscovery({
      repository: createInMemoryDiscoveryRepository(items),
    });

    assert.deepEqual(await discovery.jump("Paper Desk"), {
      outcome: "resolved",
      command: "Paper Desk",
      target: { kind: "workspace", workspace: "paper-desk" },
    });
    assert.deepEqual(await discovery.jump("Bayesian statistics"), {
      outcome: "resolved",
      command: "Bayesian statistics",
      target: {
        kind: "topic",
        id: "bayesian-statistics",
        title: "Bayesian statistics",
      },
    });
    assert.deepEqual(await discovery.jump("launch the moon console"), {
      outcome: "not-found",
      command: "launch the moon console",
    });
  });

  it("prepares, regenerates, and confirms an Ask only at the Model Adapter boundary", async () => {
    const requests: AskPayload[] = [];
    const model: DiscoveryModelAdapter = {
      requestAsk: async (payload) => {
        requests.push(payload);
        return {
          outcome: "answered",
          answer: {
            text: "Bayesian inference updates prior belief with evidence.",
            citations: [
              {
                itemId: items[2]!.id,
                title: items[2]!.title,
                authority: items[2]!.authority,
                source,
              },
            ],
            uncertainty: ["The answer is limited to selected context."],
            conflicts: ["The fixture contains claims from Working Material."],
          },
        };
      },
    };
    const discovery = createDiscovery({
      repository: createInMemoryDiscoveryRepository(items),
      model,
    });
    const prepared = await discovery.prepareAsk({
      prompt: "What does the fixture say about Bayesian inference?",
      contextItemIds: [items[2]!.id, items[3]!.id],
    });
    assert.equal(prepared.outcome, "preview-ready");
    if (prepared.outcome !== "preview-ready") {
      return;
    }
    assert.match(prepared.preview.summary, /OpenAI API/u);
    assert.equal(prepared.preview.payload.operation, "ask");
    assert.equal(prepared.preview.payload.context.length, 2);
    assert.equal(requests.length, 0);

    const reduced = await discovery.removeAskContextItem({
      preview: prepared.preview,
      itemId: items[3]!.id,
    });
    assert.equal(reduced.outcome, "preview-ready");
    if (reduced.outcome !== "preview-ready") {
      return;
    }
    assert.equal(reduced.preview.context.length, 1);
    assert.equal(reduced.preview.payload.context[0]!.id, items[2]!.id);

    assert.deepEqual(
      await discovery.confirmAsk({
        preview: reduced.preview,
        confirmation: "declined",
      }),
      { outcome: "declined" },
    );
    assert.equal(requests.length, 0);
    const answer = await discovery.confirmAsk({
      preview: reduced.preview,
      confirmation: "confirmed",
    });
    assert.equal(answer.outcome, "answered");
    assert.equal(requests.length, 1);
    assert.deepEqual(requests[0], reduced.preview.payload);
  });

  it("returns unsupported and provider-unavailable outcomes without a request", async () => {
    const discovery = createDiscovery({
      repository: createInMemoryDiscoveryRepository(items),
    });
    assert.deepEqual(
      await discovery.prepareAsk({ prompt: "What is the capital of Mars?" }),
      {
        outcome: "unsupported",
        detail: "The selected Knowledge Repository does not support this Ask.",
      },
    );

    const prepared = await discovery.prepareAsk({
      prompt: "What does Bayesian inference mean?",
      contextItemIds: [items[2]!.id],
    });
    assert.equal(prepared.outcome, "preview-ready");
    if (prepared.outcome !== "preview-ready") {
      return;
    }
    assert.deepEqual(
      await discovery.confirmAsk({
        preview: prepared.preview,
        confirmation: "confirmed",
      }),
      {
        outcome: "agent-provider-unavailable",
        detail: "Ask requires a configured Agent Provider.",
      },
    );
  });

  it("keeps the fixture Model Adapter response narrow and cited", async () => {
    const outcome = await createFixtureDiscoveryModelAdapter().requestAsk({
      operation: "ask",
      model: "fixture-pinned-model",
      prompt: "What does the fixture say?",
      context: [
        {
          id: items[2]!.id,
          title: items[2]!.title,
          kind: items[2]!.kind,
          authority: items[2]!.authority,
          text: items[2]!.text,
          source,
        },
      ],
    });
    assert.equal(outcome.outcome, "answered");
    if (outcome.outcome !== "answered") {
      return;
    }
    assert.equal(outcome.answer.citations[0]!.itemId, items[2]!.id);
    assert.equal(outcome.answer.uncertainty.length, 1);
  });
});
