import { strict as assert } from "node:assert";

import { describe, it } from "vitest";

import { createInMemoryWorkingMaterialNoteRepository } from "../src/adapters/working-material/in-memory-working-material-note-repository";
import { createWorkingMaterialNoteAuthoring } from "../src/modules/working-material-authoring";

describe("Working Material note authoring", () => {
  it("creates, saves, edits, and reopens a portable note", async () => {
    const authoring = createWorkingMaterialNoteAuthoring(
      createInMemoryWorkingMaterialNoteRepository(),
      () => "2026-09-01",
    );

    const created = await authoring.createNote();
    assert.equal(created.outcome, "available");
    if (created.outcome !== "available") return;

    const edited = await authoring.editNote({
      title: "Bayesian statistics working note",
      body: "Prior belief needs evidence.",
    });
    assert.equal(edited.outcome, "available");
    if (edited.outcome !== "available") return;

    assert.equal(
      edited.note.path,
      "scratch/tb17-bayesian-statistics-working-note.md",
    );
    assert.equal(edited.note.title, "Bayesian statistics working note");
    assert.equal(edited.note.body, "Prior belief needs evidence.");
    assert.match(edited.note.source, /type: scratch/u);
    assert.match(edited.note.source, /Prior belief needs evidence\./u);

    const reopened = await authoring.openNote(edited.note.path);
    assert.deepEqual(reopened, edited);
  });

  it("rejects an empty title without changing the current note", async () => {
    const authoring = createWorkingMaterialNoteAuthoring(
      createInMemoryWorkingMaterialNoteRepository(),
      () => "2026-09-01",
    );
    await authoring.createNote();

    assert.deepEqual(await authoring.editNote({ title: "  ", body: "x" }), {
      outcome: "invalid",
      detail: "A Working Material note title must be one nonempty line.",
    });
    const current = await authoring.readNote();
    assert.equal(current.outcome, "available");
    if (current.outcome === "available") {
      assert.equal(current.note.title, "Untitled Working Material");
    }
  });
});
