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

The format is intentionally narrow at this stage. It specifies the stable interoperability boundary and safety rules without freezing every note, audit, or rollback schema before the owning behavior exists. Concrete file schemas become part of the contract when the first file-backed Adapter needs them; each must preserve unknown content where practical and be covered by S5 contract tests.

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
