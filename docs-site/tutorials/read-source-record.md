---
title: Read a Source Record
summary: Read source-first context and reopen a saved source annotation in Paper Desk.
audience: Knowledge Workbench users reading a source
prerequisites:
  - A valid pre-populated Knowledge Repository or identified synthetic fixture with a complete topic and Source Record context.
nav_order: 6
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

# Read a Source Record

## Goal

Use Paper Desk to keep a Source Record, its source preview, provenance, and
reading position together.

## Prerequisites

- A valid Knowledge Repository is open.
- Atlas can show a complete topic and Source Record context.
- If you want to reopen a saved annotation, the selected Source Record must
  have one available.

The empty starter has no Source Record or saved annotation to read. The current
source preview is supplied by a deterministic fixture Adapter; it is not a
production Adapter, PDF import, rendering, or capture.

## Steps

1. In Atlas, choose the topic context and open it in **Studio**.
2. In Studio, choose **Open Source Record in Paper Desk**.
3. Review the Source Record title and the related topic in Paper Desk.
4. Read the source preview and its displayed page indicator.
5. If a saved source claim is present, review its text, Source Locator,
   attribution, classification, and Working Material state.
6. Choose **Open saved annotation** when you want Paper Desk to restore the
   saved reading position for that annotation.

## Expected result

Paper Desk presents source-first reading context. A saved annotation remains
Working Material and keeps its source identity, logical Source Locator, and
classification visible when reopened.

The current surface uses a deterministic fixture preview. Production PDF
rendering and a complete end-to-end annotation-capture flow are not documented
by this tutorial.

## Troubleshooting

- If Paper Desk is unavailable, return to Atlas and select a complete topic and
  Source Record context first.
- If no saved source claim is available, Paper Desk can still show the Source
  Record and preview, but there is no annotation to reopen.
- If the source preview is unavailable, preserve the Source Record and its
  locators and follow the recovery information shown by the Workbench. Do not
  treat an unavailable preview as verified source content.
