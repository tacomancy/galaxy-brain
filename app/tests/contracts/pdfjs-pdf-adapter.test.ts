import { strict as assert } from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, it } from "vitest";

import { createPdfJsAdapter } from "../../src/adapters/pdf/pdfjs-pdf-adapter";

const knownPdf = Buffer.from(
  "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA4NiA+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooQmF5ZXNpYW4gaW5mZXJlbmNlIHVwZGF0ZXMgcHJpb3IgYmVsaWVmIHdpdGggZXZpZGVuY2UuKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDEgMDAwMDAgbiAKMDAwMDAwMDM3NiAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQ0NgolJUVPRgo=",
  "base64",
);
const knownTwoPagePdf = Buffer.from(
  "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUiA0IDAgUl0gL0NvdW50IDIgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNSAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNyAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNiAwIFIgL1Jlc291cmNlcyA8PCAvRjEgNyAwIFIgPj4gPj4gPj4KZW5kb2JqCjUgMCBvYmoKPDwgL0xlbmd0aCA0OSA+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooRml4dHVyZSBwYWdlIG9uZS4pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNiAwIG9iago8PCAvTGVuZ3RoIDg2ID4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzIwIFRkCihCYXllc2lhbiBpbmZlcmVuY2UgdXBkYXRlcyBwcmlvciBiZWxpZWYgd2l0aCBldmlkZW5jZS4pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNyAwIG9iago8PCAvVHlwZSAvRm9udCAvU3VidHlwZSAvVHlwZTEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCnhyZWYKMCA4CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMjEgMDAwMDAgbiAKMDAwMDAwMDI0NyAwMDAwMCBuIAowMDAwMDAwMzczIDAwMDAwIG4gCjAwMDAwMDA0NzEgMDAwMDAwMCBuIAowMDAwMDAwNjA2IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgOCAvUm9vdCAxIDAgUiA+Plxu c3RhcnR4cmVmCjY3NgolJUVPRgo=",
  "base64",
);

const createWorkflowPdf = (): Buffer => {
  const newline = String.fromCharCode(10);
  const pageOne = [
    "BT",
    "/F1 12 Tf",
    "72 720 Td",
    "(Fixture page one.) Tj",
    "ET",
    "",
  ].join(newline);
  const pageTwo = [
    "BT",
    "/F1 12 Tf",
    "72 720 Td",
    "(Bayesian inference updates prior belief with evidence.) Tj",
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
};

describe("production PDF.js Adapter contract", () => {
  it("retains PDF.js loading failures for diagnostics without exposing the cause", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const pdfPath = join(temporaryRoot, "diagnostic-fixture.pdf");
    const causes: unknown[] = [];

    try {
      await writeFile(pdfPath, knownPdf);

      assert.deepEqual(
        await createPdfJsAdapter({
          modulePath: pathToFileURL(join(temporaryRoot, "missing-pdfjs.mjs"))
            .href,
          diagnostics: { record: (diagnostic) => causes.push(diagnostic) },
        }).readSelection({
          sourceRecord: {
            id: "bayesian-statistics-fixture-source",
            title: "Bayesian statistics fixture source",
          },
          sourceReference: pdfPath,
          page: 1,
          start: 0,
          end: 54,
        }),
        {
          outcome: "source-unavailable",
          detail: "The linked Source Asset could not be parsed.",
        },
      );
      assert.deepEqual(causes, [
        { category: "pdfjs", operation: "load-document" },
      ]);
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("resolves a known page range from real PDF bytes", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const pdfPath = join(temporaryRoot, "bayesian-statistics.pdf");

    try {
      await writeFile(pdfPath, knownPdf);

      assert.deepEqual(
        await createPdfJsAdapter().readSelection({
          sourceRecord: {
            id: "bayesian-statistics-fixture-source",
            title: "Bayesian statistics fixture source",
          },
          sourceReference: pdfPath,
          page: 1,
          start: 0,
          end: 54,
        }),
        {
          outcome: "located",
          text: "Bayesian inference updates prior belief with evidence.",
        },
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("resolves the known page-two range used by the packaged relink gate", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const pdfPath = join(temporaryRoot, "bayesian-statistics-two-page.pdf");

    try {
      await writeFile(pdfPath, knownTwoPagePdf);

      assert.deepEqual(
        await createPdfJsAdapter().readSelection({
          sourceRecord: {
            id: "bayesian-statistics-fixture-source",
            title: "Bayesian statistics fixture source",
          },
          sourceReference: pdfPath,
          page: 2,
          start: 0,
          end: 54,
        }),
        {
          outcome: "located",
          text: "Bayesian inference updates prior belief with evidence.",
        },
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("resolves the generated two-page bytes used by the packaged workflow", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "galaxy-brain-s5-"));
    const pdfPath = join(temporaryRoot, "generated-two-page.pdf");

    try {
      await writeFile(pdfPath, createWorkflowPdf());

      assert.deepEqual(
        await createPdfJsAdapter().readSelection({
          sourceRecord: {
            id: "bayesian-statistics-fixture-source",
            title: "Bayesian statistics fixture source",
          },
          sourceReference: pdfPath,
          page: 2,
          start: 0,
          end: 54,
        }),
        {
          outcome: "located",
          text: "Bayesian inference updates prior belief with evidence.",
        },
      );
    } finally {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
