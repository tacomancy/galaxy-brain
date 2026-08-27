# Test-driven delivery plan

Status: Tracer Bullet 1 complete and accepted on August 27, 2026; S1–S5 Test Seams remain confirmed; Tracer Bullet 2 is next.

Scope note: the release gate proves the provider-free core V1 workflow. Agentic Capabilities are optional V1 extensions and must degrade clearly when no Agent Provider is configured; post-V1 work remains outside this delivery sequence unless the Product Decisions explicitly promote it.

## Operating rule

This is an ordered sequence of candidate tracer bullets, not a backlog of tests to write in advance. Start a slice only after the preceding cycle is green and its evidence has been reviewed. For each slice:

1. Select one behavior at a confirmed seam.
2. Write one behavior-named test with independently known expected values.
3. Run it and observe the expected failure for the missing behavior.
4. Add only enough implementation to make that test pass.
5. Run the relevant suite and observe green.
6. Record what the slice taught and choose or revise the next slice.

Do not refactor during the red-to-green loop. Refactoring belongs to a separate review stage while the suite is green.

## Candidate tracer bullets

### 1. Open the real empty Workbench

At S1, prove that a fresh desktop session opens Atlas with the authentic empty-state path and no demonstration data mixed into it. Implement the smallest vertical path from UI adapter through Workbench Session to an in-memory Knowledge Repository adapter.

This slice validates the Electron foundation selected in ADR 0004 and forces the first concrete application composition. If the real S1 path contradicts the stack rationale, stop and revisit the ADR rather than hiding the mismatch behind the test harness.

#### Tracer Bullet 1 completion record — August 27, 2026

- **Public Behavior:** A fresh desktop session opens Atlas with the authentic empty-state path and no demonstration data.
- **Test Seam:** S1 desktop workflow, using the real packaged Electron application, main process, preload bridge, Workbench Session, Atlas UI Adapter, and in-memory Knowledge Repository Adapter.
- **Automated evidence:** With Node.js `24.19.0`, `npm run check` passed formatting, linting, type checking, and the configured Vitest command. `npm run test:workflow` packaged the macOS arm64 application and passed the WebdriverIO scenario: 1 spec passed.
- **Manual evidence:** The developer launched the application with `npm start` and observed the `Galaxy Brain` native window title, the `Atlas` workspace, the plain white empty state, and the exact repository-unselected message.
- **Scope confirmed:** Repository open/create, persistence, resume, file-backed adapters, and later S1–S5 behaviors remain deferred to subsequent tracer bullets.
- **Process note:** The original red-to-green failure was not captured in the repository history; the implementation and behavior test were introduced together in the initial tracer-bullet commit. This record makes no retroactive claim about a red run. A restricted packaging attempt also failed before test execution because the sandbox could not resolve `github.com`; the network-enabled retry passed.
- **Acceptance:** The user reviewed the running application and accepted the first tracer bullet.

### 2. Create or open a local Knowledge Repository

At S1, prove that the user can explicitly open an existing valid repository or create one from the bundled empty skeleton at a new or empty path. Creation writes files and validates the Repository Format but never initializes Git or creates a commit. A nonempty invalid directory is rejected without mutation. The app remains usable without Git, Git LFS, GitHub, credentials, or network connectivity.

### 3. Resume meaningful work

At S1, prove that reopening a known session validates and resumes the last explicitly selected repository, active workspace, and context, while a first launch opens without a repository and an unavailable or invalid remembered path presents explicit Open/Create choices. Do not scan for sibling repositories. Add only the machine-local session persistence needed for the worked fixture.

### 4. Carry context between workspaces

At S1, prove a contextual transition from an Atlas item to Studio and then to its Source Record in Paper Desk without losing the topic relationship. Add the compact global switcher only to the extent this behavior needs it.

### 5. Capture one located source claim

At S3, prove that capturing the known PDF passage produces a source-claim Structured Annotation with the fixture Source Locator and attribution. Implement the minimum PDF adapter and Working Material persistence needed for that outcome.

### 6. Reopen the capture

At S1, prove that the saved annotation and reading position are restored through the public desktop workflow. This joins the source-processing behavior to real session and repository behavior without querying storage from the test.

### 7. Synthesize selected evidence explicitly

At S3, prove that **Synthesize into topic** shows a concise summary and inspectable exact payload for the selected annotations and target context, allows removal of whole context items with regenerated previews, requires explicit confirmation before sending that final payload to OpenAI, and returns the literal draft Proposal fixture when the confirmed request succeeds. Add separate cycles proving that capture or source completion alone produces no Proposal, that declining makes no request and preserves the annotations, that arbitrary inline redaction is unavailable, that the Model Adapter cannot add context after confirmation, that request and response payloads are not retained unless explicitly saved, that the default save retains the result plus agent provenance but not the prompt/context, that an explicit save-with-prompt/context choice retains the human-facing prompt, selected source references or locators, and concise context summaries as a point-in-time snapshot but not full source excerpts or the hidden full payload, that a mismatch in saved versus current source identity or content identity does not rewrite the saved snapshot and produces a non-blocking stale-context warning, that the saved result remains Working Material, and that agent-assisted Synthesis returns `agent-provider-unavailable` without one while preserving the annotations.

