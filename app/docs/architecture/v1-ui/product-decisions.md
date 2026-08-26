# V1 product decisions

## Product shape

The Knowledge Workbench is a desktop-only V1 with three task-specific workspaces:

- **Atlas** is home, orientation, and the place where pending human Judgment is visible.
- **Studio** is the primary authoring and Synthesis workspace.
- **Paper Desk** is the focused PDF reading and Structured Annotation workspace.

Atlas is home without becoming a tollbooth. Opening the Workbench resumes meaningful active work; otherwise it opens Atlas. A compact labeled workspace switcher remains visible, while contextual transitions carry the current topic, Source Record, annotations, or Proposal to the relevant destination.

V1 officially supports macOS only while using a cross-platform-capable desktop foundation. A packaged release starts without a selected repository. The user may open an existing Knowledge Repository or create one from the bundled empty skeleton at an explicitly chosen location, conventionally a sibling directory. The app never scans for or silently opens a sibling repository. Tablet and phone adaptations are deferred rather than approximated with layouts that hide essential context.

The public application project is MIT-licensed and contains only a synthetic repository fixture and a starter skeleton. The user's actual Knowledge Repository is an independent private repository with its own lifecycle and is never bundled with or required by the application. The synthetic fixture is not derived from private content.

The Repository Format is versioned and VCS-neutral. Galaxy Brain remains usable without Git, Git LFS, GitHub, remotes, credentials, or network connectivity. The user performs Git initialization, commits, branching, synchronization, and backups outside the app. Local-only use is first-class; GitHub-dependent capabilities are optional and non-blocking.

Agent Provider configuration is also optional. A packaged Workbench starts and remains usable without an API key or configured provider. Repository, reading, editing, source, annotation, and governance workflows remain available locally; Agentic Capabilities such as Ask, agent-assisted Synthesis, Generated Relationship suggestions, and progress suggestions report a clear unavailable state until a provider is configured. The app does not block startup with a credential prompt.

Creating a repository copies and validates the skeleton but does not run `git init` or create a commit. It may write only to a new or explicitly empty directory. Existing valid repositories may be opened; nonempty invalid directories are never overwritten. The user receives a clear local-save status and may initialize and commit externally.

## Atlas

Atlas answers “What should I do now?” before describing the collection.

1. **Continue working** and **Needs your judgment** are distinct primary lanes. Unlike responsibilities are not collapsed into an opaque ranking.
2. Practice, open questions, Learning Routes, and collection indicators follow the primary lanes.
3. Learning Routes are human-curated. Generated Relationships may be overlaid for discovery only when visually and semantically distinguished.
4. A metric earns space only when its definition is visible, its underlying items are reachable, and it leads to an intelligible action. Composite health scores, streak pressure, and engagement metrics are excluded.
5. The V1 card hierarchy is opinionated and fixed. Secondary sections may collapse and useful filters may be saved, but dashboard construction is out of scope.
6. Learning goals are user-owned. System suggestions must explain their evidence and remain correctable; passive reading or activity volume cannot complete a learning stage by itself.

## Studio

Studio presents rich semantic editing by default and a fully equivalent extended-Markdown source view. Links, embeds, callouts, citations, equations, and other supported constructs behave as structured objects without ceasing to be legible repository text.

On desktop, metadata, backlinks, questions, and applicable Proposals appear in a resizable inspector. Sections can be pinned, and the authoring surface can reclaim the space when the inspector is not useful.

Human edits are direct Working Material until explicitly applied under the repository's governance rules. Agent work that would change Governed Knowledge appears as a Proposal with inline applicability markers and a dedicated review route.

## Paper Desk

Paper Desk provides deep PDF support in V1. Other source kinds may have Source Records, but do not receive a shallow universal viewer.

**Add PDF**—also discoverable as “Import PDF”—first creates a portable Source Record and then asks how to retain its Source Asset:

1. **Manage** copies and verifies the PDF under `assets/sources/` and records a repository-relative reference. Git LFS may be configured externally through the repository's `.gitattributes`; it is not required by Galaxy Brain.
2. **Link local file** leaves the PDF in place and stores its absolute path and SHA-256 identity only in machine-local configuration keyed by the Source Record. No machine-specific path enters repository content.

