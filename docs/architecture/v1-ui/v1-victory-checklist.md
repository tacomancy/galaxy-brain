# V1 Victory Checklist

Status: draft release checklist. TB15 and TB16 are merged and accepted, and the
provider-free release gate now has focused packaged-workflow evidence for its
local governance and recovery behaviors, while the linked-PDF packaging
boundary, privacy review, MC/DC release-candidate rule, TB13–TB14 implementation
and acceptance, and release-readiness dispositions below remain open.

This is the durable, printable checklist for declaring Knowledge Workbench V1 complete. Check an item only when its evidence is available in the repository, CI, packaged application, or recorded human acceptance. The checklist is a release decision aid; the authoritative behavior and verification details remain in the linked architecture documents.

Sections C–H intentionally track release-level follow-up work outside TB16’s bounded implementation scope. They remain here so deferred distribution, security, hardening, scope-classification, and documentation decisions stay visible and cannot be mistaken for completed TB16 behavior; each item requires its own evidence or an explicit human-approved deferral before V1 is declared.

## Definition of victory

V1 is ready to declare when the accepted work is integrated, TB16 is implemented and human-accepted, the provider-free packaged application gate passes, the distribution and release-operations standard is explicit, post-tracer-bullet hardening and repository-security risks are dispositioned, the documentation is current, every open issue is classified, and TB12–TB14 have each been explicitly classified as either part of V1 or deferred with rationale, ownership, and follow-up.

## A. Integrate accepted work

- [x] TB15 PR #104 was merged and closed on August 31, 2026, and the accepted TB15 behavior is present on `main`.
- [x] The TB16 branch is based on the current release target after TB15 integration.

## B. Finish TB16: desktop quality contract

Complete and verify every slice in [the TB16 specification](tracer-bullet-16-spec.md):

- [x] Keyboard-only completion of a critical workflow.
- [x] Visible focus for actionable controls and meaningful navigation states.
- [x] Semantic landmarks, names, states, and outcomes.
- [x] Reduced-motion behavior and preference respect.
- [x] Scalable text without loss of essential functionality.
- [x] Light/dark theme selection and persistence.
- [x] Working Material undo with clear local-save status.
- [x] Result-history recovery for previously saved outcomes.
- [x] Focused slice tests and lower-seam tests are green.
- [x] Full checks, coverage, complexity, documentation validation, and packaged workflow checks are green.
- [x] One final human acceptance review covered all TB16 behaviors on August 31, 2026; the eight passed steps and explicit user approval are recorded in the TB16 documentation.

## C. Provider-free packaged application gate

The implementation entry point for this gate is the [V1 release-readiness specification](v1-release-readiness-spec.md). It keeps packaged behavior evidence at the existing S1–S5 seams and does not mark a gate complete from lower-seam or automated evidence alone.

Verify the packaged macOS Workbench against a real file-backed Knowledge Repository:

- [x] Build and package using the repository's pinned runtime/toolchain; the
      named automated gate is `npm run test:provider-free`, which packages with
      Node.js `24.19.0` and runs the isolated S1 provider-free workflows.
- [x] Create and reopen a real file-backed repository; creation/opening is
      covered by the named gate and relaunch/reopen by the existing
      `resume-selected-knowledge-repository` workflow.
- [x] Complete the core workflow locally without Git, GitHub, credentials, network, or an Agent Provider; the named gate now includes repository creation/opening, a local governed apply, saved-result recovery, and unavailable-provider confirmation.
- [x] Detect an external edit and preserve the user's work safely; `v1-provider-free-recovery-gate.e2e.ts` mutates an isolated repository after review and verifies that the external bytes remain unchanged.
- [x] Recover from an interrupted transaction without silent data loss; the packaged gate opens an isolated repository with a deliberately interrupted journal and verifies restoration and transaction cleanup.
- [x] Roll back and recover a prior version or saved result; the packaged gate restores the prior saved-result version without a provider request, while the governed apply retains its prior version.
- [x] Show truthful local-save status; never imply a commit, backup, or remote sync that did not occur; the packaged gate asserts the exact local-save notice.
- [x] Implement handling for an unavailable or changed linked PDF without corrupting the repository. The implementation and automated evidence are recorded in [the provider-free PDF source-status packaged-gate specification](provider-free-pdf-gate-spec.md), including the production PDF.js path, private source-asset store, status outcomes, explicit relink, and preservation behavior.
- [x] Complete human acceptance of the packaged linked-PDF status/relink workflow and confirm that private paths and source payloads remain within the approved main-process boundary.
- [x] Show a clear unavailable-provider state without blocking provider-free
      workflows; the named packaged gate reports `agent-provider-unavailable`.
