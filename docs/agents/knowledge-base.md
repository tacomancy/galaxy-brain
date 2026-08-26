# Human-owned knowledge base

The user is the primary reader, writer, learner, and authority. Optimize the repository for the user's comprehension and workflow. Agents perform legwork, preserve human-authored material, label agent contributions, and stop at every human judgment gate.

## Request modes

Classify the request before writing:

- **Conversational research**: answer without durable repository changes unless the user asks to save the work.
- **Knowledge-base research**: create and update relevant non-core working files under `sources/`, `projects/`, `scratch/`, or `proposals/`. State the working paths and report every changed file.
- **Core integration**: investigate and prepare an exact proposal, then stop for final sign-off. An instruction to integrate establishes intent, not approval of an unseen change.

Edit existing human-authored working notes only when the task clearly calls for it. Preserve prior content. Use a companion note or proposal when ownership or intent is unclear. Deletion and broad restructuring require explicit authorization.

## Repository roles

```text
knowledge/    reviewed core knowledge; every change requires final sign-off
sources/      claims and annotations attributable to a source
projects/     goal-bound application with explicit completion criteria
scratch/      provisional, mixed-form thinking with no durability promise
proposals/    candidate core or guidance changes awaiting review
templates/    approved note contracts
assets/       lightweight knowledge-bearing visuals and source files
```

Use `knowledge/README.md` as the manually curated knowledge map. Create subfolders when demonstrated use makes the filesystem easier to navigate.

## Search before creating

Before naming or adding durable material, search existing paths, titles, aliases, headings, addressable objects, glossary terms, equations, and approved tags. The search is complete when every plausible existing home or reusable object has been considered.

Prefer an existing topic when it can absorb the material without losing cohesion. Split a note when the new object can be understood, linked, revised, or reused independently.

## Core gate

Everything under `knowledge/` is core. Guidance and templates are governed by the same gate. Before changing any governed file, present:

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

`knowledge/registries/tags.yaml` is the source of truth for approved tags and tag aliases. Use tags only for demonstrated, cross-cutting queries; use folders for location, links for semantic relationships, and metadata for type and lifecycle.

Search the registry before tagging. Put unapproved working tags in `candidate_tags`. Adding, merging, renaming, or deprecating a tag requires an exact proposal. Keep note-title aliases in the canonical note's frontmatter.

`knowledge/registries/glossary.yaml` maps terms and acronyms to canonical definitions. It points to definitions rather than copying them. Renderers may auto-link unambiguous glossary terms and show the canonical definition on hover.

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
- reusable macros registered in `knowledge/registries/math-macros.yaml`;
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

Use an in-topic `Evolution` section for local changes and a linked core decision note for cross-cutting changes. Git records what changed; the evolution record explains why.

## External files

Keep large papers, datasets, and replaceable generated output outside Git. Store portable source records with stable identifiers, canonical URLs, logical locators, and repository-held annotations. Local, Git-ignored configuration will resolve logical locators in the future workbench. Never invent or commit a machine-specific path.
