---
status: accepted
---

# Use Electron and TypeScript for the V1 desktop foundation

V1 will support macOS while preserving a credible Windows and Linux path, and it will open an arbitrary user-selected Galaxy Brain repository. Use Electron with a React and strict-TypeScript renderer, Electron Forge's Webpack TypeScript integration, npm, Vitest for S2–S5, and WebdriverIO with the Electron service for S1. This keeps the initial UI, application Modules, repository Adapter, and test Adapters in one language and gives S1 a real compiled-desktop automation path. The evidence and version-sensitive details are preserved in the [stack decision brief](../architecture/v1-ui/stack-research.md).

## Considered options

- **Tauri 2:** credible, cross-platform, smaller, and more restrictive by default, with current macOS WebdriverIO support. Rejected for V1 because it adds Rust, a second build graph, and operating-system WebView variation before those costs solve an accepted requirement.
- **Browser or PWA:** rejected as the production shell because repository permissions, reopening, monitoring, desktop distribution, and S1 evidence would become browser-dependent Interfaces.
- **Electron with Forge Vite:** rejected initially because Forge labels its Vite integration experimental and permits breaking changes in minor releases. The stable Webpack TypeScript path is preferred for the foundation.

## Consequences

The renderer remains sandboxed and unprivileged. A narrow preload Adapter exposes operation-specific desktop capabilities; the main process validates every privileged request and owns the selected repository root. Electron, Chromium, Node.js, signing, and notarization become ongoing security and release responsibilities. Editor, PDF, index, model, updater, and native-database choices remain deferred until a Tracer Bullet reaches them.
