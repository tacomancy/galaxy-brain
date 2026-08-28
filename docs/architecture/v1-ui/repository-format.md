# Galaxy Brain Repository Format v1

Status: accepted.

The Repository Format is the VCS-neutral, application-independent contract for a portable Knowledge Repository. It lets the same repository survive Workbench upgrades, move between machines, remain intelligible without the Workbench, and be processed by other conforming tools.

## Boundaries

A Knowledge Repository lives outside the installed Workbench and has its own lifecycle. The public application project may contain a synthetic fixture and an empty starter skeleton, but a user's actual repository is independent and private. Application source, executables, dependencies, caches, indexes, logs, credentials, Agent Provider configuration, session preferences, and machine-local linked-file paths are not Repository Format content.

Galaxy Brain does not require or invoke Git, Git LFS, GitHub, remotes, credentials, or network connectivity. Git and Git LFS remain optional external tools. A repository may include `.gitattributes` as user-managed policy, but its presence never changes local Workbench availability.

## Version declaration

Every repository created from the V1 skeleton has a UTF-8 YAML file named `galaxy-brain.yaml` at its root:

```yaml
format: galaxy-brain
format_version: 1
```

`format` identifies the contract. `format_version` is a positive integer changed only by an approved format revision. Workbench release versions and Repository Format versions are independent.

## Portable content

V1 repositories use ordinary directories and UTF-8 Markdown with YAML frontmatter. The canonical roots are `knowledge/`, `sources/`, `projects/`, `scratch/`, `proposals/`, `templates/`, and `assets/`. Applied-Proposal audit records live under `proposals/applied/`; targeted rollback history is repository-local and application-readable.

Managed Source Assets are verified bytes under `assets/sources/` with repository-relative references. Linked-local Source Assets remain outside the repository; their path and SHA-256 identity live only in machine-local configuration keyed by Source Record identity.

Conforming writers preserve unrecognized files, frontmatter fields, and Markdown extensions unless an explicit operation targets them. Derived and machine-local state can be rebuilt without losing knowledge.

The format is intentionally narrow at this stage. It specifies the stable interoperability boundary and safety rules without freezing unrelated note, indexing, or repository-wide history schemas. The first file-backed Governance Adapter now establishes the concrete applied-Proposal schema below. It remains within `format_version: 1`, must preserve unknown repository content, and is covered by S5 contract tests.

### Applied-Proposal persistence

One successful governed application creates one immutable UTF-8 JSON object at:

```text
proposals/applied/<applied-record-id>.json
```

For the first S5 cycle, the object has this shape and literal meaning:

```json
{
  "id": "applied-proposal-tb8-bayesian-statistics-evidence",
  "proposal": {
    "id": "proposal-tb8-bayesian-statistics-evidence",
    "fingerprint": "proposal-fingerprint-tb8-bayesian-statistics-evidence",
    "target": {
      "id": "bayesian-statistics",
      "title": "Bayesian statistics",
      "path": "knowledge/bayesian-statistics.md"
    },
    "base_version_id": "bayesian-statistics-v1",
    "working_material_id": "working-material-tb8-bayesian-statistics-evidence",
    "exact_change": {
      "path": "knowledge/bayesian-statistics.md",
      "before": "This fixture topic gives the S1 workflow a stable item to carry between\nworkspaces.",
      "after": "Bayesian statistics uses evidence to update prior belief."
    }
  },
  "judgment": {
    "id": "judgment-tb8-bayesian-statistics-evidence",
    "proposal_id": "proposal-tb8-bayesian-statistics-evidence",
    "proposal_fingerprint": "proposal-fingerprint-tb8-bayesian-statistics-evidence",
    "base_version_id": "bayesian-statistics-v1",
    "decision": "accepted"
  },
  "target": {
    "id": "bayesian-statistics",
    "title": "Bayesian statistics",
    "path": "knowledge/bayesian-statistics.md"
  },
  "previous_version": {
    "id": "bayesian-statistics-v1",
    "fingerprint": "5fb3de504a1d39faaa32c199f9b8209dabb9abb4deb419633b2679de242c41df"
  },
  "new_version": {
    "id": "bayesian-statistics-v2",
    "fingerprint": "e2f8bbc083c57de5e4c01ad7c92fc965cc54d05061b0b85b06fa8b8e3ec504d1"
  },
  "rollback_path": "proposals/applied/applied-proposal-tb8-bayesian-statistics-evidence/rollback/knowledge/bayesian-statistics.md"
}
```

