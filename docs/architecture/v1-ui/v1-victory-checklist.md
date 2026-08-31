# V1 Victory Checklist

Status: draft release checklist. TB15 is merged and accepted; TB16 implementation is complete with final human acceptance pending, while the final V1 scope decision and release-readiness dispositions below remain open.

This is the durable, printable checklist for declaring Knowledge Workbench V1 complete. Check an item only when its evidence is available in the repository, CI, packaged application, or recorded human acceptance. The checklist is a release decision aid; the authoritative behavior and verification details remain in the linked architecture documents.

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
- [ ] One final human acceptance review covers all TB16 behaviors; the date, evidence, and explicit approval are recorded in the TB16 documentation.

## C. Provider-free packaged application gate

Verify the packaged macOS Workbench against a real file-backed Knowledge Repository:

- [ ] Build and package using the repository's pinned runtime/toolchain.
- [ ] Create and reopen a real file-backed repository.
- [ ] Complete the core workflow locally without Git, GitHub, credentials, network, or an Agent Provider.
- [ ] Detect an external edit and preserve the user's work safely.
- [ ] Recover from an interrupted transaction without silent data loss.
- [ ] Roll back and recover a prior version or saved result.
- [ ] Show truthful local-save status; never imply a commit, backup, or remote sync that did not occur.
- [ ] Handle an unavailable or changed linked PDF without corrupting the repository.
- [ ] Show a clear unavailable-provider state without blocking provider-free workflows.
- [ ] Confirm that paths, credentials, and provider payloads are not leaked or retained contrary to policy.

This gate proves the packaged application behavior. It does not by itself prove that an unsigned development `.app` is a supported end-user distribution.

## D. Stable distribution and release operations

