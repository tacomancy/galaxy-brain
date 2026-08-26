# V1 product decisions

## Product shape

The Knowledge Workbench is a desktop-only V1 with three task-specific workspaces:

- **Atlas** is home, orientation, and the place where pending human Judgment is visible.
- **Studio** is the primary authoring and Synthesis workspace.
- **Paper Desk** is the focused PDF reading and Structured Annotation workspace.

Atlas is home without becoming a tollbooth. Opening the Workbench resumes meaningful active work; otherwise it opens Atlas. A compact labeled workspace switcher remains visible, while contextual transitions carry the current topic, Source Record, annotations, or Proposal to the relevant destination.

V1 supports desktop only. Tablet and phone adaptations are deferred rather than approximated with layouts that hide essential context.

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

Paper Desk provides deep PDF support in V1. Other source kinds may have Source Records and external locators, but do not receive a shallow universal viewer.

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

Applying an accepted Proposal creates a reversible new version and an immutable audit record. It never destroys the prior view.

## Shared interactions

- The global input exposes visible **Search**, **Ask**, and **Jump** modes. It may suggest a mode from natural language but shows the operation before execution.
- Ask answers cite underlying notes and Source Locators, distinguish Core Knowledge from Working Material, surface conflicts and uncertainty, and state when the repository cannot support an answer. Asking never changes knowledge automatically.
- Quick capture creates timestamped Working Material in a scratch inbox with its origin context and optional type or project. It never creates Governed Knowledge.
- Working Material, reading position, and workspace context autosave continuously. Saving is visually distinct from accepting knowledge.
- Attention remains in-app and centers on Atlas. Restrained badges identify pending Judgment; toasts acknowledge immediate actions. Repeated reminders, streak pressure, and generic notifications are excluded.
- Theme is user-selected and consistent across workspaces. Distinct accents or densities may identify a workspace without forcing a luminance change.
- Accessibility is a V1 requirement: complete keyboard operation, discoverable shortcuts, semantic structure, visible focus, reduced motion, scalable text, sufficient contrast, and no color-only meaning.
- A Working Set retains one active item per workspace plus a bounded collection of pinned and recent items. Separate application windows, rather than unlimited internal tabs, support genuine side-by-side work.
- Working edits provide immediate undo and durable artifact history. Proposal decisions retain an immutable audit trail.
- Demonstration data is optional and clearly labeled. The authentic empty-state path adds or locates a source, captures evidence, synthesizes it, and reviews the proposed change; demonstration metrics never mix with real data.

## Explicitly deferred

- Tablet and phone experiences.
- Non-PDF source viewers.
- User-constructed Atlas dashboards.
- Unrestricted internal tabs.
- Automatic Synthesis or automatic application of agent changes.
- A production framework, editor engine, PDF engine, index, model provider, and storage technology beyond the repository's existing portable-source requirements.
