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

## Compatibility and safe writes

A Workbench checks `format` and `format_version` before enabling writes:

- A supported format opens normally without incidental mutation.
- A newer or unknown format opens read-only only when meaning can be preserved safely; otherwise it produces an unsupported-format outcome.
- A required migration is separately previewed, explicitly confirmed, recoverable, and recorded in the repository. It never occurs merely by opening or updating the Workbench.
- External changes to files known as Governed Knowledge are preserved and marked unverified until explicitly reviewed.

Proposal application is a recoverable filesystem transaction. It rechecks targeted-file fingerprints immediately before writing, preserves targeted rollback data, writes the approved files and immutable audit record under `proposals/applied/`, and never claims completion after a partial failure. The user receives a non-blocking notice that changes were saved locally; Galaxy Brain does not claim Git commit, remote synchronization, or backup status.

## Starter and fixture

The public starter skeleton is empty of subject-matter knowledge and is stored under `app/templates/knowledge-repository/`. Synthetic test data is stored under `app/tests/fixtures/knowledge-repository/` and is never derived from a private repository.

## Future work

Multi-repository switching, GitHub authentication, remote synchronization, verified off-device backup, and irreversible Git/LFS history reclamation are separate future capabilities.
