# Issue #23 codebase complexity review

Review date: September 1, 2026
Reviewed revision: `50317c962df0b32efb051191b36b07838f684d6e`
Review branch: `codex/issue-23-codebase-review`
Scope: integrated V1 codebase after TB12–TB14, TB16, Issue #52, and Issue #22

## Conclusion

The completed-codebase review found no new release-blocking behavioral defect,
dependency-direction violation, or complexity-policy exception that requires a
broad rewrite. The existing S1–S5 seams remain usable, application Modules
remain inward-facing, and the current complexity gate is green.

This branch makes documentation-only corrections to the code map. It does not
implement the simplifications below. Each production change remains a separate
focused issue so that behavior can be preserved and verified independently.

## Verification evidence

- `npm run check` passed: formatting, lint, strict type checking, 164 Vitest
  tests, MC/DC checks, and documentation validation.
- `npm run test:coverage` passed at 84.85% statements, 75.47% branches,
  97.23% functions, and 84.70% lines.
- `npm run lint:complexity` passed.
- The packaged workflow passed 35 specs with one intentional skip on this
  revision's exact merged ancestor, including all three Issue #22 workflows and
  all five Issue #52 recovery variants.

## Findings and dispositions

### Tracked focused follow-ups

1. **Source Processing and Synthesis lifecycle breadth — P1 maintainability
   risk.** The Source Processing Interface currently spans capture, preview,
   persistence, freshness, regeneration, restore, and editing concerns, while
   saved result history recursively retains prior versions. The risk is tracked
   by [Issue #70](https://github.com/tacomancy/galaxy-brain/issues/70) for
   lifecycle ownership and [Issue #72](https://github.com/tacomancy/galaxy-brain/issues/72)
   for append-only result history and validation. The current behavior is
   covered and remains in scope until a focused design and acceptance plan is
   approved.

2. **File-backed safety policy duplication — P1 maintainability and security
   risk.** Working Material and Synthesis-result persistence still duplicate
   portions of canonical-root checks, directory validation, fingerprints,
   cleanup, and atomic-write policy even though they share the atomic-write
   primitive. This is tracked by [Issue #69](https://github.com/tacomancy/galaxy-brain/issues/69).

3. **Composition-root Synthesis ownership — P1 state-ownership risk.**
   `app/src/main/index.ts` retains pending previews and reconstructs related
   dependencies in several handlers. This is tracked by [Issue #70](https://github.com/tacomancy/galaxy-brain/issues/70).

4. **Workbench Session and Source Processing coupling — P1 state-ownership
   risk.** The Session Module currently consumes Source Processing types and
   obtains annotations through the Knowledge Repository seam. This is tracked
   by [Issue #71](https://github.com/tacomancy/galaxy-brain/issues/71).

5. **Result-read and regeneration contracts — P2 correctness risk.** Optional
   result reads can look like successful empty collections, malformed nested
   history can carry mismatched identity, and regeneration can preserve
   human-authorship metadata on newly generated agent output. These are tracked
   by [Issue #72](https://github.com/tacomancy/galaxy-brain/issues/72).

6. **Synthesis confirmation recovery — P2 UI-state risk.** Terminal decisions
   can leave preview/send controls visible after the main process discards the
   pending request. This is tracked by [Issue #70](https://github.com/tacomancy/galaxy-brain/issues/70).

### Explicit post-V1 maintenance deferrals

The following findings are real maintenance costs, but are not release
blockers for the accepted V1 behavior. The owner is the V1 maintainers. Revisit
each when the stated change pressure appears; do not introduce a speculative
abstraction solely to reduce a file-size or responsibility metric.

| Finding | Deferral condition | Residual risk |
| --- | --- | --- |
| Renderer shell and Studio orchestration mix presentation with workflow state. | Revisit when a second independent workflow requires the same recovery/state orchestration or when the next renderer workflow changes touch unrelated domains. | A UI change may require edits in the shell and a domain surface together. |
| The Synthesis integration test file is a large lifecycle hotspot. | Split by behavior boundary when the next Synthesis lifecycle change lands, preserving public-seam assertions. | Test navigation and fixture setup remain slower than desired. |
| Packaged fixture composition is close to production composition and hard-codes fixture PDF/model choices. | Revisit before composing a second production-like fixture or live Model Adapter. | Fixture-only assumptions could obscure a composition-boundary regression. |
| `app/src/renderer/styles.css` remains a large global maintenance surface. | Revisit on the next cross-workspace visual-system change or when a component-level style boundary is required. | Unrelated visual changes can remain coupled through global selectors. |

These deferrals do not close Issues #69–#72; those issues retain the tracked
P1/P2 risks above and require their own implementation-ready specifications.

## Review checklist

- Module depth, public Interfaces, dependency direction, state ownership, and
  complexity were reviewed against the architecture and complexity policy.
- The code map now includes the Proposal Review Module and shared atomic-write
  Adapter, and its release status includes TB12 and TB16.
- No new ADR is required: this review records dispositions and makes no
  hard-to-reverse architectural choice.
- The V1 victory checklist and delivery plan link this review. The final V1
  declaration remains blocked on the separate release-level checklist items,
  including explicit disposition/approval of open follow-ups.
