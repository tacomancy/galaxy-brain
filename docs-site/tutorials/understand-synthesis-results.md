---
title: Understand saved Synthesis results
summary: Read saved Synthesis Working Material and restore an available prior version.
audience: Knowledge Workbench users reviewing saved agent results
prerequisites:
  - A valid pre-populated Knowledge Repository or identified synthetic fixture with a saved Synthesis result.
  - A topic context that can be opened in Studio.
nav_order: 9
tracks_main: true
verified_commit: "59f4cc102f03d3f13406ac4d8a2ab31bcb757d55"
reviewed_on: "2026-08-31"
supported_platforms:
  - macOS arm64
supported_packages:
  - source checkout
  - unsigned local macOS arm64 package
repository_states:
  - prepopulated_repository
  - synthetic_fixture
adapter_boundary:
  production: not_composed
  fixture: used
---

# Understand saved Synthesis results

## Goal

Review the provenance and Working Material status of a saved Synthesis result,
then restore an available earlier version without contacting the provider.

## Prerequisites

- Open the Knowledge Repository containing the saved result.
- Open its topic in **Studio**.
- A result with a prior version is required to exercise restoration.

The empty starter has no saved result or prior version. This workflow depends on
pre-existing fixture-backed or user-saved content; it does not add an authoring
flow or imply that a provider request can create a result in the current UI.

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