- [ ] Confirm that paths, credentials, and provider payloads are not leaked or retained contrary to policy. This remains an explicit human inspection of packaged logs, session state, repository artifacts, and the confirmation surface.

This gate proves the packaged application behavior. It does not by itself prove that an unsigned development `.app` is a supported end-user distribution.

## C1. Mixed condition/decision coverage

The initial implementation scope and explicit MC/DC deferrals are recorded in the [V1 release-readiness specification](v1-release-readiness-spec.md).

Track MC/DC as an explicit quality work item alongside, rather than folded into, line, branch, and changed-lines coverage:

- [x] Select the initial high-risk multi-condition decisions in framework-independent Governance and Source Processing Modules and assign stable decision identifiers in the [V1 release-readiness specification](v1-release-readiness-spec.md).
- [x] Add independently authored truth-table cases that exercise each condition as both `true` and `false` and provide an independence pair showing that each condition changes the decision outcome.
- [x] Add dedicated `test:mcdc` and `check:mcdc` gates that report condition coverage, decision coverage, and MC/DC witnesses separately and fail when a registered decision lacks required evidence.
- [x] Define and document the short-circuit/reachability boundary, explicit exemptions, and the boundary between Module MC/DC evidence and renderer/UI workflow coverage in the [V1 release-readiness specification](v1-release-readiness-spec.md).
- [ ] Require MC/DC evidence for changed registered decisions before declaring the V1 release candidate complete; do not infer MC/DC from LCOV line or branch data.

The initial scope is deliberately limited to dense, consequential domain decisions. Expanding the manifest to every conditional, including presentation-only UI conditions, is deferred until a concrete risk or requirement justifies it.

## D. Stable distribution and release operations

