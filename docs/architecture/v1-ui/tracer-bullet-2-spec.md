# Tracer Bullet 2: Create or open a local Knowledge Repository

Status: draft implementation specification. Tracer Bullet 2 has not yet been accepted.

This specification turns the second candidate in the [delivery plan](delivery-plan.md#2-create-or-open-a-local-knowledge-repository) into an executable vertical slice. The controlling documents remain the [Product Decisions](product-decisions.md), [Repository Format](repository-format.md), [Architecture](architecture.md), and [Test Strategy](test-strategy.md).

## Goal

Starting from a fresh Workbench with no selected repository, a person can explicitly:

1. open an existing valid Knowledge Repository; or
2. create a Knowledge Repository from the bundled empty starter skeleton at a new or explicitly empty path.

The Workbench selects the repository only after the operation succeeds and validates the Repository Format. A failed operation preserves any repository that was already selected; from the fresh empty state it preserves the empty state. The attempted target is unchanged, apart from controlled staging that is cleaned up or rolled back before failure is reported.

This slice establishes the first real local file lifecycle. It does not make Git, Git LFS, GitHub, credentials, an Agent Provider, or network connectivity part of the Workbench.

## Implementation order

The acceptance matrix describes the complete Tracer Bullet 2 boundary, but implementation proceeds one behavior-named Red-to-Green cycle at a time:

1. **Create a Knowledge Repository at a new path** is the first cycle.
2. **Create at an explicitly empty path** follows once the first cycle is green.
3. **Open an existing valid repository** follows once creation and format validation are green.
4. **Reject unsafe, invalid, or unsupported targets** follows as the recovery and safety cycle.

Do not implement later recovery breadth or format migration speculatively during the first cycle.

## Public Behavior

The fresh empty state presents explicit **Open** and **Create** actions. Neither action scans sibling directories, guesses a repository, or silently uses the committed test fixture.

### Open

When the person explicitly selects a directory:

- a supported Knowledge Repository opens and becomes the selected repository;
- the Workbench remains usable and shows the repository-backed Atlas state;
- the selected root is the exact directory chosen by the person;
- opening does not initialize Git, create a commit, contact a remote, or perform incidental migration; and
- an invalid or unsupported target produces a clear visible outcome and leaves the Workbench at an explicit recovery choice.

An existing valid repository must not be rewritten merely because it was opened. Unknown files and format content remain protected by the Repository Format contract.

### Create

When the person explicitly chooses a new path or an existing empty directory:

- the Workbench copies the public starter skeleton;
- the resulting root contains the required `galaxy-brain.yaml` declaration:

  ```yaml
  format: galaxy-brain
  format_version: 1
  ```

- the resulting root contains the canonical V1 directories:
  `knowledge/`, `sources/`, `projects/`, `scratch/`, `proposals/`,
  `templates/`, and `assets/`;
- the skeleton contains no subject-matter knowledge or private repository content;
- the Workbench validates the result before selecting it; and
- the Workbench shows that local repository work is available.

Creation never runs `git init`, creates a commit, configures a remote, or claims that the repository is backed up or synchronized.

### Selection state and cancellation

Canceling a native chooser is a no-op. It does not clear a selected repository, change the Workbench state, or show a failure message. If a repository is already selected, a failed replacement Open or Create operation leaves that repository selected and usable. If no repository is selected, the Workbench remains at the empty state.

### Caller-visible outcomes

Workbench Session returns a discriminated outcome that UI Adapters and tests can interpret without parsing error strings:

| Outcome | Meaning |
| --- | --- |
| `opened` | A supported V1 repository is selected read/write. |
| `created` | A new repository was copied, validated, and selected read/write. |
| `canceled` | The chooser was canceled and no state changed. |
| `read-only-compatible` | A newer format or otherwise safe restricted repository is selected without write capability. |
| `invalid-format` | The target does not satisfy the supported format contract. |
| `unsafe-target` | The target or its reachable entries violate path-safety rules. |
| `target-unavailable` | The target cannot be accessed, created, or written as requested. |
| `operation-failed` | An unexpected failure occurred and the operation was rolled back or left unchanged. |

Human-readable details, paths, and recovery instructions are presentation data attached to the outcome; tests do not depend on exact error wording.

### Reject unsafe creation targets

When the person chooses a nonempty directory that is not a supported valid repository, creation is rejected. The Workbench must not overwrite, delete, rename, or partially scaffold that directory. The person can recover by choosing another path or using **Open** for an existing valid repository.

## Path safety and transaction boundary

The main process resolves and validates the selected path before the Repository Adapter receives it. Creation supports a new final directory beneath an existing writable parent or an existing empty directory. A file at the target, a missing parent, an unavailable volume, or an unwritable target produces a recoverable failure without mutation.

The selected creation root must be canonical and must not be a symlink. The starter skeleton must contain no symlinks, and copying must not follow links. The implementation rechecks the canonical target and its emptiness immediately before mutation so a concurrent change cannot redirect or broaden the write.

For Open, any symlink within the selected repository is an `unsafe-target` outcome. The repository remains unselected; Tracer Bullet 2 does not attempt to prove that a symlink is harmless or open the repository read-only.

Creation stages the complete skeleton in a temporary sibling location, validates the staged result, and then places it at the selected root atomically where the platform permits. If atomic placement is not available for an existing empty directory, the implementation restores the original empty state on failure. A failed operation never reports success, selects a partial repository, or leaves staging artifacts behind.

Staging paths use a unique application-owned prefix outside the final repository. The validated final manifest and canonical roots are the commit point. On a later operation, the Workbench may clean only recognized abandoned staging paths; it never scans for or auto-deletes content inside an explicitly selected user directory.

## Format validation and compatibility

For Tracer Bullet 2, a read/write V1 Knowledge Repository has:

- a root `galaxy-brain.yaml` whose `format` is the scalar `galaxy-brain`;
- a positive integer `format_version` equal to `1`; and
- all seven canonical roots present as directories: `knowledge/`, `sources/`,
  `projects/`, `scratch/`, `proposals/`, `templates/`, and `assets/`.

Unknown files and additional format content are allowed and are not rewritten merely by opening the repository. Malformed YAML, duplicate or ambiguous keys, non-scalar declarations, missing canonical roots, and unsafe filesystem entries are invalid. YAML parsing is safe and non-executing.

Compatibility outcomes are distinct:

- supported V1 repositories open read/write;
- a newer format opens read-only only when its meaning can be preserved safely; and
- malformed, unknown, or unsafe formats remain unsupported and unselected.

Migration is not part of this slice.

## Acceptance matrix

| Case | Starting condition | Expected result | Filesystem expectation |
| --- | --- | --- | --- |
| Fresh launch | No repository selected | Open and Create are visible and operable | No repository is invented or discovered |
| Open valid repository | Explicitly selected root has a supported `galaxy-brain.yaml` and valid V1 structure | Repository becomes selected and Atlas is usable | Existing content is not rewritten |
| Create at new path | Selected target does not yet exist | Empty starter repository is created, validated, selected, and usable | Only starter content is written |
| Create at empty path | Selected target exists but contains no entries | Same result as new-path creation | The empty directory is populated with starter content |
| Create at invalid nonempty path | Selected target contains a sentinel or unrelated content and is not a valid repository | Visible rejection and recovery choice | Sentinel and all pre-existing content remain unchanged |
| Open newer compatible path | Explicitly selected target declares a newer format whose meaning can be preserved safely | Repository opens read-only with a visible compatibility state | No writes or migration occur |
| Open invalid or unsafe path | Explicitly selected target fails format or safety validation | Visible invalid/unsupported outcome; no silent fallback | No migration or mutation occurs as a side effect of opening |
| Cancel selection | Native chooser is canceled | Current Workbench state is preserved | No filesystem mutation |

The exact error wording is a UI decision for implementation, but the outcome must distinguish a failed selection from a successfully opened or created repository and must offer a visible recovery path.

## Test Seam and vertical path

The confirmed Test Seam is **S1, the public desktop Knowledge Workbench workflow**. The behavior test operates the packaged Electron application through accessible actions, visible content, focus behavior, and returned durable outcomes. For this slice, the workflow uses the production file-backed Repository Adapter against isolated temporary roots because durable local files are the behavior under test. It does not inspect renderer state, routes, editor nodes, or storage as a UI side channel.

The minimum production path is:

```text
Atlas empty state
  -> typed preload operation
  -> validated main-process request
  -> Workbench Session repository operation
  -> Knowledge Repository Adapter
  -> format validation and starter-skeleton copy
  -> selected-repository outcome
  -> Atlas projection
```

The renderer remains an interaction adapter. Workbench Session owns the selected repository root and its user-visible outcome. The main process owns privileged path handling and validation. Repository-format rules stay behind the Knowledge Repository boundary rather than being reproduced in UI code.

If the slice requires a new Module Interface or Test Seam, implementation pauses and the owning architecture document is amended and explicitly confirmed before the new seam is used.

## Test conditions

### Automated acceptance

Automated coverage should establish the following independently known outcomes:

1. A fresh packaged session exposes Open and Create without a repository.
2. Creating at a new temporary path produces the required manifest and canonical roots, with no fixture subject matter.
3. Creating at an explicitly empty temporary directory succeeds with the same result.
4. Opening a known valid repository selects that exact repository and leaves its existing content intact.
5. Attempting to create in a nonempty invalid directory fails without changing a sentinel file or the directory contents.
6. Symlinked targets or template entries are rejected without writes outside the selected canonical root.
7. A forced copy or validation failure leaves no selected partial repository or staging artifacts.
8. Malformed, ambiguous, and unsafe format metadata cannot enable a write path; a safely interpretable newer format is read-only.
9. Canceling a chooser is a no-op, and a failed replacement preserves the currently selected repository.
10. The workflow remains provider-free and does not require Git, Git LFS, GitHub credentials, or network access.

The S1 workflow should use real Workbench-owned Modules, the production file-backed Adapter, and a controlled local test environment. Supporting S5 contract coverage should run now for the new Adapter and the Repository Format boundary; it must cover the same required manifest, canonical roots, safe writes, unknown-content preservation, and failure cleanup. The desktop workflow asserts public selection, recovery, and usability outcomes rather than querying storage as a side channel. Expected manifest values, directory names, and sentinel contents are written independently of the implementation.

The test data must keep the public starter skeleton and synthetic fixture separate:

- starter source: `app/templates/knowledge-repository/`;
- synthetic fixture source: `app/tests/fixtures/knowledge-repository/`; and
- per-test targets: isolated temporary directories, including new, empty, valid, and invalid cases.

The starter inventory is an explicit checked-in test input, not an incidental directory snapshot. It records starter-relative paths and content categories, including README files, registry seed files, templates, `.gitattributes`, and `.gitkeep` entries. Intentional skeleton changes update that inventory in the same reviewed change. Tests separately assert that fixture knowledge and private repository content are absent.

### Manual acceptance

After automated coverage is green, manually run the packaged or development Workbench and verify:

- the native directory chooser supports both Open and Create;
- a new repository can be created in a temporary location;
- an existing valid repository can be opened explicitly;
- an invalid nonempty directory is rejected without losing its pre-existing content;
- keyboard focus, accessible names, visible errors, and recovery actions are usable;
- the application remains usable with no Agent Provider configuration;
- local-only operation remains usable without network connectivity or Git; and
- all save/status language describes local persistence only, never commit, synchronization, or backup.

The automated environment must make unexpected Git process execution or network access fail loudly; manual offline testing supplements this boundary check rather than replacing it.

Evidence for the completed slice should include the focused behavior result, the relevant full-suite result, and a short manual record naming the selected paths and observed outcomes without copying private repository content into the public project.

## Invariants

The implementation must preserve these existing architectural and product invariants:

- A Knowledge Repository is independent of the installed Workbench and the public application project.
- The exact explicitly selected root is authoritative; the Workbench does not scan for sibling repositories.
- Supported repositories open without incidental mutation.
- Creation is limited to a new or explicitly empty directory, unless the target is already a valid repository selected through Open.
- Repository files remain VCS-neutral and portable.
- Git and Git LFS are optional external tools managed by the person, not application dependencies.
- A failed open or create operation cannot leave a partially selected repository or claim success.
- Creation validates a canonical target and never follows symlinks while copying.
- Creation failures clean up staging and restore an existing empty target when necessary.
- The starter skeleton is empty of subject matter and is never confused with the synthetic fixture.
- Agent Provider availability does not affect local repository creation or opening.

## Explicit non-goals

This slice does not implement:

- machine-local resume of the last selected repository;
- sibling discovery or automatic repository selection;
- Git initialization, commits, branches, remotes, Git LFS, GitHub integration, or backup;
- substantive knowledge editing, source capture, Synthesis, Governance, or Proposal application;
- full external-edit, interrupted-transaction, rollback, or adapter-equivalence coverage reserved for later slices and S5; or
- format migration beyond the safe invalid/unsupported outcome required at this boundary.

## Completion gate

Tracer Bullet 2 is complete and ready for user acceptance when:

1. the S1 automated behavior coverage is green, using the production file-backed path for durable-file cases;
2. the supporting S5 Repository Adapter and format checks are green;
3. the manual Open/Create, invalid-target, accessibility, and provider-free checks are recorded;
4. the code map and delivery evidence identify the production path and any new Adapter or Module; and
5. the user has reviewed the running behavior and explicitly accepted the slice.

The completion record belongs in the [delivery plan](delivery-plan.md), not in this specification. This document should then retain the final scope and test contract while its status is changed to accepted.
