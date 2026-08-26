# Human-owned knowledge base

The user is the primary reader, writer, learner, and authority. Optimize the repository for the user's comprehension and workflow. Agents perform legwork, preserve human-authored material, label agent contributions, and stop at every human judgment gate.

## Request modes

Classify the request before writing:

- **Conversational research**: answer without durable repository changes unless the user asks to save the work.
- **Knowledge-base research**: create and update relevant non-core working notes under the selected repository's `sources/`, `projects/`, or `scratch/` roots, and place repository-held supporting files under its `assets/` root. State the working paths and report every changed file.
- **Core integration**: investigate and prepare an exact knowledge-base proposal under the selected repository's `proposals/`, then stop for final sign-off. An instruction to integrate establishes intent, not approval of an unseen change.

Documentation about the Galaxy Brain application belongs under `app/docs/`, with application proposals under `app/docs/proposals/` and durable reviews under `app/docs/reviews/`; none belongs under a selected repository's `projects/` or `proposals/` roots. Disposable GUI exploration belongs under `app/prototype/`.

Edit existing human-authored working notes only when the task clearly calls for it. Preserve prior content. Use a companion note or proposal when ownership or intent is unclear. Deletion and broad restructuring require explicit authorization.

## Repository roles

```text
Application project
app/docs/     Galaxy Brain application and project documentation; never knowledge-base content
app/prototype/ temporary, disposable GUI exploration

Knowledge base
<repository-root>/assets/          local images, reference documents, and other knowledge-supporting files
<repository-root>/knowledge/       finalized, reviewed core knowledge; every change requires final sign-off
<repository-root>/projects/        working knowledge notes organized around a specific project or outcome
<repository-root>/proposals/       candidate changes to governed knowledge-base content, registries, or templates
<repository-root>/scratch/         miscellaneous provisional knowledge notes with no durability promise
<repository-root>/sources/         working notes and annotations attributable to a specific source
<repository-root>/templates/       approved templates and snippets for knowledge-base files
```

The public application project contains only a synthetic fixture and starter skeleton. A user's actual Knowledge Repository is an independent private repository, conventionally a sibling, and is selected explicitly. Do not place application plans, design proposals, review ledgers, or GUI experiments in a user's knowledge-base directories. Application source, build output, dependencies, and application-owned assets remain outside the Repository Format.

Use the selected repository's `knowledge/README.md` as the manually curated knowledge map. Create subfolders when demonstrated use makes the filesystem easier to navigate.

## Search before creating

Before naming or adding durable material, search existing paths, titles, aliases, headings, addressable objects, glossary terms, equations, and approved tags. The search is complete when every plausible existing home or reusable object has been considered.

Prefer an existing topic when it can absorb the material without losing cohesion. Split a note when the new object can be understood, linked, revised, or reused independently.

## Core gate

Everything under the selected repository's `knowledge/` is core. Governed registries and templates use the same gate. Project guidance remains under `app/docs/`; when it requires an exact proposal, that proposal also remains under `app/docs/`. Before changing any governed file, present:

1. Exact target files and diff.
2. Rationale for the change.
3. Supporting evidence and citations.
4. Epistemic labels for new or changed claims.
5. Conflicts introduced, resolved, or affected.
6. Evolution history required by a material change.

Wait for explicit final sign-off on that exact diff. Silence, approval of the research direction, or approval of a materially different draft does not authorize the write.

## Knowledge lifecycle

Working material may trigger synthesis when it:

- answers or bounds a research question;
- completes a meaningful learning unit;
- exposes a contradiction;
- is tested through application; or
- accumulates enough fragments to impair orientation.

A trigger authorizes investigation and a proposal, never promotion. Propose synthesis only when it integrates sources, materially improves orientation, cites material claims, preserves uncertainty and contrary evidence, and avoids unnecessary duplication.

Revisit core knowledge when conflicting evidence appears, application exposes a gap, an open question becomes answerable, a source materially changes, or the topic no longer provides adequate orientation. Prepare an exact revision proposal and wait for final sign-off.

## Metadata

Notes use YAML frontmatter. Common fields are:

```yaml
title: Human-readable title
type: topic
status: developing
created: YYYY-MM-DD
reviewed: YYYY-MM-DD
tags: []
aliases: []
```

Use ISO dates. `reviewed` means substantively reviewed, not merely touched. Keep derived values such as link counts out of files.

Lifecycle states are type-specific:

