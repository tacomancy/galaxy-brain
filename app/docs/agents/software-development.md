# Software development conventions

Use this guide when changing production code, dependencies, build configuration, packaging, or continuous integration. TDD behavior belongs to [code.md](code.md); Workbench slice execution belongs to [workbench.md](workbench.md); live Module locations belong to the [code map](../architecture/v1-ui/code-map.md).

## Foundation

The accepted V1 foundation is defined by [ADR 0004](../adr/0004-use-electron-typescript-for-v1.md): Electron, React, strict TypeScript, Electron Forge with Webpack, npm, Vitest, WebdriverIO, ESLint, and Prettier.

Configuration files and `package.json` scripts are the mechanical source of truth once they exist. Keep rationale and conventions here; keep versions, flags, file patterns, and command composition in the tool that enforces them.

The implementation establishes these package scripts:

- `format` and `format:check` for Prettier;
- `lint` for ESLint flat configuration;
- `typecheck` for `tsc --noEmit`;
- `test` for S2–S5 Vitest behavior and contract tests;
- `test:workflow` for S1 WebdriverIO desktop tests;
- `check` for the complete non-packaging verification gate; and
- `package` for an unsigned local macOS package.

Agents use the package scripts rather than duplicating their underlying flags. Clean installations use `npm ci`, and every dependency change includes the committed `package-lock.json` change.

## Process architecture

- **Main process:** composition root, application lifecycle, privileged Electron operations, selected repository root, production Adapters, and validated IPC handlers.
- **Preload:** a narrow typed bridge from the renderer to operation-specific main-process capabilities. It contains translation and validation wiring, not application rules.
- **Renderer:** React UI Adapters, semantic HTML, styling, and unprivileged interaction state. It has no Node.js, filesystem, raw IPC, or Electron authority.
- **Application Modules:** framework-independent TypeScript behind the Interfaces described by the architecture package. They import neither React nor Electron.
- **Adapters:** concrete implementations at real Seams. The main-process composition root supplies them to application Modules.

Imports follow that direction. Callers import a Module only through its public entry file. Cross-Module imports target another Module's Interface, never its Implementation. Shared code is promoted only after multiple real callers demonstrate common ownership; generic `utils`, `helpers`, and `services` directories are not architectural homes.

## TypeScript and naming

- Enable `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, and `useUnknownInCatchVariables`.
- Treat external input as `unknown` until validated. A justified escape from type safety is narrow, local, and documented at the escape site.
- Represent expected domain outcomes with discriminated unions. Reserve thrown errors for unexpected programming or infrastructure failures.
- Use named exports. A Module's public entry re-exports only its Interface and caller-facing domain types.
- Use `kebab-case` for files and directories, `PascalCase` for React views and exported types, and `camelCase` for functions and values.
- Use the terms in `CONTEXT.md` and the engineering glossary in names. Do not substitute framework vocabulary for domain vocabulary.

## Electron security and repository access

- Load packaged local application content through a controlled custom scheme with a restrictive Content Security Policy.
- Keep renderer sandboxing and context isolation enabled and Node integration disabled.
- Expose small operation-specific methods through `contextBridge`. Never expose `ipcRenderer`, filesystem primitives, arbitrary paths, or a generic command channel.
- Validate every bridge payload and IPC sender in the main process before invoking a Module.
- Canonicalize the user-selected repository root. Production repository Adapters constrain reads and writes to that root and define symlink behavior before enabling writes.
- Keep machine paths, credentials, signing material, and session configuration outside the selected repository.
- Treat repository Markdown, source excerpts, prompts, and rendered HTML as untrusted content. Preserve text without executing embedded scripts or event handlers.

Security-sensitive conventions derive from the official evidence linked in the [stack decision brief](../architecture/v1-ui/stack-research.md). A change that weakens them requires an ADR with an explicit threat analysis.

## Dependencies and external systems

Add a dependency only when it removes demonstrated implementation complexity at the current Tracer Bullet. Record why the platform or standard library is insufficient, verify current official documentation and maintenance, and keep the dependency behind the Module that owns the behavior.

Keep Electron within its supported stable-release window and Node.js on a repository-pinned Active LTS line. Upgrades run the full `check` gate and the relevant packaged-app smoke test. Editor, PDF, index, model, updater, database, state-management, and routing libraries remain unselected until behavior requires them.

Use In-memory Adapters for locally substitutable dependencies and narrow Mock Adapters only at External System Seams. Mock responses are operation-specific; they contain no conditional replica of Workbench logic.

## Errors, diagnostics, and privacy

Translate infrastructure errors once at the owning Adapter or composition root into serializable, caller-meaningful outcomes. Preserve causes for diagnostics without exposing raw stack traces to the renderer.

Logs are structured and originate in the main process for privileged operations. By default they exclude note contents, source excerpts, prompts, credentials, and absolute user paths. A diagnostic mode that includes sensitive material must be explicit, temporary, and clearly disclosed.

## UI and accessibility

Use semantic HTML before adding ARIA. Every action has an accessible name, every workflow is keyboard-operable, focus remains visible and intentional, and animation respects reduced-motion preferences. ESLint accessibility rules and automated checks supplement S1 behavior tests and manual keyboard review; they do not replace them.

React views adapt Interface outcomes into accessible presentation. Domain decisions, repository policy, and proposal eligibility remain in their owning application Modules.

## Documentation and completion

Comments explain invariants, trade-offs, and non-obvious constraints; names and types explain ordinary control flow. Document every exported Interface's invariants, expected outcomes, and error modes next to its public entry.

Update the [code map](../architecture/v1-ui/code-map.md) in the same change that creates, moves, renames, splits, combines, or removes a production Module or Adapter. A production-code change is complete when the applicable Red-to-Green evidence exists, `check` passes, the code map is accurate, and every hard-to-reverse decision is recorded.
