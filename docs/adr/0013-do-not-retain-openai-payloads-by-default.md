---
status: accepted
---

# Do not retain OpenAI payloads by default

V1 treats OpenAI request and response bodies as transient sensitive data. Galaxy Brain may display an agent result during the current operation, but does not retain the prompt, selected context, or response in automatic history, caches, logs, audit records, or support files. A result is retained only when the user explicitly saves it as Working Material, a Proposal, or another ordinary repository artifact.

## Rationale

The user owns the local Knowledge Repository and must be able to authorize both transmission and retention separately. Automatic transcripts or diagnostic captures would create additional copies of private prompts, source excerpts, and model output without a distinct user decision. A transient result preserves useful interaction while minimizing local duplication and keeping ordinary logs and recovery artifacts safe to inspect.

## Considered alternatives

- **Retain every request and response for history:** rejected because it silently creates a second knowledge store containing sensitive material.
- **Retain payloads in logs or crash diagnostics:** rejected because operational artifacts are broadly accessible and are not an appropriate home for private prompts or source excerpts.
- **Retain payloads behind an opt-in diagnostic mode in V1:** deferred because it needs a separate privacy, redaction, retention, and support workflow.
- **Retain only explicitly saved results:** accepted because it preserves user agency and places durable content under the ordinary Working Material or Governance lifecycle.

## Consequences

The Model Adapter and owning Modules must keep request and response bodies transient unless an explicit save operation transfers a result into an ordinary repository artifact. Minimal non-content operational metadata may support error handling, but must not reconstruct the prompt, selected context, or response. Tests must prove non-retention and explicit-save behavior. Future diagnostic capture requires a new privacy decision.
