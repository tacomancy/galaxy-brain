/** S1 packaged privacy and non-retention workflow for Section C. */
import { strict as assert } from "node:assert";
import type { Dirent } from "node:fs";
import {
  appendFile,
  cp,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, sep } from "node:path";

import { $ } from "@wdio/globals";
import "@wdio/electron-service";

const promptCanaries = [
  "GB_PRIVACY_PROMPT_DO_NOT_RETAIN",
  "GB_PRIVACY_CREDENTIAL",
  "OPENAI_API_KEY",
];

const filesUnder = async (root: string): Promise<string[]> => {
  const files: string[] = [];
  let entries: Dirent<string>[];

  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
};

const assertNoForbiddenMarkers = async (
  roots: string[],
  forbiddenMarkers: string[],
  approvedMarkers: Map<string, Set<string>> = new Map(),
): Promise<void> => {
  for (const root of roots) {
    const files = await filesUnder(root);
    for (const file of files) {
      const contents = await readFile(file, "utf8");
      for (const marker of forbiddenMarkers) {
        const approved = [...approvedMarkers.entries()].some(
          ([approvedRoot, markers]) =>
            file === approvedRoot ||
            (file.startsWith(`${approvedRoot}${sep}`) && markers.has(marker)),
        );
        if (approved) {
          continue;
        }
        assert.doesNotMatch(
          contents,
          new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "u"),
          `Forbidden privacy marker found in ${file}.`,
        );
      }
    }
  }
};

type StateSnapshot = Array<[string, string]>;

const snapshotRoots = async (roots: string[]): Promise<StateSnapshot> => {
  const snapshot: StateSnapshot = [];

  for (const root of roots) {
    for (const file of await filesUnder(root)) {
      snapshot.push([file, (await readFile(file)).toString("base64")]);
    }
  }

  return snapshot.sort(([left], [right]) => left.localeCompare(right));
};

const assertStateUnchanged = (
  before: StateSnapshot,
  after: StateSnapshot,
): void => {
  assert.deepEqual(after, before, "The operation changed local state.");
};

