# V1 release-readiness specification

Status: implementation in progress on `codex/provider-free-release-gate`. The
provider-free packaged-app workflow, local governance/recovery workflows, and
initial mixed condition/decision coverage (MC/DC) evaluator are implemented.
This brief remains the bounded work plan for the remaining release evidence;
it is not a replacement for the V1 victory checklist, which remains the
release decision authority.

## Governing documentation

- [Product Decisions](product-decisions.md) owns the provider-free local core,
  local-save truthfulness, source provenance, and optional Agent Provider
  behavior.
- [Architecture](architecture.md) owns Module boundaries, state ownership,
  and external-system seams.
- [Repository Format](repository-format.md) owns portable content and protects
  it from machine-local session state.
- [Test Strategy](test-strategy.md) owns the confirmed S1–S5 seams and the
  distinction between workflow evidence and lower-seam contract evidence.
- [Software development conventions](../agents/software-development.md) own
  the pinned toolchain, code-map accuracy, and local-only boundary.
- [V1 victory checklist](v1-victory-checklist.md) owns the provider-free gate,
  MC/DC obligations, and final release dispositions.

The TB1–TB16 delivery records and applicable ADRs remain authoritative for
behaviors already accepted. This work must not silently reopen or broaden
those tracer bullets.

## Public behaviors and quality obligations

The provider-free gate must prove, through the packaged macOS Workbench and a
real file-backed repository:

1. The pinned Node.js/toolchain builds the unsigned package successfully.
2. A person can create, open, and reopen a repository without Git, GitHub,
   credentials, network services, or an Agent Provider.
3. A file change made outside the Workbench is detected before an overwrite,
   and the user's external work is preserved.
4. An interrupted file transaction recovers without silent partial state or a
   false success report.
5. A prior governed version or saved result can be recovered while preserving
   the newer/current history.
6. Local-save status says what happened locally and never implies commit,
   backup, or remote synchronization.
7. An unavailable or changed linked PDF preserves its Source Record,
   Structured Annotations, and logical locators; an unavailable provider is a
   clear non-blocking outcome.
8. Paths, credentials, provider payloads, source excerpts, and sensitive
   diagnostics are not retained or displayed outside their approved boundary.

The MC/DC gate must, for selected high-risk Module decisions:

1. Assign stable decision identifiers and record each decision's atomic
   conditions and expected outcome.
2. Provide independently known truth-table cases covering each condition as
   true and false.
3. Provide an independence witness for each condition showing that changing
   only that condition changes the decision outcome.
4. Report condition coverage, decision coverage, and MC/DC witnesses
   separately from LCOV line/branch/function coverage.
5. Fail when a registered decision has missing or invalid evidence, while
   documenting short-circuit and unreachable-condition handling.

## Confirmed seams

Provider-free behavior uses the existing seams:

- **S1 packaged desktop workflow:** the real packaged Electron application,
  typed preload bridge, Workbench Session, renderer Adapters, and file-backed
  repository/Working Material Adapters. The workflow remains silent in
  automation and visible only for human acceptance.
- **S2 Governance Interface:** exact-version application, external-edit
  protection, interrupted-transaction recovery, and targeted rollback rules.
- **S3 Source Processing Interface:** linked-source availability, changed-file
  preservation, relinking, and provenance outcomes.
- **S5 file-backed Adapter contracts:** durable filesystem and repository
  invariants, including atomic recovery and non-retention boundaries.
- **MC/DC evaluator seam:** a framework-independent command-line tool consumes
  a checked-in decision manifest and independently authored cases. It reports
  evidence; it does not become an application Module or alter runtime behavior.

No new UI, repository format, PDF engine, Agent Provider, or storage channel is
selected by this brief.

## Independently known evidence

- Required runtime: Node.js `24.19.0`.
- Package target: unsigned macOS arm64 application produced by Electron Forge.
- Local fixture repository: `app/tests/fixtures/knowledge-repository` for
  deterministic workflow setup only; release-gate tests that mutate content
  must use isolated temporary copies.
- Canonical repository behavior: the existing starter inventory and fixture
  literals, including the known governed version, rollback bytes, Source
  Record, logical Source Locator, and saved result history.
- MC/DC initial scope: dense, consequential boolean decisions in the
  framework-independent Governance and Source Processing Modules. Presentation
  conditions and every incidental UI branch are outside the initial manifest.

## Incremental implementation path

1. Complete this documentation prerequisite and reconcile the merged TB16
   status in the delivery plan and victory checklist.
2. Add the first S1 provider-free gate workflow for package creation,
   repository create/open, and an unavailable-provider outcome. The named
   `npm run test:provider-free` gate passes against the unsigned package. The
   existing `resume-selected-knowledge-repository` workflow remains the
   relaunch/reopen evidence because the Electron test service does not support
   native dialog mocks across a `reloadSession` connection.
3. Add S1/S5 evidence for external-edit preservation, interrupted transaction
   recovery, rollback/history recovery, truthful local-save status, and linked
   PDF/provider failure states, one public behavior at a time. The focused
   packaged gate now covers external-edit preservation, interrupted-journal
   restoration, local governed application, truthful local-save status, saved
   result recovery, and unavailable-provider non-retention. The remaining
   linked-PDF item is intentionally bounded by the existing production PDF
   rendering deferral and requires a future packaged PDF path before it can be
   claimed as complete.
4. Add the initial MC/DC manifest and independently authored truth-table/
   witness cases for the selected Governance and Source Processing decisions.
   The checked-in manifest now covers `governance.target-identity-match` and
   `source-processing.locator-valid`, using simple predicates from the owning
   Module rather than treating nested helper expressions as atomic.
