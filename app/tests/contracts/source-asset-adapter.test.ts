import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  realpath,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it } from "vitest";

import {
  createFileBackedSourceAssetAdapter,
  type SourceAssetFileSystem,
} from "../../src/adapters/pdf/file-backed-source-asset-adapter";

const sourceRecordId = "bayesian-statistics-fixture-source";
const pdfBytes = "%PDF-1.4\nportable PDF test bytes\n";
const contentIdentity =
  "sha256:abdf33ce671408095a1baa7759f1c846cf93194ab879a68856b6cb43fd2aca1c";
const replacementContentIdentity =
  "sha256:e73236b90122d0b74d7091ff32aba2878a325a2e777fea2ccd6e05c287353c7b";

const contentIdentityFor = (content: string) =>
  `sha256:${createHash("sha256").update(content).digest("hex")}`;

describe("production Source Asset Adapter contract", () => {
  it("retains private store failures for diagnostics without exposing the cause", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const configurationPath = join(temporaryRoot, "missing-source-assets.json");
    const causes: unknown[] = [];

    try {
      const adapter = createFileBackedSourceAssetAdapter({
        configurationPath,
        diagnostics: { record: (diagnostic) => causes.push(diagnostic) },
      });

      assert.deepEqual(await adapter.readIdentity(sourceRecordId), {
        outcome: "unavailable",
        detail: "The linked Source Asset is unavailable.",
      });
      assert.deepEqual(causes, [
        { category: "filesystem", operation: "read-store" },
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("reads a valid private link and computes the current SHA-256 identity", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const pdfPath = join(temporaryRoot, "bayesian-statistics.pdf");
    const configurationPath = join(temporaryRoot, "source-assets.json");

    try {
      await writeFile(pdfPath, pdfBytes, "utf8");
      const fileStats = await lstat(pdfPath);
      const sourceIdentity = `file:${fileStats.dev}:${fileStats.ino}`;
      await writeFile(
        configurationPath,
        JSON.stringify(
          {
            format: "galaxy-brain-source-assets",
            format_version: 1,
            links: {
              [sourceRecordId]: {
                mode: "linked-local",
                path: pdfPath,
                source_identity: sourceIdentity,
                content_identity: contentIdentity,
              },
            },
          },
          null,
          2,
        ),
        "utf8",
      );

      const adapter = createFileBackedSourceAssetAdapter({
        configurationPath,
      });

      assert.deepEqual(await adapter.readIdentity(sourceRecordId), {
        outcome: "available",
        recorded: {
          sourceIdentity,
          contentIdentity,
        },
        current: {
          sourceIdentity,
          contentIdentity,
        },
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("does not report a regular non-PDF file as available", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const sourcePath = join(temporaryRoot, "not-a-pdf.txt");
    const configurationPath = join(temporaryRoot, "source-assets.json");

    try {
      const sourceBytes = "plain text is not a PDF\n";
      await writeFile(sourcePath, sourceBytes, "utf8");
      const fileStats = await lstat(sourcePath);
      await writeFile(
        configurationPath,
        JSON.stringify(
          {
            format: "galaxy-brain-source-assets",
            format_version: 1,
            links: {
              [sourceRecordId]: {
                mode: "linked-local",
                path: sourcePath,
                source_identity: `file:${fileStats.dev}:${fileStats.ino}`,
                content_identity: contentIdentityFor(sourceBytes),
              },
            },
          },
          null,
          2,
        ),
        "utf8",
      );

      const adapter = createFileBackedSourceAssetAdapter({
        configurationPath,
      });

      assert.deepEqual(await adapter.readIdentity(sourceRecordId), {
        outcome: "unavailable",
        detail: "The linked Source Asset is not a regular PDF file.",
      });
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("reports an unavailable outcome without rewriting an invalid private store", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const configurationPath = join(temporaryRoot, "source-assets.json");
    const invalidStore = '{"format":"wrong-format","format_version":1}';

    try {
      await writeFile(configurationPath, invalidStore, "utf8");

      const adapter = createFileBackedSourceAssetAdapter({
        configurationPath,
      });

      assert.deepEqual(await adapter.readIdentity(sourceRecordId), {
        outcome: "unavailable",
        detail: "The linked Source Asset is unavailable.",
      });
      assert.equal(await readFile(configurationPath, "utf8"), invalidStore);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("verifies a replacement locator before atomically committing its link", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const originalPath = join(temporaryRoot, "original.pdf");
    const replacementPath = join(temporaryRoot, "replacement.pdf");
    const replacementAliasPath = join(temporaryRoot, "replacement-alias.pdf");
    const configurationPath = join(temporaryRoot, "source-assets.json");
    try {
      await writeFile(originalPath, "%PDF-1.4\noriginal PDF\n", "utf8");
      await writeFile(
        replacementPath,
        "%PDF-1.4\nverified replacement PDF\n",
        "utf8",
      );
      await symlink(replacementPath, replacementAliasPath);
      await writeFile(
        configurationPath,
        JSON.stringify({
          format: "galaxy-brain-source-assets",
          format_version: 1,
          links: {
            [sourceRecordId]: {
              mode: "linked-local",
              path: originalPath,
              source_identity: "file:original",
              content_identity: "sha256:original",
            },
          },
        }),
        "utf8",
      );
      const replacementStats = await lstat(replacementPath);
      const replacementSourceIdentity = `file:${replacementStats.dev}:${replacementStats.ino}`;
      let verifiedReference = "";

      const adapter = createFileBackedSourceAssetAdapter({
        configurationPath,
        pdf: {
          readSelection: async (input) => {
            verifiedReference = input.sourceReference ?? "";
            return {
              outcome: "located" as const,
              text: "verified passage",
            };
          },
        },
      });

      assert.deepEqual(
        await adapter.relink({
          sourceRecord: {
            id: sourceRecordId,
            title: "Bayesian statistics fixture source",
          },
          replacementReference: replacementAliasPath,
          expectedReplacementSourceIdentity: replacementSourceIdentity,
          expectedReplacementContentIdentity: replacementContentIdentity,
          verificationLocator: { page: 2, start: 0, end: 16 },
        }),
        {
          outcome: "available",
          recorded: {
            sourceIdentity: replacementSourceIdentity,
            contentIdentity: replacementContentIdentity,
          },
          current: {
            sourceIdentity: replacementSourceIdentity,
            contentIdentity: replacementContentIdentity,
          },
        },
      );
      assert.equal(verifiedReference, await realpath(replacementPath));
      assert.match(
        await readFile(configurationPath, "utf8"),
        /replacement\.pdf/,
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("rejects a mismatched replacement without changing the prior link", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const originalPath = join(temporaryRoot, "original.pdf");
    const replacementPath = join(temporaryRoot, "replacement.pdf");
    const configurationPath = join(temporaryRoot, "source-assets.json");
    const originalStore = JSON.stringify({
      format: "galaxy-brain-source-assets",
      format_version: 1,
      links: {
        [sourceRecordId]: {
          mode: "linked-local",
          path: originalPath,
          source_identity: "file:original",
          content_identity: "sha256:original",
        },
      },
    });

    try {
      await writeFile(originalPath, "%PDF-1.4\noriginal PDF\n", "utf8");
      const replacementBytes = "%PDF-1.4\nreplacement\n";
      await writeFile(replacementPath, replacementBytes, "utf8");
      await writeFile(configurationPath, originalStore, "utf8");
      const replacementStats = await lstat(replacementPath);
      const actualReplacementContentIdentity =
        contentIdentityFor(replacementBytes);

      const adapter = createFileBackedSourceAssetAdapter({
        configurationPath,
        pdf: {
          readSelection: async () => ({
            outcome: "located" as const,
            text: "verified passage",
          }),
        },
      });

      assert.deepEqual(
        await adapter.relink({
          sourceRecord: {
            id: sourceRecordId,
            title: "Bayesian statistics fixture source",
          },
          replacementReference: replacementPath,
          expectedReplacementSourceIdentity: `file:${replacementStats.dev}:${replacementStats.ino}`,
          expectedReplacementContentIdentity: "sha256:wrong",
          verificationLocator: { page: 2, start: 0, end: 16 },
        }),
        {
          outcome: "changed",
          recorded: {
            sourceIdentity: "file:original",
            contentIdentity: "sha256:original",
          },
          current: {
            sourceIdentity: `file:${replacementStats.dev}:${replacementStats.ino}`,
            contentIdentity: actualReplacementContentIdentity,
          },
        },
      );
      assert.equal(await readFile(configurationPath, "utf8"), originalStore);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("rejects a replacement that changes during PDF verification", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const originalPath = join(temporaryRoot, "original.pdf");
    const replacementPath = join(temporaryRoot, "replacement.pdf");
    const configurationPath = join(temporaryRoot, "source-assets.json");
    const originalStore = JSON.stringify({
      format: "galaxy-brain-source-assets",
      format_version: 1,
      links: {
        [sourceRecordId]: {
          mode: "linked-local",
          path: originalPath,
          source_identity: "file:original",
          content_identity: "sha256:original",
        },
      },
    });

    try {
      await writeFile(originalPath, "%PDF-1.4\noriginal PDF\n", "utf8");
      const replacementBytes = "%PDF-1.4\nreplacement\n";
      const changedReplacementBytes = "%PDF-1.4\nchanged during verification\n";
      await writeFile(replacementPath, replacementBytes, "utf8");
      await writeFile(configurationPath, originalStore, "utf8");
      const replacementStats = await lstat(replacementPath);

      const adapter = createFileBackedSourceAssetAdapter({
        configurationPath,
        pdf: {
          readSelection: async () => {
            await writeFile(replacementPath, changedReplacementBytes, "utf8");
            return {
              outcome: "located" as const,
              text: "verified passage",
            };
          },
        },
      });

      assert.deepEqual(
        await adapter.relink({
          sourceRecord: {
            id: sourceRecordId,
            title: "Bayesian statistics fixture source",
          },
          replacementReference: replacementPath,
          expectedReplacementSourceIdentity: `file:${replacementStats.dev}:${replacementStats.ino}`,
          expectedReplacementContentIdentity:
            contentIdentityFor(replacementBytes),
          verificationLocator: { page: 2, start: 0, end: 16 },
        }),
        {
          outcome: "changed",
          recorded: {
            sourceIdentity: "file:original",
            contentIdentity: "sha256:original",
          },
          current: {
            sourceIdentity: `file:${replacementStats.dev}:${replacementStats.ino}`,
            contentIdentity: contentIdentityFor(changedReplacementBytes),
          },
        },
      );
      assert.equal(await readFile(configurationPath, "utf8"), originalStore);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("rejects an invalid replacement locator without changing the prior link", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const originalPath = join(temporaryRoot, "original.pdf");
    const replacementPath = join(temporaryRoot, "replacement.pdf");
    const configurationPath = join(temporaryRoot, "source-assets.json");
    const originalStore = JSON.stringify({
      format: "galaxy-brain-source-assets",
      format_version: 1,
      links: {
        [sourceRecordId]: {
          mode: "linked-local",
          path: originalPath,
          source_identity: "file:original",
          content_identity: "sha256:original",
        },
      },
    });

    try {
      await writeFile(originalPath, "%PDF-1.4\noriginal PDF\n", "utf8");
      const replacementBytes = "%PDF-1.4\nreplacement\n";
      await writeFile(replacementPath, replacementBytes, "utf8");
      await writeFile(configurationPath, originalStore, "utf8");
      const replacementStats = await lstat(replacementPath);
      const actualReplacementContentIdentity =
        contentIdentityFor(replacementBytes);

      const adapter = createFileBackedSourceAssetAdapter({
        configurationPath,
        pdf: {
          readSelection: async () => ({
            outcome: "located" as const,
            text: "too short",
          }),
        },
      });

      assert.deepEqual(
        await adapter.relink({
          sourceRecord: {
            id: sourceRecordId,
            title: "Bayesian statistics fixture source",
          },
          replacementReference: replacementPath,
          expectedReplacementSourceIdentity: `file:${replacementStats.dev}:${replacementStats.ino}`,
          expectedReplacementContentIdentity: actualReplacementContentIdentity,
          verificationLocator: { page: 2, start: 0, end: 16 },
        }),
        {
          outcome: "unavailable",
          detail: "The replacement Source Asset could not be verified.",
        },
      );
      assert.equal(await readFile(configurationPath, "utf8"), originalStore);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("preserves the previous link when atomic replacement is interrupted", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const originalPath = join(temporaryRoot, "original.pdf");
    const replacementPath = join(temporaryRoot, "replacement.pdf");
    const configurationPath = join(temporaryRoot, "source-assets.json");
    const originalStore = JSON.stringify({
      format: "galaxy-brain-source-assets",
      format_version: 1,
      links: {
        [sourceRecordId]: {
          mode: "linked-local",
          path: originalPath,
          source_identity: "file:original",
          content_identity: "sha256:original",
        },
      },
    });

    try {
      await writeFile(originalPath, "%PDF-1.4\noriginal PDF\n", "utf8");
      await writeFile(
        replacementPath,
        "%PDF-1.4\nverified replacement PDF\n",
        "utf8",
      );
      await writeFile(configurationPath, originalStore, "utf8");
      const replacementStats = await lstat(replacementPath);
      const replacementSourceIdentity = `file:${replacementStats.dev}:${replacementStats.ino}`;
      const filesystem: SourceAssetFileSystem = {
        lstat,
        mkdir,
        readFile,
        realpath,
        rename: async () => {
          throw new Error("replacement interrupted");
        },
        rm,
        writeFile,
      };

      const adapter = createFileBackedSourceAssetAdapter({
        configurationPath,
        filesystem,
        pdf: {
          readSelection: async () => ({
            outcome: "located" as const,
            text: "verified passage",
          }),
        },
      });

      assert.deepEqual(
        await adapter.relink({
          sourceRecord: {
            id: sourceRecordId,
            title: "Bayesian statistics fixture source",
          },
          replacementReference: replacementPath,
          expectedReplacementSourceIdentity: replacementSourceIdentity,
          expectedReplacementContentIdentity: replacementContentIdentity,
          verificationLocator: { page: 2, start: 0, end: 16 },
        }),
        {
          outcome: "unavailable",
          detail: "The replacement Source Asset could not be saved.",
        },
      );
      assert.equal(await readFile(configurationPath, "utf8"), originalStore);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