describe("Section C provider-free privacy gate", () => {
  let temporaryRoot: string;

  before(async () => {
    temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-privacy-"));
  });

  after(async () => {
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("does not retain a declined Ask prompt in packaged state", async () => {
    const sessionStateRoot = process.env.GALAXY_BRAIN_WDIO_SESSION_STATE_ROOT;
    const sourceAssetsPath = process.env.GALAXY_BRAIN_TEST_SOURCE_ASSETS;
    const sourcePdfPath = process.env.GALAXY_BRAIN_TEST_SOURCE_PDF;
    assert.ok(
      sessionStateRoot !== undefined,
      "The packaged harness must expose its isolated session-state root.",
    );
    assert.ok(
      sourceAssetsPath !== undefined,
      "The packaged harness must expose its isolated source-assets path.",
    );
    assert.ok(
      sourcePdfPath !== undefined,
      "The packaged harness must expose its isolated source PDF path.",
    );
    const diagnosticsPath = join(sessionStateRoot, "diagnostics.jsonl");

    const repositoryPath = join(await realpath(temporaryRoot), "repository");
    await cp(
      join(process.cwd(), "tests", "fixtures", "knowledge-repository"),
      repositoryPath,
      { recursive: true },
    );
    const sourceAnnotationPath = join(
      repositoryPath,
      "sources",
      "annotations",
      "annotation-bayesian-statistics-fixture-source-page-2-0-54.md",
    );
    const sourceExcerptCanary = "GB_PRIVACY_SOURCE_EXCERPT";
    await appendFile(sourceAnnotationPath, `\n${sourceExcerptCanary}\n`);
    const privacyPrompt = [
      ...promptCanaries,
      repositoryPath,
      sourcePdfPath,
    ].join(" ");
    const forbiddenMarkers = [
      ...promptCanaries,
      sourceExcerptCanary,
      repositoryPath,
      sourcePdfPath,
    ];
    const approvedMarkers = new Map([
      [sourceAnnotationPath, new Set([sourceExcerptCanary])],
      [sessionStateRoot, new Set([repositoryPath, sourcePdfPath])],
      [dirname(sourceAssetsPath), new Set([sourcePdfPath])],
    ]);
    const stateRoots = [
      repositoryPath,
      sessionStateRoot,
      dirname(sourceAssetsPath),
    ];

    try {
      const dialog = await browser.electron.mock("dialog", "showOpenDialog");
      await dialog.mockResolvedValue({
        canceled: false,
        filePaths: [repositoryPath],
      });
      await $("#open-repository").click();
      await $("#discovery-surface").waitForDisplayed();
      await $("#discovery-mode-ask").click();
      await $("#discovery-ask-context-bayesian-statistics").click();
      await $(
        "#discovery-ask-context-annotation-bayesian-statistics-fixture-source-page-2-0-54",
      ).click();
      await $("#discovery-input").setValue(privacyPrompt);
      await $("#discovery-submit").click();
      await $("#discovery-ask-preview").waitForDisplayed();
      await $("#discovery-ask-preview details summary").click();
      await $("#discovery-ask-payload").waitForDisplayed();
      assert.match(
        await $("#discovery-ask-payload").getText(),
        /GB_PRIVACY_PROMPT_DO_NOT_RETAIN/u,
      );
      assert.match(
        await $("#discovery-ask-payload").getText(),
        new RegExp(sourceExcerptCanary, "u"),
      );
      await assertNoForbiddenMarkers(
        stateRoots,
        forbiddenMarkers,
        approvedMarkers,
      );

      const beforeDecline = await snapshotRoots(stateRoots);
      await $("#discovery-ask-decline").click();
      await browser.waitUntil(
        async () =>
          (await $("#discovery-ask-outcome").getAttribute(
            "data-discovery-outcome",
          )) === "declined",
        {
          timeout: 5_000,
          timeoutMsg: "The privacy workflow did not reach Ask decline.",
        },
      );
      assert.equal(await $("#discovery-ask-preview").isExisting(), false);
      assertStateUnchanged(beforeDecline, await snapshotRoots(stateRoots));

      await $("#discovery-input").setValue(privacyPrompt);
      await $("#discovery-submit").click();
      await $("#discovery-ask-preview").waitForDisplayed();
      const beforeCancel = await snapshotRoots(stateRoots);
      await assertNoForbiddenMarkers(
        stateRoots,
        forbiddenMarkers,
        approvedMarkers,
      );
      await $("#discovery-ask-cancel").click();
      await browser.waitUntil(
        async () =>
          (await $("#discovery-ask-outcome").getAttribute(
            "data-discovery-outcome",
          )) === "canceled",
        {
          timeout: 5_000,
          timeoutMsg: "The privacy workflow did not reach Ask cancellation.",
        },
      );
      assert.equal(await $("#discovery-ask-preview").isExisting(), false);
      assertStateUnchanged(beforeCancel, await snapshotRoots(stateRoots));

      const savedResultPath = join(
        repositoryPath,
        "scratch",
        "synthesis-results",
        "synthesis-result-bayesian-statistics-fixture.json",
      );
      const savedResultBeforeUnavailable = await readFile(
        savedResultPath,
        "utf8",
      );
      await $("#workspace-switcher-studio").click();
      await $("#studio-synthesis-heading").waitForDisplayed();
      await $("#studio-synthesis-include-all-context").click();
      await $("#studio-synthesis-prepare").click();
      await $("#studio-synthesis-preview").waitForDisplayed();
      await $("#studio-synthesis-confirm").click();
      await browser.waitUntil(
        async () =>
          (await $("#studio-synthesis-outcome").getAttribute(
            "data-synthesis-outcome",
          )) === "agent-provider-unavailable",
        {
          timeout: 5_000,
          timeoutMsg:
            "The privacy workflow did not reach unavailable Synthesis.",
        },
      );
      await $("#studio-synthesis-results").waitForDisplayed();
      assert.equal(
        await readFile(savedResultPath, "utf8"),
        savedResultBeforeUnavailable,
      );

      await rm(sourcePdfPath, { force: true });
      await $("#workspace-switcher-paper-desk").click();
      await $("#paper-desk-source-status-heading").waitForDisplayed();
      await browser.waitUntil(
        async () =>
          (await $("#paper-desk-source-status-heading").getText()) ===
          "Source status unavailable",
        {
          timeout: 5_000,
          timeoutMsg: "The privacy workflow did not reach unavailable source.",
        },
      );
      await browser.waitUntil(
        async () => {
          try {
            return (await readFile(diagnosticsPath, "utf8")).length > 0;
          } catch {
            return false;
          }
        },
        {
          timeout: 5_000,
          timeoutMsg: "The privacy workflow did not produce diagnostics.",
        },
      );
      const diagnostics = await readFile(diagnosticsPath, "utf8");
      const diagnosticRecords = diagnostics
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line) as Record<string, unknown>);
      assert.ok(diagnosticRecords.length > 0);
      for (const record of diagnosticRecords) {
        assert.deepEqual(Object.keys(record).sort(), [
          "category",
          "operation",
          "phase",
          "timestamp",
        ]);
        assert.equal(record.category, "sanitized-operation");
        assert.equal(typeof record.operation, "string");
        assert.equal(typeof record.phase, "string");
        assert.equal(typeof record.timestamp, "string");
      }
      assert.ok(
        diagnosticRecords.some(
          (record) =>
            record.phase === "source-asset" &&
            record.operation === "read-source",
        ),
      );
      await assertNoForbiddenMarkers(
        stateRoots,
        forbiddenMarkers,
        approvedMarkers,
      );
    } finally {
      await rm(repositoryPath, { recursive: true, force: true });
    }
  });
});
