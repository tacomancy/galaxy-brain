# Test-driven delivery plan

Status: S1–S5 Test Seams confirmed; implementation has not started.

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

### 2. Create or open a local Knowledge Repository

At S1, prove that the user can explicitly open an existing valid repository or create one from the bundled empty skeleton at a new or empty path. Creation writes files and validates the Repository Format but never initializes Git or creates a commit. A nonempty invalid directory is rejected without mutation. The app remains usable without Git, Git LFS, GitHub, credentials, or network connectivity.

### 3. Resume meaningful work

At S1, prove that reopening a known session resumes its active workspace and context, while an empty or obsolete session opens Atlas. Add only the session persistence needed for the worked fixture.

### 4. Carry context between workspaces

At S1, prove a contextual transition from an Atlas item to Studio and then to its Source Record in Paper Desk without losing the topic relationship. Add the compact global switcher only to the extent this behavior needs it.

### 5. Capture one located source claim

At S3, prove that capturing the known PDF passage produces a source-claim Structured Annotation with the fixture Source Locator and attribution. Implement the minimum PDF adapter and Working Material persistence needed for that outcome.

### 6. Reopen the capture

At S1, prove that the saved annotation and reading position are restored through the public desktop workflow. This joins the source-processing behavior to real session and repository behavior without querying storage from the test.

### 7. Synthesize selected evidence explicitly

At S3, prove that **Synthesize into topic** uses only the selected annotations and returns the literal draft Proposal fixture. Then add a separate cycle proving that capture or source completion alone produces no Proposal.

### 8. Apply one governed change

At S2, start with a literal target version and Proposal. Prove that explicit acceptance and application create the expected new version while the previous version remains retrievable. Implement the smallest Governance path that can pass.

### 9. Reject stale and incoherent applications

Continue at S2 one behavior per cycle: first prove stale Judgment is rejected, then prove an invalid dependency subset is rejected, and then prove independently reviewable changes can receive different decisions. Do not prebuild all dependency behavior in the first governance cycle.

### 10. Review through the desktop interface

At S1, prove that Atlas opens the dedicated review route, displays the fixture change and evidence, records Judgment, and shows the applied version. Use the real Governance module; do not mock it to make the UI test convenient.

### 11. Preserve meaning across editing views

At S1, prove one worked extended-Markdown construct can be edited in rich view, inspected in source view, reopened, and observed with the same meaning. Expand one construct per later cycle—link, embed, callout, equation, citation—letting each reveal the next necessary editor behavior.

### 12. Separate Search, Ask, and Jump

At S4, prove one mode at a time. Start with a literal Search result, add a cited Ask answer from the known corpus, then add an unsupported Ask outcome, an unavailable-provider Ask outcome without an API key, and finally add a known Jump command. Follow with one S1 cycle proving the selected mode is visible before execution and that local workflows remain usable without Agent Provider configuration.

### 13. Make Atlas actionable

At S1, prove the fixture session appears under Continue working and the fixture Proposal under Needs your judgment. Add individual cycles for a traceable metric, a human-authored Learning Route, and a visually distinct Generated Relationship.

### 14. Keep learning progress human-owned

At S1, prove that a suggestion explains its fixture evidence but does not advance the learning stage until confirmed. If S1 cannot express the critical behavior economically, pause and propose a new Test Seam in the test strategy before writing the test.

### 15. Survive a missing or changed PDF

At S3, prove that an unavailable or hash-changed linked PDF preserves the Source Record and annotations. In the next cycle, prove relinking makes the known page available without silently accepting changed bytes or changing its logical Source Locator.

### 16. Complete the desktop quality contract

At S1, add one behavior per cycle for keyboard-only completion of a critical workflow, visible focus, semantic landmarks and names, reduced motion, scalable text, theme persistence, undo, and version-history recovery. Use automated accessibility tooling as supporting evidence, never as a substitute for observable workflow assertions and manual review.

## Review checkpoints

Pause after slices 4, 10, 13, and 16 for a green-suite review. At each checkpoint:

- assess whether module interfaces remain deep;
- remove duplication through refactoring only after the red-to-green cycle is complete;
- verify tests still observe public behavior rather than implementation structure;
- reconsider the next tracer bullet using the working product; and
- record any new hard-to-reverse architectural decision as an ADR.

The plan is complete when the accepted V1 behaviors in [Product decisions](product-decisions.md) are observable through the confirmed seams, not when every listed file, screen, or internal module has a corresponding test.

The V1 release gate also requires a packaged workflow against a real file-backed repository. It must prove repository creation/opening, local-only use without Git, external-edit detection, interrupted-transaction recovery, rollback, and transparent local-save status before release.