Resolve the distribution boundary tracked by [Issue #25](https://github.com/tacomancy/galaxy-brain/issues/25) and the operational boundary tracked by [Issue #34](https://github.com/tacomancy/galaxy-brain/issues/34). Before implementation, review the governing documentation and complete the [V1 stable distribution and release operations specification](v1-release-operations-spec.md), including its human-owned distribution, platform, and support-policy gates. Choose exactly one distribution outcome before declaring V1:

- [ ] **Public end-user V1:** signed and notarized macOS DMG/ZIP artifacts install and launch on a clean supported Mac without Node.js or npm; Gatekeeper accepts them; checksums, signing/notarization status, release notes, and supported architectures are published.
- [x] **Developer-only V1:** the human owner explicitly approved a source-build/unsigned-package release, Issue #25 is deferred with rationale in the release-operations specification and runbook, and the public support/capability/first-launch pages state that no signed downloadable installer is available.

Whichever distribution outcome is selected, complete or explicitly defer every material release-operations requirement with its residual risk recorded:

- [x] Installation, upgrade, rollback, uninstall, migration, recovery, and compatibility procedures are documented and tested for the selected distribution; all eight human release-candidate checks passed on August 31, 2026.
- [x] Reproducible build metadata, artifact checksums, release provenance, and verification instructions are published and were verified for commit `175fab6`.
- [x] Diagnostic collection is opt-in or explicitly documented and cannot retain repository content, credentials, hidden provider payloads, absolute private paths, or raw sensitive exceptions; human privacy review passed on August 31, 2026.
- [x] Support channels, severity levels, ownership, response expectations, and incident runbooks are documented; human supportability review passed on August 31, 2026.
- [x] Issue #34's selected V1 scope is complete; remaining post-V1 requirements are explicitly deferred with rationale, owner, and the supported-V1 boundary recorded in the release-operations specification and runbook.

## E. Post-tracer-bullet hardening and whole-release acceptance

The post-TB quality map in [Issue #21](https://github.com/tacomancy/galaxy-brain/issues/21) begins only after the planned V1 tracer bullets are accepted and merged. It must not remain an implicit afterthought:

- [ ] Issue #21 and its child workstreams are complete, or the human owner explicitly approves their deferral with each residual V1 risk recorded.
- [ ] Renderer bootstrap, main-window creation, and representative rejected bridge operations show a keyboard-operable, privacy-safe recovery state instead of a blank or falsely successful UI, as specified by [Issue #52](https://github.com/tacomancy/galaxy-brain/issues/52).
- [ ] The behavior, privacy, recovery, and Adapter-contract gaps in [Issue #22](https://github.com/tacomancy/galaxy-brain/issues/22) are closed or individually deferred with rationale and ownership.
- [ ] The completed-codebase review in [Issue #23](https://github.com/tacomancy/galaxy-brain/issues/23) ranks Module depth, Interface, dependency-direction, state-ownership, and complexity findings; every material finding is fixed, explicitly deferred, or tracked.
- [x] A superseding whole-release human acceptance run covers every desktop-supported user story on the exact release commit and packaged artifact, records platform/version evidence, and replaces the stale baseline in [Issue #75](https://github.com/tacomancy/galaxy-brain/issues/75); all 13 stories were accepted on August 31, 2026 using the packaged arm64 application at commit `9d8cdaa`, with the complete run record in the [Issue #75 acceptance comment](https://github.com/tacomancy/galaxy-brain/issues/75#issuecomment-5483988343).
- [ ] The existing architecture follow-ups—safe artifact storage, Synthesis lifecycle ownership, Workbench Session/Source Processing separation, and append-only result history in [Issues #69–#72](https://github.com/tacomancy/galaxy-brain/issues/69)—are completed or explicitly deferred with their V1 recovery, provenance, and persistence risks recorded.

## F. Security, supply-chain, and repository controls

Passing checks on one pull request is not enough unless the repository requires the intended checks and protects their inputs:

- [x] The default-branch ruleset requires the full verification suite against the current merge base, as specified by [Issue #76](https://github.com/tacomancy/galaxy-brain/issues/76); the active `Main Protections` ruleset was updated and verified on August 31, 2026.
- [x] New commits dismiss stale approvals, the latest push is approved, and unresolved review threads block merge, as specified by [Issue #77](https://github.com/tacomancy/galaxy-brain/issues/77); the active pull-request rule was updated and verified on August 31, 2026.
- [x] Production dependencies have no high or critical audit findings; known development-alert debt is resolved or explicitly accepted with evidence; dependency review and the production audit are required checks, as specified by [Issue #79](https://github.com/tacomancy/galaxy-brain/issues/79); PR [#118](https://github.com/tacomancy/galaxy-brain/pull/118) passed the audit gates, Dependabot reports no open alerts, and both checks are required by `Main Protections` as of August 31, 2026.
- [x] GitHub Actions workflows pass syntax/security validation, use immutable SHA-pinned actions with version comments, and run under an approved-action and least-privilege policy, as specified by [Issue #80](https://github.com/tacomancy/galaxy-brain/issues/80); PR [#114](https://github.com/tacomancy/galaxy-brain/pull/114) passed actionlint, zizmor, and pin validation, and the repository Actions policy requires SHA pinning with approved actions as of August 31, 2026.
- [x] CodeQL explicitly runs the approved `security-extended` and `security-and-quality` suites, as specified by [Issue #81](https://github.com/tacomancy/galaxy-brain/issues/81); merged PR [#112](https://github.com/tacomancy/galaxy-brain/pull/112) added the explicit query configuration.
- [ ] Current CodeQL findings are fixed, dismissed with rationale, or tracked before the V1 release candidate is declared; this remains a release-candidate evidence check for [Issue #81](https://github.com/tacomancy/galaxy-brain/issues/81).
- [x] Concise PR diagnostics from [Issue #82](https://github.com/tacomancy/galaxy-brain/issues/82) are available, or their deferral is recorded with an alternative way to investigate failed release gates; PR [#111](https://github.com/tacomancy/galaxy-brain/pull/111) added JUnit, LCOV, and JSON artifacts, job summaries, desktop logs and screenshots, and 14-day retention without changing check semantics.

## G. TB12–TB14 release-scope decision

These remaining planned bullets must not remain ambiguous. The scope decision below records whether each item belongs in V1; implementation, verification, and human acceptance remain separate release gates. Record the decision in the delivery plan and relevant spec or product decision.

- [x] TB12, “Separate Search, Ask, and Jump,” is in scope for V1; implementation, verification, and human acceptance completed on September 1, 2026 in [Issue #31](https://github.com/tacomancy/galaxy-brain/issues/31).
- [x] TB13, “Make Atlas actionable,” is in scope for V1; implementation, verification, and human acceptance completed on September 1, 2026 in [Issue #32](https://github.com/tacomancy/galaxy-brain/issues/32).
- [x] TB14, “Keep learning progress human-owned,” is in scope for V1; implementation, verification, and human acceptance completed on September 1, 2026 in [Issue #32](https://github.com/tacomancy/galaxy-brain/issues/32).
- [x] TB12–TB14 implementation, verification, and human acceptance are complete for V1 as of September 1, 2026.

If any of TB12–TB14 is required for V1, review the governing documentation and create a guidance-compliant implementation spec before implementation begins. If deferred, document the boundary clearly rather than leaving an unimplemented tracer bullet implied by the release label.

## H. Documentation, issue-tracker, and release hygiene

- [ ] Current Capabilities distinguishes the latest published release, reviewed `main`, and planned work.
- [ ] Product Decisions, Architecture, Repository Format, Test Strategy, Delivery Plan, and TB16 documentation agree about scope and status.
- [x] The first-release public journey in [Issue #89](https://github.com/tacomancy/galaxy-brain/issues/89) accurately documents how to run/install the selected distribution, explicit context selection, empty-starter versus pre-populated/fixture boundaries, and portable TB8 audit/rollback/staging artifacts; completed in merged and closed [PR #109](https://github.com/tacomancy/galaxy-brain/pull/109).
- [x] Tutorial version/evidence metadata and visible-label drift protection in [Issue #90](https://github.com/tacomancy/galaxy-brain/issues/90) are complete; completed in merged and closed [PR #113](https://github.com/tacomancy/galaxy-brain/pull/113).
- [ ] Every deferred behavior, discarded alternative, and unresolved follow-up has an owner or an explicit decision to revisit it.
- [ ] Code-map pointers and public/internal documentation links resolve.
- [ ] Every open GitHub issue has a dated disposition: required for V1, explicitly deferred post-V1 with rationale and owner, or superseded/completed and closed.
- [ ] Completed tracer-bullet trackers—including Issues #29, #30, and #33—are updated and closed rather than remaining open with stale implementation status.
- [ ] Repository-housekeeping findings in [Issue #95](https://github.com/tacomancy/galaxy-brain/issues/95) are complete or classified as non-blocking with rationale.
- [ ] All implementation PRs required for V1 are merged and closed, with CI checks passing.
- [ ] Release notes, version metadata, and the packaged artifact are prepared according to the repository's release process.
- [ ] The final V1 declaration records the date, release commit/tag, packaged artifact, test evidence, and human approver.

## Final declaration

- [ ] Provider-free core release gate passed.
- [x] TB15 integrated and accepted in PR #104 on August 31, 2026.
- [x] TB16 integrated and accepted in PR #106 on August 31, 2026.
- [x] TB12–TB14 are classified as in scope for V1; implementation and acceptance completed on September 1, 2026.
- [ ] Distribution and release-operations outcome recorded.
- [ ] Post-TB hardening and whole-release human acceptance complete or explicitly deferred with residual risks accepted.
- [ ] Security, supply-chain, and repository-control gates passed.
- [ ] Every open issue dispositioned and completed trackers reconciled.
- [ ] Documentation and release artifact prepared.

V1 victory declared by: ____________________

Date: ____________________

Release commit or tag: ____________________

Evidence links or notes: __________________________________________________

## Reference documents

- [Product decisions](product-decisions.md)
- [Architecture](architecture.md)
- [Repository Format](repository-format.md)
- [Test strategy](test-strategy.md)
- [Delivery Plan](delivery-plan.md)
- [TB15 specification](tracer-bullet-15-spec.md)
- [TB16 specification](tracer-bullet-16-spec.md)
- [TB12 specification](tracer-bullet-12-spec.md)
- [V1 release operations specification](v1-release-operations-spec.md)
- [Open GitHub issues](https://github.com/tacomancy/galaxy-brain/issues?q=is%3Aissue%20state%3Aopen)
- [Post-TB quality hardening, Issue #21](https://github.com/tacomancy/galaxy-brain/issues/21)
- [macOS distribution, Issue #25](https://github.com/tacomancy/galaxy-brain/issues/25)
- [Release operations, Issue #34](https://github.com/tacomancy/galaxy-brain/issues/34)

## Suggested verification commands

Run the repository's checks from the app directory with the pinned runtime:

```text
cd /Users/slehr/GitHub/dr-tacomancer/galaxy-brain/app
npm run check
npm run test:coverage
npm run lint:complexity
npm run check:changed-coverage -- --lcov coverage/lcov.info --base-ref origin/main --repository-root .. --coverage-root .
npm run test:workflow
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

The packaged workflow may require a built application and the repository's documented test-mode setup. Automated accessibility checks support the evidence but do not replace observable workflow assertions or human review.

## Maintainability review gate

Complete this gate against the integrated release candidate after all required tracer bullets are merged. The review should identify concrete change risk and maintenance cost; it is not permission for a broad rewrite, speculative abstraction, or cosmetic code churn. Record each material finding with an owner and classify it as fixed for V1, explicitly accepted for V1 with rationale, or deferred to a focused follow-up issue.

A reviewer should be able to identify where a behavior lives, which valid states and failures it permits, what it preserves when an operation fails, and the smallest safe place to make the next related change.

- [ ] Every important state object, business rule, and persistence decision has one authoritative Module or Adapter owner; competing implementations or ambiguous ownership are resolved or tracked.
- [ ] Domain terms, types, and outcomes reflect the product’s real concepts and valid states; invalid combinations, ambiguous flags, and ordinary expected failures are prevented or represented explicitly at the owning boundary.
- [ ] Common changes remain local to the Module that owns the behavior; a change does not require unrelated UI, domain, persistence, and infrastructure edits merely because boundaries are shallow or duplicated.
- [ ] Core behavior is deterministic for the same inputs and declared dependencies. Time, randomness, environment, filesystem, provider, and desktop effects are introduced through explicit boundaries rather than hidden globals or ambient mutation.
- [ ] Dependency direction remains explicit and inward: domain and application Modules do not depend on renderer frameworks, filesystem implementations, provider SDKs, or other infrastructure details.
- [ ] External systems—including filesystems, desktop APIs, Agent Providers, and future network services—remain behind narrow application-owned Interfaces that translate external data and failures into project vocabulary.
- [ ] Public Interfaces are smaller and more stable than the complexity they hide; they do not expose private framework state, arbitrary command channels, storage layouts, or sequencing details.
- [ ] Expected failures such as cancellation, unavailable resources, invalid input, stale data, and conflicts are represented explicitly, while violated invariants and unexpected defects remain distinguishable.
- [ ] Persisted representations and consequential state changes preserve history and intent where recovery, provenance, or auditability matter; they are validated, versioned or compatibility-bounded, recoverable, and protected against partial writes, external changes, and destructive internal refactors.
- [ ] Tests observe public behavior at confirmed Test Seams rather than private methods, component internals, implementation call order, or storage side channels.
- [ ] Ordinary functions and direct data flow remain the default composition mechanism. Every new abstraction has demonstrated variation or leverage; duplicated knowledge is removed without forcing distinct policies into a speculative generic layer.
- [ ] Complexity hotspots, broad orchestration functions, duplicated policy, and unclear state ownership have been reviewed under Issue #23; accepted complexity is documented rather than hidden by arbitrary metric exceptions.
- [ ] A maintainer unfamiliar with the implementation can use the code map, Module names, Interfaces, ADRs, and tests to locate where the next related change belongs.
- [ ] Architecture, code-map, Repository Format, Test Strategy, and ADR documentation reflects every material Module, Interface, dependency-direction, state-ownership, persistence, or Test-Seam decision present in the release candidate.
- [ ] Behavior changes were made in small verified increments; refactoring occurred only with relevant tests green, and no release-critical behavior depends on an unverified broad cleanup.
- [ ] The maintainability reviewer records the release commit, review date, reviewed surfaces, material findings, dispositions, and explicit approval or rejection.
