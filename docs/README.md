# Galaxy Brain project documentation

This directory contains documentation about the Galaxy Brain project and its desktop Knowledge Workbench. It is not part of the knowledge base.

Use it for architecture, ADRs, engineering and agent guidance, application design proposals under `docs/proposals/`, review records under `docs/reviews/`, and other durable project documentation. Knowledge-base content belongs under the selected repository's `assets/`, `knowledge/`, `projects/`, `proposals/`, `scratch/`, `sources/`, or `templates/` roots according to its role and lifecycle. The public project contains only the synthetic fixture under `app/tests/fixtures/knowledge-repository/` and starter skeleton under `app/templates/knowledge-repository/`.

The application may read or write a user-selected Knowledge Repository, but project documentation must not become repository content merely because the public project contains fixtures and a starter skeleton.

## Documentation authority

Keep each statement in the narrowest document that owns it. Other documents should summarize and link rather than create competing versions:

- **Product Decisions** own user-visible V1 scope and behavior.
- **Architecture** owns Module responsibilities, Interfaces, Seams, state ownership, and invariants.
- **Repository Format** owns the portable Knowledge Repository contract.
- **Test Strategy** owns the confirmed observation points and verification obligations.
- **Delivery Plan** owns implementation order and tracer-bullet sequencing.
- **ADRs** own hard-to-reverse architectural trade-offs and their consequences.
- **Agent guidance** owns collaboration and execution rules, and points back to the applicable authority above.

The [grilling ledger](reviews/v1-document-grilling-review-ledger.md) indexes concerns and records their disposition; it does not override the document that owns a decision.
