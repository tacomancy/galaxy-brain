# Domain Docs

How the engineering skills should consume this repository's domain documentation.

## Before exploring, read these

- `CONTEXT.md` at the repository root.
- Relevant ADRs under `docs/adr/`.

If these files do not exist, proceed silently. The `domain-modeling` skill creates them lazily when terminology or decisions are resolved.

## File structure

This is a single-context repository:

    /
    ├── CONTEXT.md
    ├── app/
    │   ├── docs/adr/
    │   │   ├── 0001-example-decision.md
    │   │   └── 0002-another-decision.md
    │   ├── src/
    │   ├── templates/knowledge-repository/
    │   └── tests/fixtures/knowledge-repository/
    └── <selected-private-repository>/

## Use the glossary's vocabulary

When output names a domain concept—in an issue title, refactor proposal, hypothesis, or test name—use the term defined in `CONTEXT.md`. Do not drift to synonyms the glossary explicitly avoids.

If the required concept is absent, reconsider whether the project uses that language or note the gap for `domain-modeling`.

## Flag ADR conflicts

If output contradicts an existing ADR, surface the conflict explicitly rather than silently overriding it.
