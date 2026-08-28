# Issue 51: Select an explicit Workbench context

Status: implementation complete on August 28, 2026.

This brief coordinates the quality-hardening behavior requested by [Issue 51](https://github.com/tacomancy/galaxy-brain/issues/51). It is an implementation entry point, not a second authority for product behavior, architecture, repository format, or testing.

## Public behavior

When a valid Knowledge Repository contains more than one complete topic-to-Source-Record context, opening it must not silently choose the first filesystem entry. The Workbench remains in Atlas and presents every complete candidate in deterministic topic-ID and Source-Record-ID order. The person chooses one candidate explicitly.

The selected context is persisted as machine-local convenience state using the exact repository root and the stable topic and Source Record identities. On relaunch, the Workbench restores that context when it is still available. If the saved pair is no longer available, the candidates remain visible for a new choice; no directory-order or content substitution is allowed.

When several Structured Annotations belong to one Source Record, the Working Material Adapter returns the lexicographically first annotation by ID for the singular lookup and returns all matching annotations in the same ID order. This keeps resume behavior deterministic without changing portable annotation content.

## Test seam and expected values

Use the already-confirmed S1 packaged desktop workflow and S5 Adapter/Module contracts. The S1 fixture adds a second complete topic and Source Record. The independently known candidate IDs are `bayesian-statistics` and `zeta-topic`; the selected relaunch expectation is `bayesian-statistics` with Source Record `bayesian-statistics-fixture-source`.

Tests observe caller-visible outcomes and rendered behavior through the Workbench interfaces. They do not inspect React state, directory enumeration, or machine-local files as UI side channels.

## Minimum vertical path

1. Extend the Knowledge Repository outcome with explicit ambiguity and stable complete-context ordering.
2. Preserve candidate contexts in Workbench Session state and expose a caller-facing selection operation.
3. Persist and restore the selected context through the machine-local session-state Adapter.
4. Validate the choice through the main/preload boundary and present accessible Atlas selection controls.
5. Make singular and plural Source Record annotation reads deterministic by annotation ID.

## Boundaries

- A complete context requires valid topic metadata and a valid referenced Source Record; incomplete candidates are not selectable.
- The feature does not add repository discovery, automatic default selection, Git/GitHub behavior, or network access.
- Selection state remains outside the portable Knowledge Repository.
- No new Test Seam or hard-to-reverse architectural decision is introduced.

## Acceptance evidence

The slice is complete when the focused S1 workflow proves explicit selection and relaunch restoration, the S5 Knowledge Repository, Workbench Session, session-state, and Working Material contracts are green, `npm run check` passes, and the code map identifies the affected existing Module and Adapter locations.
