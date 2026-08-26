---
status: accepted
---

# Use one pinned OpenAI model for V1

V1 Agentic Capabilities use one internally selected, pinned OpenAI model version. The exact model is chosen when the provider-enabled implementation slice establishes its behavior and quality requirements. V1 does not expose a model picker, dynamically discover available models, or switch models as part of ordinary use. Other providers and model ecosystems remain future work.

## Rationale

A stable model target keeps the first Agentic Capability behavior, tests, cost assumptions, and user expectations understandable. It also preserves the option to change the internal model deliberately through a later reviewed decision rather than making model availability an implicit part of every user workflow.

## Considered alternatives

- **Expose a user-facing model picker in V1:** deferred because it adds configuration, comparison, failure, documentation, and support complexity before the OpenAI workflow is proven.
- **Dynamically discover and select models:** deferred because model availability and behavior would vary across accounts and time, weakening reproducibility and complicating tests.
- **Support multiple providers and model ecosystems in V1:** deferred because it expands the external Adapter and capability contract before the first OpenAI boundary is established.
- **Use one internally selected, pinned OpenAI model version:** accepted because it provides a stable V1 target while keeping the provider seam replaceable.

## Consequences

The model identifier is internal V1 configuration, not a Repository Format setting or user-facing requirement. The provider Adapter and Agentic Capability tests must record the chosen pinned model version. Changing it requires deliberate compatibility and evaluation work. Future dynamic model selection must define availability, cost, capability differences, fallback behavior, and reproducibility before entering the product surface.