- `topic`: `developing`, `current`, `contested`, `superseded`
- `map`: `current`, `superseded`
- `source`: `queued`, `in-progress`, `processed`, `set-aside`
- `project`: `planned`, `active`, `paused`, `complete`, `abandoned`
- `scratch`: `active`, `harvested`, `stale`
- `proposal`: `draft`, `pending`, `approved`, `applied`, `rejected`, `superseded`
- `decision`: `current`, `superseded`
- `practice`: `current`, `retired`

Lifecycle is distinct from certainty, evidence quality, and conflict. Agents maintain non-core states when an observable completion criterion is met and report the transition. Every core state change requires final sign-off. `stale` never authorizes deletion.

## Tags, aliases, and glossary

The selected repository's `knowledge/registries/tags.yaml` is the source of truth for approved tags and tag aliases. Use tags only for demonstrated, cross-cutting queries; use folders for location, links for semantic relationships, and metadata for type and lifecycle.

Search the registry before tagging. Put unapproved working tags in `candidate_tags`. Adding, merging, renaming, or deprecating a tag requires an exact proposal. Keep note-title aliases in the canonical note's frontmatter.

The selected repository's `knowledge/registries/glossary.yaml` maps terms and acronyms to canonical definitions. It points to definitions rather than copying them. Renderers may auto-link unambiguous glossary terms and show the canonical definition on hover.

## Links and addressable objects

Links state their relationship in surrounding prose: supports, contradicts, applies, extends, exemplifies, or raises a question about.

Use:

```markdown
[[note]]
[[note#human-readable-anchor]]
![[note#human-readable-anchor]]
```

The `!` form embeds the target. Reusable definitions, equations, figures, callouts, and excerpts use stable human-readable anchors. Preserve anchors when headings change. A move or replacement proposal accounts for every inbound link and embed.

Keep reusable objects inside cohesive topic notes by default. Create a separate note only when the object is independently substantial, widely reused, independently evolving, or carries its own evidence and open questions.

## Extended Markdown

Raw files remain intelligible without the future workbench. Supported source constructs include:

- YAML frontmatter;
- `[[links]]` and `![[embeds]]`;
- semantic callouts such as `> [!EVIDENCE]` and `> [!CONFLICT]`;
- `==highlighting==` and allowlisted semantic HTML spans;
- inline `$...$` and display `$$...$$` LaTeX-style mathematics;
- reusable macros registered in the selected repository's `knowledge/registries/math-macros.yaml`;
- fenced Mermaid diagrams;
- ordinary Markdown image links to lightweight assets; and
- addressable directives such as `::: equation {#anchor title="..."}`.

Preserve unfamiliar extensions. Embedded HTML must remain non-executable and limited to presentation. Concrete rendering ergonomics remain provisional until validated in the workbench prototype.

## Evolution

Editorial changes need no history. Record a refinement only when a future reader could otherwise misunderstand earlier use. Material reversals, replacements, resolved conflicts, or cross-topic changes preserve:

- the previous view;
- the current view;
- why it changed;
- the responsible evidence; and
- the approval date.

Use an in-topic `Evolution` section for local changes and a linked core decision note for cross-cutting changes. External version-control tools may record what changed; the evolution record explains why. Galaxy Brain does not require or invoke those tools.

## External files

Place files managed inside the knowledge base under the selected repository's `assets/`, including images, diagrams, reference documents, and other knowledge-supporting files. Keep source notes and annotations under its `sources/`; they describe and locate sources but do not need to contain the source bytes.

Files intentionally kept elsewhere remain external and are referenced through portable Source Records with stable identifiers, canonical URLs, logical locators, and repository-held annotations. Managed PDFs use `assets/sources/**/*.pdf` and the `managed` Source Asset mode; linked-local assets retain their absolute path and SHA-256 identity only in machine-local configuration. Never invent or write a machine-specific path into repository content, proposals, logs, or audit records.

## Local-first repository operations

Galaxy Brain may create repository files, audit records under `proposals/applied/`, and targeted rollback data through recoverable filesystem transactions. It never requires or invokes Git, Git LFS, GitHub, credentials, remotes, or network connectivity. Users manage initialization, commits, branching, synchronization, and backups externally. After a local save, the Workbench reports that the change is saved locally without claiming it is committed or backed up.

Agent Provider configuration is not Knowledge Repository content. Missing API keys or provider configuration must not prevent local reading, editing, source, annotation, governance, or repository work. Agentic Capabilities may be unavailable and should say so clearly; never write provider credentials, prompts, or machine-local provider paths into repository content, audit records, or ordinary knowledge notes.

Before a mutation, recheck fingerprints for targeted files. Preserve external edits, abort stale operations, and require explicit review. Never automatically delete audit records or rollback history; future Repository Housekeeping reports require explicit approval.
