---
status: accepted
---

# Keep Agent Provider configuration optional

Galaxy Brain must remain usable without an API key or configured Agent Provider. Local repository, reading, editing, source, annotation, and governance workflows are first-class capabilities. Agentic Capabilities return a clear unavailable outcome until a provider is configured; the app does not block startup or require a credential prompt.

## Considered options

- **Require provider configuration at startup:** rejected because it makes unrelated local Workbench behavior depend on an external service and prevents offline or provider-free use.
- **Silently omit agentic features:** rejected because users need to understand why an Agentic Capability is unavailable and how it could be enabled.
- **Optional provider with explicit unavailable outcomes:** accepted because it preserves local utility while making the capability boundary legible.

## Consequences

Provider configuration, API keys, endpoints, prompts, and provider-specific state are machine-local and never enter the Repository Format, repository audit records, logs, proposals, or ordinary knowledge content. The model Adapter must represent missing configuration as a normal capability outcome, and S1/S4/release tests must prove that local workflows continue without it.
