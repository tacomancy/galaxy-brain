# Use append-only Synthesis result versions

Status: accepted on September 1, 2026.

Explicitly saved Synthesis results will use a small current-version pointer
plus independently addressable immutable version files within the existing
`format: galaxy-brain`, `format_version: 1` Repository Format boundary. A
result with ID `<result-id>` is represented under
`scratch/synthesis-results/` by `<result-id>.json` and reserved files named
`<result-id>--version-<positive-integer>.json`.

The pointer records the result identity and current version only. Each version
file contains one complete result, including provenance and any explicitly
saved context snapshot, but never recursively embeds `priorResults`. New
versions are written through the repository-scoped Artifact Store before the
pointer is atomically replaced with an expected-current-version check. Older
version files are never rewritten or pruned automatically.

Legacy result files containing nested `priorResults` remain readable without
an incidental write. An explicit save, edit, regeneration, or restore may
validate and flatten that history, write the independent version files, and
replace the legacy file with the pointer only after all writes succeed. A
failed migration preserves the original legacy file as the readable authority.

## Rationale

Nested result history duplicates the complete prior lineage on every new
version, increasing repository size and validation work while making recovery
less local. Independently addressable immutable files preserve provenance and
restore behavior while keeping one current result easy to read. A flat
reserved-name layout reuses the existing repository-scoped Artifact Store
without introducing a broad nested-directory filesystem API. Staying within
Repository Format v1 preserves existing repository compatibility and unknown
content without requiring a repository-wide migration.

## Considered alternatives

- **Keep nested `priorResults`:** rejected because serialized history grows
  recursively and each read validates duplicated content.
- **Use one append-only JSONL or monolithic history file:** rejected because
  reading one version requires scanning a shared file and partial-write or
  external-change recovery becomes less local.
- **Use a new Repository Format version:** rejected because the additive
  representation preserves the existing roots and can read legacy results
  without changing the repository-wide contract.
- **Migrate on repository open or read:** rejected because opening a
  repository must not mutate user files without an explicit write operation.
- **Automatically prune or compact old versions:** rejected because history is
  recovery and provenance data; deletion needs a separate human-owned policy
  and warning.

## Consequences

The Source Processing Interface and Synthesis-result Adapter must expose
current-result reads, explicit version reads, append-only writes, and safe
history summaries without exposing filesystem mechanics. Restore creates a
new current version and makes no Model Adapter request. The renderer receives
small version summaries rather than a recursive prior-result tree. Malformed,
missing, externally changed, or interrupted history must produce explicit safe
outcomes and must not corrupt a valid prior version.
