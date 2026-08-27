---
status: accepted
---

# Keep Governed Knowledge editable through governed evolution

Governed Knowledge is authoritative but not read-only. A person can open an existing item into a Working Material draft, edit it at their own pace, create a human-authored or agent-assisted Proposal, and apply a replacement only after exact-version review and explicit Judgment. Each applied replacement creates a new governed version, preserves the prior version for history and rollback, and records an immutable audit trail.

## Rationale

Knowledge earns authority through review, not permanent closure. Corrections, refinements, retractions, new evidence, and changed understanding are ordinary parts of a human-owned knowledge system. The review boundary must prevent unexamined edits from becoming authoritative, while the product must still support deliberate evolution without an Agent Provider.

## Considered alternatives

- **Freeze Governed Knowledge after promotion:** rejected because accepted knowledge can require correction, refinement, retraction, or improvement.
- **Allow direct edits to the current governed version:** rejected because they bypass exact-version review, provenance, audit, and rollback safeguards.
- **Require an Agent Provider to revise knowledge:** rejected because governance and knowledge evolution must remain available offline and provider-free.
- **Create reviewed replacement versions from editable Working Material:** accepted because it preserves human control, auditability, reversibility, and ongoing evolution.

## Consequences

Knowledge Authoring must open governed items as drafts without mutating the current version. Governance must support manually authored Proposals as well as optional agent assistance. Tests must prove that the current version remains authoritative until application, the new version becomes current only after eligible Judgment, and prior versions remain retrievable.