5. Add the dedicated MC/DC command and package scripts; keep its output
   distinct from existing LCOV and changed-lines coverage gates. The
   `npm run test:mcdc` evaluator tests and `npm run check:mcdc` manifest gate
   now pass and report the three metrics separately.
6. Run `npm run check`, coverage, complexity, documentation validation,
   changed-lines coverage, the complete silent packaged workflow, and the
   dedicated MC/DC gate. Record red/green evidence here and in the delivery
   plan.
7. Present the real packaged application for the provider-free human review;
   automated evidence does not check those boxes by itself.

## Boundaries and explicit deferrals

This work does not implement signed or notarized distribution, a downloadable
end-user installer, auto-update, support operations, new Discovery behavior,
new PDF technology, a production Model Adapter, broad accessibility
certification, repository-wide snapshots, or new V1 product capabilities.

MC/DC is initially limited to registered high-risk Module decisions. Automatic
AST discovery of every boolean expression, renderer/UI MC/DC, mutation testing,
property-based generation, and a new coverage framework are deferred until a
concrete risk justifies them. Existing line, branch, function, statement, and
changed-lines gates remain active and are not relabeled as MC/DC.

The manifest evaluates the logical truth table for each registered decision;
it does not pretend that a truth-table row proves JavaScript evaluation of a
short-circuited operand. A short-circuited condition must therefore have a
reachable public behavior or contract test at its owning Module seam. No
short-circuit or unreachable-condition exemption is registered in the initial
manifest; any future exemption must name the condition, explain why it cannot
be reached through the public seam, and identify the compensating evidence.

The provider-free gate does not imply that the unsigned development package is
an end-user distribution. Distribution and operational decisions remain the
separate checklist items tracked by Issues #25 and #34.

The first remaining packaged source-status item is specified in the dedicated
[provider-free PDF source-status packaged-gate specification](provider-free-pdf-gate-spec.md).
That brief extends TB15's accepted S3 behavior to a production linked-file
Adapter and Paper Desk S1 workflow. It was confirmation-gated until the owner
confirmed linked-existing-record scope, selected the production PDF
technology, and recorded that choice in an ADR. Gates 1–6 were confirmed on
August 31, 2026, and the PDF.js choice is recorded in [ADR 0015](../../adr/0015-use-pdfjs-behind-pdf-adapter.md); implementation is now complete on
the working branch. Automated packaged acceptance passes, and final human
review of the artifact remains open.

## Alternatives considered and discarded

- **Mark the checklist from existing lower-seam tests alone:** discarded
  because S2/S3/S5 cannot prove that the packaged desktop composition exposes
  truthful, usable behavior to a person.
- **Use the checked-in fixture directly for mutating workflow tests:**
  discarded because test execution must not modify canonical evidence or make
  later runs order-dependent.
- **Treat LCOV branch coverage as MC/DC:** discarded because branch coverage
  does not provide condition independence witnesses.
- **Automatically derive MC/DC cases from the implementation:** discarded
  because expected outcomes must be independently authored and because AST
  tooling would freeze implementation structure prematurely.
- **Add a new runtime quality Module:** discarded because release verification
  belongs at existing S1–S5 seams and the MC/DC evaluator is a development
  tool, not application behavior.

## Acceptance evidence

The selected automated gates now pass: `npm run test:mcdc`,
`npm run check:mcdc`, the named provider-free packaged workflow, the full
silent packaged suite, and the documentation/type/lint checks. The provider-
free workflows cover external-edit preservation, interrupted-journal recovery,
local governed application, truthful local-save status, saved-result recovery,
and unavailable-provider behavior. The linked-PDF slice adds production
`pdfjs-dist@6.3.289` loading, private source-asset identity storage, explicit
relink verification, and S1/S5 evidence for available, unavailable, changed,
failed-relink, and successful-relink states. The MC/DC evaluator is included
in the changed-lines coverage surface so new quality logic cannot bypass that
PR gate. The remaining release work for this slice is visible human review of
the packaged artifact and local-only privacy boundary; the broader provider-
free checklist, distribution, security, and whole-release obligations remain
open.
Implementation is complete only when that evidence passes, coverage and
complexity evidence is current, the code map and release documents are
current, and the provider-free packaged workflow is ready for a visible human
review. The human owner must then confirm the real packaged repository
lifecycle and local-only boundaries before the corresponding victory-checklist
items are marked complete.

Any newly discovered persistence representation, product behavior, or
hard-to-reverse decision must pause this path and be documented with rationale
before implementation continues.

## Remaining human checks

The following checks are intentionally not inferred from automated output:

1. **Privacy and non-retention:** launch the exact packaged application tested
   by `npm run test:provider-free` with no real credentials configured. Create
   or open an isolated temporary repository, prepare a Synthesis preview, and
   confirm that the exact payload is visible only on the confirmation surface.
   Confirm that declining or receiving `agent-provider-unavailable` leaves no
   new request, response, hidden payload, credential, or absolute private path
   in the repository, session-state file, or application diagnostics. Use
   explicit searches such as `grep -R -n -E "OPENAI_API_KEY|sk-[A-Za-z0-9]"
   <temporary-root>`; do not paste a real secret into the test.
2. **Production PDF boundary:** do not mark the linked-PDF checklist item
   complete from the current fixture preview. It remains deferred until a
   production PDF-backed packaged path exists and the missing/changed asset
   scenarios can be observed there without changing Source Records or saved
   locators.
3. **Release-candidate MC/DC:** on the final release candidate, run
   `npm run check:mcdc` after updating from the current merge base and confirm
   that every changed registered decision has independently authored witnesses.
   This is a release policy check, not a claim that LCOV branch coverage is
   MC/DC.
