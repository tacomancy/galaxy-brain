# Security Policy

## Supported versions

Galaxy Brain is in active early development. Security fixes are currently
made against the latest version on `main` and the latest published release,
if one exists.

The V1 distribution is developer-only: the supported paths are the source
checkout and the unsigned local macOS arm64 package built from the pinned
toolchain. There is no signed downloadable installer or public Gatekeeper-
accepted package. Product support expectations and safe diagnostic guidance
are documented in [SUPPORT.md](SUPPORT.md).

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Latest published release (`0.19.0`) | Yes | <!-- x-release-please-version -->
| Older versions | No |

## Reporting a vulnerability

Please do not report suspected vulnerabilities in a public issue, pull
request, or discussion.

Use GitHub's private vulnerability reporting feature from this repository's
**Security** tab and choose **Report a vulnerability**. Include enough detail
to reproduce the issue, the affected version or commit, the expected and
observed behavior, and any proposed mitigation.

If private vulnerability reporting is unavailable, contact the repository
maintainers privately through the `tacomancy` GitHub organization. Do not
include credentials, API keys, private Knowledge Repository content, or other
secrets in a report.

We will evaluate reports, keep communication private while a fix is being
prepared, and coordinate public disclosure when appropriate.
