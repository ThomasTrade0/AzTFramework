# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning follows
[Semantic Versioning](https://semver.org/) once the project reaches `1.0.0`.

## [0.1.0] — Unreleased

Initial public release.

### Added

- `@azt/core` — `Result` type, `AztError` hierarchy, a minimal DI `Container`, and `DisposableStore` for lifecycle management.
- `@azt/config` — environment configuration loading and validation via Zod, returning a `Result`.
- `@azt/logger` — structured leveled logging with child loggers and pluggable transports (JSON, pretty).
- `@azt/validation` — `Result`-typed wrappers around Zod schema validation.
- `@azt/events` — a strongly-typed in-process event bus with isolated handler errors.
- `@azt/http` — a fetch-based HTTP client with retries/timeouts, and a minimal Node HTTP router/server.
- `@azt/testing` — factories, a scriptable `fetch` mock, and `Result` assertions for tests.
- `examples/rest-api` — a task-management REST API composing all of the above.
- `examples/event-driven-worker` — an in-memory job queue/worker driven by domain events.
