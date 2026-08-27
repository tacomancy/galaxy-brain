import { strict as assert } from "node:assert";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename as realRename,
  rm,
  realpath,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { afterEach, beforeEach, describe, it } from "vitest";

import {
  createFileBackedKnowledgeRepository,
  type KnowledgeRepositoryFileSystem,
} from "../../src/adapters/knowledge-repository/file-backed-knowledge-repository";
import { createWorkbenchSession } from "../../src/modules/workbench-session";

const canonicalRoots = [
  "assets",
  "knowledge",
  "projects",
  "proposals",
  "scratch",
  "sources",
  "templates",
] as const;

const starterInventory = [
  ".gitattributes",
  "README.md",
  "assets/README.md",
  "galaxy-brain.yaml",
  "knowledge/README.md",
  "knowledge/registries/glossary.yaml",
  "knowledge/registries/math-macros.yaml",
  "knowledge/registries/tags.yaml",
  "projects/README.md",
  "proposals/README.md",
  "proposals/applied/README.md",
  "scratch/README.md",
  "sources/README.md",
  "sources/books/.gitkeep",
  "sources/courses/.gitkeep",
  "sources/papers/.gitkeep",
  "sources/web/.gitkeep",
  "templates/README.md",
  "templates/book.md",
  "templates/course.md",
  "templates/decision.md",
  "templates/other.md",
  "templates/paper.md",
  "templates/practice.md",
  "templates/project.md",
  "templates/proposal.md",
  "templates/scratch.md",
  "templates/topic.md",
  "templates/web.md",
] as const;

const expectedStarterEntries = [
  ".gitattributes",
  "README.md",
  "assets",
  "assets/README.md",
  "galaxy-brain.yaml",
  "knowledge",
  "knowledge/README.md",
  "knowledge/registries",
  "knowledge/registries/glossary.yaml",
  "knowledge/registries/math-macros.yaml",
  "knowledge/registries/tags.yaml",
  "projects",
  "projects/README.md",
  "proposals",
  "proposals/README.md",
  "proposals/applied",
  "proposals/applied/README.md",
  "scratch",
  "scratch/README.md",
  "sources",
  "sources/README.md",
  "sources/books",
  "sources/books/.gitkeep",
  "sources/courses",
  "sources/courses/.gitkeep",
  "sources/papers",
  "sources/papers/.gitkeep",
  "sources/web",
  "sources/web/.gitkeep",
  "templates",
  "templates/README.md",
  "templates/book.md",
  "templates/course.md",
  "templates/decision.md",
  "templates/other.md",
  "templates/paper.md",
  "templates/practice.md",
  "templates/project.md",
  "templates/proposal.md",
  "templates/scratch.md",
  "templates/topic.md",
  "templates/web.md",
] as const;

const listEntries = async (root: string, current = ""): Promise<string[]> => {
  const entries = await readdir(join(root, current), { withFileTypes: true });
  const paths: string[] = [];

  for (const entry of entries) {
    const entryPath = join(current, entry.name);
    paths.push(entryPath);

    if (entry.isDirectory()) {
      paths.push(...(await listEntries(root, entryPath)));
    }
  }

  return paths.sort();
};