Resolve the distribution boundary tracked by [Issue #25](https://github.com/tacomancy/galaxy-brain/issues/25) and the operational boundary tracked by [Issue #34](https://github.com/tacomancy/galaxy-brain/issues/34). Choose exactly one distribution outcome before declaring V1:

- [ ] **Public end-user V1:** signed and notarized macOS DMG/ZIP artifacts install and launch on a clean supported Mac without Node.js or npm; Gatekeeper accepts them; checksums, signing/notarization status, release notes, and supported architectures are published.
- [ ] **Developer-only V1:** the human owner explicitly approves a source-build/unsigned-package release, Issue #25 is deferred with rationale and owner, and every public page states that no signed downloadable installer is available.

Whichever distribution outcome is selected, complete or explicitly defer every material release-operations requirement with its residual risk recorded:

- [ ] Installation, upgrade, rollback, uninstall, migration, recovery, and compatibility procedures are documented and tested for the selected distribution.
- [ ] Reproducible build metadata, artifact checksums, release provenance, and verification instructions are published.
- [ ] Diagnostic collection is opt-in or explicitly documented and cannot retain repository content, credentials, hidden provider payloads, absolute private paths, or raw sensitive exceptions.
- [ ] Support channels, severity levels, ownership, response expectations, and incident runbooks are documented.
- [ ] Issue #34 is complete, or its remaining requirements are explicitly deferred with rationale, owner, and a statement of what “supported V1” means without them.

## E. Post-tracer-bullet hardening and whole-release acceptance

The post-TB quality map in [Issue #21](https://github.com/tacomancy/galaxy-brain/issues/21) begins only after the planned V1 tracer bullets are accepted and merged. It must not remain an implicit afterthought:

- [ ] Issue #21 and its child workstreams are complete, or the human owner explicitly approves their deferral with each residual V1 risk recorded.
- [ ] Renderer bootstrap, main-window creation, and representative rejected bridge operations show a keyboard-operable, privacy-safe recovery state instead of a blank or falsely successful UI, as specified by [Issue #52](https://github.com/tacomancy/galaxy-brain/issues/52).
- [ ] The behavior, privacy, recovery, and Adapter-contract gaps in [Issue #22](https://github.com/tacomancy/galaxy-brain/issues/22) are closed or individually deferred with rationale and ownership.
- [ ] The completed-codebase review in [Issue #23](https://github.com/tacomancy/galaxy-brain/issues/23) ranks Module depth, Interface, dependency-direction, state-ownership, and complexity findings; every material finding is fixed, explicitly deferred, or tracked.
- [ ] A superseding whole-release human acceptance run covers every desktop-supported user story on the exact release commit and packaged artifact, records platform/version evidence, and replaces the stale baseline in [Issue #75](https://github.com/tacomancy/galaxy-brain/issues/75).
- [ ] The existing architecture follow-ups—safe artifact storage, Synthesis lifecycle ownership, Workbench Session/Source Processing separation, and append-only result history in [Issues #69–#72](https://github.com/tacomancy/galaxy-brain/issues/69)—are completed or explicitly deferred with their V1 recovery, provenance, and persistence risks recorded.

## F. Security, supply-chain, and repository controls

Passing checks on one pull request is not enough unless the repository requires the intended checks and protects their inputs:

- [ ] The default-branch ruleset requires the full verification suite against the current merge base, as specified by [Issue #76](https://github.com/tacomancy/galaxy-brain/issues/76).
- [ ] New commits dismiss stale approvals, the latest push is approved, and unresolved review threads block merge, as specified by [Issue #77](https://github.com/tacomancy/galaxy-brain/issues/77).
- [ ] Production dependencies have no high or critical audit findings; known development-alert debt is resolved or explicitly accepted with evidence; dependency review and the production audit are required checks, as specified by [Issue #79](https://github.com/tacomancy/galaxy-brain/issues/79).
- [ ] GitHub Actions workflows pass syntax/security validation, use immutable SHA-pinned actions with version comments, and run under an approved-action and least-privilege policy, as specified by [Issue #80](https://github.com/tacomancy/galaxy-brain/issues/80).
- [ ] CodeQL explicitly runs the approved security-extended and security-and-quality suites; every finding is fixed, dismissed with rationale, or tracked, as specified by [Issue #81](https://github.com/tacomancy/galaxy-brain/issues/81).
- [ ] Concise PR diagnostics from [Issue #82](https://github.com/tacomancy/galaxy-brain/issues/82) are available, or their deferral is recorded with an alternative way to investigate failed release gates.

## G. TB12–TB14 release-scope decision

These remaining planned bullets must not remain ambiguous. For each one, choose exactly one outcome and record the decision in the delivery plan and relevant spec or product decision:

- [ ] TB12, “Separate Search, Ask, and Jump,” is implemented, verified, and human-accepted for V1, closing or updating [Issue #31](https://github.com/tacomancy/galaxy-brain/issues/31).
- [ ] TB12 is explicitly deferred post-V1 with rationale, owner, and follow-up recorded in [Issue #31](https://github.com/tacomancy/galaxy-brain/issues/31).
- [ ] TB13, “Make Atlas actionable,” is implemented, verified, and human-accepted for V1, closing or updating [Issue #32](https://github.com/tacomancy/galaxy-brain/issues/32).
- [ ] TB13 is explicitly deferred post-V1 with rationale, owner, and follow-up recorded in [Issue #32](https://github.com/tacomancy/galaxy-brain/issues/32).
- [ ] TB14, “Keep learning progress human-owned,” is implemented, verified, and human-accepted for V1, closing or updating [Issue #32](https://github.com/tacomancy/galaxy-brain/issues/32).
- [ ] TB14 is explicitly deferred post-V1 with rationale, owner, and follow-up recorded in [Issue #32](https://github.com/tacomancy/galaxy-brain/issues/32).

If any of TB12–TB14 is required for V1, review the governing documentation and create a guidance-compliant implementation spec before implementation begins. If deferred, document the boundary clearly rather than leaving an unimplemented tracer bullet implied by the release label.

## H. Documentation, issue-tracker, and release hygiene

- [ ] Current Capabilities distinguishes the latest published release, reviewed `main`, and planned work.
- [ ] Product Decisions, Architecture, Repository Format, Test Strategy, Delivery Plan, and TB16 documentation agree about scope and status.
- [ ] The first-release public journey in [Issue #89](https://github.com/tacomancy/galaxy-brain/issues/89) accurately documents how to run/install the selected distribution, explicit context selection, empty-starter versus pre-populated/fixture boundaries, and portable TB8 audit/rollback/staging artifacts.
- [ ] Tutorial version/evidence metadata and visible-label drift protection in [Issue #90](https://github.com/tacomancy/galaxy-brain/issues/90) are complete, or explicitly deferred with rationale, owner, and a manual release-review substitute.
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
- [ ] TB15 integrated and accepted.
- [ ] TB16 integrated and accepted.
- [ ] TB12–TB14 scope classification recorded.
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
npm run check:changed-coverage
npm run test:workflow
npm audit --omit=dev --audit-level=high
npm audit --audit-level=high
```

The packaged workflow may require a built application and the repository's documented test-mode setup. Automated accessibility checks support the evidence but do not replace observable workflow assertions or human review.
