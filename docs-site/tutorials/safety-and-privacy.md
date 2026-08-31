---
title: Safety and privacy
summary: Keep local repository work, provider confirmation, and public documentation boundaries clear.
audience: All Knowledge Workbench users
prerequisites:
  - None; use this guide as a boundary checklist before other tutorials.
nav_order: 11
tracks_main: true
verified_commit: "59f4cc102f03d3f13406ac4d8a2ab31bcb757d55"
reviewed_on: "2026-08-31"
supported_platforms:
  - macOS arm64
supported_packages:
  - source checkout
  - unsigned local macOS arm64 package
repository_states:
  - empty_starter
  - prepopulated_repository
  - synthetic_fixture
adapter_boundary:
  production: not_composed
  fixture: not_used
---

# Safety and privacy

## Goal

Understand the boundaries that keep local Knowledge Repository work available
without Git or an Agent Provider, while making provider-dependent actions
explicit and inspectable.

## Prerequisites

- None.
- Review the [Repository Format](../../docs/architecture/v1-ui/repository-format.md)
  when you need the portable-file rules.

## Steps

1. Use the Workbench locally without assuming Git, GitHub credentials, network
   access, or an Agent Provider is available.
2. Before a Synthesis request, inspect its concise summary and exact payload.
3. Remove whole context items when the request should contain less repository
   material, then inspect the regenerated preview.
4. Confirm only the final request you intend to authorize. Decline or cancel when
   you do not want a provider request to proceed.
5. Treat provider request and response content as transient unless a future
   explicit save workflow says otherwise; do not put prompts, payloads, or
   credentials in repository files or public examples.
6. Keep a user’s private Knowledge Repository separate from this public project,
   its synthetic fixture, and its starter skeleton.

## Expected result

Local reading, repository selection, source review, and other provider-free
workflows remain usable when an Agent Provider is unavailable. The Workbench
does not silently transmit repository content, expose a hidden payload, or make
an unavailable provider look like a successful Synthesis result.

Git, backups, synchronization, and remote sharing remain external user-managed
choices. The public documentation site publishes only its curated allowlist.

## Troubleshooting

- If Synthesis reports `agent-provider-unavailable`, continue with local
  workflows. Do not put an API key in a Knowledge Repository, tutorial, log, or
  source annotation.
- If you are unsure what a request contains, do not confirm it. Return to the
  preview and inspect the exact payload.
- If documentation examples would require private notes, absolute machine
  paths, credentials, or hidden provider payloads, replace them with generic
  examples or defer the workflow.
