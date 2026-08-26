---
status: accepted
---

# Keep Agent Provider configuration optional

Galaxy Brain must remain usable without an API key or configured Agent Provider. Local repository, reading, editing, source, annotation, and governance workflows are first-class capabilities. Agentic Capabilities are optional V1 capabilities: they return a clear unavailable outcome until a provider is configured, while the app does not block startup or require a credential prompt.

## Considered options

- **Require provider configuration at startup:** rejected because it makes unrelated local Workbench behavior depend on an external service and prevents offline or provider-free use.
- **Silently omit agentic features:** rejected because users need to understand why an Agentic Capability is unavailable and how it could be enabled.
- **Optional provider with explicit unavailable outcomes:** accepted because it preserves local utility while making the capability boundary legible.

## Consequences

For V1, the Agent Provider is the OpenAI API, configured through `OPENAI_API_KEY` in a machine-local `.env` file located in the Workbench's application configuration directory. The committed [`app/.env.example`](../../.env.example) documents the required variable and setup steps; repository ignore rules exclude `.env` itself from version control. This means OpenAI API access, not ChatGPT consumer-account login or ChatGPT OAuth. The app reads only recognized variables, never writes their values to the Repository Format, repository audit records, logs, proposals, or ordinary knowledge content, and never requires the file for provider-free local use. Support for other providers and model ecosystems, OS-backed credential storage, and provider-native OAuth are deferred.

Each provider-dependent operation uses the shared `agent-provider-unavailable` outcome when the `.env` file or required variables are absent; no blank, partial, or apparently successful result is substituted. Provider-independent operations remain usable, and S1/S3/S4/release tests must prove both the unavailable outcome and continued local work. Provider choice may remain deferred until the Agentic Capability slice needs it; that deferral does not make local V1 use incomplete.

The `.env` approach is a deliberate V1 compromise: it avoids requiring a Galaxy Brain account, hosted credential broker, OAuth redirect flow, or platform-specific secure-storage integration while the OpenAI integration is being developed. It is not treated as strong secret storage. The packaged-app documentation must warn users not to commit or share the file, and future secure storage must preserve the same optional-provider boundary.