### 8. Apply one governed change

At S2, start with a literal existing governed version and a manually authored Proposal from an edited Working Material draft. Prove that explicit acceptance and application create the expected new version while the current version remains unchanged until application and the previous version remains retrievable, all without an Agent Provider. Agent-assisted Proposal drafting can be added at the model seam without changing Governance authority.

### 9. Reject stale and incoherent applications

Continue at S2 one behavior per cycle: first prove stale Judgment is rejected, then prove an invalid dependency subset is rejected, and then prove independently reviewable changes can receive different decisions. Do not prebuild all dependency behavior in the first governance cycle.

### 10. Review through the desktop interface

At S1, prove that Atlas opens the dedicated review route, displays the fixture change and evidence, records Judgment, and shows the applied version. Use the real Governance module; do not mock it to make the UI test convenient.

### 11. Preserve meaning across editing views

At S1, prove one worked extended-Markdown construct can be edited in rich view, inspected in source view, reopened, and observed with the same meaning. Expand one construct per later cycle—link, embed, callout, equation, citation—letting each reveal the next necessary editor behavior.

### 12. Separate Search, Ask, and Jump

At S4, prove one mode at a time. Start with a literal Search result, add a cited Ask answer from the known corpus after explicit confirmation of its concise summary and inspectable exact OpenAI payload, including removing a whole context item and observing the regenerated payload, then prove the default save excludes the prompt/context while the explicit save-with-prompt/context choice retains the human-facing prompt, selected source references or locators, and concise context summaries as a point-in-time snapshot—but not full source excerpts—and preserves agent provenance without becoming Governed Knowledge. Change a referenced source afterward so its identity or content identity differs, and verify that the saved snapshot is not silently rewritten, that navigation may resolve the current source, and that opening the saved artifact shows a non-blocking stale-context warning. Add an unsupported Ask outcome, an unavailable-provider Ask outcome without an API key, and finally a known Jump command. Follow with one S1 cycle proving the selected mode and outbound payload are visible before execution, that declining makes no request, and that local workflows remain usable without Agent Provider configuration.

### 13. Make Atlas actionable

At S1, prove the fixture session appears under Continue working and the fixture Proposal under Needs your judgment. Add individual cycles for a traceable metric, a human-authored Learning Route, and a visually distinct Generated Relationship.

### 14. Keep learning progress human-owned

At S1, prove that a suggestion explains its fixture evidence but does not advance the learning stage until confirmed. If S1 cannot express the critical behavior economically, pause and propose a new Test Seam in the test strategy before writing the test.

### 15. Survive a missing or changed PDF

At S3, prove that an unavailable or hash-changed linked PDF preserves the Source Record and annotations. In the next cycle, prove relinking makes the known page available without silently accepting changed bytes or changing its logical Source Locator.

### 16. Complete the desktop quality contract

At S1, add one behavior per cycle for keyboard-only completion of a critical workflow, visible focus, semantic landmarks and names, reduced motion, scalable text, theme persistence, undo, and version-history recovery. Use automated accessibility tooling as supporting evidence, never as a substitute for observable workflow assertions and manual review.

Saved agent context must retain its point-in-time snapshot when the current source cannot be checked or lacks a comparable identity. The Workbench reports `source status unavailable` without blocking access or claiming that the snapshot is current. An explicit refresh must create a new snapshot/version while preserving the original and must never silently replace it in place. Refresh updates only the saved context representation; a separate result-regeneration action requires fresh confirmation before any new OpenAI request.

Result regeneration must create a new result version and preserve the previous result rather than silently overwriting it.

The Workbench should present the newest result as current and make prior versions retrievable through ordinary artifact history without creating separate top-level items for each regeneration.

An explicit restore of an older result must create a new current version derived from that result, preserve all intervening versions, and make no OpenAI request.

Prior result versions remain retained by default. Automatic cleanup is prohibited; future deletion or history pruning requires explicit approval and a warning about lost recovery and provenance.

## Review checkpoints

Pause after slices 4, 10, 13, and 16 for a green-suite review. At each checkpoint:

- assess whether module interfaces remain deep;
- remove duplication through refactoring only after the red-to-green cycle is complete;
- verify tests still observe public behavior rather than implementation structure;
- reconsider the next tracer bullet using the working product; and
- record any new hard-to-reverse architectural decision as an ADR.

The plan is complete when the accepted V1 behaviors in [Product decisions](product-decisions.md) are observable through the confirmed seams, not when every listed file, screen, or internal module has a corresponding test.

The V1 release gate also requires a packaged workflow against a real file-backed repository. It must prove repository creation/opening, local-only use without Git, external-edit detection, interrupted-transaction recovery, rollback, and transparent local-save status before release.
