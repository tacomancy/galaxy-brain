# Tracer Bullet 2: Create or open a local Knowledge Repository

Status: accepted on August 27, 2026.

This brief coordinates the next tracer bullet in the [delivery plan](delivery-plan.md#2-create-or-open-a-local-knowledge-repository). It is an implementation entry point, not a second authority for product behavior, architecture, repository format, or testing.

## Scope

Starting from a fresh Workbench with no selected repository, a person can explicitly open an existing valid Knowledge Repository or create one from the bundled empty starter skeleton at a new or explicitly empty path. The Workbench selects the repository only after successful validation. A failed operation preserves the existing selection or fresh empty state.

The slice establishes the first real local file lifecycle while keeping Git, Git LFS, GitHub, credentials, Agent Provider configuration, and network connectivity outside the Workbench boundary. It does not implement session resume, repository discovery, migration, substantive knowledge workflows, or later transaction-recovery breadth.

## Authoritative decisions

The following documents are authoritative and must be updated at their owning boundary when this slice reveals a new requirement:

- [Product Decisions](product-decisions.md) owns user-visible scope, local-only behavior, and non-goals.
- [Architecture](architecture.md#workbench-session-module) owns Workbench Session, selection state, caller-facing outcomes, and module ownership.
- [Repository Format](repository-format.md) owns the manifest, canonical roots, compatibility, path safety, symlink behavior, and filesystem transaction contract.
- [Test Strategy](test-strategy.md#s1--desktop-workflow-seam) owns S1/S5 observation points, acceptance coverage, fixtures, harness boundaries, and manual evidence.
- [Delivery Plan](delivery-plan.md#2-create-or-open-a-local-knowledge-repository) owns the implementation order and delivery sequencing.

The existing [code map](code-map.md) remains the source for live and planned production locations.

## Implementation checklist

1. Execute the four behavior cycles in the [delivery plan](delivery-plan.md#2-create-or-open-a-local-knowledge-repository).
2. Implement the production path through the confirmed S1 seam and file-backed Adapter described by [Architecture](architecture.md) and [Test Strategy](test-strategy.md).
3. Keep the public starter skeleton separate from the synthetic fixture, and maintain the checked-in starter inventory required by [Test Strategy](test-strategy.md#s1--desktop-workflow-seam).
4. Complete the S1, S5, manual, code-map, and user-acceptance gates defined by [Test Strategy](test-strategy.md#s1--desktop-workflow-seam) and the [delivery plan](delivery-plan.md#2-create-or-open-a-local-knowledge-repository).

Tracer Bullet 2 is accepted only when those owning documents' requirements are met and the user has reviewed the running behavior. The completion record belongs in the delivery plan; this brief should then retain its scope and change to accepted status.
