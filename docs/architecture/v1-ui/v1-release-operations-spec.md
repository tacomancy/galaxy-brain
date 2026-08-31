# V1 stable distribution and release operations specification

Status: accepted by the human owner on August 31, 2026 for the selected
developer-only V1 path. The documentation review, implementation gates, and
eight human release-candidate checks are complete. This brief
covers the stable-distribution and release-operations work in [Section D of
the V1 victory checklist](v1-victory-checklist.md#d-stable-distribution-and-release-operations),
tracked by [Issue #25](https://github.com/tacomancy/galaxy-brain/issues/25)
and [Issue #34](https://github.com/tacomancy/galaxy-brain/issues/34).

This is an implementation entry point, not a replacement for Product
Decisions, Architecture, Repository Format, Test Strategy, the Security
Policy, or the victory checklist. It must be revised before implementation if
the human owner selects a materially different distribution, platform, or
support boundary.

## Problem statement

Galaxy Brain can currently be packaged as an unsigned local macOS `.app` for
development and packaged-workflow verification. That artifact is not an
end-user release: it requires a source checkout and the pinned Node.js/npm
toolchain to build, has no signed DMG or ZIP delivery path, and has no
versioned operational process for installation, upgrades, rollback,
uninstallation, migration, recovery, diagnostics, support, or artifact
verification.

The V1 victory checklist therefore cannot be completed from passing
application tests alone. The project needs a release boundary a person can
understand and operate, with evidence that the selected package is safe to
install, preserves the local-only Knowledge Repository boundary, and can be
verified and supported without exposing private repository content,
credentials, hidden Agent Provider payloads, or machine-local paths.

## User-facing solution

Galaxy Brain will publish one explicitly chosen V1 distribution outcome:

1. **Public end-user V1:** a signed and notarized macOS DMG and ZIP that a
   person can install and launch on a clean supported Mac without Node.js,
   npm, Git, an existing Knowledge Repository, or an API key; or
2. **Developer-only V1:** a deliberately non-public source-build and/or
   unsigned-package path, with the absence of a signed downloadable installer
   stated on every public entry point and Issue #25 explicitly deferred.

Whichever outcome is chosen, the repository will contain a repeatable release
checklist and safe operating procedures. A release record will identify the
exact application version and source revision, supported macOS/architectures,
build inputs, artifact checksums, provenance, verification results, known
limitations, and human approval. Support and diagnostic instructions will
make the safe collection boundary explicit and will never imply that Galaxy
Brain backs up, commits, synchronizes, or remotely stores a user's Knowledge
Repository.

## Human decision gates

Implementation must not begin until the human owner confirms the following
choices. The specification may be implemented in slices after these gates are
confirmed; confirmation of a gate is not final human acceptance of the
resulting package.

### Gate 1 — distribution outcome

Select exactly one:

- **Public end-user V1.** Implement the signed/notarized macOS distribution
  path described in this brief and close the corresponding Issue #25 scope.
- **Developer-only V1.** Keep the existing unsigned/source path, explicitly
  defer Issue #25, name the owner and revisit condition, and update public
  documentation so it does not describe an installer or downloadable release.

The human owner selected **developer-only V1** on August 31, 2026. No
workflow, release note, or public capability page claims a public end-user
distribution. Issue #25 remains deferred.

### Gate 2 — supported platform and architecture

The current application is macOS-only and the packaged workflow is verified on
macOS arm64. The recommended initial target is macOS arm64, with x64 or a
universal artifact added only if the owner promotes it into this work and the
clean-machine evidence is available for it.

The owner must confirm:

- the supported macOS versions or support rule;
- arm64-only, x64-only, or universal artifact scope; and
- whether unsupported architectures receive a clear refusal or are simply
  outside the published support boundary.

This implementation uses the recommended **macOS arm64-only** target. x64 and
universal artifacts remain deferred. A target architecture is part of the
release contract, not an incidental packager flag.

### Gate 3 — version and compatibility policy

The release policy must define:

- how application versions are selected and tagged;
- which release, `main`, or development versions receive security fixes;
- what a Knowledge Repository compatibility promise means;
- how incompatible repository formats are refused or opened read-only;
- how application upgrades, migrations, and failed migrations are handled;
- how long deprecation notices remain visible; and
- who owns each support and security decision.

The selected starting policy is to support the latest published application
release and the current `main` development line for security reports, and to
keep Knowledge Repositories application-independent with explicit format
compatibility checks. The owner must confirm that policy or provide a
replacement before release automation is treated as complete. The current
`SECURITY.md`, application package metadata, public capability metadata, and
release notes must agree before the V1 declaration.

## Governing authorities and documentation prerequisite

Before implementation or behavior tests, complete these explicit tasks:

1. Review [Product Decisions](product-decisions.md), [Architecture](architecture.md),
   [Repository Format](repository-format.md), [Test Strategy](test-strategy.md),
   [Software development conventions](../agents/software-development.md),
   [Issue-tracker guidance](../agents/issue-tracker.md), the [Security Policy](../../../SECURITY.md),
   applicable ADRs, the [delivery plan](delivery-plan.md), and the current
   [V1 victory checklist](v1-victory-checklist.md).
2. Review Issues #25 and #34 and preserve their non-overlapping boundaries:
   #25 owns macOS packaging/signing/notarization, while #34 owns release
   operations, supportability, lifecycle procedures, diagnostics, and
   provenance.
3. Confirm Gate 1, Gate 2, and Gate 3 above. Record any hard-to-reverse
   choice in an ADR before it spreads into packaging or workflow interfaces.
4. Confirm that the release process changes application artifacts and public
   documentation only; it never changes a user's portable Knowledge
   Repository as part of install, upgrade, or uninstall.
5. Confirm the Test Seam and independently known expected values below.
6. Only after these confirmations, begin the first Red-to-Green slice and
   record its evidence in this brief and the delivery plan.

This documentation prerequisite was completed before implementation. Gate 1
was confirmed by the human owner; the recommended arm64 target and proposed
support policy were used for the implementation. Final release acceptance is
still a separate human gate.

## Public behaviors

The completed work must make these behaviors true and inspectable:

1. A release operator can build the selected package from an exact source
   revision using the pinned Node.js/npm toolchain and a clean dependency
   install.
2. The selected release artifacts have deterministic names and metadata,
   include no user Knowledge Repository or fixture content, and contain the
   bundled starter skeleton only where the current application contract
   requires it.
3. In the developer-only path, every public installation instruction clearly
   identifies the source-build/unsigned boundary and does not suggest that
   Gatekeeper-accepted or signed downloads exist.
4. A first launch starts without selecting or scanning for a repository. A
   person can create or open a repository explicitly, and the package does
   not initialize Git or create commits on the person's behalf.
5. An upgrade preserves a valid repository and machine-local session state
   according to the confirmed compatibility policy, or reports a clear
   recoverable incompatibility without mutating the repository.
6. A rollback procedure returns to the prior application version or clearly
   identifies the supported recovery action without destroying repository
   content, audit records, or retained result history.
7. Uninstall removes application-owned package files according to the selected
   platform procedure while leaving the user's Knowledge Repository intact;
   any machine-local session or link data is described as a separate cleanup
   choice.
8. Migration and recovery procedures identify what is backed up externally,
   what Galaxy Brain can validate or restore locally, and what must be
   recovered by the user. The Workbench never claims that an application
   rollback is a repository backup.
9. Release metadata identifies the source revision, application version,
    target platform/architecture, pinned toolchain, artifact hashes, build
    workflow, and signing/notarization status where applicable.
10. Diagnostic collection is opt-in or explicitly limited to safe automatic
    metadata. It excludes repository content, source excerpts, prompts,
    provider request/response payloads, credentials, absolute private paths,
    and raw sensitive exception data.
11. A person can report a security or product issue through documented
    channels, understand severity and response expectations, and follow an
    incident runbook without being asked to disclose private Knowledge
    Repository content or secrets.

## Independently known expected values

These values are established before implementation and must not be derived
from the artifact being tested:

- Runtime/toolchain: Node.js `24.19.0` with the repository's committed npm
  lockfile.
- Current application version baseline: `0.13.1`.
- Current package boundary: macOS Electron application; current automated
  package verification targets arm64.
- Fresh-launch state: no repository selected and explicit Open/Create choices.
- Portable-content rule: the selected repository remains outside the
  application package, and the bundled starter skeleton is distinct from
  synthetic fixtures.
- Selected package outcome: unsigned/source-build instructions with an
  explicit no-downloadable-installer statement.
- Verification outcome: a checksum mismatch, unsupported platform, failed
  signature/notarization check, or incompatible repository must fail visibly
  and must not be reported as a successful release.
- Privacy outcome: prohibited content remains absent from repositories,
  release artifacts, logs, diagnostics, and support bundles.

## Confirmed Test Seams and evidence boundaries

Use the highest existing seam for each behavior:

- **S1 packaged desktop workflow:** the real packaged Electron application,
  typed preload bridge, Workbench Session, renderer Adapters, and isolated
  file-backed repository verify first launch, explicit repository selection,
  local-only operation, upgrade compatibility, and recovery outcomes. The
  automated harness remains silent; visible launch is reserved for human
  acceptance.
- **S5 file-backed Adapter contracts:** isolated temporary repositories verify
  that installation, migration, failed recovery, and application-owned
  machine-local state do not overwrite portable repository files or leave
  silent partial state.
- **Release artifact/workflow boundary:** CI and release scripts verify build
  inputs, artifact contents, checksums, provenance, signatures, notarization
  status, and public metadata. This is release tooling evidence, not a new
  Workbench application Module or a substitute for S1 human observation.

No new application Module, generic release service, or renderer bridge is
selected by this specification. Release orchestration belongs to packaging
configuration, CI workflow, and documented operator procedures; Workbench
runtime behavior continues to use the existing application boundaries.

## Implementation decisions

### Packaging and artifact contract

- Keep the existing Electron Forge/Webpack packaging foundation and pinned
  toolchain. Add only the makers and metadata required by the confirmed
  distribution outcome.
- Give the application a stable bundle identity, display metadata, and
  release version. Add a reviewed application icon for any user-facing
  installer.
- Keep ASAR/resource boundaries explicit. The package may contain the public
  starter skeleton and runtime resources, but never a user's repository,
  synthetic fixture content, `.env` values, API keys, signing credentials, or
  machine-local link/session data.
- Use deterministic artifact names that include application version and
  platform/architecture. A release record must bind each artifact to the
  source revision and exact build inputs.
- Generate checksums and machine-readable provenance beside the artifacts.
  Verification must be possible without trusting the artifact filename alone.

### Signing and notarization for the public outcome

Developer-only V1 does not add signing, notarization, DMG/ZIP makers, or
signing credentials. These mechanics remain explicitly deferred and public
documentation states that no signed downloadable installer is available.

### Release process and version policy

- Retain the existing release-PR/versioning automation as the starting point,
  but make its version, changelog, public capability metadata, security
  support policy, and artifact metadata checks agree on one release identity.
- Require a release checklist that names the source revision, version,
  supported target, verification commands, artifact locations, checksums,
  signing/notarization result, known limitations, and human approver.
- Publish release notes that distinguish new behavior, compatibility or
  migration impact, security fixes, deferred limitations, and unsupported
  platforms.
- Require a clean release candidate before publication. A failed candidate is
  retained as evidence or discarded by documented operator action; it is not
  represented as a supported release.
- Keep GitHub, Git, credentials, and network as release-operator/CI concerns;
  the Workbench itself remains local-first and VCS-neutral.

### Lifecycle, migration, and recovery policy

- Installation must be tested from the selected artifact on a clean supported
  Mac.
- Upgrade must be tested from the prior supported package with a repository
  containing representative portable content, Working Material, Source
  Records, and any accepted persisted artifacts relevant to the confirmed
  V1 scope.
- Rollback must identify the prior package, the point at which application
  rollback is safe, and the cases where repository migration must be restored
  from an external backup rather than reversed automatically.
- Uninstall documentation must distinguish application files, machine-local
  session/link data, and user-owned repository files. It must not instruct a
  destructive recursive deletion of a user's repository.
- Migration must be versioned, validated before mutation, recoverable after
  interruption, and explicit about unsupported newer formats. If no migration
  is required for the selected V1 package, the release record must say so and
  prove that the compatibility check was exercised.

### Diagnostics, support, and incidents

- Default diagnostics contain only safe operational metadata needed to
  identify the application version, platform, workflow, and failure class.
- Diagnostic capture must be opt-in whenever content could be sensitive, and
  the user must be able to inspect or decline it. Automatic support bundles
  must not contain repository content, credentials, hidden provider payloads,
  absolute paths, or raw stack traces with sensitive data.
- Document issue-report templates, severity levels, ownership, initial
  response expectations, escalation, security disclosure, and incident
  containment. A security report remains private according to `SECURITY.md`.
- A release incident runbook must cover withdrawal, communicating a bad
  artifact, preserving evidence, publishing a corrected release, and
  recording the residual risk.

## Incremental implementation path

Each slice requires a focused red-to-green or documentation evidence record,
the relevant existing checks, and a green-suite review before the next slice.
No later slice may be implemented speculatively.

1. **Policy and metadata reconciliation.** Confirm Gates 1–3; reconcile
   version, support, current-main, security, capabilities, and release-note
   metadata; record any hard-to-reverse choices in ADRs.
2. **Artifact contract.** Add or verify stable bundle metadata, icon/resource
   boundaries, deterministic artifact naming, artifact-content inspection,
   checksums, provenance, and failure behavior. Prove that no private or
   fixture content enters the package.
3. **Selected distribution path.** For public V1, add DMG/ZIP makers,
   signing, hardened runtime, entitlements, notarization, ticket stapling,
   and CI-only secret handling. For developer-only V1, formalize the unsigned
   package/source path and public no-installer boundary instead; do not add
   dormant signing plumbing.
4. **Release automation.** Make the release workflow build from the exact
   release revision, run the required verification gates, retain concise
   diagnostics, publish the artifact/checksum/provenance set, and fail closed
   on signing, notarization, content, or metadata errors.
5. **Lifecycle procedures.** Document and exercise install, first launch,
   create/open, upgrade, compatibility refusal, migration/no-migration,
   rollback, uninstall, and recovery for the selected distribution.
6. **Support and privacy operations.** Add safe support templates, severity
   and ownership guidance, diagnostic boundaries, private security-reporting
   instructions, and incident runbooks. Verify that example reports contain
   no real secrets or private repository content.
7. **Release-candidate acceptance.** Run the complete repository, package,
   artifact, security, documentation, and release workflow gates. Perform
   the clean-machine human review, record the exact release evidence, update
   the victory checklist, and only then declare the selected Section D
   outcome complete.

## Automated acceptance evidence

The implementation is complete only when applicable evidence is current and
recorded for the exact release candidate:

- repository `check`, documentation, lint, type, unit/contract, coverage,
  complexity, audit, and workflow-security gates pass;
- package creation succeeds from a clean install using Node.js `24.19.0`;
- artifact inspection confirms deterministic metadata and absence of private,
  fixture, credential, and machine-local content;
- checksums reproduce from the published artifacts;
- provenance identifies the source revision and build inputs;
- public V1 signing, Gatekeeper, notarization, and ticket-stapling checks pass
  for every published architecture, or developer-only documentation evidence
  explicitly proves that no signed installer is claimed;
- isolated lifecycle tests cover repository preservation across install,
  upgrade, migration/no-migration, rollback, uninstall, and recovery; and
- release metadata, public capability pages, security support policy, release
  notes, and operator checklist agree on version, support, and distribution.

Automated output does not prove that a clean Mac can understand the package,
that the public instructions are adequate, or that a user-owned repository
was preserved through the lifecycle. Those remain human gates.

## Human acceptance checklist

The human owner must review the exact release candidate and record pass/fail
evidence for the selected outcome:

1. **Artifact identity:** confirm version, source revision, architecture,
   checksums, provenance, release notes, and support policy agree.
2. **Clean installation:** on a supported Mac with no Node.js/npm/Git,
   install the selected artifact; for public V1 confirm Gatekeeper accepts
   it. For developer-only V1 confirm the documented unsigned/source boundary
   is truthful.
3. **First launch:** verify Atlas opens with no repository selected and no
   invented or fixture content; confirm explicit Open/Create choices.
4. **Repository lifecycle:** create or open an isolated repository, verify
   portable files, close/reopen, upgrade from the prior supported version,
   and confirm the compatibility/migration outcome.
5. **Recovery and uninstall:** exercise the documented rollback or recovery
   path and uninstall procedure; verify the user-owned repository remains
   intact and that any machine-local cleanup is clearly separated.
6. **Privacy and diagnostics:** inspect the documented diagnostic path and
   any generated support material. Confirm no repository content, credentials,
   hidden provider payloads, absolute private paths, or raw sensitive errors
   are retained or published.
7. **Supportability:** follow the issue/security reporting instructions and
   confirm severity, ownership, response expectations, and incident guidance
   are actionable.
8. **Release declaration:** record the exact artifact, release commit/tag,
   platform, date, test evidence, known deferrals, and human approver.

Passing these checks accepts the selected release-operations scope. It does
not accept deferred platforms, auto-update, or later post-V1 hardening.

## Implementation evidence — August 31, 2026

The selected developer-only path has been implemented and exercised against
the current release candidate. The focused red-to-green cycle found and fixed
two artifact-boundary defects: a valid relative Electron framework symlink was
initially rejected, and a static PDF.js import embedded this checkout's
absolute path in `app.asar`. The verifier now permits only in-artifact relative
symlinks, scans application-owned payloads for sensitive markers, and keeps
vendor framework binaries in the complete artifact hash without treating their
own macOS path literals as application leakage.

Recorded green evidence:

- `npm run check`: 26 Vitest files / 127 tests, MC/DC, and 29 documentation
  files passed;
- `npm run test:coverage`: 82.77% statements, 74.64% branches, 96.51%
  functions, and 82.67% lines;
- `npm run lint:complexity` passed;
- the pinned Python 3.11 public-docs test passed (7 tests);
- `npm run test:workflow` passed all 28 silent packaged-app specs;
- `npm run release:manifest` and `npm run release:verify` passed for the
  rebuilt `0.13.1` macOS arm64 artifact; and
- production and full dependency audit commands remain required release gates
  and are recorded with the final candidate evidence.

These results establish implementation and human acceptance evidence for the
selected developer-only scope. The signed/notarized installer, x64/universal
packaging, updater, and other post-V1 work remain explicitly deferred.

## Explicit deferrals

The following are outside this specification unless the owner explicitly
promotes them through a revised decision and acceptance plan:

- Windows distribution tracked by Issue #26.
- Enterprise hosting or managed deployment tracked by Issue #27.
- Automatic updates, background update checks, and rollback orchestration
  performed by an updater.
- Multi-user support, remote synchronization, GitHub integration, verified
  off-device backup, and repository discovery.
- Adding a production Model Adapter or changing Agent Provider confirmation
  and non-retention rules.
- OCR, non-PDF viewers, broad import workflows, or new Knowledge Repository
  format fields.
- Full screen-reader certification, new accessibility capabilities, and
  post-TB hardening tracked by Issues #21, #22, and #23.
- Universal/x64 artifacts when arm64-only is confirmed.
- Crash telemetry or remote diagnostic upload beyond the approved explicit
  support boundary.
- Closing the V1 declaration from lower-seam tests without exact packaged
  artifact and human lifecycle evidence.

Every deferred item needs an owner or an explicit revisit decision in the
issue tracker before Section D can be declared complete.

## Discarded alternatives and rationale

- **Treat the unsigned `.app` as a public release:** discarded because it is
  not independently verifiable, is not Gatekeeper-accepted distribution, and
  requires the development toolchain to produce.
- **Select public versus developer-only release silently:** discarded because
  it changes user expectations, signing obligations, support liability, and
  the status of Issue #25; the owner must choose.
- **Store signing credentials in the repository or local package:** discarded
  because credentials and signing material are machine/CI secrets and must
  never cross the repository or artifact boundary.
- **Make the Workbench itself perform GitHub releases or repository backup:**
  discarded because Git, GitHub, network, and backup remain external
  user-managed concerns under the accepted VCS-neutral architecture.
- **Bundle user repositories or fixture content for a richer first launch:**
  discarded because it would violate the empty-start and portable-content
  boundaries and make a release artifact misleading.
- **Add an updater as part of the first stable distribution:** discarded
  because update discovery and rollback introduce a new trust, migration, and
  recovery surface; they remain separately deferred.
- **Use release metadata as a substitute for clean-machine acceptance:**
  discarded because metadata can prove identity but cannot prove installation,
  usability, Gatekeeper behavior, or repository preservation.
- **Create a new runtime Release Module:** discarded because release
  orchestration is tooling and operational procedure, not Workbench product
  behavior. A new Module would add an abstraction without a demonstrated
  runtime caller or Test Seam.

## Completion record

The human owner accepted the selected developer-only V1 release-operations
scope on August 31, 2026. The accepted candidate is version `0.13.1` from
commit `175fab66b19d1b2927c7bf741b5f47622d8ab1c3`, targeting unsigned macOS
arm64 with Node.js `24.19.0` and the committed npm lockfile. Its artifact is
`out/Galaxy Brain-darwin-arm64/Galaxy Brain.app`, with 334833159 bytes, 853
files, and SHA-256
`15d465cad6f30d50bb101bdb9bd5efd497bf02d93af75f4d245b56c300931d67`. The
manifest checksum is
`ecf7fa10b23214351995bc7a9f6698841a2707628f04c299b319871963048d59`.

Automated evidence passed: repository checks (127 tests, MC/DC, and
documentation checks), coverage, complexity, changed-lines coverage, both
dependency audits, public-docs validation, artifact manifest generation and
verification, and all 28 silent packaged-app workflow specs. The human owner
also passed all eight acceptance checks: artifact identity, clean installation
boundary, first launch, repository lifecycle, recovery/uninstall, privacy and
diagnostics, supportability, and release declaration.

The accepted V1 boundary explicitly defers signed/notarized DMG/ZIP and public
end-user distribution (Issue #25), x64/universal artifacts, auto-update,
Windows and enterprise deployment, and the other post-V1 work listed above.
Issue #34's selected V1 release-operations scope is complete; deferred items
remain tracked with their residual risks in the issue tracker and this brief.
