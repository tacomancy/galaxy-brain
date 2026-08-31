# Developer-only release operations runbook

Status: implemented operating boundary for V1 developer-only distribution;
the human owner still needs to complete the release-candidate acceptance
checks in the [V1 release-operations specification](architecture/v1-ui/v1-release-operations-spec.md).

This runbook implements the selected Section D outcome. V1 supports a source
checkout and an unsigned macOS arm64 `.app` for development and controlled
review. It does not publish a signed installer, DMG, ZIP, auto-update path, or
Gatekeeper-accepted end-user package. Issue #25 is explicitly deferred.

## Release candidate checklist

Run from a clean checkout of the exact candidate revision:

1. Confirm the repository is clean and the intended revision is checked out.
2. Use Node.js `24.19.0` and run `npm ci` in `app/`.
3. Run `npm run check` in `app/`.
4. Run `npm run package` in `app/` on macOS arm64.
5. Run `npm run release:manifest` to write the artifact manifest and its
   checksum under `app/out/`.
6. Run `npm run release:verify` and retain the manifest, checksum, and output
   as candidate evidence.
7. Run `npm run test:workflow` or the relevant packaged workflow. Automated
   windows remain silent; visible launch is reserved for human review.
8. Record the version, source revision, architecture, Node.js version,
   lockfile hash, artifact hash, file count/size, verification output, known
   limitations, and human approver.

The manually dispatched [Developer-only release candidate workflow](../.github/workflows/developer-release.yml)
performs the clean-install verification, package build, manifest generation,
manifest verification, and short-lived evidence upload. Its artifact is CI
evidence, not a public download.

## Artifact contract

The release manifest is developer-only and deliberately records:

- application version and exact source commit;
- pinned Node.js version and package-lock hash;
- macOS arm64 target;
- unsigned and non-notarized status;
- the packaged `.app` path, byte count, file count, and content hash.

The verifier hashes the complete application bundle, permits only relative
symlinks that stay inside the bundle, rejects forbidden fixture/test/session
paths, and scans application-owned `Info.plist` and `app.asar` content for
credentials and private-path markers. Electron vendor binaries are hashed but
not content-scanned because their standard macOS sandbox literals are not
Galaxy Brain state. A failed check is a failed candidate.

The package may contain the public starter skeleton and runtime dependencies.
It must not contain a user's Knowledge Repository, synthetic fixture content,
`.env` values, API keys, signing credentials, or machine-local session/link
data.

## Install and first launch

The supported local procedure is:

1. Build and verify the unsigned `.app` from the candidate checkout.
2. Copy the `.app` to a user-controlled local application directory if
   desired; do not represent the copy as a signed or notarized install.
3. Launch it and confirm Atlas opens without a selected repository.
4. Explicitly create a repository in a new/empty directory or open an existing
   valid repository.
5. Confirm the application does not run `git init`, create a commit, scan for
   sibling repositories, or upload local content.

If macOS warns that the unsigned application cannot be opened, use a local
development review procedure approved by the machine owner. Do not weaken or
claim to have passed Gatekeeper; Gatekeeper acceptance is outside this V1
outcome.

## Upgrade and compatibility

Before replacing a local application copy, preserve the user-owned Knowledge
Repository with the user's normal external backup/version-control process.
The application package is replaceable; the repository is not an application
rollback artifact.

For each candidate, open a copy of a representative repository containing
portable knowledge, Working Material, Source Records, and any accepted
persisted artifacts in scope. Confirm the repository format compatibility
result before writing. A newer or unsupported format must be refused or opened
read-only according to the existing Repository Format contract; it must not be
silently rewritten.

The selected V1 support policy covers the latest published release and the
current `main` development line for security reports. Public version metadata,
`SECURITY.md`, release notes, and the release manifest must agree.

## Rollback and recovery

Rollback means returning to a previously built application package. It does
not reverse a user's repository history, restore a backup, or delete newer
portable artifacts.

1. Stop the Workbench.
2. Keep the candidate manifest and failure evidence.
3. Restore the prior verified `.app` using the machine owner's normal file
   replacement procedure.
4. Reopen the isolated repository and verify its portable files and current
   application state.
5. If a repository migration was partially applied or the repository is
   inconsistent, stop writing and recover it from the user's external backup
   or version-control process. Do not use an application uninstall as repair.

The existing Workbench transaction and recovery behavior remains governed by
the Repository Format and Governance contracts; release operations do not add
a second recovery authority.

## Uninstall and machine-local state

Uninstalling the unsigned `.app` removes only the application copy. It must
leave the user's Knowledge Repository, portable audit records, rollback data,
Source Records, and Working Material untouched.

Session state and linked-local Source Asset metadata are machine-local
application state. Removing them is a separate, explicit cleanup choice and
may remove resume or relinking convenience. The operator must identify the
exact application-owned files before removing them; never use a broad or
recursive command against the repository root.

## Diagnostics and support

Default diagnostics are limited to application version, source revision,
platform/architecture, workflow, and sanitized failure category. They exclude
repository content, source excerpts, prompts, provider payloads, credentials,
absolute private paths, and raw sensitive exceptions.

Use [SUPPORT.md](../SUPPORT.md) for issue severity, response expectations,
safe report contents, and the private security-reporting route. A broader
support bundle requires explicit human approval and an inspectable preview.

## Incident response

For a bad candidate or suspected release incident:

1. Stop the candidate workflow and do not redistribute its CI artifact.
2. Preserve the exact manifest, checksum, source revision, workflow run, and
   sanitized failure category.
3. Determine whether the issue affects only the package or also application
   behavior/repository integrity; do not copy private user content into the
   incident record.
4. Mark the candidate unsupported and communicate the safe recovery or
   rollback procedure.
5. Correct the source, rerun the complete candidate checklist, and generate a
   new manifest rather than mutating the old evidence.
6. Record the incident, response owner, user impact, correction, and residual
   risk. Route suspected vulnerabilities through `SECURITY.md` privately.

## Deferred work and owners

- Signed/notarized DMG/ZIP and public end-user distribution: Issue #25,
  deferred by the human owner for developer-only V1; owner/revisit decision
  remains in the issue tracker.
- Auto-update: separate future decision and implementation.
- Windows and enterprise deployment: Issues #26 and #27.
- Broad post-TB hardening, coverage, and complexity follow-ups: Issues #21,
  #22, and #23.
- Remote synchronization, verified backup, GitHub integration, and production
  Model Provider behavior: post-V1 or separately scoped work.

These deferrals are part of the supported V1 boundary and must not be
described as available release features.
