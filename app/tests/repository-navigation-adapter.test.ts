import { strict as assert } from "node:assert";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it } from "vitest";

import { createFileBackedRepositoryNavigation } from "../src/adapters/knowledge-repository/file-backed-repository-navigation";
import { createFileBackedWorkingMaterialNoteRepository } from "../src/adapters/working-material/file-backed-working-material-note-repository";

const fixturePath = join(
  process.cwd(),
  "tests",
  "fixtures",
  "knowledge-repository",
);

describe("file-backed TB17 adapters", () => {
  it("enumerates canonical roots and supported repository-relative entries", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-tb17-tree-"),
    );
    const repositoryPath = join(temporaryRoot, "repository");
    await cp(fixturePath, repositoryPath, { recursive: true });

    try {
      const navigation = createFileBackedRepositoryNavigation(repositoryPath);
      const tree = await navigation.readEntries();
      assert.equal(tree.outcome, "available");
      if (tree.outcome !== "available") return;

      const paths = tree.entries.map((entry) => entry.path);
      assert.deepEqual(paths.slice(0, 7), [
        "assets",
        "assets/README.md",
        "knowledge",
        "knowledge/bayesian-statistics.md",
        "knowledge/README.md",
        "knowledge/registries",
        "knowledge/registries/glossary.yaml",
      ]);
      assert.equal(paths.includes(".galaxy-brain"), false);
      assert.equal(
        paths.includes(
          "scratch/synthesis-results/synthesis-result-bayesian-statistics-fixture.json",
        ),
        true,
      );

      const topic = await navigation.openEntry(
        "knowledge/bayesian-statistics.md",
      );
      assert.equal(topic.outcome, "topic");
      assert.equal(topic.identity, "bayesian-statistics");
      assert.deepEqual(await navigation.openEntry("../outside.md"), {
        outcome: "unavailable",
        detail: "The repository navigation target is unavailable.",
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("writes portable notes and preserves external edits on fingerprint conflict", async () => {
    const temporaryRoot = await mkdtemp(
      join(tmpdir(), "galaxy-brain-tb17-note-"),
    );
    const repositoryPath = join(temporaryRoot, "repository");
    await cp(fixturePath, repositoryPath, { recursive: true });

    try {
      const repository =
        createFileBackedWorkingMaterialNoteRepository(repositoryPath);
      const created = await repository.createNote({
        title: "Bayesian statistics working note",
        body: "Prior belief needs evidence.",
        date: "2026-09-01",
      });
      assert.equal(created.outcome, "available");
      if (created.outcome !== "available") return;
      assert.equal(
        created.note.path,
        "scratch/tb17-bayesian-statistics-working-note.md",
      );
      assert.match(
        created.note.source,
        /title: Bayesian statistics working note/u,
      );

      const loaded = await repository.readNote(created.note.path);
      assert.equal(loaded.outcome, "available");
      if (loaded.outcome !== "available") return;
      await writeFile(
        join(repositoryPath, created.note.path),
        `${loaded.note.source}External edit\n`,
      );

      const save = await repository.saveNote({
        path: created.note.path,
        title: created.note.title,
        body: "Agent edit must not overwrite.",
        expectedFingerprint: loaded.note.fingerprint,
      });
      assert.equal(save.outcome, "external-change");
      assert.match(
        (await readFile(join(repositoryPath, created.note.path))).toString(),
        /External edit/u,
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
