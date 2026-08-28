---
title: Current capabilities
summary: Versioned distinction between released, current-main, and planned Workbench behavior.
applies_to_release: "0.11.0"
tracks_main: true
verified_commit: "5aeb14980b1ea407bc6fbb6fa19db27143cdfd38"
reviewed_on: "2026-08-28"
---

# Current capabilities

This page is the public status authority for what Galaxy Brain supports today.
It distinguishes the latest published release from the continuously changing
`main` branch and from capabilities that remain planned. The [project
documentation authority map](../docs/README.md#documentation-authority)
explains which source owns each kind of claim.

## Version markers

This page was reviewed on **2026-08-28** against the following two baselines:

| Baseline                 | Marker                                                                                                 | Meaning                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Latest published release | [0.11.0 release notes](../app/CHANGELOG.md)                                                           | The version identified by the application package, changelog, and support policy.                                                     |
| Current `main` snapshot  | [`5aeb149`](https://github.com/tacomancy/galaxy-brain/commit/5aeb14980b1ea407bc6fbb6fa19db27143cdfd38) | The `main` revision reviewed for this page; later commits may change current-main behavior without changing the release claims above. |

The support classes used below are deliberate:

- **Desktop-supported** means the behavior is exposed through the packaged
  Knowledge Workbench and has the corresponding accepted desktop evidence.
- **Module-only** means implementation and contract evidence exist in
  application Modules or Adapters, but the capability is not a supported
  desktop workflow yet. Human acceptance may still be pending.
- **Planned** means the capability is not part of the supported release or
  current `main` surface. Architecture and issue descriptions are plans, not
  user instructions.

## Latest published release: 0.11.0

The latest published release is **0.11.0**. Its desktop-supported baseline is
the accepted TB1–TB7 Workbench behavior. The 0.11.0 release also contains the
TB8 file-backed implementation, but that work remains module-only pending the
human acceptance recorded in the project status documents.

| Capability                                                                                                                    | Support class     | What a reader can rely on                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create or open a local Knowledge Repository from the empty starter or an existing conforming repository                       | Desktop-supported | The Workbench validates the selected local repository and reports cancellation, invalid, unsafe, unavailable, unsupported, and newer read-only outcomes without requiring Git or a network.                                                                          |
| Resume the explicitly selected repository and Workbench context                                                               | Desktop-supported | The Workbench restores the selected repository, workspace, topic, Source Record, and supported reading position without silently selecting a different context.                                                                                                      |
| Navigate Atlas, Studio, and Paper Desk; read Source Records; and reopen captured Structured Annotations                       | Desktop-supported | The packaged Workbench presents the accepted reading and navigation flows, including source-bound capture and recovery states.                                                                                                                                       |
| Review a Synthesis preview, remove whole context items, and decline, cancel, or confirm deliberately                          | Desktop-supported | The exact payload is inspectable before confirmation; cancellation and decline make no provider request and preserve local state. With no production Model Adapter composed, confirmation reports the explicit unavailable outcome rather than fabricating a result. |
| Open explicitly saved Synthesis results and restore retained versions                                                         | Desktop-supported | Saved results remain Working Material with agent provenance, and restore creates a new current version without making a provider request.                                                                                                                            |
| File-backed Governance persistence, applied audit records, targeted rollback data, and recoverable transaction handling (TB8) | Module-only       | The implementation and compatible packaged verification exist in `main`, but human acceptance is pending. There is no desktop Proposal Review or rollback UI.                                                                                                        |

## Current `main` snapshot

Current `main` is reviewed at commit
[`5aeb149`](https://github.com/tacomancy/galaxy-brain/commit/5aeb14980b1ea407bc6fbb6fa19db27143cdfd38).
It contains the 0.9.0 application behavior plus documentation, verification,
and status corrections. The public desktop support boundary is therefore the
same accepted TB1–TB7 surface described above; the newer TB8 implementation is
still module-only.

| Capability                                                    | Support class     | Current-main status                                                                                                                         |
| ------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted TB1–TB7 local Workbench workflows                    | Desktop-supported | Available through the packaged Workbench as described in the release table above.                                                           |
| TB8 Governance persistence and recoverable local transactions | Module-only       | Implemented and tested on `main`; compatible packaged verification is complete; human acceptance remains pending.                           |
| First TB9 stale-Judgment policy slice                         | Planned           | Implemented and tested on a separate feature branch, but not merged into `main` or release 0.9.0. It is not a current-main user capability. |

## Planned capabilities and known limits

The following capabilities are planned or deliberately deferred. None should
be presented as available because a Module Interface, fixture, architecture
brief, or future issue exists.

| Capability                                                                                           | Support class | Boundary                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| General Knowledge Authoring and rich/source editing                                                  | Planned       | The Studio presents current contextual and Synthesis surfaces, but a general authoring workflow is deferred to Tracer Bullet 11.                            |
| Production PDF import, rendering, capture, availability, and relinking                               | Planned       | Paper Desk currently uses the accepted source-reading boundary; a production PDF engine and complete import workflow are not selected.                      |
| Production Model Adapter and live provider-backed Synthesis                                          | Planned       | Provider configuration is optional and an API key alone does not compose a production Model Adapter. No provider request should be implied by the local UI. |
| Desktop Proposal Review, exact Proposal editing, human Judgment, apply, and rollback controls        | Planned       | Governance persistence is module-only; a desktop review and rollback route remains outside the current Workbench.                                           |
| Search, Ask, Jump, Generated Relationships, and authority-aware discovery                            | Planned       | Discovery is a later tracer bullet and is not part of the current desktop surface.                                                                          |
| Learning Routes, learning goals, and human-confirmed progress suggestions                            | Planned       | Learning remains a later capability and has no current Workbench workflow.                                                                                  |
| Signed/notarized installers, downloadable releases, auto-update, and supported end-user distribution | Planned       | `npm run package` creates an unsigned local macOS package for development verification; it is not an end-user distribution channel.                         |

For task instructions, use the [public tutorials](tutorials/index.md). For
intended product scope and architecture, use the [V1 architecture
package](../docs/architecture/v1-ui/README.md). For published-version behavior, use the
[release notes](../app/CHANGELOG.md). None of those pages overrides the support
classes and version markers on this page. For security boundaries and
vulnerability reporting, see the [security guidance](../SECURITY.md).
