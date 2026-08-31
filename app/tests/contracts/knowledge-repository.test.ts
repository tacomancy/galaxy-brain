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
import {
  createWorkbenchSession,
  type WorkbenchContext,
  type WorkbenchSessionSnapshot,
} from "../../src/modules/workbench-session";
import type { StructuredAnnotation } from "../../src/modules/source-processing";

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
      '# A harmless comment\nformat_version: 1 # still V1\nformat: "galaxy-brain" # quoted V1\nextra: preserved\n';
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

    const unsupportedPath = join(temporaryRoot, "unsupported-repository");
    await cp(
      resolve(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      unsupportedPath,
      { recursive: true },
    );
    await writeFile(
      join(unsupportedPath, "galaxy-brain.yaml"),
      "format: other-system\nformat_version: 1\n",
    );

    assert.deepEqual(
      await createFileBackedKnowledgeRepository(starterRoot).openAt(
        unsupportedPath,
      ),
      {
        outcome: "unsupported-format",
        detail: "The selected target uses an unsupported repository format.",
      },
    );
  });

  it("reports malformed filesystem input as an opening failure", async () => {
    assert.deepEqual(
      await createFileBackedKnowledgeRepository(starterRoot).openAt("\0"),
      {
        outcome: "operation-failed",
        detail: "The Knowledge Repository could not be opened.",
      },
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

  it("reports an unreadable workbench context without hiding the failure", async () => {
    const repositoryPath = join(temporaryRoot, "unreadable-context-repository");
    await cp(
      resolve(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );
    await rm(
      join(repositoryPath, "sources", "papers", "bayesian-statistics.md"),
    );

    const result =
      await createFileBackedKnowledgeRepository(
        starterRoot,
      ).readWorkbenchContext(repositoryPath);

    assert.deepEqual(result.outcome, "unavailable");
    if (result.outcome === "unavailable") {
      assert.equal(
        result.detail,
        "The selected repository context could not be read.",
      );
      assert.equal(result.cause instanceof Error, true);
    }
  });

  it("reports all complete contexts in stable order when a repository has multiple topics", async () => {
    const repositoryPath = join(temporaryRoot, "ambiguous-context-repository");
    await cp(
      resolve(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );
    await rm(join(repositoryPath, "knowledge", "bayesian-statistics.md"));
    await rm(
      join(repositoryPath, "sources", "papers", "bayesian-statistics.md"),
    );

    await writeFile(
      join(repositoryPath, "knowledge", "zeta-topic.md"),
      `---
id: zeta-topic
title: Zeta topic
type: topic
source_record: sources/papers/zeta-source.md
---
`,
      "utf8",
    );
    await writeFile(
      join(repositoryPath, "knowledge", "alpha-topic.md"),
      `---
id: alpha-topic
title: Alpha topic
type: topic
source_record: sources/papers/alpha-source.md
---
`,
      "utf8",
    );
    await writeFile(
      join(repositoryPath, "knowledge", "incomplete-topic.md"),
      `---
id: incomplete-topic
title: Incomplete topic
type: topic
source_record: sources/papers/missing-source.md
---
`,
      "utf8",
    );
    await writeFile(
      join(repositoryPath, "sources", "papers", "zeta-source.md"),
      `---
id: zeta-source
title: Zeta source
type: source
---
`,
      "utf8",
    );
    await writeFile(
      join(repositoryPath, "sources", "papers", "alpha-source.md"),
      `---
id: alpha-source
title: Alpha source
type: source
---
`,
      "utf8",
    );

    const result =
      await createFileBackedKnowledgeRepository(
        starterRoot,
      ).readWorkbenchContext(repositoryPath);

    assert.deepEqual(result, {
      outcome: "ambiguous",
      contexts: [
        {
          topic: { id: "alpha-topic", title: "Alpha topic" },
          sourceRecord: { id: "alpha-source", title: "Alpha source" },
        },
        {
          topic: { id: "zeta-topic", title: "Zeta topic" },
          sourceRecord: { id: "zeta-source", title: "Zeta source" },
        },
      ],
    });
  });

  it("reads the saved source annotation for its Source Record", async () => {
    const repositoryPath = join(temporaryRoot, "annotation-repository");
    await cp(
      resolve(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );

    assert.deepEqual(
      await createFileBackedKnowledgeRepository(
        starterRoot,
      ).readWorkbenchAnnotation(
        repositoryPath,
        "bayesian-statistics-fixture-source",
      ),
      {
        outcome: "found",
        annotation: {
          id: "annotation-bayesian-statistics-fixture-source-page-2-0-54",
          state: "working-material",
          sourceRecord: {
            id: "bayesian-statistics-fixture-source",
            title: "Bayesian statistics fixture source",
          },
          sourceLocator: {
            page: 2,
            start: 0,
            end: 54,
            logical: "page:2#chars=0-54",
          },
          text: "Bayesian inference updates prior belief with evidence.",
          attribution: "source-claim",
          classification: "source-claim",
        },
      },
    );
  });
});

describe("Workbench Session selection contract", () => {
  it("reads and persists the explicit theme without repository content", async () => {
    const unselectedSession = createWorkbenchSession(
      {
        createAt: async () => ({
          outcome: "created" as const,
          repositoryPath: "/unselected-repository",
        }),
        openAt: async () => ({
          outcome: "opened" as const,
          repositoryPath: "/unselected-repository",
        }),
        readWorkbenchContext: async () => ({
          outcome: "not-found" as const,
          detail: "No context.",
        }),
        readWorkbenchAnnotation: async () => ({
          outcome: "not-found" as const,
          detail: "No annotation.",
        }),
      },
      { readSession: async () => undefined, writeSession: async () => {} },
    );

    assert.deepEqual(await unselectedSession.setTheme("dark"), {
      outcome: "updated",
      theme: "dark",
    });

    let writeCount = 0;
    const selectedSession = createWorkbenchSession(
      {
        createAt: async () => ({
          outcome: "created" as const,
          repositoryPath: "/selected-repository",
        }),
        openAt: async () => ({
          outcome: "opened" as const,
          repositoryPath: "/selected-repository",
        }),
        readWorkbenchContext: async () => ({
          outcome: "not-found" as const,
          detail: "No context.",
        }),
        readWorkbenchAnnotation: async () => ({
          outcome: "not-found" as const,
          detail: "No annotation.",
        }),
      },
      {
        readSession: async () => ({
          selectedRepositoryPath: "/selected-repository",
          theme: "dark",
        }),
        writeSession: async () => {
          writeCount += 1;
          if (writeCount > 1) {
            throw new Error("theme persistence unavailable");
          }
        },
      },
    );

    assert.equal(await selectedSession.readTheme(), "dark");
    // This invalid value deliberately exercises the runtime boundary behind the typed API.
    assert.deepEqual(await selectedSession.setTheme("sepia" as never), {
      outcome: "operation-failed",
      detail: "The selected theme is not supported.",
    });
    assert.deepEqual(await selectedSession.setTheme("light"), {
      outcome: "updated",
      theme: "light",
    });
    assert.deepEqual(await selectedSession.setTheme("dark"), {
      outcome: "operation-failed",
      detail: "The Workbench theme could not be saved.",
    });
  });

  it("keeps ambiguous context candidates visible until the user selects one", async () => {
    const contexts: WorkbenchContext[] = [
      {
        topic: { id: "alpha-topic", title: "Alpha topic" },
        sourceRecord: { id: "alpha-source", title: "Alpha source" },
      },
      {
        topic: { id: "zeta-topic", title: "Zeta topic" },
        sourceRecord: { id: "zeta-source", title: "Zeta source" },
      },
    ];

    const session = createWorkbenchSession(
      {
        createAt: async () => ({
          outcome: "created" as const,
          repositoryPath: "/ambiguous-repository",
        }),
        openAt: async () => ({
          outcome: "opened" as const,
          repositoryPath: "/ambiguous-repository",
        }),
        readWorkbenchContext: async () => ({
          outcome: "ambiguous" as const,
          contexts,
        }),
        readWorkbenchAnnotation: async () => ({
          outcome: "not-found" as const,
          detail: "The source annotation was not found.",
        }),
      },
      {
        readSession: async () => undefined,
        writeSession: async () => {},
      },
    );

    assert.deepEqual(await session.createRepository("/requested-repository"), {
      outcome: "created",
      repositoryPath: "/ambiguous-repository",
    });
    assert.deepEqual(await session.openFreshWorkbench(), {
      activeWorkspace: "atlas",
      repositoryStatus: "selected",
      repositoryPath: "/ambiguous-repository",
      repositoryAccess: "read-write",
      repositorySelection: "created",
      contextOptions: contexts,
    });
  });

  it("selects and persists one explicit context candidate", async () => {
    const contexts: WorkbenchContext[] = [
      {
        topic: { id: "alpha-topic", title: "Alpha topic" },
        sourceRecord: { id: "alpha-source", title: "Alpha source" },
      },
      {
        topic: { id: "zeta-topic", title: "Zeta topic" },
        sourceRecord: { id: "zeta-source", title: "Zeta source" },
      },
    ];
    let latestSnapshot: WorkbenchSessionSnapshot | undefined;

    const session = createWorkbenchSession(
      {
        createAt: async () => ({
          outcome: "created" as const,
          repositoryPath: "/ambiguous-repository",
        }),
        openAt: async () => ({
          outcome: "opened" as const,
          repositoryPath: "/ambiguous-repository",
        }),
        readWorkbenchContext: async () => ({
          outcome: "ambiguous" as const,
          contexts,
        }),
        readWorkbenchAnnotation: async () => ({
          outcome: "not-found" as const,
          detail: "The source annotation was not found.",
        }),
      },
      {
        readSession: async () => undefined,
        writeSession: async (snapshot) => {
          latestSnapshot = snapshot;
        },
      },
    );

    await session.createRepository("/requested-repository");

    assert.deepEqual(
      await session.selectWorkbenchContext({
        topicId: "zeta-topic",
        sourceRecordId: "zeta-source",
      }),
      {
        outcome: "selected",
        workbench: {
          activeWorkspace: "atlas",
          repositoryStatus: "selected",
          repositoryPath: "/ambiguous-repository",
          repositoryAccess: "read-write",
          repositorySelection: "created",
          context: contexts[1],
        },
      },
    );
    assert.deepEqual(latestSnapshot, {
      selectedRepositoryPath: "/ambiguous-repository",
      activeWorkspace: "atlas",
      selectedContext: {
        topicId: "zeta-topic",
        sourceRecordId: "zeta-source",
      },
    });
    assert.deepEqual(await session.switchWorkspace("studio"), {
      outcome: "transitioned",
      workbench: {
        activeWorkspace: "studio",
        repositoryStatus: "selected",
        repositoryPath: "/ambiguous-repository",
        repositoryAccess: "read-write",
        repositorySelection: "created",
        context: contexts[1],
      },
    });
    assert.deepEqual(latestSnapshot, {
      selectedRepositoryPath: "/ambiguous-repository",
      activeWorkspace: "studio",
      selectedContext: {
        topicId: "zeta-topic",
        sourceRecordId: "zeta-source",
      },
    });
    assert.deepEqual(await session.openFreshWorkbench(), {
      activeWorkspace: "studio",
      repositoryStatus: "selected",
      repositoryPath: "/ambiguous-repository",
      repositoryAccess: "read-write",
      repositorySelection: "created",
      context: contexts[1],
    });
  });

  it("keeps a replacement candidate explicit when the remembered context disappears", async () => {
    const replacementContext: WorkbenchContext = {
      topic: { id: "replacement-topic", title: "Replacement topic" },
      sourceRecord: {
        id: "replacement-source",
        title: "Replacement source",
      },
    };
    const session = createWorkbenchSession(
      {
        createAt: async () => ({
          outcome: "created" as const,
          repositoryPath: "/replacement-repository",
        }),
        openAt: async () => ({
          outcome: "opened" as const,
          repositoryPath: "/replacement-repository",
        }),
        readWorkbenchContext: async () => ({
          outcome: "available" as const,
          context: replacementContext,
        }),
        readWorkbenchAnnotation: async () => ({
          outcome: "not-found" as const,
          detail: "The source annotation was not found.",
        }),
      },
      {
        readSession: async () => ({
          selectedRepositoryPath: "/replacement-repository",
          selectedContext: {
            topicId: "removed-topic",
            sourceRecordId: "removed-source",
          },
        }),
        writeSession: async () => {},
      },
    );

    assert.deepEqual(await session.openFreshWorkbench(), {
      activeWorkspace: "atlas",
      repositoryStatus: "selected",
      repositoryPath: "/replacement-repository",
      repositoryAccess: "read-write",
      repositorySelection: "opened",
      contextOptions: [replacementContext],
    });
  });

  it("preserves the selected repository after a failed replacement", async () => {
    const session = createWorkbenchSession(
      {
        createAt: async () => ({
          outcome: "created",
          repositoryPath: "/created-repository",
        }),
        openAt: async () => ({
          outcome: "invalid-format",
          detail: "invalid",
        }),
        readWorkbenchContext: async () => ({
          outcome: "not-found",
          detail: "No contextual topic is available.",
        }),
        readWorkbenchAnnotation: async () => ({
          outcome: "not-found",
          detail: "The source annotation was not found.",
        }),
      },
      {
        readSession: async () => undefined,
        writeSession: async () => {},
      },
    );

    assert.deepEqual(await session.createRepository("/requested-repository"), {
      outcome: "created",
      repositoryPath: "/created-repository",
    });
    assert.deepEqual(await session.openFreshWorkbench(), {
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
    assert.deepEqual(await session.openFreshWorkbench(), {
      activeWorkspace: "atlas",
      repositoryStatus: "selected",
      repositoryPath: "/created-repository",
      repositoryAccess: "read-write",
      repositorySelection: "created",
    });
  });

  it("carries repository context through workspace and reading transitions", async () => {
    const context: WorkbenchContext = {
      topic: { id: "topic-id", title: "Bayesian statistics" },
      sourceRecord: {
        id: "source-id",
        title: "Bayesian statistics fixture source",
      },
    };
    const annotation: StructuredAnnotation = {
      id: "annotation-id",
      state: "working-material",
      sourceRecord: context.sourceRecord,
      sourceLocator: {
        page: 2,
        start: 10,
        end: 54,
        logical: "page:2#chars=10-54",
      },
      text: "Bayesian inference updates prior belief with evidence.",
      attribution: "source-claim",
      classification: "source-claim",
    };
    let latestSnapshot: WorkbenchSessionSnapshot | undefined;

    const session = createWorkbenchSession(
      {
        createAt: async () => ({
          outcome: "created" as const,
          repositoryPath: "/contextual-repository",
        }),
        openAt: async () => ({
          outcome: "opened" as const,
          repositoryPath: "/contextual-repository",
        }),
        readWorkbenchContext: async () => ({
          outcome: "available" as const,
          context,
        }),
        readWorkbenchAnnotation: async () => ({
          outcome: "found" as const,
          annotation,
        }),
      },
      {
        readSession: async () => undefined,
        writeSession: async (snapshot) => {
          latestSnapshot = snapshot;
        },
      },
    );

    assert.deepEqual(await session.createRepository("/requested-repository"), {
      outcome: "created",
      repositoryPath: "/contextual-repository",
    });
    assert.deepEqual(await session.openTopicInStudio("topic-id"), {
      outcome: "transitioned",
      workbench: {
        activeWorkspace: "studio",
        repositoryStatus: "selected",
        repositoryPath: "/contextual-repository",
        repositoryAccess: "read-write",
        repositorySelection: "created",
        context,
        sourceAnnotation: annotation,
      },
    });
    assert.deepEqual(await session.openSourceRecordInPaperDesk("source-id"), {
      outcome: "transitioned",
      workbench: {
        activeWorkspace: "paper-desk",
        repositoryStatus: "selected",
        repositoryPath: "/contextual-repository",
        repositoryAccess: "read-write",
        repositorySelection: "created",
        context,
        sourceAnnotation: annotation,
      },
    });
    assert.deepEqual(await session.switchWorkspace("atlas"), {
      outcome: "transitioned",
      workbench: {
        activeWorkspace: "atlas",
        repositoryStatus: "selected",
        repositoryPath: "/contextual-repository",
        repositoryAccess: "read-write",
        repositorySelection: "created",
        context,
      },
    });
    assert.deepEqual(await session.openSavedAnnotation(), {
      outcome: "position-restored",
      workbench: {
        activeWorkspace: "paper-desk",
        repositoryStatus: "selected",
        repositoryPath: "/contextual-repository",
        repositoryAccess: "read-write",
        repositorySelection: "created",
        context,
        sourceAnnotation: annotation,
        readingPosition: {
          sourceRecordId: "source-id",
          page: 2,
          characterOffset: 10,
        },
      },
    });
    assert.deepEqual(latestSnapshot, {
      selectedRepositoryPath: "/contextual-repository",
      activeWorkspace: "paper-desk",
      selectedContext: {
        topicId: "topic-id",
        sourceRecordId: "source-id",
      },
      readingPosition: {
        sourceRecordId: "source-id",
        page: 2,
        characterOffset: 10,
      },
    });
  });
});
