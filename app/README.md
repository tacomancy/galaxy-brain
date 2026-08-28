# Galaxy Brain application project

This directory contains the MIT-licensed Galaxy Brain desktop Knowledge Workbench project. It is the application namespace, not part of a user's portable Knowledge Repository.

- `../docs/`: architecture, ADRs, engineering and agent guidance, proposals, and review records for the application
- `../prototype/`: temporary, disposable GUI explorations
- `templates/knowledge-repository/`: the empty public starter skeleton
- `tests/fixtures/knowledge-repository/`: synthetic test and development data
- current application source, dependencies, build output, and UI assets belong here with the application code

The application may open or create files in a user-selected Knowledge Repository, but application releases and source changes must not require changes to the repository's knowledge files. A packaged release starts without a selected repository; the user explicitly opens an existing repository or creates one from the bundled skeleton. Git operations remain external and optional.

Agent Provider configuration is optional. The Workbench must open and support non-agentic local workflows without an API key or configured provider, while clearly reporting Agentic Capabilities as unavailable. An API key alone does not enable live Synthesis: current `main` does not compose a production Model Adapter. V1 focuses on the OpenAI API, using `OPENAI_API_KEY` from the machine-local `.env` described in [`.env.example`](.env.example); this is not ChatGPT consumer-account login. The real `.env` is excluded from version control and must never be committed. Other providers and model ecosystems are deferred.

## Build and run

The application currently requires Node.js `24.19.0`, as pinned by [`.nvmrc`](.nvmrc).

From the repository root:

```bash
cd app
nvm use
npm ci
```

Start the development application with:

```bash
npm start
```

Create an unsigned local package with:

```bash
npm run package
```

The packaged application is written under `app/out/`. Run the repository verification gate with:

```bash
npm run check
```

Run the local coverage command for [Issue #47](https://github.com/tacomancy/galaxy-brain/issues/47) with:

```bash
npm run test:coverage
```

It measures the explicitly selected production TypeScript/TSX surface, enforces the calibrated global and per-file floors, and emits text, HTML, LCOV, and machine-readable reports. See the [coverage enforcement policy](../docs/architecture/v1-ui/test-strategy.md#coverage-enforcement) for the required boundaries and the distinction between branch and condition coverage.

The packaged desktop workflow test packages the application and launches it through WebdriverIO:

```bash
npm run test:workflow
```

The workflow test currently targets the macOS Electron package and therefore requires macOS as well as the pinned Node.js version. The first-run Workbench does not require an API key or Agent Provider configuration.

For a visible human review of the current transient fixture-backed slice, launch the packaged binary with the explicit review mode:

```bash
open "out/Galaxy Brain-darwin-arm64/Galaxy Brain.app" --args --galaxy-brain-test-mode=review --galaxy-brain-session-state=/tmp/galaxy-brain-tb11-review.json
```

Review mode is local acceptance tooling only. It composes deterministic fixture content after a repository is opened; it does not represent normal product behavior, does not persist authoring drafts, and must not be used as evidence that a normal launch exposes fixture content.

## Dependency security

`package.json` contains narrowly scoped npm overrides for patched transitive build and test dependencies. They address vulnerable archive extraction, temporary-directory, archive parsing, object-merging, serialization, and browser-download paths without downgrading the accepted Electron Forge or WebdriverIO toolchain. Keep the overrides and `package-lock.json` together; after dependency changes, run `npm audit`, `npm audit --omit=dev`, `npm run check`, `npm run package`, and the packaged workflow test. The remaining audit findings are moderate Webpack development-tool findings and are tracked separately from the resolved high and critical advisories.
