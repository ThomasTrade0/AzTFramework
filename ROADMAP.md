# Roadmap

AzTFramework is a young, pre-1.0 project. This roadmap tracks what exists,
what's planned, and — as importantly — what's deliberately not planned.

## Shipped (`0.1.0`)

| Package           | Status | Purpose                                                 |
| ----------------- | ------ | ------------------------------------------------------- |
| `@azt/core`       | ✅     | Result type, error model, DI container, lifecycles      |
| `@azt/config`     | ✅     | Typed, validated environment configuration              |
| `@azt/logger`     | ✅     | Structured leveled logging                              |
| `@azt/validation` | ✅     | `Result`-typed Zod validation                           |
| `@azt/events`     | ✅     | In-process typed event bus                              |
| `@azt/http`       | ✅     | Fetch client (retries/timeouts) + minimal server/router |
| `@azt/testing`    | ✅     | Factories, fetch mocking, `Result` assertions           |

Reference applications: [`examples/rest-api`](examples/rest-api) and
[`examples/event-driven-worker`](examples/event-driven-worker).

## Planned packages

These are sketched in the original module list but **not yet implemented**.
They'll be built when there's a concrete example that needs them, not
speculatively — see [README.md#philosophy](README.md#philosophy).

- **`@azt/database`** — PostgreSQL query/transaction helpers and a thin
  repository pattern, building on `@azt/core`'s `Result`.
- **`@azt/cache`** — a small cache abstraction (in-memory + pluggable Redis
  adapter) with typed get/set/invalidate.
- **`@azt/queue`** — a durable background-job abstraction. `examples/event-driven-worker`
  currently ships a minimal in-memory queue directly; `@azt/queue` would
  generalize that into a package with a real-broker adapter.
- **`@azt/ai`** — a provider-agnostic LLM abstraction (chat, structured
  output, tool calling) over multiple backends.
- **`@azt/storage`** — a file storage abstraction (local disk + S3-compatible
  adapter).
- **`@azt/payments`** — Stripe-backed billing primitives (customers,
  subscriptions, webhooks).
- **`@azt/observability`** — tracing/metrics helpers that complement
  `@azt/logger` (correlation propagation, timing spans).
- **`@azt/auth`** — sessions, JWTs, and RBAC primitives. Security-sensitive;
  will ship with an explicit threat model in `SECURITY.md`.

## Planned example applications

- A SaaS backend example (multi-tenant, RBAC) once `@azt/database` and
  `@azt/auth` exist.
- An AI application example once `@azt/ai` exists.
- An authentication example once `@azt/auth` exists.

## Explicitly out of scope

- Reinventing what Zod, esbuild, or Node's `http` module already do well.
  AzTFramework wraps and composes; it doesn't replace.
- A CLI/scaffolding tool (`create-azt-app`) — possible later, not before the
  packages themselves are stable.
- Claims of production adoption. This is an open-source reference
  implementation; see the note at the top of the [README](README.md).
