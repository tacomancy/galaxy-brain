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

For V1, the Agent Provider is the OpenAI API and each Agentic Capability uses one internally selected, pinned OpenAI model version. “OpenAI / ChatGPT” here means OpenAI API access using `OPENAI_API_KEY`; it does not mean ChatGPT consumer-account login, ChatGPT OAuth, or a requirement for a ChatGPT subscription. V1 does not expose a model picker or dynamically discover and switch models. Configuration is declared in a machine-local `.env` file in the Workbench's application configuration directory, not in the selected Knowledge Repository or the public application source tree. The committed [`app/.env.example`](../../../app/.env.example) lists the required variables and setup steps without containing a secret. The repository-wide ignore rules exclude `.env` from version control. The app reads only recognized variables, never writes them to repository content or logs, and never requires the file for provider-free local use. Support for other providers and model ecosystems, dynamic model selection, OS-backed credential storage, and provider-native OAuth remain future work. The OpenAI API's standard API-key authentication is documented in the [official OpenAI API reference](https://developers.openai.com/api/reference/overview).

The provider-free local Workbench is the minimum V1 release gate. The Agentic Capabilities described in this document remain optional V1 capabilities—not post-V1 scope—but their availability depends on a configured Agent Provider. A release may be useful and complete for local work without activating them.

## Agent data transmission

When the current source for a saved context snapshot cannot be checked or lacks a comparable identity, the Workbench shows **source status unavailable**, preserves the saved snapshot, and does not claim that the snapshot is current.

If the user explicitly chooses to refresh a saved context snapshot, Galaxy Brain creates a new snapshot/version and preserves the original. It never silently replaces the historical context in place.

Refreshing a snapshot updates only its saved context representation. Regenerating the agent result is a separate explicit action; if it sends a new OpenAI request, it requires a new confirmation of that request's final payload.

Explicit result regeneration creates a new result version and preserves the previous result. It does not silently overwrite the earlier agent output.

The Workbench presents the newest result as current and exposes prior result versions through ordinary artifact history. Each version remains retrievable without creating a separate top-level item for every regeneration.

Users may explicitly restore an older result version. Restoration creates a new current version derived from the selected older version, preserves all intervening versions, and does not send a new OpenAI request.

Prior agent-result versions are retained by default through ordinary artifact history; Galaxy Brain does not clean them up automatically. Any future deletion or history-pruning action requires explicit user approval and clearly explains the lost recovery and provenance.

Every request to OpenAI from an Agentic Capability requires explicit confirmation immediately before the request, even when the request contains only user-entered text and no repository-derived material. The confirmation identifies the operation, the OpenAI destination, and the request context, including any selected notes, annotations, source excerpts, metadata, or other material in scope. V1 shows a concise summary by default—including operation, destination, model, prompt, sources, content categories, and estimated request size—and provides an expandable view of the exact outbound payload. Users may remove whole context items before approval; each removal regenerates the summary and exact payload. V1 does not provide arbitrary inline redaction or payload editing. Small requests may show the full payload expanded by default; large requests may keep it collapsed, but never hide or truncate it without a clear way to inspect it. The user confirms the exact final payload, and the Model Adapter may not add context afterward. V1 does not use blanket consent, remembered consent, silent background requests, or whole-repository uploads. Until the user confirms, no network request occurs; declining or canceling leaves local material and state unchanged. Provider-independent operations never require this confirmation. Configurable confirmation policies are future work; V1 always confirms every OpenAI request.

Galaxy Brain does not retain OpenAI request or response payloads in automatic history, caches, logs, audit records, or other local support files. An agent result may be displayed transiently; it is retained only when the user explicitly saves it as Working Material, a Proposal, or another ordinary repository artifact. Minimal non-content operational metadata may support ordinary error handling, but must not reconstruct the prompt, selected context, or response. Any future diagnostic capture requires separate explicit privacy decisions.

When a user explicitly saves an OpenAI result, the default save retains the generated result plus agent-generated attribution and provenance: OpenAI provider identity, pinned model version, generation timestamp, Agentic Capability or operation, and source-context references, including Source Records and Source Locators when applicable. A separate explicit **save with prompt/context** choice may also retain the human-facing prompt, selected source references or locators, and concise context summaries. Those references, locators, and summaries are a point-in-time snapshot of the confirmed context. They may support navigation to the current source, but later source changes must not silently rewrite the saved artifact. When the Workbench detects that a referenced source's saved identity or content identity differs from the current source, it shows a non-blocking warning that distinguishes the saved snapshot from the current source; it does not silently refresh the snapshot or prevent access. That choice does not retain full source excerpts. Neither choice automatically retains the hidden full API payload. Human edits add human authorship without erasing the agent provenance. These metadata identify origin and evidence; they do not confer authority. The saved result remains Working Material until it passes normal Proposal and Judgment Governance.

Creating a repository copies and validates the skeleton but does not run `git init` or create a commit. It may write only to a new or explicitly empty directory. Existing valid repositories may be opened; nonempty invalid directories are never overwritten. The user receives a clear local-save status and may initialize and commit externally.

After the user explicitly opens or creates a Knowledge Repository, the Workbench may remember that exact root in machine-local session state. On a later launch it attempts to validate and resume that explicit selection; if the path is unavailable or invalid, it shows a clear recovery state with choices to open another repository or create one. It never scans for sibling repositories or silently selects a different root.

## V1 scope boundary

The minimum V1 release is a packaged macOS Workbench that can open or create a local Knowledge Repository and complete the core local workflows: navigate and resume work, author Working Material, read and annotate PDFs, preserve source provenance, review and apply governed Proposals, recover safely from file changes or interruptions, and operate accessibly without Git, network services, or Agent Provider configuration.

Optional V1 capabilities—Ask, agent-assisted Synthesis, Generated Relationship suggestions, and progress suggestions—activate when an Agent Provider is configured. Their absence must be visible but must not block the core release gate. Tablet and phone experiences, non-PDF viewers, remote synchronization, verified backup, GitHub integration, demo mode, multi-repository support, Repository Housekeeping, and other items listed below remain post-V1 work.

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

Human edits are direct Working Material until explicitly governed. A user may manually turn Working Material into a Proposal, edit its exact diff and rationale, and apply it through the normal Judgment and Governance flow without an Agent Provider. Agent work that would change Governed Knowledge also appears as a Proposal with inline applicability markers and a dedicated review route; agent assistance is optional.

## Governed Knowledge evolves

Promotion does not make knowledge read-only. A user can open an existing Core Knowledge item, edit an independent Working Material draft, and later create a human-authored Proposal from that draft without an Agent Provider. Applying the eligible Proposal creates a new governed version, preserves the prior version for history and rollback, and records the decision in the immutable audit trail. The current governed version remains authoritative until the replacement is explicitly applied.

This deliberate friction protects provenance, evidence, uncertainty, and reversibility without pretending that accepted knowledge cannot need correction, refinement, retraction, or improvement. Direct edits to the governed version are not allowed because they would bypass review; freezing it permanently is also rejected because the purpose of the system is the deliberate evolution of reviewed knowledge.

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

Agent-assisted Synthesis requires an Agent Provider. Without one, the agent-assisted action returns a clear unavailable result and leaves captured annotations intact; provider-independent source review, classification, linking, and Proposal review remain available.

If an external PDF becomes unavailable, its Source Record, Source Locators, annotations, and citations remain. The Workbench marks the source unavailable and permits relinking without claiming the source was verified while inaccessible.

## Proposal review

Proposal review has a dedicated route reachable from Atlas and Studio, but it is not a fourth primary workspace. It has room for a rendered preview, exact source diff, rationale, evidence, epistemic labels, uncertainty, conflicts, evolution requirements, and dependencies.

A coherent Proposal may contain independently reviewable changes. Each change can be accepted, edited, deferred, or rejected. Dependencies that make decisions inseparable must be explicit. Judgment binds to the exact reviewed version; a changed target or Proposal makes that Judgment stale.

Applying an accepted Proposal writes the approved files, an immutable record under `proposals/applied/`, and targeted rollback data as one recoverable filesystem transaction. It never destroys the prior view. Galaxy Brain does not create Git commits.

## Shared interactions

- The global input exposes visible **Search**, **Ask**, and **Jump** modes. It may suggest a mode from natural language but shows the operation before execution.
- Ask answers cite underlying notes and Source Locators, distinguish Core Knowledge from Working Material, surface conflicts and uncertainty, and state when the repository cannot support an answer. Asking never changes knowledge automatically.
- Ask returns an explicit provider-unavailable result when no Agent Provider is configured; it never presents a blank, partial, or apparently successful answer.
- Generated Relationship and learning-progress suggestions return the same provider-unavailable result without changing Learning Routes, goals, or progress.
- Quick capture creates timestamped Working Material in a scratch inbox with its origin context and optional type or project. It never creates Governed Knowledge.
- Working Material, reading position, and workspace context autosave continuously. Saving is visually distinct from accepting knowledge.
- Attention remains in-app and centers on Atlas. Restrained badges identify pending Judgment; toasts acknowledge immediate actions. Repeated reminders, streak pressure, and generic notifications are excluded.
- Theme is user-selected and consistent across workspaces. Distinct accents or densities may identify a workspace without forcing a luminance change.
- Accessibility is a V1 requirement: complete keyboard operation, discoverable shortcuts, semantic structure, visible focus, reduced motion, scalable text, sufficient contrast, and no color-only meaning.
- A Working Set retains one active item per workspace plus a bounded collection of pinned and recent items. Separate application windows, rather than unlimited internal tabs, support genuine side-by-side work.
- Working edits provide immediate undo and durable artifact history. Proposal decisions retain an immutable repository-held audit trail and rollback history.
- The authentic empty-state path opens or creates a repository, adds or locates a source, captures evidence, synthesizes it, and reviews the proposed change; test fixtures never mix with real data. Demo mode is listed in Future work.

## Explicitly deferred

These are V1 exclusions. The [Future work](#future-work) section below is the canonical inventory of post-V1 capabilities.

- Tablet and phone experiences.
- Non-PDF source viewers.
- User-constructed Atlas dashboards.
- Unrestricted internal tabs.
- Automatic Synthesis or automatic application of agent changes.
- Specific editor, PDF, index, updater, router, state-management, and native-database technologies remain unselected until behavior requires them. OpenAI is the sole V1 Agent Provider; one pinned model version is used for V1, while other providers, model ecosystems, and dynamic model selection are deferred.

## Future work

- Multi-Knowledge-Repository support with explicit switching, isolated session state and indexes, and no implicit cross-repository Search or Ask.
- GitHub authentication, remote synchronization, and verified off-device backup.
- Repository Housekeeping reports for stale, duplicate, unreferenced, or obsolete support files and rollback data. Cleanup requires explicit approval; audit records are never automatically removed, and irreversible Git/LFS history reclamation is separate advanced work.
- A standalone public skeleton distribution if the bundled starter proves insufficient.
- Topic-based tutoring sessions powered by an optionally configured Agent Provider. Tutoring should stay grounded in the selected topic and evidence, provide explanations, questions, practice, and feedback, and never automatically change Governed Knowledge or advance user-owned learning progress.
- Support for providers and model ecosystems other than the V1 OpenAI API integration.
- Dynamic model discovery, model switching, and user-facing model selection.
- Configurable confirmation policies, including trusted-operation exemptions or remembered consent.
- Arbitrary inline redaction or editing of outbound request payloads.
