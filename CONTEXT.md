# Galaxy Brain

Galaxy Brain is a human-owned knowledge system for research, learning, and the deliberate evolution of reviewed knowledge.

## Language

**Knowledge Workbench**:
The desktop interface through which a person reads sources, develops ideas, reviews proposals, and maintains Galaxy Brain.
_Avoid_: Dashboard, editor app

**Atlas**:
The Knowledge Workbench workspace for orientation, resuming active work, and finding matters that need human judgment.
_Avoid_: Dashboard, home dashboard

**Studio**:
The Knowledge Workbench workspace for authoring and synthesizing knowledge.
_Avoid_: Editor, note editor

**Paper Desk**:
The Knowledge Workbench workspace for reading a source and creating source-bound annotations.
_Avoid_: PDF viewer, reader

**Core Knowledge**:
Reviewed knowledge that the user has accepted as authoritative enough to guide future understanding and work.
_Avoid_: Notes, wiki

**Governed Knowledge**:
Core Knowledge and the rules, registries, guidance, and templates whose changes require explicit human approval.
_Avoid_: Production data, locked content

**Working Material**:
Provisional research, annotations, drafts, captures, and proposals that have not become Governed Knowledge.
_Avoid_: Unsaved work, temporary data

**Knowledge Repository**:
An application-independent collection of Governed Knowledge, Working Material, portable supporting assets, audit records, and rollback history that conforms to the Repository Format.
_Avoid_: App data, application database

**Repository Format**:
The documented, versioned contract for the portable files and directory structure of a Knowledge Repository. It does not require a version-control system.
_Avoid_: Internal schema, application storage layout

**Source Record**:
A portable description of an external source, including its stable identity and the information needed to locate it.
_Avoid_: File, attachment

**Source Asset**:
The bytes associated with a Source Record, either managed inside the Knowledge Repository or linked from the broader operating-system filesystem.
_Avoid_: Attachment, repository file

**Source Locator**:
A durable logical reference to a specific place within a Source Record, such as a page and highlight.
_Avoid_: File path, bookmark

**Agent Provider**:
An optional external service or local runtime that supplies generative behavior for agentic capabilities. Its configuration is machine-local and is not required to open or use the Knowledge Workbench.
_Avoid_: Knowledge Repository dependency

**Agentic Capability**:
A Workbench operation whose behavior depends on an Agent Provider, such as an Ask answer, Synthesis suggestion, Generated Relationship, or progress suggestion. Without provider configuration, the capability is unavailable while non-agentic Workbench behavior remains usable.
_Avoid_: Core Workbench capability

**Structured Annotation**:
Working Material bound to a Source Locator and classified as a source claim, personal interpretation, agent inference, question, or relationship.
_Avoid_: Highlight, margin note

**Synthesis**:
The deliberate act of deciding whether and how selected Working Material should affect broader knowledge.
_Avoid_: Import, merge

**Proposal**:
A version-bound set of exact changes to Governed Knowledge, together with its rationale, evidence, uncertainty, conflicts, and dependencies.
_Avoid_: Agent edit, suggestion

**Judgment**:
An explicit human decision to accept, edit, defer, or reject all or part of a Proposal.
_Avoid_: Moderation, validation

**Learning Route**:
A human-curated sequence or map that expresses an intended path through related knowledge.
_Avoid_: Generated graph, curriculum

**Generated Relationship**:
A machine-derived connection presented for discovery without the authority of a Learning Route.
_Avoid_: Learning Route, canonical link

**Working Set**:
The bounded collection of active, pinned, and recent items retained across Knowledge Workbench workspaces.
_Avoid_: Tabs, session
