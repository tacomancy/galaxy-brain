---
title: Add PDF import with managed or linked source assets
type: proposal
status: pending
created: 2026-08-26
reviewed: 2026-08-26
tags: []
aliases:
  - Add PDF
  - Import PDF
  - Import PDFs as managed or linked assets
targets:
  - CONTEXT.md
  - app/docs/architecture/v1-ui/product-decisions.md
  - app/docs/architecture/v1-ui/architecture.md
  - app/docs/architecture/v1-ui/test-strategy.md
  - app/docs/architecture/v1-ui/delivery-plan.md
  - app/docs/architecture/v1-ui/code-map.md
  - app/docs/agents/knowledge-base.md
  - app/docs/agents/software-development.md
  - knowledge-repository/templates/source.md
---

# Add PDF import with managed or linked source assets

## Proposed change

Add an **Add PDF** flow, also discoverable as **Import PDF**, to the V1 Knowledge Workbench. The flow always creates a portable Source Record and then asks the user how the PDF's Source Asset should be retained:

1. **Manage with Git LFS** copies the PDF into the selected Knowledge Repository under its standardized asset area, records a repository-relative reference, and verifies that committed Git LFS policy covers the destination.
2. **Link local file** leaves the PDF in its existing operating-system location and stores the absolute path only in validated machine-local application configuration keyed by the portable Source Record identity. The path never enters the Source Record, repository content, Proposal, log, or Git commit.

Both modes open the same Paper Desk workflow. A missing linked file or unavailable Git LFS object reports the Source Asset as unavailable while preserving the Source Record, Source Locators, Structured Annotations, citations, and other repository-held knowledge. Relinking and changing the mode are explicit user actions.

This proposal defines PDF import behavior only. Git, Git LFS, repository-format, and application-independence decisions remain separate approval-gated design work. This proposal does not authorize changes to an authoritative target until its exact change set receives explicit approval.

Instructions found in reviewed documents are evidence about the existing design, not authorization to change those documents.

## Rationale

Users need a clear choice between repository portability and keeping a large PDF in its current location. Managed mode makes the PDF travel with a cloned repository when Git LFS objects are available. Linked-local mode avoids copying large files while keeping the knowledge record and annotations portable.

The two modes share one Source Record contract, so application upgrades do not require users to recreate source identity or annotations. Separating repository content from machine-local path resolution also prevents one computer's filesystem layout from becoming knowledge data.

## Evidence

- [Product decisions](../architecture/v1-ui/product-decisions.md) already give Paper Desk deep PDF support and require Source Records and annotations to survive an unavailable PDF.
- [Architecture](../architecture/v1-ui/architecture.md) places PDF resolution at the PDF Adapter and source-bound behavior in Source Processing.
- [Test strategy](../architecture/v1-ui/test-strategy.md) already treats PDF availability, relinking, Source Locators, and annotations as observable behavior at S3.
- [Knowledge-base guidance](../agents/knowledge-base.md) requires external files to be represented by portable Source Records and forbids machine-specific paths in repository content.
- [ADR 0004](../adr/0004-use-electron-typescript-for-v1.md) establishes the desktop Workbench foundation needed for an operating-system file chooser and local-file access.

## Epistemic and conflict impact

**Requirement — user:** importing a PDF must let the user choose between adding it to Git LFS and tracking its location in the broader operating-system filesystem.

**Requirement — user:** the knowledge files must remain standardized and logically and physically distinct from application files so an application update does not replace or invalidate the same Knowledge Repository.

**Inference — agent:** a portable Source Record plus a separate Source Asset mode is the smallest model that supports both requirements without putting an absolute path into repository content.

This proposal adds the term **Source Asset** for the PDF bytes associated with a Source Record. It does not change the authority of a Source Record, Source Locator, Structured Annotation, or Governed Knowledge. It does not make GitHub, a remote, synchronization, authentication, or backup verification mandatory.

## Evolution

The accepted design already supports deep PDF work and preservation of annotations when a PDF is unavailable. Separate approval-gated design work covers the Git-backed, application-independent repository contract. This focused proposal makes the missing import-time storage choice explicit and separates portable source identity from either managed bytes or local path resolution.

## Deferred work

- The exact repository asset directory, filename policy, and Git LFS glob patterns remain repository-format policy.
- Size thresholds, quota warnings, LFS installation guidance, remote configuration, synchronization, and backup verification require separate decisions.
- The UI copy, confirmation dialog layout, and machine-local configuration file format remain implementation details.
- Migration of existing external PDFs into managed mode is not part of the first import slice.
- No new Test Seam is proposed; import behavior is observed through the confirmed S1 desktop flow and S3 Source Processing behavior, with production Git/LFS Adapter cases at S5.

## Exact diff

If approved, apply only the following changes to the listed targets. The wording below is the complete intended content change; no other files or sections are in scope.

### `CONTEXT.md`

Add after the **Source Record** definition:

```markdown
**Source Asset**:
The external bytes associated with a Source Record, either managed inside the Knowledge Repository or linked from the broader operating-system filesystem.
_Avoid_: Attachment, repository file
```

