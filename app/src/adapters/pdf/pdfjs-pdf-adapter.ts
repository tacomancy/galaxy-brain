/**
 * Production PDF Adapter. It reads source bytes in the main process and
 * translates PDF.js and filesystem failures into safe domain outcomes without
 * exposing vendor objects, paths, or raw exceptions to the renderer.
 */
import { readFile } from "node:fs/promises";

import type {
  CaptureSourceClaimInput,
  PdfAdapter,
  PdfSelectionOutcome,
} from "../../modules/source-processing";

type PdfJsModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

// Native runtime import is required because the packaged module lives outside
// the Webpack bundle in Contents/Resources and must be loaded from a file URL.
// Rationale: this narrow assertion supplies the known PDF.js module shape to
// the runtime import; the module path is selected only by the main process.
const importFromRuntime = new Function(
  "modulePath",
  "return import(modulePath);",
) as (modulePath: string) => Promise<PdfJsModule>;

/** Optional runtime module URL used by the packaged main process. */
export interface PdfJsAdapterOptions {
  modulePath?: string;
  standardFontDataUrl?: string;
  loadPdfJs?: () => Promise<PdfJsModule>;
  diagnostics?: PdfJsDiagnostics;
}

/** Internal sink for sanitized PDF.js and filesystem diagnostics. */
export interface PdfJsDiagnostics {
  record(diagnostic: PdfJsDiagnostic): void;
}

/** Sanitized filesystem or PDF.js operation metadata for internal diagnostics. */
export interface PdfJsDiagnostic {
  category: "filesystem" | "pdfjs";
  operation: "read-source" | "load-document" | "resolve-locator" | "cleanup";
}

const loadPdfJs = async (
  modulePath: string | undefined,
  loader: (() => Promise<PdfJsModule>) | undefined,
): Promise<PdfJsModule> =>
  loader?.() ??
  (modulePath === undefined
    ? Promise.reject(new Error("PDF.js module path is not configured."))
    : importFromRuntime(modulePath));

/**
 * Creates the production PDF Adapter. PDF.js stays behind this boundary and
 * receives bytes only in the main process; the renderer sees domain outcomes.
 * @param options Optional packaged module URL and local resource configuration.
 * @returns A PDF Adapter that translates parsing and locator failures into outcomes.
 */
export const createPdfJsAdapter = (
  options: PdfJsAdapterOptions = {},
): PdfAdapter => {
  const readSelection = async (
    input: CaptureSourceClaimInput,
  ): Promise<PdfSelectionOutcome> => {
    if (input.sourceReference === undefined) {
      return {
        outcome: "source-unavailable",
        detail: "The linked Source Asset is unavailable.",
      };
    }

    let bytes: Buffer;

    try {
      bytes = await readFile(input.sourceReference);
    } catch {
      options.diagnostics?.record({
        category: "filesystem",
        operation: "read-source",
      });
      return {
        outcome: "source-unavailable",
        detail: "The linked Source Asset could not be read.",
      };
    }

    let document: Awaited<ReturnType<PdfJsModule["getDocument"]>["promise"]>;

    try {
      const { getDocument } = await loadPdfJs(
        options.modulePath,
        options.loadPdfJs,
      );
      document = await getDocument({
        data: new Uint8Array(bytes),
        disableFontFace: true,
        useWasm: false,
        useSystemFonts: true,
        ...(options.standardFontDataUrl === undefined
          ? {}
          : { standardFontDataUrl: options.standardFontDataUrl }),
      }).promise;
    } catch {
      options.diagnostics?.record({
        category: "pdfjs",
        operation: "load-document",
      });
      return {
        outcome: "source-unavailable",
        detail: "The linked Source Asset could not be parsed.",
      };
    }

    try {
      const page = await document.getPage(input.page);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join("");

      if (
        input.start < 0 ||
        input.end > text.length ||
        input.start >= input.end
      ) {
        return {
          outcome: "source-unavailable",
          detail: "The requested source locator could not be resolved.",
        };
      }

      return { outcome: "located", text: text.slice(input.start, input.end) };
    } catch {
      options.diagnostics?.record({
        category: "pdfjs",
        operation: "resolve-locator",
      });
      return {
        outcome: "source-unavailable",
        detail: "The requested source locator could not be resolved.",
      };
    } finally {
      try {
        await document.cleanup();
      } catch {
        options.diagnostics?.record({
          category: "pdfjs",
          operation: "cleanup",
        });
        // Cleanup is best effort after the domain outcome is determined; a
        // vendor cleanup failure must not escape the Adapter boundary.
      }
    }
  };

  return { readSelection };
};
