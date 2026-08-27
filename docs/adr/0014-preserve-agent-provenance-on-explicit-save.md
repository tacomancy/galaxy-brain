---
status: accepted
---

# Preserve agent provenance on explicit save

When a user explicitly saves an OpenAI result as Working Material, a Proposal, or another ordinary repository artifact, Galaxy Brain labels it agent-generated and preserves the OpenAI provider identity, pinned model version, generation timestamp, Agentic Capability or operation, and applicable source-context references, including Source Records and Source Locators. The default save excludes the human-facing prompt and context. A separate explicit save-with-prompt/context action may retain the human-facing prompt, selected source references or locators, and concise context summaries, but not full source excerpts. Those references, locators, and summaries are a point-in-time snapshot of the confirmed context. They may support navigation to the current source, but later source changes must not silently rewrite the saved artifact. When the Workbench detects that a referenced source's saved identity or content identity differs from the current source, it shows a non-blocking warning that distinguishes the saved snapshot from the current source; it does not silently refresh the snapshot or block access. Neither save path automatically retains the hidden full API payload. Human edits add human authorship without erasing agent provenance. The saved result remains Working Material until normal Proposal and Judgment Governance accepts it.

## Rationale

The result's origin and evidence context are necessary for the user to evaluate it later, especially after the transient request and response have been discarded. Attribution prevents polished generated prose from being mistaken for human-authored or Governed Knowledge. Keeping provenance separate from authority preserves the user's ability to edit, challenge, or reject the result. Separating default save from an explicit prompt/context choice preserves non-retention by default while allowing the user to retain limited reproducibility material deliberately. References and concise summaries support orientation without duplicating full private source excerpts. Making them a point-in-time snapshot prevents later source edits from silently changing the record of what informed the result. A non-blocking warning makes that distinction visible without making saved work inaccessible.

## Considered alternatives

- **Save the result without agent attribution:** rejected because later readers could mistake generated content for human-authored knowledge.
- **Persist the full prompt and response transcript as provenance:** rejected because V1 explicitly does not retain payloads unless the user deliberately saves the result itself.
- **Treat an explicitly saved agent result as Governed Knowledge:** rejected because saving is not Judgment and agent metadata cannot substitute for human Governance.
- **Discard source-context references after saving:** rejected because provenance and later evaluation require the evidence relationship to survive the transient interaction.
- **Always save the prompt and context with the result:** rejected because it creates additional sensitive repository content without requiring a distinct choice.
- **Re-resolve saved references and summaries live:** rejected because later source edits could silently change the record of the context that informed the result.
- **Silently refresh or block a saved artifact when its source changes:** rejected because silent refresh destroys historical clarity while blocking makes legitimate saved work inaccessible; a visible non-blocking warning preserves both.
- **Replace the saved context snapshot in place when the user refreshes it:** rejected because it destroys the historical record of what informed the result; an explicit refresh must create a new snapshot/version and preserve the original.
- **Overwrite the previous agent result when regenerating:** rejected because it destroys the history of generated output; regeneration must create a new result version and preserve the previous result.
- **Expose every regenerated result as a separate top-level item:** rejected because it clutters the repository and makes the user's working collection harder to navigate; one current result with ordinary artifact history preserves access without multiplying primary items.
- **Restore an older result by overwriting the current version:** rejected because it destroys intervening history; restoration must create a new current version while preserving every existing version.
- **Automatically delete older result versions:** rejected because it can remove useful recovery and provenance without a distinct user decision; older versions remain retained by default, and future pruning must be explicit and warned.
- **Preserve agent attribution and source context while keeping the result Working Material, with an explicit prompt/context save option limited to references and concise summaries:** accepted because it supports inspectable origin, human editing, eventual governed evolution, and deliberate reproducibility without duplicating full source excerpts.

## Consequences

If the current source cannot be checked or lacks a comparable identity, the Workbench reports `source status unavailable`, preserves the snapshot, and does not claim that it is current.

An explicit refresh creates a new context snapshot/version and preserves the original; it updates only the saved context representation. Regenerating the agent result is a separate explicit action, and any new OpenAI request remains subject to a fresh V1 confirmation boundary.

Result regeneration creates a new result version and preserves the previous result. The versioning mechanism must retain provenance for each result and must not silently overwrite earlier agent output.

The Workbench presents the newest result as current and exposes prior versions through ordinary artifact history. Each version remains retrievable without becoming a separate top-level item.

An explicit restore creates a new current version derived from the selected older version, preserves all intervening versions, and makes no OpenAI request.

Prior result versions are retained by default through ordinary artifact history. Automatic cleanup is prohibited; any future deletion or history pruning requires explicit approval and a warning about lost recovery and provenance.

The save workflow must write provenance metadata with the artifact and preserve it through ordinary human edits. The default save must not include the human-facing prompt/context; the explicit save-with-prompt/context choice may include the human-facing prompt, selected source references or locators, and concise context summaries, but not full source excerpts. These references, locators, and summaries are saved as a point-in-time snapshot; navigation may resolve a current source, but source changes must not silently rewrite the artifact. A mismatch in saved versus current source identity or content identity must produce a non-blocking warning that distinguishes the snapshot from the current source without blocking access. Neither path writes API credentials or reconstructs the hidden full request/response payload. Tests must verify both save paths, attribution, provider/model/timestamp/operation fields, source-context references, persistence through edits and source changes, the stale-context warning, and the absence of automatic Governance promotion.
