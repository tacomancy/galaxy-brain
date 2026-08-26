---
title: Use an application-independent Git Repository Format
type: proposal
status: pending
created: 2026-08-26
reviewed: 2026-08-26
tags: []
aliases:
  - Use Git and Git LFS for the Knowledge Repository
  - Add Git-based backend support
  - Import PDFs as managed or linked assets
targets:
  - app/docs/adr/0005-use-git-and-git-lfs-for-repository-storage.md
  - app/docs/adr/0006-keep-knowledge-repositories-application-independent.md
  - app/docs/architecture/v1-ui/repository-format.md
  - CONTEXT.md
  - app/docs/architecture/v1-ui/README.md
  - app/docs/architecture/v1-ui/product-decisions.md
  - app/docs/architecture/v1-ui/architecture.md
  - app/docs/architecture/v1-ui/test-strategy.md
  - app/docs/architecture/v1-ui/delivery-plan.md
  - app/docs/architecture/v1-ui/code-map.md
  - app/docs/agents/knowledge-base.md
  - app/docs/agents/software-development.md
  - knowledge-repository/templates/source.md
---

# Use an application-independent Git Repository Format

## Proposed change

Define a versioned Galaxy Brain Repository Format as the application-independent contract for knowledge files. A packaged Workbench and each user Knowledge Repository occupy separate filesystem roots and have independent lifecycles, so installing, updating, moving, or uninstalling the application does not alter the repository merely because the application version changed.

Make a local Git working tree the production Knowledge Repository and use Git commits for durable Governed Knowledge versions. Support repository-managed large binaries through standard Git LFS pointers and committed `.gitattributes` policy, with GitHub interoperability but no GitHub-specific knowledge model.

Add an **Add PDF** flow, also discoverable as “Import PDF,” that always creates a portable Source Record and asks the user to choose the Source Asset mode: copy it into the repository and manage it with Git LFS, or leave it in the broader filesystem and resolve it through machine-local configuration. Neither mode commits a machine-specific path.

Require compatibility checks before writes, preservation of unknown repository content, and explicit, previewed, reversible format migrations. This proposal contains the complete diff and does not authorize applying it until explicit final approval.

If both this proposal and [Resolve V1 document clarity and consistency issues](2026-08-26-document-review-concerns.md) are approved, apply the document-review proposal first. This diff is verified against both the current documents and that post-review state.

## Rationale

Knowledge should outlive any Workbench implementation. A documented portable format prevents app upgrades, framework changes, rebuilds, or uninstalls from becoming knowledge migrations. It also keeps the repository intelligible to people and other tools without requiring application internals.

Git makes the repository's existing versioned and auditable operating model explicit. Git LFS allows intentionally managed large binaries without ordinary-Git blob growth, while a separate format version lets application releases evolve independently of knowledge files.

The explicit PDF choice lets users trade repository portability and LFS storage against keeping a large local file in place. A single portable Source Record model keeps annotations and citations stable when either kind of asset is unavailable or later relinked.

## Evidence

