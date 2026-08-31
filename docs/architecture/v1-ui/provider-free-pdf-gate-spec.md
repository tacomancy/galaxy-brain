# Provider-free PDF source-status packaged-gate specification

Status: implementation complete and human-accepted on
`codex/production-pdf-release-gate` on August 31, 2026; automated evidence is
green. The six final human acceptance gates were explicitly passed and accepted
by the human owner. The PDF.js choice is recorded in [ADR
0015](../../adr/0015-use-pdfjs-behind-pdf-adapter.md). The production
dependency is pinned to `pdfjs-dist@6.3.289`; its legacy module, worker module,
and standard-font resources are packaged under `Contents/Resources/pdfjs-dist`
and loaded locally by the main-process Adapter.

This brief addresses the first remaining unchecked item in Section C of the
[V1 victory checklist](v1-victory-checklist.md): the packaged Workbench must
handle an unavailable or changed linked PDF without corrupting its Source
Record, Structured Annotations, citations, or logical Source Locators. It is a
new packaged S1 slice over the accepted TB15 S3 behavior; it does not reopen
TB15.

## Documentation prerequisite

Before writing behavior tests or implementation code, explicitly complete
these tasks:

1. Review the accepted [Product Decisions](product-decisions.md#paper-desk),
   [Architecture](architecture.md#source-processing-module), [Repository
   Format](repository-format.md#portable-content), [Test Strategy](test-strategy.md#s1--desktop-workflow-seam),
   [TB15 specification](tracer-bullet-15-spec.md), the [V1 release-readiness
   specification](v1-release-readiness-spec.md), and the completed TB1–TB16
   delivery records.
2. Confirm the scope and PDF-engine decision below, then record the selected
   production PDF technology and its consequences in an ADR before the
   dependency spreads into application code. This task is complete in ADR
   0015 for the confirmed PDF.js choice.
3. Confirm that the machine-local link record below is an application
   configuration artifact, not a Repository Format change, and that its
   absolute path never crosses into renderer state, repository content, logs,
   proposals, audit records, or provider payloads.
4. Confirm the exact status vocabulary, relink boundary, fixture values,
   isolation strategy, and human acceptance evidence described below.
5. Only after these confirmations, write the first red S1 workflow and begin
   the red-to-green implementation cycle.

## Decisions and scope

### Decision 1 — minimum product scope

**Recommended decision:** implement the linked-local Source Asset status and
relink path for an existing portable Source Record. This slice includes:

- reading a validated machine-local link for a Source Record;
- checking the linked PDF's availability, source identity, and SHA-256 content
  identity when the Source Record is opened in Paper Desk;
- showing available, unavailable, and changed states without hiding or
  mutating existing annotations;
- opening an explicit replacement-file action from Paper Desk; and
- committing a replacement machine-local link only after identity and known
  page/range verification succeed.

This slice does not include the complete **Add PDF / Import PDF** creation
workflow or the managed-copy mode. A test fixture may contain a portable
Source Record plus an isolated machine-local link record so that the packaged
status/relink behavior can be exercised honestly. Creating a Source Record,
choosing **Manage** versus **Link local file**, and copying a PDF into
`assets/sources/` remain separate work unless the owner promotes them into this
slice.

**Gate 1 — confirmed:** the human owner accepted this linked-existing-record
scope for closing the Section C checklist item on August 31, 2026. If the
Add/Import flow is later required, this brief must be expanded before
implementation because it adds a new Source Record creation workflow,
managed-asset persistence, and additional acceptance gates.

### Decision 2 — production PDF technology

**Recommended decision:** use PDF.js through a pinned `pdfjs-dist` dependency
behind the existing `PdfAdapter` interface. The repository's stack research
already identifies PDF.js as the candidate renderer ecosystem; the adapter
must keep PDF.js types and worker configuration outside Source Processing and
Paper Desk.

The selected version and worker/resource strategy are recorded in ADR 0015.
The fixture PDF Adapter remains useful for deterministic S3 tests; it is not
the production implementation. The production Adapter uses a native runtime
ESM import of the packaged legacy module, with PDF.js main-process fallback
text verification and no network-loaded worker.

**Gate 2 — confirmed:** the human owner accepted PDF.js as the production PDF
technology on August 31, 2026. A different technology would require revising
this brief and ADR before coding.

### Decision 3 — machine-local link representation

The production linked-file Adapter owns a separate application-private JSON
store in the Workbench application configuration directory. It is not the
existing Workbench session snapshot and it is never placed inside the
selected repository.

The proposed representation is:

```json
{
  "format": "galaxy-brain-source-assets",
  "format_version": 1,
  "links": {
    "bayesian-statistics-fixture-source": {
      "mode": "linked-local",
      "path": "/private/example/bayesian-statistics.pdf",
      "source_identity": "file-id",
      "content_identity": "sha256:hex-digest"
    }
  }
}
```

The literal example path and identities are illustrative only and must not be
checked into fixtures. The Adapter must validate the store before use, accept
only the recognized format/version and `linked-local` mode, canonicalize the
selected path, compute the current source identity and SHA-256 content
identity, and reject unsafe or unreadable paths without rewriting the record.
The source identity is the platform file identity returned by the Adapter's
validated filesystem boundary; the content identity is the SHA-256 digest of
the PDF bytes. The exact serialized file identity encoding is an Adapter
detail, not a Source Processing contract.

A successful relink atomically replaces only the machine-local link record
after the replacement PDF resolves the known page/range and matches the
caller-authorized expected identities. A failed check leaves the previous
link record byte-for-byte unchanged. The Adapter must not retain PDF bytes,
page text, prompts, credentials, or raw exception text in this store.

**Gate 3 — confirmed:** the human owner accepted the separate source-asset
store as the machine-local authority on August 31, 2026. If the existing
session-state file is preferred later, the specification must be revised to
define its versioned link section and associated migration/recovery rules
before implementation.

## Gate confirmation record

- **Gate 1 — scope:** confirmed; linked-existing-record status and relink only,
  with Add/Import and managed assets deferred.
- **Gate 2 — PDF technology:** confirmed; PDF.js behind `PdfAdapter`.
- **Gate 3 — machine-local representation:** confirmed; separate versioned
  source-asset store outside the Knowledge Repository and session snapshot.
- **Gate 4 — public outcomes:** confirmed; exact available, unavailable,
  changed, and verified-relink vocabulary and preservation rules.
- **Gate 5 — verification:** confirmed; S1 packaged, S3 Source Processing,
  and S5 production-Adapter seams with isolated temporary PDFs.
- **Gate 6 — deferrals:** confirmed; Add/Import, managed assets, OCR,
  remapping, automatic relinking, and unrelated provider/VCS work remain out
  of scope.

These confirmations approve the documented scope and design direction only;
they do not approve an unseen implementation or a later scope expansion.

## Public behavior

Given a portable fixture repository containing the known Bayesian statistics
Source Record and Structured Annotation, plus an isolated machine-local link
to a deterministic PDF:

1. **Available source.** Opening the Source Record in Paper Desk reports
   `Source available` and displays the Source Record, captured annotation,
   attribution, classification, and logical locator.
2. **Unavailable source.** If the linked path is missing, unreadable, or its
   identity cannot be compared, Paper Desk reports the exact status
   `Source status unavailable`. The Source Record, annotation text,
   attribution, classification, citation/reference, and logical locator
   remain visible and unchanged. The Workbench does not claim that the source
   is current or verified.
3. **Changed source.** If the linked path is readable but its source identity
   or content identity differs from the recorded identity, Paper Desk reports
   the exact status `Source status changed`. The old link remains the
   authority until an explicit relink; no annotation is deleted, remapped, or
   rewritten.
4. **Explicit relink.** The person can choose a replacement PDF through the
   native file-selection action. The main process passes the selected path to
   the Source Asset Adapter; the renderer receives only the domain outcome,
   never the absolute path. The Adapter verifies the expected source/content
   identities and the known page/range before committing the new link.
5. **Successful relink.** After verification, Paper Desk reports
   `Source relinked and verified.` The Source Record ID, annotation ID,
   annotation text, attribution, classification, and logical locator remain
   unchanged. The source status becomes `Source available`.
6. **Failed relink.** An unavailable, changed, identity-mismatched, or
   locator-invalid replacement reports the appropriate unavailable/changed
   outcome. The original machine-local link and all portable repository
   content remain unchanged. No guessed page/range remapping is allowed.
7. **Provider-free boundary.** All six behaviors work without Git, GitHub,
   credentials, network connectivity, or an Agent Provider. No status check or
   relink creates a Proposal, invokes Synthesis, changes Governed Knowledge,
   or transmits source material.

## Exact fixture values

The existing TB5/TB15 values remain authoritative:

- Source Record ID: `bayesian-statistics-fixture-source`.
- Source Record title: `Bayesian statistics fixture source`.
- Structured Annotation ID:
  `annotation-bayesian-statistics-fixture-source-page-2-0-54`.
- Annotation text: `Bayesian inference updates prior belief with evidence.`
- Source Locator: page `2`, start `0`, exclusive end `54`, logical
  `page:2#chars=0-54`.
- Attribution: `source-claim`.
- Classification: `source-claim`.
- Material state: `working-material`.
- Known PDF passage: `Bayesian inference updates prior belief with evidence.`
- Known passage length: `54` characters.

Use independently authored identity fixtures:

- Original source identity: `source-identity-bayesian-statistics-v1`.
- Original content identity: `content-identity-bayesian-statistics-v1`.
- Changed source identity: `source-identity-bayesian-statistics-v2`.
- Changed content identity: `content-identity-bayesian-statistics-v2`.

The packaged workflow must derive actual SHA-256 identities from temporary PDF
files and assert the domain outcomes against known expected values. It must
not calculate its expected result by calling the Adapter under test.

## Module ownership and Interfaces

The existing Source Processing Interface remains the policy owner. It owns
the `available`, `source-status-unavailable`, `source-changed`, and `relinked`
outcomes, preservation of annotations, explicit relink authorization, and the
rule that a changed source cannot be used for a new capture until relink.

The Source Asset Adapter owns:

- validated machine-local path resolution;
- file identity and SHA-256 calculation;
- reading and atomically writing the private link store;
- replacement verification against the requested identity and locator; and
- translating filesystem/PDF failures into Adapter outcomes while retaining
  raw causes only in the existing internal diagnostics boundary.

The PDF Adapter owns page/range resolution through the selected production
PDF engine. It does not decide whether changed bytes are trusted and cannot
delete or rewrite annotations.

Paper Desk is an S1 caller/projection. It owns only transient control state and
visible rendering. It must not compare hashes, inspect the source-asset JSON,
retain absolute paths, or implement relink policy.

The preload bridge exposes operation-specific commands and domain outcomes,
not filesystem paths, PDF.js objects, or storage records. The main process
composes the Modules and Adapters and owns native file selection.

## Confirmed Test Seams

### S3 — Source Processing behavior

Extend the existing TB15 public-interface tests only where the packaged
behavior requires a new outcome or invariant. Keep tests framework-independent
and verify annotation preservation by rereading through the public Working
Material Interface. Cover:

- available, unavailable, and changed linked-source outcomes;
- successful relink with the known page/range;
- unavailable, mismatched, and locator-invalid relinks; and
- changed-source capture refusal until explicit relink.

### S5 — production Source Asset Adapter contract

Add a contract only for the production machine-local Adapter. Use isolated
temporary roots and real temporary PDF bytes. Verify:

- valid private-store read/write and version validation;
- SHA-256 identity comparison;
- missing/unreadable path outcomes;
- source replacement commits only after identity and locator verification;
- failed replacement leaves the prior record unchanged;
- absolute paths and PDF bytes never appear in the selected repository; and
- atomic write interruption does not leave a false successful link.

### S1 — packaged macOS workflow

Extend the silent test harness with an isolated source-asset configuration path
and a deterministic temporary PDF fixture. The workflow must use the real
packaged Electron application, preload bridge, main composition, Paper Desk,
production Source Asset Adapter, and selected PDF Adapter. It must cover at
least these independently reviewable cases:

1. Open a linked source and observe `Source available` with the exact existing
   annotation values.
2. Remove the linked PDF, reopen Paper Desk, observe `Source status unavailable`,
   and verify the annotation remains visible.
3. Replace the PDF bytes at the same path, reopen Paper Desk, observe `Source
status changed`, and verify the annotation and locator remain unchanged.
4. Explicitly relink to a verified replacement and observe
   `Source relinked and verified.` plus `Source available`.
5. Attempt a mismatched or locator-invalid replacement and verify that the
   old link, status, and portable annotation remain unchanged.

The test harness may prepare temporary link metadata and mutate temporary PDF
files, but it must not mutate the checked-in fixture or inspect React state.
Native dialog mocks must return paths only to the main-process boundary; the
renderer assertions must observe visible outcomes.

## Minimum vertical implementation path

1. Complete the documentation prerequisite, obtain the confirmations above,
   and record the production PDF decision in an ADR. The confirmed choice is
   recorded in ADR 0015.
2. Add the first failing S5 contract for a valid machine-local link record and
   SHA-256 identity read.
3. Add the first failing S3 behavior for an unavailable linked source; add the
   smallest Source Asset Adapter and Source Processing composition needed to
   make it pass while preserving the existing TB15 outcomes.
4. Add the S5 atomic-write and failed-relink contracts, then implement the
   private-store write and verification boundary.
5. Add the S3 changed-source and explicit-relink behaviors with independently
   authored identities and the known locator.
6. Add the production PDF Adapter implementation behind `PdfAdapter`, keeping
   PDF.js out of Source Processing and renderer code.
7. Add the first S1 packaged available/unavailable workflow, then the changed,
   successful-relink, and failed-relink workflows one at a time.
8. Run focused S1/S3/S5 tests, `npm run check`, `npm run test:coverage`,
   `npm run lint:complexity`, `npm run check:changed-coverage`,
   `npm run test:provider-free`, `npm run test:workflow`, and documentation
   validation. Record red/green evidence in this brief and the delivery plan.
9. Present the exact packaged artifact for human acceptance. Automated tests
   do not close the privacy or final visual/interaction gates.

## Boundaries and explicit deferrals

This slice does not implement:

- Add PDF / Import PDF Source Record creation;
- the managed-copy Source Asset mode or `assets/sources/` population;
- OCR, arbitrary text selection, annotation remapping, or fuzzy matching;
- automatic relinking, path search, file watching, background hashing, or
  source synchronization;
- accepting changed bytes merely by opening a file;
- provider, Git, GitHub, credential, remote, or network behavior;
- Proposal, Governance, Discovery, or Synthesis changes;
- provider payload retention or diagnostics that expose source content; or
- non-PDF viewers, Windows/Linux packaging, or signed/notarized distribution.

If implementation requires a new Repository Format field, a new portable
Source Record representation, a second durable authority, a renderer-visible
absolute path, or a new PDF engine without an ADR, stop and revise this brief
and the governing documentation before continuing.

## Alternatives considered and discarded

- **Use the existing Workbench session snapshot for source links:** discarded
  because session resume state and linked-asset identity have different
  lifecycles, privacy risks, recovery rules, and ownership. A separate private
  store keeps the source link durable without coupling it to workspace resume.
- **Persist linked paths or hashes in the Knowledge Repository:** discarded
  because it would make portable content machine-specific and violate the
  accepted Repository Format boundary.
- **Let Paper Desk compare hashes or accept replacements:** discarded because
  UI code would become a second source-identity authority and could bypass the
  Source Processing preservation rule.
- **Treat changed bytes as automatically current:** discarded because a changed
  PDF can invalidate citations and locators; only explicit relink may accept
  the replacement.
- **Use only the deterministic fixture Adapter:** discarded because it proves
  S3 policy but cannot prove production file identity, private-path isolation,
  or packaged PDF behavior.
- **Add a production PDF engine before the behavior contract:** discarded
  because the S3/S5 contracts must constrain the engine's responsibility;
  engine selection follows the confirmed adapter requirement and is recorded
  separately in an ADR.
- **Expand this slice to the entire Add/Import PDF workflow:** deferred because
  it introduces Source Record creation, managed assets, import validation, and
  additional UI decisions that are not required to prove preservation of an
  existing linked Source Record.

## Acceptance evidence

### Automated implementation evidence — August 31, 2026

- The production linked-file Adapter stores versioned machine-local JSON,
  compares file identity and SHA-256 content identity, verifies the known
  page/range before relink, and atomically preserves the prior record on
  failed writes. A failed relink preserves the prior source-status projection
  and renders only a sanitized operation outcome alongside it.
- The production PDF.js Adapter contract resolves real one-page, static
  two-page, generated workflow, and explicitly configured local-resource PDF
  bytes through `pdfjs-dist@6.3.289`.
- The silent packaged S1 workflow uses the real unsigned Electron package and
  production PDF.js path. It covers available, changed, unavailable, failed
  relink (including locator-invalid replacements), successful relink,
  post-verification replacement changes, and the identity-mismatch contract in
  the focused S5 suite. It also covers Source Record/
  annotation metadata preservation, canonical replacement-path persistence,
  and post-relink status persistence. Its
  isolated fixture scans every portable repository file and verifies that
  absolute paths and replacement bytes do not enter the selected repository.
  The source-store path override
  is restricted to the silent/review harness; normal launches use the
  application-private configuration root.
- Focused S5 and PDF.js contracts pass; `npm run test:provider-free` passes
  both the provider-free baseline and production linked-PDF workflows, and the
  full silent packaged suite passes 27/27 workflow specs. The human owner passed the six final packaged-artifact
  acceptance gates on August 31, 2026, covering baseline availability, changed
  source detection, invalid replacement rejection, verified relinking,
  unavailable-source recovery, and relaunch/privacy boundaries.

### Red-to-green evidence for PR-readiness hardening

- **Red:** `npm test -- --run tests/contracts/source-asset-adapter.test.ts tests/contracts/pdfjs-pdf-adapter.test.ts` initially ran 11 tests with 2 failures. Both new diagnostics assertions observed the sanitized domain outcome but received no diagnostic records.
- **Green:** The same focused command passed all 13 tests after the optional internal diagnostics sinks, PDF-header validation, TOCTOU recheck, and isolated packaged fixture coordination were added. `npm run check` (115 tests), `npm run test:coverage` (82.57% statements, 74.51% branches, 96.74% functions, 82.46% lines), `npm run lint:complexity`, `npm run test:provider-free`, and `npm run test:workflow` are green for this hardening cycle. Changed-lines coverage passes at 81.08% (120/148 executable changed lines, 80.00% threshold).

### Human acceptance record — August 31, 2026

The human owner reviewed the visible packaged application in explicit review
mode and passed all six final gates. The review confirmed the available source
baseline; external-change detection with annotation preservation; rejection of
an invalid replacement locator; successful verified relinking; unavailable
source recovery after the relinked file disappeared; and stable relaunch,
provider-free operation, and repository privacy behavior. The owner explicitly
accepted this implemented scope. This approval does not promote the documented
Add/Import, managed-copy, OCR, remapping, automatic-relink, distribution, or
whole-release deferrals.

The slice is complete only when:

- the documentation prerequisite and PDF-engine ADR are recorded;
- S3 and S5 focused tests prove all failure and successful-relink outcomes;
- the named silent packaged workflow proves available, unavailable, changed,
  successful relink, and failed relink behavior against isolated temporary
  files;
- full checks, coverage, complexity, changed-lines coverage, and documentation
  validation are green;
- the code map identifies the production Source Asset Adapter, PDF Adapter,
  private-store boundary, preload operation, and Paper Desk projection;
- the V1 release-readiness specification, delivery plan, and victory checklist
  distinguish automated evidence from human acceptance; and
- the human owner confirms that the packaged Workbench preserves the Source
  Record, annotation, citation, and logical locator in each missing/changed
  source scenario and does not leak the linked path or source payload.

Human approval of this brief is approval of the documented scope and decisions
only. It is not approval of an unseen implementation or of a changed scope.
