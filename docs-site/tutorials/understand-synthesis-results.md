---
title: Understand saved Synthesis results
summary: Read saved Synthesis Working Material and restore an available prior version.
audience: Knowledge Workbench users reviewing saved agent results
prerequisites:
  - A valid Knowledge Repository with a saved Synthesis result.
  - A topic context that can be opened in Studio.
nav_order: 9
---

# Understand saved Synthesis results

## Goal

Review the provenance and Working Material status of a saved Synthesis result,
then restore an available earlier version without contacting the provider.

## Prerequisites

- Open the Knowledge Repository containing the saved result.
- Open its topic in **Studio**.
- A result with a prior version is required to exercise restoration.

## Steps

1. In Studio, find **Synthesis results**.
2. Read the result title and text, then confirm that its state is **Working
   Material**.
3. Review its attribution, provider, model, generation timestamp, source
   context, and version.
4. If an earlier version is listed, choose **Restore version _n_**.
5. Read the restore outcome and review the refreshed result history.

## Expected result

Studio presents saved results as Working Material rather than Governed
Knowledge. Agent-generated attribution and source-context provenance remain
visible. Restoring an earlier version creates a new current version, preserves
the intervening history, and does not make a provider request.

The current UI does not expose explicit save, regeneration, context refresh, or
human-edit controls. Those workflows remain outside this tutorial.

## Troubleshooting

- If no results appear, the selected repository may not contain an explicitly
  saved result. Return to local source and topic workflows rather than treating
  an empty list as a failed read.
- If saved results are unavailable, keep the visible error and retry the read
  later. Do not infer that the result was deleted or recreate it automatically.
- If a restore fails, the visible history should remain unchanged. Choose only a
  listed prior version and retry after the result is readable.
