---
status: accepted
---

# Use a machine-local `.env` for V1 provider configuration

The V1 Agent Provider is the OpenAI API. The Workbench reads `OPENAI_API_KEY` from a `.env` file in its machine-local application configuration directory. The committed [`app/.env.example`](../../.env.example) lists the required variable and setup steps without containing a secret. The real `.env` is excluded from version control and never belongs in the selected Knowledge Repository. This integration uses OpenAI API access, not ChatGPT consumer-account login or ChatGPT OAuth; see the [official OpenAI API reference](https://developers.openai.com/api/reference/overview).

The file is optional to the application: local repository, reading, editing, source, annotation, and governance workflows remain available without it. Agentic Capabilities that need a missing variable return `agent-provider-unavailable` and do not block startup or mutate local knowledge.

## Rationale

This gives the first provider-enabled slice one explicit, inspectable setup path without requiring a Galaxy Brain account, hosted credential broker, OAuth redirect flow, or platform-specific secure-storage integration. It keeps provider configuration outside portable knowledge and preserves the provider-free local boundary. Focusing V1 on OpenAI makes the first Adapter and its tests concrete while leaving other providers and model ecosystems replaceable at the external seam. Keeping one pinned model version also avoids making model availability and selection part of every first-run workflow. The approach is a transitional convenience, not a claim that plaintext `.env` files are strong secret storage.

## Considered alternatives

- **Require an API key or provider at startup:** rejected because local Workbench use must remain provider-free.
- **Put `.env` in the selected Knowledge Repository:** rejected because a secret could travel with private content, be committed, or be copied into backups.
- **Put `.env` in the public application source tree:** rejected because it creates an obvious path to accidental publication and is unsuitable for packaged application data.
- **Use Auth0 or another hosted identity service:** deferred because authenticating a Galaxy Brain user does not itself authorize arbitrary model-provider APIs and would add a hosted account and network dependency.
- **Use provider-native OAuth immediately:** deferred until a selected provider and its supported desktop flow are known.
- **Support multiple providers or model ecosystems in V1:** deferred because it would expand the first Agentic Capability slice before the OpenAI boundary and provider-unavailable behavior are proven.
- **Use OS-backed secure storage immediately:** deferred to avoid coupling the first provider slice to platform-specific credential APIs; it remains the preferred future packaged-app experience.
- **Use a machine-local `.env` in the application configuration directory for OpenAI:** accepted for V1 because it is simple, explicit, and compatible with the local-first boundary.

## Consequences

The Workbench must load only recognized variables, never log or echo their values, and report malformed or missing configuration without exposing secrets. Documentation must tell users not to commit or share `.env`. The sample file may be committed; the real file must remain ignored. Future OAuth or OS-backed storage should replace the secret-retention mechanism without changing the optional-provider or provider-unavailable behavior.
