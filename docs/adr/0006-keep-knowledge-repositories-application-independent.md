---
status: accepted
---

# Keep Knowledge Repositories application-independent

Knowledge Repositories conform to a documented, versioned Galaxy Brain Repository Format and live outside the installed Workbench. Application code, dependencies, caches, indexes, credentials, Agent Provider configuration, session state, and linked-local paths are not part of that format. A Workbench update must continue using the same repository without changing it merely by opening it.

## Considered options

- **Knowledge files inside the application installation or source tree:** rejected because application updates, rebuilds, and uninstallers could affect user knowledge.
- **Implicit migration during application launch:** rejected because it would make updating the Workbench an unreviewed knowledge mutation.
- **Independent portable repository:** accepted because it permits a private sibling repository, public synthetic fixtures, and application-independent recovery.

## Consequences

The Workbench validates the format before writes, preserves unknown content, and uses read-only or unsupported outcomes when safe writing is impossible. Format migrations are separate, previewed, explicitly confirmed, recoverable operations. A new repository can be scaffolded from the bundled skeleton without initializing Git.
