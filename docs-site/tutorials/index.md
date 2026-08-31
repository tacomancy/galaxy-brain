---
title: Tutorials
summary: Task-oriented introductions to the current Knowledge Workbench workflows.
audience: New and returning Knowledge Workbench users
prerequisites: []
nav_order: 0
---

# Tutorials

These tutorials introduce the workflows currently visible in the Galaxy Brain
Knowledge Workbench. They describe what a person can do today; they do not
turn planned Interfaces or architecture notes into promises about the product.

## Choose the right starting material

The empty starter is only a portable repository skeleton. You can create it and
open it in the Workbench, but it contains no subject-matter knowledge, saved
Source Record annotations, or Synthesis results, so it cannot exercise
authoring, PDF import/capture, or the other content-dependent tutorials by
itself. Use a pre-populated conforming repository for those workflows. The
public project may also provide a synthetic fixture and fixture Adapter for
deterministic tests or review. The fixture is demonstration data, and the
fixture Adapter is test machinery rather than a production Adapter; neither is
a production repository, import path, or live provider.

The current reproducible launch path is a source checkout or an unsigned local
macOS arm64 package. See [First launch](first-run.md) for the exact build
boundary; this tutorial set does not document an end-user installer or a
downloadable release.

Start with [First launch](first-run.md), then continue with the workflow that
matches your situation:

- [Create a Knowledge Repository](create-knowledge-repository.md)
- [Open a Knowledge Repository](open-knowledge-repository.md)
- [Resume a Workbench session](resume-workbench-session.md)
- [Navigate among workspaces](navigate-workspaces.md)
- [Read a Source Record](read-source-record.md)
- [Prepare a Synthesis request](prepare-synthesis-request.md)
- [Confirm, decline, or cancel Synthesis](confirm-synthesis-request.md)
- [Understand saved Synthesis results](understand-synthesis-results.md)
- [Repository Format overview](repository-format-overview.md)
- [Safety and privacy](safety-and-privacy.md)
- [Troubleshoot common recovery states](troubleshooting.md)

These guides use the canonical terms and boundaries defined in the
[V1 architecture](../../docs/architecture/v1-ui/README.md), the
[Repository Format](../../docs/architecture/v1-ui/repository-format.md), and the
[application documentation](../../app/README.md).