The field names are portable snake-case names. `id` is unique within `proposals/applied/`; `proposal` and `judgment` preserve the exact approved identities, target, base version, and replacement; `previous_version` and `new_version` bind the target fingerprints to the Governance-domain version identifiers; and `rollback_path` is a repository-relative path to the exact original target bytes. The `decision` value is `accepted` for this cycle. Records are never overwritten; reusing an identity with different content is an explicit failure.

The current governed file remains at its ordinary canonical path. The rollback file is stored at:

```text
proposals/applied/<applied-record-id>/rollback/<target-relative-path>
```

It contains the exact original bytes before application and is immutable after the application succeeds. It is retained history and recovery data, not a second current-content authority. This first cycle preserves only the targeted file; multi-file bundles and repository-wide snapshots are deferred.

An in-progress application is staged at:

```text
proposals/applied/.transactions/<applied-record-id>/
```

The directory contains a private journal and staged target, rollback, and audit content. The journal is written before mutation, the live target fingerprint is rechecked immediately before replacement, and the Adapter must resolve an interrupted operation on reopen by either completing a fully staged application or restoring the prior target. Cleanup occurs only after the target, rollback, and audit record are in place. Unknown or orphaned transaction directories are not automatically removed by this first cycle.

Readers must treat malformed or internally inconsistent applied records as an explicit repository/application outcome rather than silently inventing version history. A successful open with no applied record uses the existing target bytes as the deterministic fixture baseline `bayesian-statistics-v1`; after application, the valid applied record establishes `bayesian-statistics-v2` and its prior relationship. General version allocation, branching lineage, migrations, indexing, retention policy, and schema negotiation remain deferred.

## Compatibility and safe writes

A Workbench checks `format` and `format_version` before enabling writes:

- A supported format opens normally without incidental mutation.
- A newer or unknown format opens read-only only when meaning can be preserved safely; otherwise it produces an unsupported-format outcome.
- A required migration is separately previewed, explicitly confirmed, recoverable, and recorded in the repository. It never occurs merely by opening or updating the Workbench.
- External changes to files known as Governed Knowledge are preserved and marked unverified until explicitly reviewed.

For the Tracer Bullet 2 file-backed Adapter, a read/write V1 repository has the scalar `format: galaxy-brain` declaration, `format_version: 1`, and all seven canonical roots. Unknown files and additional format content are preserved. Malformed YAML, duplicate or ambiguous keys, non-scalar declarations, missing canonical roots, and unsafe filesystem entries are invalid. YAML parsing is safe and non-executing. A newer format is read-only only when its meaning can be preserved safely; malformed, unknown, or unsafe formats remain unselected, and migration is outside this slice.

The selected creation root must be canonical and must not be a symlink. The starter skeleton contains no symlinks, and copying never follows links. The Adapter rechecks the canonical target and its emptiness immediately before mutation. Opening a repository containing any symlink returns an unsafe-target outcome and leaves it unselected.

Creation stages the complete skeleton in a uniquely named application-owned temporary sibling, validates it, and places it at the selected root atomically where the platform permits. When an existing empty directory cannot be replaced atomically, failure restores its original empty state. Failed operations clean staging and never select a partial repository. Later cleanup may remove only recognized abandoned staging paths; it never scans or deletes content inside an explicitly selected user directory.

Proposal application is a recoverable filesystem transaction. It rechecks targeted-file fingerprints immediately before writing, preserves targeted rollback data, writes the approved files and immutable audit record under `proposals/applied/`, and never claims completion after a partial failure. The user receives a non-blocking notice that changes were saved locally; Galaxy Brain does not claim Git commit, remote synchronization, or backup status.

## Starter and fixture

The public starter skeleton is empty of subject-matter knowledge and is stored under `app/templates/knowledge-repository/`; its checked-in [inventory](starter-inventory.md) is the independent expected tree for creation tests. Synthetic test data is stored under `app/tests/fixtures/knowledge-repository/` and is never derived from a private repository.

## Future work

Repository-format-related future work is maintained in the canonical [Product Decisions future-work list](product-decisions.md#future-work), rather than duplicated here.
