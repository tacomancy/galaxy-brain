---
status: accepted
---

# Resume explicitly selected repositories

After a user explicitly opens or creates a Knowledge Repository, the Workbench may remember that exact root in machine-local session state and attempt to resume it on a later launch. It must validate the remembered path first and present explicit Open/Create recovery choices when the path is unavailable or invalid. It must never scan for sibling repositories or silently substitute another root.

## Considered options

- **Require repository selection on every launch:** rejected because it adds friction after the user has already made an explicit selection.
- **Discover a repository automatically:** rejected because filesystem scanning and sibling selection can expose or open the wrong private repository.
- **Resume the exact prior selection with validation and fallback:** accepted because it combines convenience with explicit repository ownership and a safe failure path.

## Consequences

The selected root is machine-local session state, not Repository Format content. Workbench Session owns validation and resume behavior. S1 tests must cover first launch, successful resume, and unavailable or invalid remembered paths without filesystem discovery.
