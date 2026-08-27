# Tracer Bullet 4: Carry context between workspaces

Status: implementation complete and accepted on August 27, 2026.

This brief coordinates this tracer bullet in the [delivery plan](delivery-plan.md#4-carry-context-between-workspaces). It is an implementation entry point, not a second authority for product behavior, architecture, or testing.

## Scope

From an explicitly selected fixture Knowledge Repository, a person can follow a meaningful item from Atlas into Studio and then follow that item's associated Source Record into Paper Desk. Each contextual transition preserves the topic relationship and makes the destination context visible. A compact global workspace switcher is added only to the extent this flow needs it.

This slice proves in-session continuity. It does not claim that the active workspace, Working Set, reading position, or contextual navigation is restored across relaunch; those are separate behaviors that require their own independently observable cycles.

The slice remains provider-free and local. It does not add authoring semantics, PDF rendering, Structured Annotation capture, Synthesis, Governance, Search, Ask, Jump, or repository discovery.

## Authoritative decisions

The following documents own the behavior and must be updated at their owning boundary if this slice reveals a new requirement:

- [Product Decisions](product-decisions.md) owns the three-workspace product shape, contextual transitions, the global switcher, and scope boundaries.
- [Architecture](architecture.md#workbench-session-module) owns Workbench Session, navigation, context, state ownership, and dependency direction.
- [ADR 0001](../../adr/0001-use-task-specific-workspaces.md) owns the decision to use task-specific workspaces with contextual transitions.
- [Test Strategy](test-strategy.md#s1--desktop-workflow-seam) owns the S1 observation point and cross-workspace acceptance coverage.
- [Delivery Plan](delivery-plan.md#4-carry-context-between-workspaces) owns implementation order and delivery sequencing.

The existing [code map](code-map.md) remains the source for live and planned production locations.

## Public behavior

Given the fixed fixture topic and its associated Source Record:

1. Atlas presents the topic as a meaningful item with a visible action to continue in Studio.
2. Activating that action opens Studio with the same topic identity and relationship visible; the destination does not become an unrelated blank workspace.
3. Studio presents the associated Source Record as a contextual destination.
4. Activating that destination opens Paper Desk with the same Source Record identity and the originating topic relationship visible.
5. The compact global switcher, if needed by the flow, remains available across these workspaces and does not clear the current context when used.

The exact fixture labels and independently expected identifiers must be named in the behavior test before implementation. Assertions should use visible workspace names, topic identity, Source Record identity, and relationship text or accessible names—not renderer state, route serialization, or repository storage.

## Test Seam and fixture

Use S1, the packaged desktop workflow, through the real Electron main process, preload bridge, Workbench Session, and Atlas, Studio, and Paper Desk UI Adapters. Do not mock Workbench-owned Modules to make a workspace test convenient.

The fixture supplies one known topic and one associated Source Record with stable human-readable identifiers. The expected values are written independently of the implementation:

- Atlas starts in the selected fixture repository and shows the known topic as the continuation item.
- Studio shows that exact topic as the active contextual item.
- Paper Desk shows that exact Source Record and the topic relationship that led there.
- No transition silently substitutes a different topic, Source Record, repository, or workspace.

Use the existing local file-backed repository/session setup from TB2 and TB3 where durable repository selection is required. Do not add a PDF engine or source-processing Adapter merely to display the Source Record relationship; those behaviors belong to later tracer bullets.

## Implementation plan

Run one Red-to-Green cycle per behavior, stopping at Green before refactoring or selecting the next cycle:

1. **Atlas to Studio:** expose the fixture continuation item and prove that its contextual action reaches Studio with the topic identity preserved.
2. **Studio to Paper Desk:** expose the associated Source Record action and prove that Paper Desk receives both the Source Record identity and the originating topic relationship.
3. **Global switcher support:** if the first two cycles need it, add the smallest labeled switcher that moves among Atlas, Studio, and Paper Desk without discarding the active context.

The minimum vertical path should extend Workbench Session's context-transition Interface and compose the three UI Adapters around shared session state. Keep route details, view models, and presentation-specific context encoding inside the renderer/application implementation. Add preload or main-process bridge operations only when a real privileged boundary requires them.

Do not persist new launch-resume state in this slice. In-memory context transfer is sufficient for the acceptance behavior; persistence of active workspace or broader Working Set state remains a later behavior decision.

## Acceptance gate

Tracer Bullet 4 is complete only when:

- the packaged S1 workflow starts from the selected fixture repository and visibly completes Atlas → Studio → Paper Desk;
- the known topic identity remains visible in Studio and its relationship remains visible in Paper Desk alongside the known Source Record;
- the flow uses the real Workbench Session and UI Adapters without mocks of Workbench-owned Modules;
- the relevant contract and full verification suites are green, and the user reviews the running behavior;
- the compact global switcher, if implemented, is limited to this flow and preserves context; and
- no later tracer bullet is implemented speculatively and no new Test Seam or hard-to-reverse architectural decision is introduced without the required confirmation.

The implementation completion record is recorded in the [delivery plan](delivery-plan.md#tracer-bullet-4-implementation-completion-record--august-27-2026). The user reviewed the running behavior and accepted the acceptance gate on August 27, 2026.
