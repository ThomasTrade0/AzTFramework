# Security Policy

## Supported Versions

AzTFramework is pre-1.0 (`0.x`). Only the latest published version of each
package receives security fixes.

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report it privately via [GitHub's private vulnerability reporting](../../security/advisories/new)
for this repository, or by opening a private security advisory. Include:

- A description of the vulnerability and its potential impact
- Steps to reproduce (a minimal code sample is ideal)
- The affected package(s) and version(s)

You should expect an initial response within a few days. This is a
maintained open-source project, not a funded security team — response times
are best-effort.

## Scope and Threat Model

- `@azt/auth` and similar security-relevant packages are on the framework's
  roadmap (see [ROADMAP.md](ROADMAP.md)) and not yet implemented — do not
  assume any package in this repository has been independently audited.
- `@azt/http`'s server (`Router`/`createServer`) is a minimal routing layer
  for examples and small services. It does not implement rate limiting,
  request size limits, or TLS termination — put a reverse proxy or gateway
  in front of it in any environment exposed to untrusted traffic.
- `@azt/config` and `@azt/validation` validate shape, not trust — validating
  that a field looks like an email does not mean the request is authorized.
- No package in this repository logs secrets by default, but any field
  passed into `@azt/logger`'s `fields` is logged verbatim — do not pass
  credentials, tokens, or PII into log fields without redacting them first.

## Disclosure

Once a fix is available, we will publish a patched release and credit the
reporter (unless they prefer to remain anonymous) in the release notes.