Changed or unavailable linked bytes preserve the Source Record, Source Locators, Structured Annotations, and citations until the user explicitly relinks or accepts the new bytes.

A capture preserves source identity and its Source Locator before asking for minimal classification. Fast controls, keyboard shortcuts, and remembered defaults classify a Structured Annotation as a source claim, personal interpretation, agent inference, question, or relationship. Incomplete captures remain visible in a processing queue.

Capture never implies Synthesis. **Synthesize into topic** is an explicit action that:

1. selects relevant Structured Annotations;
2. selects or proposes a target topic;
3. previews relationships such as supports, contradicts, qualifies, extends, or raises a question about; and
4. produces a draft Proposal, a source link without a knowledge change, or an explicit no-action result.

The Workbench may remind the user about unsynthesized annotations and suggest likely targets. It may not automatically manufacture a Proposal when a capture or source-processing session completes.

If an external PDF becomes unavailable, its Source Record, Source Locators, annotations, and citations remain. The Workbench marks the source unavailable and permits relinking without claiming the source was verified while inaccessible.

## Proposal review

Proposal review has a dedicated route reachable from Atlas and Studio, but it is not a fourth primary workspace. It has room for a rendered preview, exact source diff, rationale, evidence, epistemic labels, uncertainty, conflicts, evolution requirements, and dependencies.

A coherent Proposal may contain independently reviewable changes. Each change can be accepted, edited, deferred, or rejected. Dependencies that make decisions inseparable must be explicit. Judgment binds to the exact reviewed version; a changed target or Proposal makes that Judgment stale.

Applying an accepted Proposal writes the approved files, an immutable record under `proposals/applied/`, and targeted rollback data as one recoverable filesystem transaction. It never destroys the prior view. Galaxy Brain does not create Git commits.

## Shared interactions

- The global input exposes visible **Search**, **Ask**, and **Jump** modes. It may suggest a mode from natural language but shows the operation before execution.
- Ask answers cite underlying notes and Source Locators, distinguish Core Knowledge from Working Material, surface conflicts and uncertainty, and state when the repository cannot support an answer. Asking never changes knowledge automatically.
- Quick capture creates timestamped Working Material in a scratch inbox with its origin context and optional type or project. It never creates Governed Knowledge.
- Working Material, reading position, and workspace context autosave continuously. Saving is visually distinct from accepting knowledge.
- Attention remains in-app and centers on Atlas. Restrained badges identify pending Judgment; toasts acknowledge immediate actions. Repeated reminders, streak pressure, and generic notifications are excluded.
- Theme is user-selected and consistent across workspaces. Distinct accents or densities may identify a workspace without forcing a luminance change.
- Accessibility is a V1 requirement: complete keyboard operation, discoverable shortcuts, semantic structure, visible focus, reduced motion, scalable text, sufficient contrast, and no color-only meaning.
- A Working Set retains one active item per workspace plus a bounded collection of pinned and recent items. Separate application windows, rather than unlimited internal tabs, support genuine side-by-side work.
- Working edits provide immediate undo and durable artifact history. Proposal decisions retain an immutable repository-held audit trail and rollback history.
- Demo mode is deferred. The authentic empty-state path opens or creates a repository, adds or locates a source, captures evidence, synthesizes it, and reviews the proposed change; test fixtures never mix with real data.

## Explicitly deferred

- Tablet and phone experiences.
- Non-PDF source viewers.
- User-constructed Atlas dashboards.
- Unrestricted internal tabs.
- Automatic Synthesis or automatic application of agent changes.
- An editor engine, PDF engine, index, model provider, updater, router, state-management library, native database, Git/Git LFS integration, GitHub authentication, remote synchronization, verified backup service, demo mode, and multi-repository support.

## Future work

- Multi-Knowledge-Repository support with explicit switching, isolated session state and indexes, and no implicit cross-repository Search or Ask.
- GitHub authentication, remote synchronization, and verified off-device backup.
- Repository Housekeeping reports for stale, duplicate, unreferenced, or obsolete support files and rollback data. Cleanup requires explicit approval; audit records are never automatically removed, and irreversible Git/LFS history reclamation is separate advanced work.
- A standalone public skeleton distribution if the bundled starter proves insufficient.
