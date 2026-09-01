---
title: Current capabilities
summary: Versioned distinction between released, current-main, and planned Workbench behavior.
applies_to_release: "0.17.0"
tracks_main: true
verified_commit: "4ef9b37"
reviewed_on: "2026-09-01"
---

# Current capabilities

This page is the public status authority for what Galaxy Brain supports today.
It distinguishes the latest published release from the continuously changing
`main` branch and from capabilities that remain planned. The [project
documentation authority map](../docs/README.md#documentation-authority)
explains which source owns each kind of claim.

## Version markers

This page was reviewed on **2026-09-01** against the following two baselines:

| Baseline                 | Marker                                                                                                 | Meaning                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Latest published release | [0.17.0 release notes](../app/CHANGELOG.md)                                                           | The version identified by the application package, changelog, and support policy.                                                     |
| Current `main` snapshot  | [`4ef9b37`](https://github.com/tacomancy/galaxy-brain/commit/4ef9b37) | The `main` revision reviewed for this page; later commits may change current-main behavior without changing the release claims above. |

The support classes used below are deliberate:

- **Desktop-supported** means the behavior is exposed through the packaged
  Knowledge Workbench and has the corresponding accepted desktop evidence.
- **Module-only** means implementation and contract evidence exist in
  application Modules or Adapters, but the capability is not a supported
  desktop workflow yet. Human acceptance may still be pending.
- **Planned** means the capability is not part of the supported release or
  current `main` surface. Architecture and issue descriptions are plans, not
  user instructions.

## Latest published release: 0.17.0

The latest published release is **0.17.0**. Its desktop-supported baseline is
the accepted TB1–TB7 Workbench behavior. The 0.15.0 release also contains the
TB8 file-backed implementation, but that work remains module-only because the
published release has no desktop persistence or rollback workflow.

| Capability                                                                                                                    | Support class     | What a reader can rely on                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create or open a local Knowledge Repository from the empty starter or an existing conforming repository                       | Desktop-supported | The Workbench validates the selected local repository and reports cancellation, invalid, unsafe, unavailable, unsupported, and newer read-only outcomes without requiring Git or a network.                                                                          |
| Resume the explicitly selected repository and Workbench context                                                               | Desktop-supported | The Workbench restores the selected repository, workspace, topic, Source Record, and supported reading position without silently selecting a different context.                                                                                                      |
| Navigate Atlas, Studio, and Paper Desk; read Source Records; and reopen captured Structured Annotations                       | Desktop-supported | The packaged Workbench presents the accepted reading and navigation flows, including source-bound capture and recovery states.                                                                                                                                       |
| Review a Synthesis preview, remove whole context items, and decline, cancel, or confirm deliberately                          | Desktop-supported | The exact payload is inspectable before confirmation; cancellation and decline make no provider request and preserve local state. With no production Model Adapter composed, confirmation reports the explicit unavailable outcome rather than fabricating a result. |
| Open explicitly saved Synthesis results and restore retained versions                                                         | Desktop-supported | Saved results remain Working Material with agent provenance, and restore creates a new current version without making a provider request.                                                                                                                            |
| File-backed Governance persistence, applied audit records, targeted rollback data, and recoverable transaction handling (TB8) | Module-only       | The implementation, compatible packaged verification, and human acceptance are recorded; the published release has no desktop Proposal Review or rollback UI.                                                                                                        |

## Current `main` snapshot

Current `main` is reviewed at commit
[`4ef9b37`](https://github.com/tacomancy/galaxy-brain/commit/4ef9b37).
It contains the 0.17.0 application behavior and the merged V1 desktop
workflows through the current release baseline.

| Capability                                                    | Support class     | Current-main status                                                                                                                         |
| ------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted TB1–TB7 local Workbench workflows                    | Desktop-supported | Available through the packaged Workbench as described in the release table above.                                                           |
| TB8 Governance persistence and recoverable local transactions | Module-only       | Implemented, packaged-verified, and human-accepted on `main`; it remains module-only because no desktop persistence/rollback workflow is supported. |
| TB9 Governance decision slices                                | Module-only       | Stale, dependency, deferred, edited, edited-dependent, and persisted-provenance behavior is implemented and human-accepted on `main`; it remains module-only because the recorded slices have no desktop review surface. |
| TB10 bounded desktop Proposal Review                          | Desktop-supported | The packaged route, exact-diff review, explicit apply boundary, and file-backed application are implemented, automatically verified, and human-accepted on `main`; richer review controls remain deferred. |

## Planned capabilities and known limits

The following capabilities are planned or deliberately deferred. None should
be presented as available because a Module Interface, fixture, architecture
brief, or future issue exists.

| Capability                                                                                           | Support class | Boundary                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| General Knowledge Authoring and rich/source editing                                                  | Planned       | TB11's bounded six-construct transient review slice is implemented and human-accepted on the feature branch, but it is not current-main support; durable drafts, broad syntax, and general authoring remain deferred to later work. |
| Production PDF import, rendering, capture, availability, and relinking                               | Planned       | Paper Desk currently uses the accepted source-reading boundary; a production PDF engine and complete import workflow are not selected.                      |
| Production Model Adapter and live provider-backed Synthesis                                          | Planned       | Provider configuration is optional and an API key alone does not compose a production Model Adapter. No provider request should be implied by the local UI. |
| Richer Proposal Review, exact Proposal editing, selective Judgment, and rollback controls             | Planned       | The bounded TB10 review/apply route is present on current `main`; selective decisions, pending-Proposal persistence, Judgment revision, and rollback UI remain deferred. |
| Search, Ask, Jump, Generated Relationships, and authority-aware discovery                            | Planned       | Discovery is a later tracer bullet and is not part of the current desktop surface.                                                                          |
| Learning Routes, learning goals, and human-confirmed progress suggestions                            | Planned       | Learning remains a later capability and has no current Workbench workflow.                                                                                  |
| Signed/notarized installers, downloadable releases, auto-update, and supported end-user distribution | Planned       | V1 is explicitly developer-only: `npm run package` creates an unsigned local macOS arm64 package for controlled development/review; it is not a signed installer or end-user distribution channel. |

For task instructions, use the [public tutorials](tutorials/index.md). For
intended product scope and architecture, use the [V1 architecture
package](../docs/architecture/v1-ui/README.md). For published-version behavior, use the
[release notes](../app/CHANGELOG.md). None of those pages overrides the support
classes and version markers on this page. For security boundaries and
vulnerability reporting, see the [security guidance](../SECURITY.md).
