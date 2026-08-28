# Production complexity policy

Status: initial pull-request gate implemented on August 28, 2026. The GitHub branch-protection requirement remains a manual repository-admin step.

## Scope and command

The initial gate covers authored production TypeScript and TSX under `app/src`. It does not cover tests, fixtures, generated bundles, installed dependencies, or packaging output.

Run the gate locally from `app/` with:

```text
npm run lint:complexity
```

The command uses the repository ESLint 9 flat configuration and enforces:

- ESLint core `complexity`, `variant: "classic"`, with `max: 15`.
- `sonarjs/cognitive-complexity` with a maximum of `15`.

Only the SonarJS cognitive-complexity rule is enabled. The plugin recommended bundle is intentionally not enabled.

## Baseline and calibration

The baseline was measured against the `origin/main` checkout before enabling the hard gate. With a temporary cyclomatic limit of 20, four production functions exceeded the limit:

| Function                    | File                                                                           | Cyclomatic complexity |
| --------------------------- | ------------------------------------------------------------------------------ | --------------------: |
| `stripYamlComment`          | `app/src/adapters/knowledge-repository/file-backed-knowledge-repository.ts`    |                    21 |
| `createAt`                  | `app/src/adapters/knowledge-repository/file-backed-knowledge-repository.ts`    |                    28 |
| `isSynthesisSavedResult`    | `app/src/adapters/working-material/file-backed-synthesis-result-repository.ts` |                    46 |
| `restoreSelectedRepository` | `app/src/modules/workbench-session/index.ts`                                   |                    28 |

With a temporary cognitive-complexity limit of 15, nine production functions exceeded the limit. The measured values were 24 for `stripYamlComment`, 26 for `createAt`, 16 for `openAt`, 21 for `isSynthesisSavedResult`, 16 for `saveSynthesisResult`, 24 for `restoreSelectedRepository`, 17 for `transitionToWorkspace`, 17 for `Atlas`, and 34 for `Studio`.

The initial limit of 15 is the upper end of the issue's calibration candidates. Existing violations were reduced through focused helper extraction and component decomposition while preserving repository safety, transaction recovery, Synthesis provenance, session restoration, and packaged UI behavior. No production exceptions remain at the initial limits.

## Verification evidence

- A clean Node.js `24.19.0` `npm ci` succeeds.
- `npm run lint:complexity` passes at the configured limits.
- Temporarily tightening the cyclomatic limit to 14 reports six over-limit functions; temporarily tightening the cognitive limit to 14 reports one over-limit function. Both runs identify file and line diagnostics and exit non-zero.
- `npm run check` passes formatting, ESLint, strict type checking, and 42 Vitest tests.
- `npm run test:workflow` passes all 21 packaged WebdriverIO specs.

Complexity is a review signal and complements, rather than replaces, behavior tests, accessibility review, security checks, and human design review. Future threshold changes should be based on a fresh measured baseline and recorded with the reason for the change.
