/** WebdriverIO configuration for S1 packaged Electron workflow tests. */
import { dirname, join } from "node:path";
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";

import { browser } from "@wdio/globals";
import type { Capabilities, Options } from "@wdio/types";

const packagedBinary = join(
  process.cwd(),
  "out",
  `Galaxy Brain-${process.platform}-${process.arch}`,
  "Galaxy Brain.app",
  "Contents",
  "MacOS",
  "Galaxy Brain",
);

// Keep isolated session-state files for each workflow worker so a reload
// exercises persistence while parallel specs remain independent.
const testSessionStateRoot = mkdtempSync(join(tmpdir(), "galaxy-brain-wdio-"));
const testSourceAssetCoordinatePath = join(
  tmpdir(),
  "galaxy-brain-wdio-source-assets-path.txt",
);
const isWdioLauncher = process.env.WDIO_WORKER_ID === undefined;
const configuredSourcePdfPath = process.env.GALAXY_BRAIN_TEST_SOURCE_PDF;
const configuredSourceAssetsPath = process.env.GALAXY_BRAIN_TEST_SOURCE_ASSETS;
const reusesConfiguredSourceAssets =
  configuredSourcePdfPath !== undefined &&
  configuredSourceAssetsPath !== undefined;
const coordinatedSourceAssetRoot = isWdioLauncher
  ? mkdtempSync(join(tmpdir(), "galaxy-brain-wdio-source-assets-"))
  : readFileSync(testSourceAssetCoordinatePath, "utf8");
if (isWdioLauncher) {
  writeFileSync(testSourceAssetCoordinatePath, coordinatedSourceAssetRoot);
}
const testSourceAssetRoot = reusesConfiguredSourceAssets
  ? dirname(configuredSourcePdfPath)
  : coordinatedSourceAssetRoot;
const testSourcePdfPath = reusesConfiguredSourceAssets
  ? configuredSourcePdfPath
  : join(testSourceAssetRoot, "bayesian-statistics-fixture.pdf");
const testSourceAssetsPath = reusesConfiguredSourceAssets
  ? configuredSourceAssetsPath
  : join(testSourceAssetRoot, "source-assets.json");
const testSourcePdf = createTwoPagePdf(
  Buffer.from(
    "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA4NiA+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooQmF5ZXNpYW4gaW5mZXJlbmNlIHVwZGF0ZXMgcHJpb3IgYmVsaWVmIHdpdGggZXZpZGVuY2UuKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDEgMDAwMDAgbiAKMDAwMDAwMDM3NiAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQ0NgolJUVPRgo=",
    "base64",
  ),
);
const testInvalidReplacementPdfPath = join(
  testSourceAssetRoot,
  "bayesian-statistics-invalid-replacement.pdf",
);
const testInvalidReplacementPdf = createTwoPagePdf(
  Buffer.from("invalid replacement"),
  "A replacement passage with an invalid locator.",
);

function createTwoPagePdf(
  seed: Buffer,
  pageTwoText = "Bayesian inference updates prior belief with evidence.",
): Buffer {
  const newline = String.fromCharCode(10);
  const pageOne = [
    "BT",
    "/F1 12 Tf",
    "72 720 Td",
    `(Fixture page one ${seed.byteLength}.) Tj`,
    "ET",
    "",
  ].join(newline);
  const pageTwo = [
    "BT",
    "/F1 12 Tf",
    "72 720 Td",
    `(${pageTwoText}) Tj`,
    "ET",
    "",
  ].join(newline);
  const bodies = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 7 0 R >> >> >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(pageOne)} >>${newline}stream${newline}${pageOne}endstream`,
    `<< /Length ${Buffer.byteLength(pageTwo)} >>${newline}stream${newline}${pageTwo}endstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = `%PDF-1.4${newline}`;
  const offsets = [0];

  bodies.forEach((body, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj${newline}${body}${newline}endobj${newline}`;
  });

  const xref = Buffer.byteLength(pdf);
  pdf += `xref${newline}0 ${bodies.length + 1}${newline}0000000000 65535 f ${newline}`;
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n ${newline}`;
  }
  pdf += `trailer${newline}<< /Size ${bodies.length + 1} /Root 1 0 R >>${newline}startxref${newline}${xref}${newline}%%EOF${newline}`;
  return Buffer.from(pdf);
}
if (!reusesConfiguredSourceAssets) {
  writeFileSync(testSourcePdfPath, testSourcePdf);
  writeFileSync(testInvalidReplacementPdfPath, testInvalidReplacementPdf);
  const testSourceStats = lstatSync(testSourcePdfPath);
  writeFileSync(
    testSourceAssetsPath,
    `${JSON.stringify(
      {
        format: "galaxy-brain-source-assets",
        format_version: 1,
        links: {
          "bayesian-statistics-fixture-source": {
            mode: "linked-local",
            path: testSourcePdfPath,
            source_identity: `file:${testSourceStats.dev}:${testSourceStats.ino}`,
            content_identity: `sha256:${createHash("sha256").update(testSourcePdf).digest("hex")}`,
          },
        },
      },
      null,
      2,
    )}\n`,
  );
}
process.env.GALAXY_BRAIN_TEST_SOURCE_PDF = testSourcePdfPath;
process.env.GALAXY_BRAIN_TEST_SOURCE_ASSETS = testSourceAssetsPath;
process.env.GALAXY_BRAIN_TEST_INVALID_REPLACEMENT_PDF =
  testInvalidReplacementPdfPath;
