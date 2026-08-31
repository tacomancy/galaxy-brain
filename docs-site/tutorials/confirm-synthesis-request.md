---
title: Confirm, decline, or cancel Synthesis
summary: Make the explicit decision that controls whether a prepared Synthesis request proceeds.
audience: Knowledge Workbench users reviewing an Agentic Capability
prerequisites:
  - A prepared Synthesis preview in Studio.
  - The exact request has been reviewed and is ready for a deliberate decision.
nav_order: 8
---

# Confirm, decline, or cancel Synthesis

## Goal

Understand the three explicit decisions available after reviewing a Synthesis
request.

## Prerequisites

- Follow [Prepare a Synthesis request](prepare-synthesis-request.md).
- Confirm that the displayed destination, model, context, and payload are the
  request you intend to review.

This tutorial requires pre-existing content from a prepared preview; an empty
starter cannot reach it. The current composition has no production Model
Adapter, so a confirmation attempt reports the explicit provider-unavailable
outcome rather than creating a live result.

## Steps

1. Choose **Confirm and send** only when you intend to authorize the displayed
   request.
2. Choose **Decline** when you do not want the prepared request to proceed.
3. Choose **Cancel** when you want to leave the confirmation flow without
   accepting it.
4. Read the outcome shown below the preview.
5. If the Agent Provider is unavailable, keep working locally and return to the
   source or topic workflow; no provider-dependent result is presented as
   successful.

## Expected result

Confirmation is required immediately before a provider-dependent Synthesis
operation. Declining or canceling preserves local Working Material and makes no
provider request. In the current Workbench composition, a configured-provider
success path is not user-facing; a confirm attempt presents the explicit
`agent-provider-unavailable` outcome instead of pretending that a draft was
created.

Synthesis never promotes material directly to Governed Knowledge. A future
configured-provider workflow may save an explicit result, but that workflow is
outside this tutorial slice.

## Troubleshooting

- If the preview has expired, prepare it again before choosing an outcome.
- If the outcome says the Agent Provider is unavailable, continue with local
  reading and Working Material workflows. Do not add credentials to the
  Knowledge Repository or public project.
- If a request outcome is unclear, do not repeat confirmation blindly. Prepare a
  fresh preview and inspect its exact payload first.