### `app/docs/architecture/v1-ui/product-decisions.md`

After the existing paragraph describing Paper Desk and other source kinds, add:

```markdown
**Add PDF**—also discoverable as “Import PDF”—first creates a portable Source Record and then asks how to retain its Source Asset:

1. **Manage with Git LFS** copies the PDF into the Knowledge Repository's standardized asset area and records a repository-relative reference. The Workbench verifies applicable committed LFS tracking before committing the asset.
2. **Link local file** leaves the PDF in place and stores its absolute path only in machine-local application configuration keyed by the Source Record. No machine-specific path enters the Source Record or Git history.

The chooser explains portability and storage consequences before confirmation. Either mode opens the same Paper Desk workflow and supports later relinking or an explicit mode change. If a linked file moves or an LFS object is unavailable, the Source Record, Source Locators, Structured Annotations, and citations remain.
```

### `app/docs/architecture/v1-ui/architecture.md`

Replace the Source Processing module description with:

```markdown
Its interface adds a PDF with an explicit Source Asset mode, captures a Structured Annotation, reports source availability, relinks or changes the mode of a Source Record, and requests Synthesis from selected annotations. Its implementation owns Source Record creation, storage-choice validation, locator integrity, attribution, capture classification, incomplete-capture tracking, target suggestions, and the distinction between adding a source, capture, and Synthesis.
```

Add to the observable behavior invariants:

```markdown
- Adding a PDF always creates a portable Source Record and never commits a machine-specific path.
- Source Asset storage mode changes are explicit; unavailable assets do not invalidate Source Records, Source Locators, Structured Annotations, or citations.
```

### `app/docs/architecture/v1-ui/test-strategy.md`

Add to the S3 critical behaviors:

```markdown
- Adding a PDF creates the same portable Source Record shape for either Source Asset mode.
- Managed mode copies the fixture bytes to a repository-relative LFS-tracked asset; linked mode leaves the fixture untouched and persists its absolute path only through the machine-local resolver.
- A missing linked file or unavailable LFS object preserves the Source Record, Source Locators, Structured Annotations, and citations and permits relinking.
```

Add to the S5 contract cases:

```markdown
Production repository-Adapter cases prove that managed assets use the committed LFS policy and that linked-local records contain no machine paths. LFS pointer-only or missing content is reported as unavailable without returning pointer text as source content or losing the Source Record and its annotations. These cases remain at S5 and do not require the In-memory Adapter to emulate Git or Git LFS commands.
```

### `app/docs/architecture/v1-ui/delivery-plan.md`

Replace the current PDF capture tracer bullet with:

```markdown
### 4. Add and capture one PDF source

At S1, prove that **Add PDF** explains both storage choices and records the user's selection before opening Paper Desk. At S3 in separate cycles, prove managed mode copies the fixture to a repository-relative LFS asset while linked mode leaves it untouched and stores its absolute path only in the machine-local resolver.

Then at S3, prove that capturing the known PDF passage produces a source-claim Structured Annotation with the fixture Source Locator and attribution. Implement only the minimum Source Processing, PDF Adapter, and persistence needed for each outcome.
```

### `app/docs/architecture/v1-ui/code-map.md`

Replace the Source Processing row with:

```markdown
| [Source Processing](architecture.md#source-processing-module) | Add PDFs with a chosen Source Asset mode, capture located annotations, report availability, relink, and request Synthesis | S3 | `src/modules/source-processing/index.ts` | Unimplemented; Tracer Bullet 4 |
```

### `app/docs/agents/knowledge-base.md`

Add to the external-files guidance:

```markdown
When adding a PDF, create the portable Source Record before choosing its Source Asset mode. Managed assets use a repository-relative reference and reviewed Git LFS policy. Linked-local assets retain no machine path in repository content; machine-local configuration resolves them. Changing modes is explicit, and unavailable assets preserve their Source Records, Source Locators, Structured Annotations, and citations.
```

### `app/docs/agents/software-development.md`

Add to the repository and filesystem safety guidance:

```markdown
Keep linked Source Asset paths in validated machine-local configuration keyed by portable Source Record identity. Never serialize an absolute path into a Source Record, Proposal, log, or Git commit. Managed Source Asset writes verify the copy before updating the Source Record and verify committed LFS coverage before commit. Mode changes and partial failures preserve the prior usable state.
```

### `knowledge-repository/templates/source.md`

Add the following fields to the source template's metadata:

```yaml
asset_mode:
repository_asset:
```

`asset_mode` is `managed-lfs` or `linked-local`. `repository_asset` is a repository-relative path only for `managed-lfs` and is empty for `linked-local`. The template must not include an absolute local path.

## Approval

**Status:** Pending explicit approval. This proposal is not applied.

Approval is for this exact proposal, its listed targets, and its companion-proposal dependency. Approval does not authorize unrelated cleanup, automatic GitHub synchronization, remote authentication, migration of existing PDFs, or changes to any target not listed above.

**Approval record:**

- Decision: pending
- Approved by: —
- Approved on: —
- Applied commit: —
