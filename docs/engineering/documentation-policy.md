# Code documentation policy

This policy defines the minimum documentation needed for a human maintainer to
understand public code contracts and deliberately complex or risky boundaries.
It is a structural review aid, not a substitute for human judgment about
whether an explanation is accurate, current, and useful.

## Scope

The automated check covers authored production TypeScript and TSX under
`app/src`. Tests, fixtures, generated bundles, dependencies, and packaging
output are outside this initial gate. Run both commands from `app/`:

```text
npm run test:docs
npm run docs:check
```

`test:docs` runs positive and negative fixtures for each enforced category.
`docs:check` scans the production source and prints actionable file-and-line
diagnostics. The pull-request `Documentation quality` job runs both commands
for every pull request targeting `main`; the broader `npm run check` gate runs
the same documentation checks after the application tests.

## Public contracts

Every exported declaration in production source must have an adjacent JSDoc
description. This includes exported functions, classes, interfaces, type
aliases, enums, constants, Module Interfaces, and Adapter entry points.

Function-like exported declarations must also document:

- each parameter with an `@param` tag; and
- the return value or caller-facing outcome with an `@returns` tag.

The description must contain meaningful prose rather than a placeholder or a
tag-only comment. It should explain purpose, invariants, expected outcomes,
and error modes when those details are part of the Interface. Each `@param`,
`@returns`, and applicable `@throws` tag must contain meaningful prose; a
function with a direct `throw` statement must include an `@throws` tag. The
checker also rejects empty recognized tags and unclosed inline TSDoc tags.
Public interface members should receive focused comments when their
individual behavior is not obvious from the surrounding contract.

## Rationale documentation

Explain the reason, invariant, safety constraint, or trade-off at these
boundaries:

- `any` types and unsafe type assertions;
- `eslint-disable` directives and complexity exceptions;
- filesystem, transaction, rollback, and recovery code;
- Electron IPC and preload bridge code; and
- TODO or FIXME decisions that need an owner or follow-up.

The checker treats `as const` and `as unknown` as narrow containment or
narrowing patterns. Other type assertions require a rationale on the same or
immediately preceding comment lines; an unrelated older comment does not
qualify. Lint suppressions must carry a rationale, and TODO/FIXME comments must
name an owner or include a follow-up issue such as `#48`.

Filesystem and IPC files must contain an explanatory comment identifying the
relevant filesystem, transaction, rollback, recovery, or IPC constraint. The
comment may explain the file-level seam when the invariant is shared by its
operations; comments should be closer to a particular block when different
operations have different safety rules. Transaction, rollback, and recovery
declarations, preload bridge use, and generic network/external-system calls
must likewise have a nearby category-specific rationale unless a precise
file-level seam comment covers the shared invariant. Exported interfaces whose
names end in `Adapter` must identify the external system, boundary, or
translation constraint in their contract description.

## What does not need a comment

Do not add comments that merely narrate ordinary syntax or every line of a
private helper. Straightforward control flow, generated output, dependencies,
and test fixtures do not have a documentation obligation unless they encode a
non-obvious contract. Prefer clear names, types, and structure for ordinary
behavior.

## Human review

The checker can identify missing documentation and a few objective rationale
markers. It cannot determine whether prose is understandable or whether a
comment has become stale. A human reviewer remains responsible for confirming
that:

- the public contract matches the current behavior;
- explanations describe invariants, trade-offs, and safety boundaries rather
  than syntax;
- the documentation is appropriately scoped and not misleading; and
- exceptions and deferred decisions have an owner or a useful follow-up.

The [architecture](../architecture/v1-ui/architecture.md), [test strategy](../architecture/v1-ui/test-strategy.md),
[software development guidance](../agents/software-development.md), and
relevant ADR remain authoritative for the behavior being documented.
