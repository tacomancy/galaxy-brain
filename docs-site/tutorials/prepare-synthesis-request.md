---
title: Prepare a Synthesis request
summary: Inspect selected source claims and the exact request before confirmation.
audience: Knowledge Workbench users reviewing an Agentic Capability
prerequisites:
  - A valid pre-populated Knowledge Repository or identified synthetic fixture with a selected topic and saved source claim.
  - An understanding that Synthesis is an explicit action, not an automatic consequence of capture.
nav_order: 7
---

# Prepare a Synthesis request

## Goal

Review which source claims a Synthesis request will use before any Agent
Provider request is considered.

## Prerequisites

- Open a Knowledge Repository with a topic and saved source claim.
- Open that topic in **Studio**.
- Read the [safety and privacy guidance](safety-and-privacy.md) before sending
  any agentic request.

The empty starter cannot satisfy this prerequisite because it contains no
saved source claim. A fixture-backed source claim is suitable for deterministic
review, but it does not represent production authoring, PDF capture, or a live
provider.

## Steps

1. In Studio, find **Synthesize into topic**.
2. Leave **Include all saved claims for this Source Record** unchecked when you
   want to review only the current selected claim. Select it when all saved
   claims for that Source Record should be included.
3. Choose **Review Synthesis request**.
4. Read the summary, destination, model, selected context count, and estimated
   request size.
5. Expand **Inspect exact payload** and review the complete request data,
   including the target topic and each selected context item.
6. To remove a whole context item, choose **Remove context item** next to it.
   Review the regenerated summary, count, estimate, and exact payload.

## Expected result

Studio shows a preview that identifies the Agent Provider destination and model,
the selected source claims, and the exact payload. Removing context changes the
preview before confirmation. Preparing or editing the preview does not itself
send a provider request.

## Troubleshooting

- If the Synthesis controls are not present, select a topic context with a
  saved source claim first.
- If removing the final context item makes the request invalid, prepare it again
  with valid evidence or a supported prompt when that input is available.
- If the preview is no longer available, prepare the request again. Do not use
  an old confirmation surface as evidence of the current payload.
