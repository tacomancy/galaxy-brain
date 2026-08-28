import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createInMemoryWorkingMaterialRepository } from "../../src/adapters/working-material/in-memory-working-material-repository";
import { createSourceProcessing } from "../../src/modules/source-processing";

const sourceRecord = {
  id: "bayesian-statistics-fixture-source",
  title: "Bayesian statistics fixture source",
};

const annotation = {
  id: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
  state: "working-material" as const,
  sourceRecord,
  sourceLocator: {
    page: 2,
    start: 0,
    end: 54,
    logical: "page:2#chars=0-54",
  },
  text: "Bayesian inference updates prior belief with evidence.",
  attribution: "source-claim" as const,
  classification: "source-claim" as const,
};

describe("TB15 missing PDF behavior", () => {
  it("reports the recorded identities when the linked PDF is available", async () => {
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => ({
          outcome: "located" as const,
          text: annotation.text,
        }),
      },
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      sourceAsset: {
        readIdentity: async () => ({
          outcome: "available" as const,
          sourceIdentity: "source-identity-bayesian-statistics-v1",
          contentIdentity: "content-identity-bayesian-statistics-v1",
        }),
        relink: async () => ({
          outcome: "available" as const,
          sourceIdentity: "source-identity-bayesian-statistics-v1",
          contentIdentity: "content-identity-bayesian-statistics-v1",
        }),
      },
    });

    assert.deepEqual(
      await sourceProcessing.checkSourceAvailability({
        sourceRecord,
        expectedSourceIdentity: "source-identity-bayesian-statistics-v1",
        expectedContentIdentity: "content-identity-bayesian-statistics-v1",
      }),
      {
        outcome: "available",
        sourceRecord,
        sourceIdentity: "source-identity-bayesian-statistics-v1",
        contentIdentity: "content-identity-bayesian-statistics-v1",
      },
    );
  });

  it("preserves the Source Record and annotation when the linked PDF is unavailable", async () => {
    const workingMaterial = createInMemoryWorkingMaterialRepository();
    await workingMaterial.saveAnnotation(annotation);
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => ({
          outcome: "source-unavailable" as const,
          detail: "The linked fixture PDF is missing.",
        }),
      },
      workingMaterial,
      sourceAsset: {
        readIdentity: async () => ({
          outcome: "unavailable" as const,
          detail: "The linked fixture PDF is missing.",
        }),
        relink: async () => ({
          outcome: "unavailable" as const,
          detail: "The linked fixture PDF is missing.",
        }),
      },
    });

    const outcome = await sourceProcessing.checkSourceAvailability({
      sourceRecord,
      expectedSourceIdentity: "source-identity-bayesian-statistics-v1",
      expectedContentIdentity: "content-identity-bayesian-statistics-v1",
    });

    assert.deepEqual(outcome, {
      outcome: "source-status-unavailable",
      sourceRecord,
      warning: "source status unavailable",
      detail: "The linked fixture PDF is missing.",
    });
    assert.deepEqual(await workingMaterial.readAnnotation(annotation.id), {
      outcome: "found",
      annotation,
    });
  });

  it("translates an identity-check failure into unavailable status", async () => {
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => ({
          outcome: "source-unavailable" as const,
          detail: "The linked fixture PDF is missing.",
        }),
      },
      workingMaterial: createInMemoryWorkingMaterialRepository(),
      sourceAsset: {
        readIdentity: async () => {
          throw new Error("simulated identity reader failure");
        },
        relink: async () => ({
          outcome: "unavailable" as const,
          detail: "The linked fixture PDF is missing.",
        }),
      },
    });

    assert.deepEqual(
      await sourceProcessing.checkSourceAvailability({
        sourceRecord,
        expectedSourceIdentity: "source-identity-bayesian-statistics-v1",
        expectedContentIdentity: "content-identity-bayesian-statistics-v1",
      }),
      {
        outcome: "source-status-unavailable",
        sourceRecord,
        warning: "source status unavailable",
        detail: "The linked source asset could not be checked.",
      },
    );
  });

  it("reports changed linked bytes without replacing the Source Record or annotation", async () => {
    const workingMaterial = createInMemoryWorkingMaterialRepository();
    await workingMaterial.saveAnnotation(annotation);
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => ({
          outcome: "located" as const,
          text: annotation.text,
        }),
      },
      workingMaterial,
      sourceAsset: {
        readIdentity: async () => ({
          outcome: "available" as const,
          sourceIdentity: "source-identity-bayesian-statistics-v2",
          contentIdentity: "content-identity-bayesian-statistics-v2",
        }),
        relink: async () => ({
          outcome: "available" as const,
          sourceIdentity: "source-identity-bayesian-statistics-v2",
          contentIdentity: "content-identity-bayesian-statistics-v2",
        }),
      },
    });

    const outcome = await sourceProcessing.checkSourceAvailability({
      sourceRecord,
      expectedSourceIdentity: "source-identity-bayesian-statistics-v1",
      expectedContentIdentity: "content-identity-bayesian-statistics-v1",
    });

    assert.deepEqual(outcome, {
      outcome: "source-changed",
      sourceRecord,
      warning: "source status changed",
      expectedSourceIdentity: "source-identity-bayesian-statistics-v1",
      expectedContentIdentity: "content-identity-bayesian-statistics-v1",
      actualSourceIdentity: "source-identity-bayesian-statistics-v2",
      actualContentIdentity: "content-identity-bayesian-statistics-v2",
    });
    assert.deepEqual(await workingMaterial.readAnnotation(annotation.id), {
      outcome: "found",
      annotation,
    });
  });

  it("accepts only an explicit verified relink and preserves the logical locator", async () => {
    const workingMaterial = createInMemoryWorkingMaterialRepository();
    await workingMaterial.saveAnnotation(annotation);
    let currentIdentity = {
      sourceIdentity: "source-identity-bayesian-statistics-v1",
      contentIdentity: "content-identity-bayesian-statistics-v1",
    };
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => ({
          outcome: "located" as const,
          text: annotation.text,
        }),
      },
      workingMaterial,
      sourceAsset: {
        readIdentity: async () => ({
          outcome: "available" as const,
          ...currentIdentity,
        }),
        relink: async () => {
          currentIdentity = {
            sourceIdentity: "source-identity-bayesian-statistics-v2",
            contentIdentity: "content-identity-bayesian-statistics-v2",
          };
          return { outcome: "available" as const, ...currentIdentity };
        },
      },
    });

    const outcome = await sourceProcessing.relinkSource({
      sourceRecord,
      expectedSourceIdentity: "source-identity-bayesian-statistics-v1",
      expectedContentIdentity: "content-identity-bayesian-statistics-v1",
      replacementReference: "/machine-local/known-bayesian-statistics-v2.pdf",
    });

    assert.deepEqual(outcome, {
      outcome: "relinked",
      sourceRecord,
      sourceIdentity: "source-identity-bayesian-statistics-v2",
      contentIdentity: "content-identity-bayesian-statistics-v2",
    });
    assert.deepEqual(
      await sourceProcessing.checkSourceAvailability({
        sourceRecord,
        expectedSourceIdentity: "source-identity-bayesian-statistics-v2",
        expectedContentIdentity: "content-identity-bayesian-statistics-v2",
      }),
      {
        outcome: "available",
        sourceRecord,
        sourceIdentity: "source-identity-bayesian-statistics-v2",
        contentIdentity: "content-identity-bayesian-statistics-v2",
      },
    );
    assert.deepEqual(await workingMaterial.readAnnotation(annotation.id), {
      outcome: "found",
      annotation,
    });
  });

  it("does not mutate the link or annotation when relinking is unavailable", async () => {
    const workingMaterial = createInMemoryWorkingMaterialRepository();
    await workingMaterial.saveAnnotation(annotation);
    const sourceProcessing = createSourceProcessing({
      pdf: {
        readSelection: async () => ({
          outcome: "located" as const,
          text: annotation.text,
        }),
      },
      workingMaterial,
      sourceAsset: {
        readIdentity: async () => ({
          outcome: "available" as const,
          sourceIdentity: "source-identity-bayesian-statistics-v1",
          contentIdentity: "content-identity-bayesian-statistics-v1",
        }),
        relink: async () => ({
          outcome: "unavailable" as const,
          detail: "The replacement fixture PDF is unavailable.",
        }),
      },
    });

    const outcome = await sourceProcessing.relinkSource({
      sourceRecord,
      expectedSourceIdentity: "source-identity-bayesian-statistics-v1",
      expectedContentIdentity: "content-identity-bayesian-statistics-v1",
      replacementReference: "/machine-local/missing-bayesian-statistics.pdf",
    });

    assert.deepEqual(outcome, {
      outcome: "source-status-unavailable",
      sourceRecord,
      warning: "source status unavailable",
      detail: "The replacement fixture PDF is unavailable.",
    });
    assert.deepEqual(await workingMaterial.readAnnotation(annotation.id), {
      outcome: "found",
      annotation,
    });
  });
});
