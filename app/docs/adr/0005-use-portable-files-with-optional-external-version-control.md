---
status: accepted
---

# Use portable files with optional external version control

The Knowledge Repository is a VCS-neutral collection of portable files. Galaxy Brain reads and writes those files locally without requiring or invoking Git, Git LFS, GitHub, remotes, credentials, or network connectivity. Users may manage Git operations externally for history, synchronization, and backups.

## Considered options

- **App-managed Git integration:** rejected because local use must not depend on Git installation, authentication, remotes, or the app's interpretation of external version-control state.
- **Application-private database:** rejected because it would couple knowledge durability and readability to one implementation.
- **Portable files with optional external version control:** accepted because it preserves local usability and interoperability while allowing users to choose their own version-control workflow.

## Consequences

The file-backed repository Adapter owns safe filesystem transactions, exact-version fingerprints, audit records, rollback history, and external-edit detection. Git and Git LFS may be configured by the user, but commit status never determines knowledge authority and Galaxy Brain never performs Git operations.