- [ADR 0003](../adr/0003-keep-rich-and-source-editing-equivalent.md) already requires repository text to remain portable, inspectable, and independent of the Workbench.
- Existing [knowledge-base guidance](../agents/knowledge-base.md#extended-markdown) defines human-readable source constructs and requires unfamiliar extensions to be preserved.
- The [Git and Git LFS research note](../../../knowledge-repository/sources/web/2026-08-26-git-lfs-backend-research.md) records primary-source evidence for standard LFS pointers, committed tracking rules, separate hydration state, GitHub limits, and backup requirements.
- The accepted [Knowledge Repository seam](../architecture/v1-ui/architecture.md#system-seams-and-adapters) already isolates persistence from application Modules.

## Epistemic and conflict impact

**Interpretation — user:** knowledge files must use a standardized format and remain logically and physically distinct from application files so users can update the application while retaining the same knowledge base.

**Interpretation — user:** adding a PDF must let the user choose between Git LFS management and tracking the PDF's location elsewhere in the operating-system filesystem.

**Inference — agent:** “standardized” is best represented by a documented Galaxy Brain Repository Format built from UTF-8 Markdown, YAML, Git, and optional Git LFS, with a root format-version declaration and preservation rules. This provides a stable contract without pretending every current Markdown extension is an external standard.

The proposal resolves the current storage deferral and the instruction to keep all large papers and datasets outside Git. It also clarifies that this development repository's co-location of project files and fixture knowledge is not the production installation model.

## Evolution

The previous design required portable text but did not define a repository manifest, release-compatibility contract, physical application boundary, or production storage backend. ADR 0005 records the Git/LFS choice; ADR 0006 records the separate and broader principle that Knowledge Repositories remain independent of Workbench releases.

The revised proposal also distinguishes the portable Source Record from its Source Asset and makes managed-versus-linked storage an explicit Paper Desk choice. This feature is reversible and fits the existing Source Processing boundary, so it does not require another ADR.

## Deferred work

- LFS path patterns, any size threshold, and migration of existing large files require separate reviewed policy.
- The concrete machine-local configuration file and UI for changing an existing PDF's mode remain implementation details constrained by the specified outcomes.
- Bundled versus system Git tooling remains an implementation decision subject to security support.
- GitHub authentication, automatic synchronization, conflict resolution, and verified off-device backup remain separate capabilities.
- Future Repository Format versions and their concrete migrations require their own exact proposals. No migration occurs merely by applying this design proposal.

## Exact diff

The patch uses zero-context unified hunks so the Markdown file contains no whitespace-only diff lines. Validate it with `git apply --check --unidiff-zero`.

```diff
diff --git a/app/docs/adr/0005-use-git-and-git-lfs-for-repository-storage.md b/app/docs/adr/0005-use-git-and-git-lfs-for-repository-storage.md
new file mode 100644
index 0000000..9ef384a
--- /dev/null
+++ b/app/docs/adr/0005-use-git-and-git-lfs-for-repository-storage.md
@@ -0,0 +1,19 @@
+---
+status: accepted
+---
+
+# Use Git and Git LFS for repository storage
+
+The production Knowledge Repository uses a local Git working tree and Git commits for durable Governed Knowledge versions. Repository-managed large binary assets use standard Git LFS pointers according to committed `.gitattributes` rules, with GitHub-compatible hosting supported without making GitHub part of the knowledge model. This preserves portable source text and auditable history while avoiding ordinary-Git blob limits and repository bloat.
+
+## Considered options
+
+- **Plain filesystem plus an application-specific version ledger:** rejected because it would duplicate Git's history and recovery model while reducing interoperability with existing tools.
+- **Git for text while keeping every large asset outside the repository:** rejected because it prevents a repository clone plus its LFS objects from carrying a complete, intentionally managed knowledge collection.
+- **GitHub-specific storage APIs:** rejected because they would make local use and repository portability depend on one hosting provider.
+
+## Consequences
+
+Applying an eligible Proposal creates one Git commit containing the approved changes and audit record without absorbing unrelated working-tree changes. Working Material may remain autosaved and uncommitted; Git commit status never determines whether material is Governed Knowledge. LFS tracking rules are human-owned repository policy, and changing them for existing files is an explicit migration rather than a silent rewrite.
+
+Git and Git LFS become production dependencies for repository-managed large assets. When adding a PDF, the user chooses whether its Source Asset is copied into the repository and managed with Git LFS or remains outside the repository and is resolved through machine-local configuration. A missing client, object, or linked file produces an actionable unavailable-source outcome instead of exposing pointer text as content or corrupting Source Records and annotations. GitHub and other remotes remain optional and user-configured; V1 does not automate authentication, push, pull, merge, or complete off-device backup.
diff --git a/app/docs/adr/0006-keep-knowledge-repositories-application-independent.md b/app/docs/adr/0006-keep-knowledge-repositories-application-independent.md
new file mode 100644
index 0000000..b6f1fed
--- /dev/null
+++ b/app/docs/adr/0006-keep-knowledge-repositories-application-independent.md
@@ -0,0 +1,17 @@
+---
+status: accepted
+---
+
+# Keep Knowledge Repositories application-independent
+
+Knowledge Repositories conform to a documented, versioned Galaxy Brain Repository Format and live outside the installed Workbench. Application code, dependencies, caches, credentials, indexes, and session state are not part of that format. A Workbench update must continue using the same repository without changing it merely by opening it; any necessary format migration is a separate, explicit, previewed, reversible repository operation.
+
+## Considered options
+
+- **Application-private database:** rejected because it would couple knowledge durability and readability to one application implementation.
+- **Knowledge files inside the application installation or source tree:** rejected because application updates, rebuilds, and uninstalls could affect user knowledge and knowledge changes could dirty or destabilize the application.
+- **Implicit migration during application launch:** rejected because it would make updating the Workbench an unreviewed knowledge mutation and could strand the repository for older tools.
+
+## Consequences
+
+The Repository Format is a public compatibility contract with an explicit version. Workbench releases preserve unknown repository content, check compatibility before writes, and use read-only or unsupported outcomes when safe writing is impossible. Format migrations require a preview, user confirmation, one recoverable Git commit, and documented rollback; they never occur as a hidden side effect of installing or opening an application version.
diff --git a/app/docs/architecture/v1-ui/repository-format.md b/app/docs/architecture/v1-ui/repository-format.md
new file mode 100644
index 0000000..206e4c1
--- /dev/null
+++ b/app/docs/architecture/v1-ui/repository-format.md
@@ -0,0 +1,52 @@
+# Galaxy Brain Repository Format v1
+
+Status: accepted through [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md).
+
+## Purpose
+
+The Galaxy Brain Repository Format is the application-independent contract for a portable Knowledge Repository. It lets the same repository survive Workbench upgrades, move between machines, remain intelligible without the Workbench, and be processed by other conforming tools.
+
+The packaged Workbench and a user's Knowledge Repository are separate filesystem roots with independent lifecycles. Installing, updating, moving, or uninstalling the Workbench must not move, replace, or delete a Knowledge Repository. Application source, executables, dependencies, build output, caches, indexes, logs, credentials, and session preferences are not Repository Format content.
+
+## Version declaration
+
+Every Knowledge Repository has a UTF-8 YAML file named `galaxy-brain.yaml` at its root:
+
+```yaml
+format: galaxy-brain
+format_version: 1
+```
+
+`format` identifies the contract. `format_version` is a positive integer changed only by an approved format revision. Application release versions and Repository Format versions are independent.
+
+## Portable content
+
+V1 repositories use ordinary directories and UTF-8 Markdown with YAML frontmatter. The canonical roots are `knowledge/`, `sources/`, `projects/`, `scratch/`, `proposals/`, `templates/`, and `assets/`. The supported extended-Markdown constructs and metadata contracts remain documented in repository guidance and templates rather than inferred from application internals.
+
+Standard Git stores text and metadata. Git LFS may store repository-managed large binary assets selected by committed `.gitattributes` rules. LFS pointers, unavailable objects, and hydrated objects are representations of asset availability; none changes the authority of related knowledge.
+
+### PDF asset modes
+
+Every added PDF creates a portable Source Record. Its `asset_mode` is either `managed-lfs` or `linked-local`:
+
+- `managed-lfs` copies the Source Asset under `assets/sources/`, records its repository-relative path in `repository_asset`, and requires matching committed Git LFS policy. Absolute paths are invalid.
+- `linked-local` leaves the Source Asset outside the repository. `repository_asset` remains empty, and machine-local application configuration maps the Source Record to an absolute path without committing that path.
+
+Changing modes is an explicit operation. Moving from linked to managed copies and verifies the bytes before changing the Source Record; moving from managed to linked does not delete the managed asset until the user confirms the reviewed repository change. Missing assets never remove the Source Record, Source Locators, or annotations.
+
+Conforming writers preserve unrecognized files, frontmatter fields, and Markdown extensions unless an explicit operation targets them. Derived or machine-local state stays outside the repository or in documented ignored paths and can be deleted and rebuilt without losing knowledge.
+
+## Application compatibility
+
+A Workbench release checks `format` and `format_version` before enabling writes:
+
+- A supported format opens normally without changing repository content merely because the application version changed.
+- An older format remains usable when the release supports it. If a migration is required, the repository opens without mutation and the user receives a preview of the proposed migration.
+- A newer or unknown format is never written optimistically. The Workbench opens it read-only only when it can preserve meaning safely; otherwise it reports an unsupported-format outcome.
+- Installing or updating the Workbench changes only application-owned files. Repository migration is a separate user-confirmed operation.
+
+Every released format migration is deterministic, preserves unknown content, reports its source and target versions, and creates one recoverable Git commit containing only migration changes and its audit record. Failure leaves the pre-migration version recoverable. Migration support and rollback instructions remain available for every format version the release claims to support.
+
+## Conformance
+
+The Knowledge Repository Interface defines observable repository behavior; it does not expose file-parser, Git, or application-version details. The In-memory and production Adapters share contract fixtures for portable content and authority semantics. Production Adapter tests additionally use real Git repositories, LFS availability states, and fixtures from every previously released Repository Format version still supported.
diff --git a/CONTEXT.md b/CONTEXT.md
index 9064623..cfa8c1e 100644
--- a/CONTEXT.md
+++ b/CONTEXT.md
@@ -34,0 +35,8 @@ _Avoid_: Unsaved work, temporary data
+**Knowledge Repository**:
+An application-independent collection of Governed Knowledge, Working Material, and portable supporting assets that conforms to the Repository Format.
+_Avoid_: App data, application database
+
+**Repository Format**:
+The documented, versioned contract that makes a Knowledge Repository portable across Workbench versions and other conforming tools.
+_Avoid_: Internal schema, application storage layout
+
@@ -38,0 +47,4 @@ _Avoid_: File, attachment
+**Source Asset**:
+The source bytes associated with a Source Record, whether managed inside the Knowledge Repository or resolved from a linked local file.
+_Avoid_: Source Record, annotation
+
diff --git a/app/docs/architecture/v1-ui/README.md b/app/docs/architecture/v1-ui/README.md
index a21257e..c32888f 100644
--- a/app/docs/architecture/v1-ui/README.md
+++ b/app/docs/architecture/v1-ui/README.md
@@ -14,0 +15 @@ This package translates the accepted V1 UI direction into an Electron and strict
+- [Repository Format](repository-format.md) defines the versioned, application-independent knowledge-file contract.
@@ -24,0 +26,2 @@ The hard-to-reverse decisions are recorded separately:
+- [ADR 0005](../../adr/0005-use-git-and-git-lfs-for-repository-storage.md): use Git and Git LFS for repository storage.
+- [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md): keep Knowledge Repositories independent of Workbench releases.
diff --git a/app/docs/architecture/v1-ui/product-decisions.md b/app/docs/architecture/v1-ui/product-decisions.md
index 886e72b..d8a5833 100644
--- a/app/docs/architecture/v1-ui/product-decisions.md
+++ b/app/docs/architecture/v1-ui/product-decisions.md
@@ -13 +13,9 @@ Atlas is home without becoming a tollbooth. Opening the Workbench resumes meanin
-V1 officially supports macOS only while using a cross-platform-capable desktop foundation. It opens an arbitrary user-selected Galaxy Brain repository; this repository is the development Fixture, not a hard-coded production location. Tablet and phone adaptations are deferred rather than approximated with layouts that hide essential context.
+V1 officially supports macOS only while using a cross-platform-capable desktop foundation. It opens an arbitrary user-selected Galaxy Brain Git working tree that conforms to the versioned Repository Format; the development Fixture is not a hard-coded production location or production installation layout. Tablet and phone adaptations are deferred rather than approximated with layouts that hide essential context.
+
+The packaged Workbench and each Knowledge Repository occupy separate filesystem roots and have independent lifecycles. Installing, updating, moving, or uninstalling the Workbench does not move, replace, or mutate a repository. A newer Workbench continues using the same supported repository; any required Repository Format migration is separately previewed, explicitly confirmed, reversible, and recorded without being hidden inside application startup.
+
+The production Knowledge Repository uses Git for durable Governed Knowledge versions. Applying an accepted Proposal creates one Git commit containing its approved changes and audit record without including unrelated working-tree changes. Commit status does not confer knowledge authority: Working Material remains Working Material whether or not a user commits it outside the Workbench.
+
+Repository-managed large binary assets may use Git LFS according to committed `.gitattributes` rules. The Workbench preserves standard LFS pointers, distinguishes Git synchronization from LFS object availability, and never presents pointer text as source content. GitHub-compatible remotes are supported through standard Git and Git LFS behavior, but V1 does not require a remote or automate authentication, push, pull, merge, or backup verification.
+
+The Repository Format is a public compatibility contract built from portable files, not the Workbench's internal object model. Application code, dependencies, build output, caches, indexes, credentials, and session preferences remain outside it. The Workbench checks the format version before writing, preserves unknown repository content, and refuses unsafe writes when a repository is newer than the formats it supports.
@@ -37,0 +46,7 @@ Paper Desk provides deep PDF support in V1. Other source kinds may have Source R
+**Add PDF**—also discoverable as “Import PDF”—first creates a portable Source Record and then asks how to retain the Source Asset:
+
+1. **Manage with Git LFS** copies the PDF into the Knowledge Repository under its standardized asset area and records a repository-relative reference. The Workbench verifies applicable LFS tracking before committing the asset.
+2. **Link local file** leaves the PDF in place and stores its absolute path only in machine-local application configuration. No machine-specific path enters the Source Record or Git history.
+
+The chooser explains portability and storage consequences before confirmation. Either mode opens the same Paper Desk workflow and supports later relinking or an explicit mode change. If a linked file moves or an LFS object is unavailable, the Source Record, Source Locators, annotations, and citations remain.
+
@@ -79 +94 @@ Applying an accepted Proposal creates a reversible new version and an immutable
-- An editor engine, PDF engine, index, model provider, updater, router, state-management library, native database, and storage technology beyond the repository's existing portable-source requirements.
+- An editor engine, PDF engine, index, model provider, updater, router, state-management library, native database, remote hosting provider, and automatic synchronization or backup service.
diff --git a/app/docs/architecture/v1-ui/architecture.md b/app/docs/architecture/v1-ui/architecture.md
index b71cdc5..af0902a 100644
--- a/app/docs/architecture/v1-ui/architecture.md
+++ b/app/docs/architecture/v1-ui/architecture.md
@@ -7 +7 @@ The architecture should make the human trust boundary deep: UI callers request m
-The three workspaces are user-facing concepts, not three independent data silos. They are desktop UI adapters over shared application modules and the same repository state.
+The three workspaces are user-facing concepts, not three independent data silos. They are desktop UI adapters over shared application modules and the same repository state. That state conforms to the application-independent [Repository Format](repository-format.md) and lives outside the installed Workbench.
@@ -33 +33 @@ flowchart LR
-  Q --> F[Repository adapter]
+  Q --> F[Git repository adapter]
@@ -55 +55 @@ flowchart LR
-The renderer owns presentation and unprivileged interaction state. It receives only small operation-specific capabilities from preload. The main process owns the selected repository root, validates privileged requests, and composes framework-independent application Modules with production Adapters. Domain rules do not live in React views, preload, or IPC handlers.
+The renderer owns presentation and unprivileged interaction state. It receives only small operation-specific capabilities from preload. The main process owns the selected Git working-tree root, validates privileged requests, and composes framework-independent application Modules with production Adapters. Domain rules do not live in React views, preload, or IPC handlers.
@@ -69 +69 @@ Callers do not manage route serialization, session persistence, or context recon
-Its interface captures a Structured Annotation, reports source availability, relinks a Source Record, and requests Synthesis from selected annotations. Its implementation owns locator integrity, attribution, capture classification, incomplete-capture tracking, target suggestions, and the distinction between capture and Synthesis.
+Its interface adds a PDF with an explicit Source Asset mode, captures a Structured Annotation, reports source availability, relinks or changes the mode of a Source Record, and requests Synthesis from selected annotations. Its implementation owns Source Record creation, storage-choice validation, locator integrity, attribution, capture classification, incomplete-capture tracking, target suggestions, and the distinction between adding a source, capture, and Synthesis.
@@ -99,4 +99,4 @@ Its interface records user-owned goals, suggests progress with evidence, and acc
-| Governed Knowledge | reviewed topics, maps, registries, guidance, templates | Repository source of truth; changes only through eligible applied Proposals |
-| Working Material | drafts, annotations, captures, draft Proposals | Continuously autosaved; attributed; not authoritative merely because it is saved |
-| Session state | active workspace, Working Set, reading position, pane preferences | Restorable convenience state; must not redefine knowledge |
-| Derived state | search index, Generated Relationships, actionable counts | Rebuildable projection; must link back to authoritative or working items |
+| Governed Knowledge | reviewed topics, maps, registries, guidance, templates | Git-backed repository source of truth; eligible Proposal application creates an exact commit and audit record |
+| Working Material | drafts, annotations, captures, draft Proposals | Continuously autosaved in the working tree; attributed; neither saving nor Git commit status makes it authoritative |
+| Session state | active workspace, Working Set, reading position, pane preferences | Application-owned, restorable convenience state outside the Repository Format; must not redefine knowledge |
+| Derived state | search index, Generated Relationships, actionable counts | Application-owned, rebuildable projection outside the Repository Format; must link back to authoritative or working items |
@@ -111 +111 @@ Introduce an adapter only where behavior genuinely varies:
-- **Knowledge Repository seam:** a production repository adapter and an in-memory adapter used by behavior tests justify the seam. It stores and retrieves both Working Material and versioned Governed Knowledge without exposing filesystem details to application modules.
+- **Knowledge Repository seam:** a production Git repository adapter and an in-memory adapter used by behavior tests justify the seam. It stores and retrieves Working Material and versioned Governed Knowledge without exposing filesystem, Git, or Git LFS mechanics to application modules.
@@ -117,0 +118,12 @@ Do not introduce interfaces around internal parsers, reducers, view models, or w
+### Git-backed repository adapter
+
+The production adapter accepts only a validated Git working tree inside the selected root. It resolves version identifiers, reads and writes portable repository files, detects external changes, and creates a commit for an eligible Proposal without staging or committing unrelated working-tree changes. Git failures become explicit repository outcomes; callers do not receive Git process objects, index state, or command output as domain data.
+
+Before enabling writes, the adapter validates the root `galaxy-brain.yaml` declaration against the supported Repository Format versions. It preserves unknown repository files, metadata fields, and Markdown extensions unless an explicit operation targets them. Unsupported newer formats produce a read-only or unsupported outcome rather than an optimistic write. Installing or launching a Workbench version never performs a repository migration.
+
+For a managed Source Asset, the adapter copies verified bytes to the standardized repository asset area, checks that committed LFS policy covers the destination, and records only a repository-relative reference. For a linked Source Asset, a machine-local resolver stores the absolute path outside the repository. Source Processing sees availability and relinking outcomes rather than filesystem paths or LFS commands.
+
+Committed `.gitattributes` rules are the source of truth for which repository-managed assets use Git LFS. Adding or changing a rule for existing files is a separately reviewed migration because it can rewrite stored representation and history. The adapter distinguishes an LFS pointer from hydrated content and reports missing clients, credentials, quota, remote objects, or integrity failures as actionable source-unavailability outcomes while preserving Source Records, Source Locators, annotations, and pointer identity.
+
+Remote Git hosting is optional configuration outside the knowledge model. V1 neither treats a successful Git fetch as proof that LFS objects are hydrated nor claims a remote is a verified backup. Authentication, automatic synchronization, conflict resolution, and full-ref-plus-LFS backup verification remain outside the initial adapter Interface.
+
@@ -129,0 +142,7 @@ Do not introduce interfaces around internal parsers, reducers, view models, or w
+11. Applying an eligible Proposal creates one Git commit containing its approved changes and audit record without including unrelated working-tree changes.
+12. LFS pointer presence is not source availability; unresolved LFS content never replaces or invalidates portable source identity and annotations.
+13. Application installation and update operations never write into a Knowledge Repository.
+14. A Repository Format migration is explicit, previewed, user-confirmed, reversible, and separate from opening the Workbench.
+15. Conforming writes preserve unknown repository content outside the requested operation.
+16. Adding a PDF always creates a portable Source Record and never commits a machine-specific path.
+17. Source Asset storage mode changes are explicit; unavailable assets do not invalidate Source Records, Source Locators, or annotations.
@@ -133 +152 @@ Do not introduce interfaces around internal parsers, reducers, view models, or w
-The selected foundation is Electron, React, strict TypeScript, Electron Forge with Webpack, npm, Vitest, WebdriverIO, ESLint, and Prettier. The rationale and version-sensitive evidence live in the [stack decision brief](stack-research.md).
+The selected foundation is Electron, React, strict TypeScript, Electron Forge with Webpack, npm, Git, Git LFS for tracked large assets, the Galaxy Brain Repository Format, Vitest, WebdriverIO, ESLint, and Prettier. The desktop rationale and version-sensitive evidence live in the [stack decision brief](stack-research.md); storage and compatibility decisions are recorded in [ADR 0005](../../adr/0005-use-git-and-git-lfs-for-repository-storage.md) and [ADR 0006](../../adr/0006-keep-knowledge-repositories-application-independent.md).
diff --git a/app/docs/architecture/v1-ui/test-strategy.md b/app/docs/architecture/v1-ui/test-strategy.md
index 46672c9..facc201 100644
--- a/app/docs/architecture/v1-ui/test-strategy.md
+++ b/app/docs/architecture/v1-ui/test-strategy.md
@@ -80,0 +81,3 @@ Critical behaviors:
+- Adding a PDF creates the same portable Source Record shape for either Source Asset mode.
+- Managed mode copies the fixture bytes to a repository-relative LFS-tracked asset; linked mode leaves the fixture untouched and persists its absolute path only through the machine-local resolver.
+- A missing linked file or unavailable LFS object preserves the Source Record, Source Locators, and annotations and permits relinking.
@@ -124,0 +128,4 @@ Contract tests are shared across adapters. They do not assert filenames, SQL, pa
+Repository Format cases at S5 prove that portable content round-trips independently of application objects, unknown files and supported extensions survive unrelated writes, linked-local Source Records contain no machine paths, supported older-version fixtures open without incidental mutation, and an unsupported newer version cannot be written. A migration case proves the previewed source and target versions, exact migration commit, preserved unknown content, and recoverable prior version.
+
+Production Git-adapter cases at S5 additionally use temporary repositories and the real Git boundary to prove that an eligible application creates one exact commit, leaves unrelated working-tree changes outside that commit, detects a changed target version, and translates Git failures into repository outcomes. Git LFS cases prove that a tracked hydrated asset is available, pointer-only or missing content is reported unavailable without returning pointer text as asset content, and Source Records and annotations remain usable. These are production Adapter obligations at the existing S5 seam, not a new Test Seam or requirements for the In-memory Adapter to emulate Git commands.
+
diff --git a/app/docs/architecture/v1-ui/delivery-plan.md b/app/docs/architecture/v1-ui/delivery-plan.md
index 01bd31b..b750343 100644
--- a/app/docs/architecture/v1-ui/delivery-plan.md
+++ b/app/docs/architecture/v1-ui/delivery-plan.md
@@ -34 +34 @@ At S1, prove a contextual transition from an Atlas item to Studio and then to it
-### 4. Capture one located source claim
+### 4. Add and capture one PDF source
@@ -36 +36,3 @@ At S1, prove a contextual transition from an Atlas item to Studio and then to it
-At S3, prove that capturing the known PDF passage produces a source-claim Structured Annotation with the fixture Source Locator and attribution. Implement the minimum PDF adapter and Working Material persistence needed for that outcome.
+At S1, prove that **Add PDF** explains both storage choices and records the user's selection before opening Paper Desk. At S3 in separate cycles, prove managed mode copies the fixture to a repository-relative LFS asset while linked mode leaves it untouched and stores its absolute path only in the machine-local resolver.
+
+Then at S3, prove that capturing the known PDF passage produces a source-claim Structured Annotation with the fixture Source Locator and attribution. Implement only the minimum Source Processing, PDF Adapter, and persistence needed for each outcome.
@@ -57,0 +60,4 @@ At S1, prove that Atlas opens the dedicated review route, displays the fixture c
+At S5 in the next cycle, define the V1 Repository Format fixture and run the Knowledge Repository contract against both the In-memory Adapter and a temporary real Git working tree. Prove that applying the same fixture Proposal creates one exact commit, excludes a known unrelated working-tree edit, and preserves an unknown file and frontmatter field. Add separate cases that reject writes to a future format version and prove opening a supported prior-version fixture causes no incidental migration.
+
+Add Git LFS behavior one case at a time: hydrate one tracked fixture, then report one pointer-only fixture unavailable without losing its Source Record or annotations. Do not add remote synchronization or GitHub authentication to this slice.
+
diff --git a/app/docs/architecture/v1-ui/code-map.md b/app/docs/architecture/v1-ui/code-map.md
index 1788e83..b5d5949 100644
--- a/app/docs/architecture/v1-ui/code-map.md
+++ b/app/docs/architecture/v1-ui/code-map.md
@@ -52 +52 @@ The renderer never imports main-process code or privileged Adapters. Preload exp
-| [Source Processing](architecture.md#source-processing-module) | Capture located annotations, report source availability, relink, and request Synthesis | S3 | `src/modules/source-processing/index.ts` | Unimplemented; Tracer Bullet 4 |
+| [Source Processing](architecture.md#source-processing-module) | Add PDFs with a chosen Source Asset mode, capture located annotations, report availability, relink, and request Synthesis | S3 | `src/modules/source-processing/index.ts` | Unimplemented; Tracer Bullet 4 |
@@ -71 +71 @@ The renderer never imports main-process code or privileged Adapters. Preload exp
-| Knowledge Repository | Node-backed, root-scoped repository Adapter under `src/adapters/knowledge-repository/` | In-memory Adapter beside the Interface implementation | S5 contract; used by S1–S4 | Unimplemented; in-memory path begins in Tracer Bullet 1 |
+| Knowledge Repository | Versioned Repository Format and Git-backed, root-scoped Adapter with Git LFS hydration under `src/adapters/knowledge-repository/` | Format-conforming In-memory Adapter beside the Interface implementation | S5 contract; used by S1–S4 | Unimplemented; in-memory path begins in Tracer Bullet 1, production path after Tracer Bullet 9 |
diff --git a/app/docs/agents/knowledge-base.md b/app/docs/agents/knowledge-base.md
--- a/app/docs/agents/knowledge-base.md
+++ b/app/docs/agents/knowledge-base.md
@@ -36,0 +37,6 @@ Use `knowledge/README.md` as the manually curated knowledge map. Create subfolde
+## Application-independent repository
+
+Knowledge Repositories conform to the versioned [Galaxy Brain Repository Format](../architecture/v1-ui/repository-format.md). Keep application source, executables, dependencies, build output, caches, indexes, logs, credentials, and session preferences outside a user's repository. Application installation and update operations never modify knowledge files.
+
+Opening a repository must not migrate it implicitly. Preserve unknown files, metadata fields, and Markdown extensions during unrelated operations. When a Workbench version cannot write the declared format safely, use a read-only or unsupported outcome. A required format migration is a separate, previewed, explicitly confirmed, reversible change with its own Git commit and audit record.
+
@@ -154,3 +160,7 @@ Use an in-topic `Evolution` section for local changes and a linked core decision
-Place files managed inside the knowledge base under `knowledge-repository/assets/`, including images, diagrams, reference documents, and other knowledge-supporting files. Keep source notes and annotations under `knowledge-repository/sources/`; they describe and locate sources but do not need to contain the source bytes.
-
-Files intentionally kept elsewhere remain external and are referenced through portable Source Records with stable identifiers, canonical URLs, logical locators, and repository-held annotations. Follow the accepted storage policy before adding large files. Never invent or commit a machine-specific path.
+Place repository-managed images, diagrams, reference documents, and other knowledge-supporting files under `assets/`. Keep source notes and annotations under `sources/`; they describe and locate sources but do not need to contain the source bytes.
+
+Keep replaceable generated output, caches, credentials, and machine-specific paths outside Git. Files intentionally kept elsewhere remain external and are referenced through portable Source Records with stable identifiers, canonical URLs, logical locators, and repository-held annotations.
+
+Repository-managed large binary assets may use Git LFS when committed `.gitattributes` policy selects them. Keep tracking rules narrow and reviewable; adding LFS tracking for existing files is an explicit migration because it can change history and remote storage requirements. A Git remote is not a verified backup unless recovery covers every required Git ref and reachable LFS object. Missing LFS content makes the asset unavailable, not the Source Record or its annotations.
+
+When adding a PDF, create the portable Source Record before choosing its Source Asset mode. Managed assets use a repository-relative reference and reviewed Git LFS policy. Linked local assets retain no machine path in repository content; machine-local configuration resolves them. Changing modes is explicit, and unavailable assets preserve their Source Records, Source Locators, annotations, and citations.
diff --git a/app/docs/agents/software-development.md b/app/docs/agents/software-development.md
index 06b3ae3..dc6b097 100644
--- a/app/docs/agents/software-development.md
+++ b/app/docs/agents/software-development.md
@@ -48,0 +49,8 @@ Imports follow that direction. Callers import a Module only through its public e
+- Invoke Git and Git LFS without shell interpolation, validate their supported versions, and translate failures at the repository Adapter boundary. Never expose raw commands or allow repository content to become command arguments outside validated operation-specific inputs.
+- Treat committed `.gitattributes` as human-owned repository policy. Do not add or migrate LFS tracking rules implicitly while opening, reading, or autosaving a repository.
+- Delegate remote credentials to the operating system's Git credential facilities. Never persist credentials, tokens, or credential-bearing remote URLs in repository content or application logs.
+- Keep the packaged application, source checkout, and user-selected Knowledge Repository as separate roots. Updaters may replace application-owned files only; uninstallers never delete a repository.
+- Validate `galaxy-brain.yaml` before writes. Preserve unknown repository content, reject unsafe writes to unsupported versions, and keep every format migration explicit, previewed, reversible, and separate from application startup or update.
+- Store caches, indexes, logs, credentials, and session preferences outside the Repository Format. Tests must be able to delete and rebuild derived application state without changing repository content.
+- Keep linked Source Asset paths in validated machine-local configuration keyed by portable Source Record identity. Never serialize an absolute path into a Source Record, Proposal, log, or Git commit.
+- Managed Source Asset writes verify the copy before updating the Source Record and verify committed LFS coverage before commit. Mode changes and partial failures preserve the prior usable state.
diff --git a/knowledge-repository/templates/source.md b/knowledge-repository/templates/source.md
index a7797f5..1ba3941 100644
--- a/knowledge-repository/templates/source.md
+++ b/knowledge-repository/templates/source.md
@@ -16 +16,2 @@ citekey:
-external_locator:
+asset_mode:
+repository_asset:
```

## Approval

- Decision: pending
- Approved diff identifier:
- Approved on:
- Applied on:
