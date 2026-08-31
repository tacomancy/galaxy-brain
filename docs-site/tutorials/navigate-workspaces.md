---
title: Navigate among workspaces
summary: Carry repository context among Atlas, Studio, and Paper Desk.
audience: Knowledge Workbench users with an open repository
prerequisites:
  - A valid pre-populated Knowledge Repository or identified synthetic fixture is open.
  - The repository contains a complete topic and Source Record context for Studio or Paper Desk.
nav_order: 5
---

# Navigate among workspaces

## Goal

Know which workspace to use and move through the currently supported context
path without losing the selected topic or Source Record.

## Prerequisites

- A valid Knowledge Repository is open in the Workbench.
- Atlas can show a complete topic context. Studio and Paper Desk require the
  relevant context to be available.
- For the multiple-context path, the repository must contain at least two
  complete topic-to-Source Record contexts. The public synthetic fixture may
  provide this deterministic setup; an empty starter cannot.

## Steps

1. Start in **Atlas** to orient yourself and review the active repository.
2. If more than one complete topic-to-Source Record context is available,
   wait for Atlas to present **Select a Workbench context**. Choose the intended
   candidate and confirm with **Use this context**. The Workbench does not
   silently continue with the first filesystem entry.
3. When Atlas presents the selected topic context, choose **Open in Studio**.
4. In **Studio**, review the topic and its related Source Record.
5. Choose **Open Source Record in Paper Desk** to move into source-first reading.
6. In **Paper Desk**, review the Source Record, source preview, reading position,
   and any saved source annotation that is available.
7. Use the **Workspaces** switcher to return to Atlas or move between contextual
   workspaces. Studio and Paper Desk remain unavailable when the required
   context is missing.
8. Close and relaunch the Workbench. Verify that Atlas restores the same topic
   and Source Record identities when that exact pair is still available. If it
   is unavailable, choose again from the remaining candidates instead of
   accepting a substitute.

## Expected result

Atlas, Studio, and Paper Desk retain the selected repository context as you move
through the supported workflow:

- **Atlas** provides orientation and continuation.
- **Studio** presents the selected topic and its related Source Record.
- **Paper Desk** presents source-first reading and saved annotation context.

The selected topic and Source Record identities are restored on relaunch when
that exact pair is still available. If it is no longer available, Atlas shows
the remaining complete candidates for a new explicit choice; it does not
substitute another context.

The current Paper Desk surface can display saved annotations, but it does not
provide a complete end-to-end annotation-capture workflow. Do not interpret
this guide as documenting capture, Governance, or Synthesis.

## Troubleshooting

- If Studio or Paper Desk is disabled, return to Atlas and select a complete
  context first.
- If a context transition fails, the Workbench preserves the current workspace
  and context so a failed operation is not mistaken for success.
- For the canonical ownership of workspaces and context, consult the
  [V1 architecture](../../docs/architecture/v1-ui/README.md).
