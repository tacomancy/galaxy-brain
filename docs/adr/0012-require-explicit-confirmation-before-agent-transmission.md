---
status: accepted
---

# Require explicit confirmation before Agent transmission

Every V1 Agentic Capability request to OpenAI must present a concise summary and an inspectable exact outbound payload and receive explicit user confirmation immediately before the request, even when the request contains only user-entered text and no repository-derived material. The summary identifies the operation, destination, model, prompt, selected sources, content categories, and estimated request size. Users may remove whole context items before approval, after which the summary and exact payload are regenerated; arbitrary inline redaction and payload editing are not V1 behavior. Small requests may show the exact payload expanded by default; large requests may collapse it only while keeping every part available for inspection. The confirmed payload is final, and the Model Adapter may not add context afterward. V1 does not use blanket consent, remembered consent, silent background requests, or whole-repository uploads. A declined or canceled request makes no network call and leaves local knowledge and Working Material unchanged. Configurable confirmation policies are future work.

## Rationale

The Knowledge Repository is private and user-owned, user-entered prompts can also be sensitive, and OpenAI is an external service. The user must be able to understand what leaves the local boundary and authorize each request. A concise summary keeps the decision legible, while an exact expandable payload prevents important content from being hidden. Per-operation confirmation preserves agency, limits accidental disclosure, and keeps the local-first product useful when the user declines or has no provider configured. A fixed V1 rule is easier to explain and test than a configurable policy before the first provider workflow is proven.

## Considered alternatives

- **Send any request without confirmation:** rejected because selection by the UI or an agent does not substitute for the user's authorization to transmit a prompt or private material.
- **Ask once for blanket consent:** rejected because later operations may differ in content, sensitivity, destination context, and consequence.
- **Remember consent for repeated operations:** rejected for V1 because it would turn a visible boundary into an implicit one and could outlive the user's understanding of the selected scope.
- **Permit silent background requests:** rejected because they make network activity and disclosure difficult to observe or interrupt.
- **Upload the whole repository to simplify context selection:** rejected because it violates data minimization and makes private disclosure needlessly broad.
- **Require confirmation only when repository material is present:** rejected for V1 because a user-only prompt can still be sensitive and future context assembly could be misunderstood.
- **Show only a concise summary:** rejected because the user could not inspect the exact text or metadata leaving the local boundary.
- **Show the full payload expanded for every request:** deferred as the default presentation because large requests would be difficult to review and could encourage rubber-stamping; the exact payload remains available before approval.
- **Allow arbitrary inline redaction or payload editing:** deferred because it could invalidate citations, source locators, context relationships, or the meaning of generated results.
- **Allow removal of whole context items before approval:** accepted because it gives the user practical data-minimization control while keeping the final payload structurally understandable and testable.
- **Require explicit per-operation confirmation with a concise summary and expandable exact payload:** accepted because it keeps the decision legible, makes the actual transmission inspectable, and allows focused OpenAI-assisted capabilities.

## Consequences

The owning application Module must prepare both a request summary and exact payload before calling the Model Adapter, and the UI must allow whole context items to be removed and regenerate both views before obtaining positive confirmation for the final operation and payload. The Model Adapter must not select additional repository material behind the user's confirmation or persist request and response bodies. Tests must prove that confirmation precedes every external call, the exact payload is inspectable, item removal changes the payload, arbitrary inline redaction is unavailable, declining makes no call, local state is preserved, and agent content is not retained unless explicitly saved. Future changes to consent duration, automatic assistance, configurable exemptions, additional providers, or sensitive-content handling require a new decision.
