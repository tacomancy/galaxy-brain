# Galaxy Brain support

## Current V1 boundary

Galaxy Brain V1 is a developer-only macOS arm64 distribution. The supported
path is a source checkout or the unsigned local `.app` produced by the pinned
Node.js toolchain. There is no signed downloadable installer, DMG, ZIP,
auto-update service, or Gatekeeper-accepted public package. Do not treat an
unsigned local package as an end-user release.

The Workbench is local-first. It does not commit, synchronize, back up, or
upload a user's Knowledge Repository. Git, Git LFS, GitHub, credentials, and
network services remain external user-managed tools.

## Before opening a product issue

Use a new or isolated Knowledge Repository when reproducing a problem. Include:

- the application version and source revision;
- macOS version and arm64 hardware model;
- whether the source checkout or unsigned package was used;
- the exact reproducible steps and expected versus observed result; and
- only safe diagnostic metadata such as the workflow and failure category.

Never attach repository content, source excerpts, credentials, API keys,
provider request/response payloads, absolute private paths, or raw exception
output containing sensitive data. Redact screenshots and logs before posting.

Open a public GitHub issue for reproducible product defects, documentation
problems, and feature requests. If the report could reveal a security
vulnerability, use the private process in [SECURITY.md](SECURITY.md) instead.

## Severity and response expectations

- **Critical:** private content or credentials may be exposed, repository data
  may be corrupted or lost, or the supported launch path is unusable for all
  users.
- **High:** a serious integrity, privacy, security, or repeated-crash problem
  has no reliable workaround.
- **Medium:** a reproducible regression or blocked workflow has a reasonable
  workaround.
- **Low:** cosmetic, usability, documentation, or enhancement work.

Maintainers triage the reported severity and aim to acknowledge new reports
within five business days. This is an operating target, not a guaranteed
service level or promise of a particular fix date. Security reports remain
private while they are assessed and remediated.

## Safe diagnostic collection

The approved default diagnostic boundary is limited to application version,
source revision, platform/architecture, workflow name, and a sanitized
failure category. Any broader collection must be explicitly requested,
inspectable by the reporter, and declined without affecting local work.

If a release artifact is involved, include its release manifest and checksum
only after checking that they contain no local paths or secrets. The release
manifest identifies the exact application artifact; it does not contain a
user repository or provider payload.

## Release incidents

If a candidate package is unsafe or incorrect, maintainers should stop
distribution, preserve the candidate manifest and workflow evidence, document
the impact without copying private content, publish a corrected candidate, and
record the residual risk. The detailed operator procedure is in
[the release-operations runbook](docs/release-operations.md).
