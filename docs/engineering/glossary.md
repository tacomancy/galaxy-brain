# Engineering glossary

This glossary defines the vocabulary used to design, test, review, and maintain the Galaxy Brain codebase. It is deliberately separate from the [product-domain glossary](../../CONTEXT.md) and the [knowledge-base glossary](../../knowledge/registries/glossary.yaml). Engineering terms must not be added to either of those glossaries merely because the implementation uses them.

## Codebase design

**Module**:
Anything with an Interface and an Implementation, at any scale from a function to a tier-spanning slice.
_Avoid_: Unit, component, service

**Interface**:
Everything a caller must know to use a Module correctly, including operations, invariants, ordering constraints, error modes, configuration, and relevant performance characteristics.
_Avoid_: API, signature

**Implementation**:
The code and internal design hidden inside a Module's Interface.

**Depth**:
The leverage a Module provides through its Interface. A deep Module hides substantial behavior behind a small Interface; a shallow Module makes callers learn nearly as much complexity as it contains.

**Seam**:
The location where a Module's Interface lives and behavior can be changed without editing its callers.
_Avoid_: Boundary

**Adapter**:
A concrete implementation that satisfies an Interface at a Seam. “Adapter” describes the role a thing fills, not its size or internal technology.

**Leverage**:
The capability callers gain for each concept they must learn at an Interface.

**Locality**:
The concentration of related behavior, change, defects, and verification in one maintainable place.

**External System Seam**:
A Seam between Galaxy Brain and a dependency it does not control, such as a model provider or PDF engine. Tests may use a narrow mock Adapter at this Seam.
_Avoid_: System boundary

## Testing

**Public Behavior**:
An outcome meaningful to a caller or user and observable through a Module's Interface without inspecting its Implementation.

**Behavior Test**:
A test that specifies Public Behavior through an Interface and remains valid when the Implementation is refactored without changing that behavior.
_Avoid_: Implementation test, method test

**Test Seam**:
A Seam explicitly selected and confirmed as a place where tests may observe behavior. Not every Interface is a Test Seam.

**Fixture**:
A small, fixed example used to establish known test inputs and independently known outcomes.

**Independent Expected Value**:
An expected result taken from a specification, worked example, or known literal rather than recomputed by the logic under test.

**In-memory Adapter**:
An Adapter that provides a real local implementation without production I/O. Prefer it over a Mock when the dependency is owned and locally substitutable.

**Mock Adapter**:
A narrowly programmed Adapter used only at an External System Seam. It returns operation-specific outcomes and does not reproduce application logic.
_Avoid_: Mocking internal Modules

## Test-driven delivery

**Test-Driven Development**:
A development discipline in which one missing Public Behavior is specified by a failing test before the minimum passing Implementation is written.
_Avoid_: Writing a complete test suite before implementation

**Red**:
The observed state in which the new Behavior Test fails for the expected reason because the behavior does not yet exist.

**Green**:
The observed state in which the new Behavior Test and the relevant existing suite pass after adding the minimum behavior.

**Red-to-Green Cycle**:
One iteration from a single expected failing Behavior Test to the minimum passing Implementation. Refactoring is not part of this cycle.

**Vertical Slice**:
A thin increment that delivers one observable behavior through every layer required to make it real.
_Avoid_: Completing an entire technical layer before delivering behavior

**Tracer Bullet**:
A Vertical Slice chosen to test an architectural path and teach what the next slice should be. It is working behavior, not a disposable skeleton.

**Refactoring**:
Changing an Implementation's structure without changing its Public Behavior. In this project it occurs during review while the suite remains Green, outside the Red-to-Green Cycle.

**Review Stage**:
The Green phase between Red-to-Green Cycles in which the implementation and tests are reviewed, refactoring may occur, and the next Tracer Bullet is selected.
