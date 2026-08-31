# Use PDF.js behind the PDF Adapter

Status: accepted on August 31, 2026.

The Workbench will use PDF.js through a pinned `pdfjs-dist` dependency behind
the existing `PdfAdapter` interface for production PDF reading. This keeps
PDF parsing, rendering, worker configuration, and vendor types outside the
Source Processing Module and Paper Desk UI while preserving the deterministic
fixture Adapter for framework-independent behavior tests. The dependency is
pinned to `pdfjs-dist@6.3.289`.

The packaged application copies the PDF.js distribution to
`Contents/Resources/pdfjs-dist`, including the legacy module, worker module,
and `standard_fonts` resources. The main-process Adapter loads the legacy
module from an explicit local `file:` URL using a native runtime ESM import;
this keeps the vendor module outside the Webpack bundle and avoids any
network dependency. It reads PDF bytes only in the main process and uses
`disableFontFace: true`, `useSystemFonts: true`, and `useWasm: false`. The
current text-verification path uses PDF.js's main-process fallback rather than
starting a renderer worker; the packaged worker is shipped with the resource
set for the future rendering path and to keep the dependency complete.

## Considered options

- **Keep the fixture Adapter as production behavior:** rejected because it
  cannot read user PDFs or prove the packaged linked-source gate.
- **Expose PDF.js directly to Source Processing or Paper Desk:** rejected
  because vendor objects and rendering mechanics would become application
  policy and make the PDF technology difficult to replace.
- **Select a different native or web PDF engine:** deferred because the
  existing stack research already identifies PDF.js as a web-standard,
  replaceable fit for the confirmed Adapter boundary; a different choice
  would require revising this ADR and the implementation specification.

## Consequences

The production dependency must be compatible with the unsigned macOS arm64
package and load without network access. The S1 packaged gate exercises real
temporary PDF bytes through the production Adapter, while S3 tests continue to use
independently authored fixture text and locators. PDF.js-specific failures are
translated by the Adapter and must not leak raw paths, bytes, or vendor
exceptions into renderer state, repository content, or diagnostics.