describe("file-backed Knowledge Repository contract", () => {
  let temporaryRoot: string;
  const starterRoot = resolve(
    process.cwd(),
    "templates",
    "knowledge-repository",
  );

  beforeEach(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
  });

  afterEach(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("creates the complete V1 starter inventory", async () => {
    const repositoryPath = join(temporaryRoot, "created-repository");
    const repository = createFileBackedKnowledgeRepository(starterRoot);

    assert.deepEqual(await repository.createAt(repositoryPath), {
      outcome: "created",
      repositoryPath: await realpath(repositoryPath),
    });

    assert.equal(
      await readFile(join(repositoryPath, "galaxy-brain.yaml"), "utf8"),
      "format: galaxy-brain\nformat_version: 1\n",
    );

    assert.deepEqual(await listEntries(repositoryPath), expectedStarterEntries);

    for (const root of canonicalRoots) {
      assert.equal(
        (await readdir(join(repositoryPath, root))).length >= 0,
        true,
        `expected canonical root ${root}`,
      );
    }

    for (const relativePath of starterInventory) {
      const contents = await readFile(join(repositoryPath, relativePath));
      assert.ok(contents.length >= 0, `expected starter entry ${relativePath}`);
    }
  });

  it("preserves unknown content when opening a valid repository", async () => {
    const repositoryPath = join(temporaryRoot, "existing-repository");
    const unknownPath = join(repositoryPath, "knowledge", "user-extension.txt");
    await cp(
      resolve(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      {
        recursive: true,
      },
    );
    await writeFile(unknownPath, "user content must survive opening\n");

    const outcome =
      await createFileBackedKnowledgeRepository(starterRoot).openAt(
        repositoryPath,
      );

    assert.deepEqual(outcome, {
      outcome: "opened",
      repositoryPath: await realpath(repositoryPath),
    });
    assert.equal(
      await readFile(unknownPath, "utf8"),
      "user content must survive opening\n",
    );
  });

  it("accepts compatible YAML presentation without rewriting unknown content", async () => {
    const repositoryPath = join(temporaryRoot, "presentation-repository");
    const unknownPath = join(repositoryPath, "knowledge", "user-extension.txt");
    await cp(
      resolve(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    const manifest =
      "# A harmless comment\nformat_version: 1 # still V1\nformat: galaxy-brain\nextra: preserved\n";
    await writeFile(join(repositoryPath, "galaxy-brain.yaml"), manifest);
    await writeFile(unknownPath, "preserve this content\n");

    assert.deepEqual(
      await createFileBackedKnowledgeRepository(starterRoot).openAt(
        repositoryPath,
      ),
      {
        outcome: "opened",
        repositoryPath: await realpath(repositoryPath),
      },
    );
    assert.equal(
      await readFile(join(repositoryPath, "galaxy-brain.yaml"), "utf8"),
      manifest,
    );
    assert.equal(
      await readFile(unknownPath, "utf8"),
      "preserve this content\n",
    );
  });

  it("rejects unsafe entries without selecting the repository", async () => {
    const repositoryPath = join(temporaryRoot, "unsafe-repository");
    await cp(
      resolve(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      {
        recursive: true,
      },
    );
    await symlink(
      join(repositoryPath, "README.md"),
      join(repositoryPath, "unsafe-link"),
    );

    assert.deepEqual(
      await createFileBackedKnowledgeRepository(starterRoot).openAt(
        repositoryPath,
      ),
      {
        outcome: "unsafe-target",
        detail: "The selected target contains unsafe filesystem entries.",
      },
    );
  });

  it("reports a missing creation parent as unavailable", async () => {
    const repositoryPath = join(temporaryRoot, "missing-parent", "repository");

    assert.deepEqual(
      await createFileBackedKnowledgeRepository(starterRoot).createAt(
        repositoryPath,
      ),
      {
        outcome: "target-unavailable",
        detail: "The selected Knowledge Repository is unavailable.",
      },
    );
  });

  it("rejects a non-empty creation target without mutating it", async () => {
    const repositoryPath = join(temporaryRoot, "non-empty-repository");
    await mkdir(repositoryPath);
    const sentinelPath = join(repositoryPath, "sentinel.txt");
    await writeFile(sentinelPath, "keep me\n");

    assert.deepEqual(
      await createFileBackedKnowledgeRepository(starterRoot).createAt(
        repositoryPath,
      ),
      {
        outcome: "operation-failed",
        detail: "The Knowledge Repository could not be created.",
      },
    );
    assert.equal(await readFile(sentinelPath, "utf8"), "keep me\n");
  });

  it("opens newer valid formats read-only and rejects ambiguous manifests", async () => {
    const newerPath = join(temporaryRoot, "newer-repository");
    await cp(
      resolve(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      newerPath,
      {
        recursive: true,
      },
    );
    await writeFile(
      join(newerPath, "galaxy-brain.yaml"),
      "format: galaxy-brain\nformat_version: 2\n",
    );

    assert.deepEqual(
      await createFileBackedKnowledgeRepository(starterRoot).openAt(newerPath),
      {
        outcome: "read-only-compatible",
        repositoryPath: await realpath(newerPath),
      },
    );

    const malformedPath = join(temporaryRoot, "malformed-repository");
    await cp(newerPath, malformedPath, { recursive: true });
    await writeFile(
      join(malformedPath, "galaxy-brain.yaml"),
      "format: galaxy-brain\nformat: other-system\nformat_version: 1\n",
    );

    assert.deepEqual(
      await createFileBackedKnowledgeRepository(starterRoot).openAt(
        malformedPath,
      ),
      {
        outcome: "invalid-format",
        detail: "The selected target is not a valid Knowledge Repository.",
      },
    );
  });

  it("restores an explicitly empty target after interrupted placement", async () => {
    const repositoryPath = join(temporaryRoot, "empty-repository");
    await mkdir(repositoryPath);
    let renameCount = 0;
    const filesystem: KnowledgeRepositoryFileSystem = {
      rename: async (oldPath, newPath) => {
        renameCount += 1;
        if (renameCount === 2) {
          throw new Error("injected placement failure");
        }

        return realRename(oldPath, newPath);
      },
      rm,
    };

    const outcome = await createFileBackedKnowledgeRepository(
      starterRoot,
      filesystem,
    ).createAt(repositoryPath);

    assert.deepEqual(outcome, {
      outcome: "operation-failed",
      detail: "The Knowledge Repository could not be created.",
    });
    assert.deepEqual(await readdir(repositoryPath), []);
    assert.deepEqual(
      (await readdir(dirname(repositoryPath))).filter((entry) =>
        entry.startsWith(".galaxy-brain-"),
      ),
      [],
    );
  });
});

describe("Workbench Session selection contract", () => {
  it("preserves the selected repository after a failed replacement", async () => {
    const session = createWorkbenchSession({
      createAt: async () => ({
        outcome: "created",
        repositoryPath: "/created-repository",
      }),
      openAt: async () => ({
        outcome: "invalid-format",
        detail: "invalid",
      }),
    });

    assert.deepEqual(await session.createRepository("/requested-repository"), {
      outcome: "created",
      repositoryPath: "/created-repository",
    });
    assert.deepEqual(session.openFreshWorkbench(), {
      activeWorkspace: "atlas",
      repositoryStatus: "selected",
      repositoryPath: "/created-repository",
      repositoryAccess: "read-write",
      repositorySelection: "created",
    });

    assert.deepEqual(await session.openRepository("/invalid-repository"), {
      outcome: "invalid-format",
      detail: "invalid",
    });
    assert.deepEqual(session.openFreshWorkbench(), {
      activeWorkspace: "atlas",
      repositoryStatus: "selected",
      repositoryPath: "/created-repository",
      repositoryAccess: "read-write",
      repositorySelection: "created",
    });
  });
});