const sessionStateArgumentPrefix = "--galaxy-brain-session-state=";
const sourceAssetsArgumentPrefix = "--galaxy-brain-source-assets=";
const silentTestModeArgument = "--galaxy-brain-test-mode=silent";
const desktopArtifactDirectory =
  process.env.GALAXY_BRAIN_WDIO_ARTIFACT_DIR ??
  mkdtempSync(join(tmpdir(), "galaxy-brain-wdio-artifacts-"));
const screenshotDirectory = join(desktopArtifactDirectory, "screenshots");

mkdirSync(screenshotDirectory, { recursive: true });

const safeScreenshotName = (parent: string, title: string) => {
  const name = `${parent}-${title}`
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return name.length > 0 ? name : "failed-test";
};

/** Captures a failed desktop test without masking the original test failure. */
export async function saveDesktopFailureScreenshot(
  saveScreenshot: (path: string) => Promise<void>,
  screenshotPath: string,
  warn: (message: string) => void = console.warn,
): Promise<void> {
  try {
    await saveScreenshot(screenshotPath);
  } catch (error) {
    warn(`Unable to save desktop failure screenshot: ${String(error)}`);
  }
}

// S1 launches the unsigned macOS package produced by Electron Forge so the
// test covers packaging, preload loading, and the real desktop composition.
export const config: Options.Testrunner &
  Capabilities.WithRequestedTestrunnerCapabilities = {
  runner: "local",
  specs: ["./tests/workflows/**/*.e2e.ts"],
  maxInstances: 1,
  capabilities: [
    {
      browserName: "electron",
    },
  ],
  framework: "mocha",
  services: [
    [
      "electron",
      {
        appBinaryPath: packagedBinary,
        appArgs: [
          silentTestModeArgument,
          `${sessionStateArgumentPrefix}${join(
            testSessionStateRoot,
            "workbench-session.json",
          )}`,
          `${sourceAssetsArgumentPrefix}${testSourceAssetsPath}`,
        ],
      },
    ],
  ],
  outputDir: desktopArtifactDirectory,
  logLevel: "warn",
  beforeSession: (_config, capabilities, _specs, cid) => {
    const workerSessionStatePath = join(
      testSessionStateRoot,
      `workbench-session-${cid}.json`,
    );

    rmSync(workerSessionStatePath, { force: true });

    // WDIO's requested capability type omits the Electron service's converted
    // Chrome options, so this assertion is limited to the field we mutate.
    const chromeOptions = (
      capabilities as Capabilities.W3CCapabilities & {
        "goog:chromeOptions"?: { args?: string[] };
      }
    )["goog:chromeOptions"];
    if (chromeOptions !== undefined) {
      chromeOptions.args = (chromeOptions.args ?? []).map((argument) =>
        argument.startsWith(sessionStateArgumentPrefix)
          ? `${sessionStateArgumentPrefix}${workerSessionStatePath}`
          : argument,
      );
    }
  },
  afterTest: async (test, _context, result) => {
    if (result.passed) {
      return;
    }

    await saveDesktopFailureScreenshot(
      async (path) => {
        await browser.saveScreenshot(path);
      },
      join(
        screenshotDirectory,
        `${safeScreenshotName(test.parent, test.title)}.png`,
      ),
    );
  },
  onComplete: () => {
    rmSync(testSessionStateRoot, { recursive: true, force: true });
    if (isWdioLauncher && !reusesConfiguredSourceAssets) {
      rmSync(testSourceAssetRoot, { recursive: true, force: true });
      rmSync(testSourceAssetCoordinatePath, { force: true });
    }
  },
  mochaOpts: {
    ui: "bdd",
    timeout: 30_000,
  },
};
