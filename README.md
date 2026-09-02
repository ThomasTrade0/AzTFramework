# AzTFramework

A production-oriented TypeScript toolkit for building modular SaaS
applications, APIs, automation systems and AI-powered products.

[![CI](https://github.com/ThomasTrade0/AzTFramework/actions/workflows/ci.yml/badge.svg)](https://github.com/ThomasTrade0/AzTFramework/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Status:** this is an open-source reference implementation and portfolio
> project — pre-1.0, actively developed, not (yet) production-tested at
> scale. See [ROADMAP.md](ROADMAP.md) for what's built vs. planned.

## Why

Most small-to-mid TypeScript backends end up rebuilding the same handful of
primitives — a `Result` type instead of throwing everywhere, a structured
logger, a way to validate config and request bodies, an event bus for
decoupling side effects, an HTTP client with sane retry/timeout defaults —
usually as ad-hoc, undocumented, per-project utility files.

AzTFramework packages those primitives as small, independent, well-tested
`@azt/*` modules you can adopt individually — not a monolithic framework you
either buy into completely or not at all.

## Philosophy

- **Pragmatic, not exhaustive.** Every package exists because an example
  application in this repo needed it. No speculative abstractions.
- **Compose, don't replace.** `@azt/config` and `@azt/validation` wrap Zod
  rather than reinventing schema validation. `@azt/http`'s client wraps the
  platform `fetch`. Reach for a real framework (Express/Fastify/Hono, NestJS)
  when you outgrow the minimal server in `@azt/http`.
- **`Result` over exceptions for expected failures.** Validation errors,
  not-found lookups, and conflicts are values (`Result<T, E>` from
  `@azt/core`), not control flow via `throw`. Exceptions are reserved for
  programmer errors and truly exceptional conditions — and `@azt/http`'s
  router still maps a thrown `AztError` to the right HTTP status, so both
  styles interoperate.
- **Explicit composition over magic.** `@azt/core`'s `Container` has no
  decorators or reflection-based auto-wiring — dependencies are registered
  and resolved explicitly at a composition root, so you can always trace
  where an instance came from.
- **No half-finished packages.** A module listed in [ROADMAP.md](ROADMAP.md)
  as "planned" doesn't exist yet as a stub — it isn't built until an example
  needs it.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Your application                        │
└─────────────────────────────────────────────────────────────────┘
        │            │            │            │            │
        ▼            ▼            ▼            ▼            ▼
   @azt/http    @azt/events   @azt/config  @azt/validation  @azt/testing
        │            │            │            │
        └────────────┴─────┬──────┴────────────┘
                            ▼
                  @azt/logger   @azt/core
                                (Result, AztError,
                                 Container, Disposable)
```

`@azt/core` has zero dependencies and is the only package every other
package may depend on — that keeps the dependency graph shallow and
acyclic. `@azt/logger` and `@azt/events` are also dependency-free, so they
can be adopted standalone.

## Tech stack

TypeScript (strict mode) · Node.js ≥ 18 · Zod · npm workspaces · tsup (build)
· Vitest (tests) · ESLint (flat config) + Prettier · GitHub Actions (CI)

## Package structure

```
packages/
  core/         @azt/core        Result, AztError, DI Container, Disposable
  config/       @azt/config      Typed environment configuration
  logger/       @azt/logger      Structured leveled logging
  validation/   @azt/validation  Result-typed Zod validation
  events/       @azt/events      Strongly-typed in-process event bus
  http/         @azt/http        Fetch client + minimal server/router
  testing/      @azt/testing     Factories, fetch mocking, Result assertions
examples/
  rest-api/               A task-management REST API using every package
  event-driven-worker/    An in-memory job queue/worker driven by events
```

Each package is independently versioned in its `package.json`, has its own
`src/` and `tests/`, and builds to ESM with type declarations via
[tsup](https://tsup.egoist.dev/).

## Installation

This repository is an npm workspaces monorepo; the packages are not (yet)
published to the npm registry. To use them, clone the repo and either import
directly from a workspace, or `npm pack` a package and install the tarball
in an external project:

```bash
git clone https://github.com/ThomasTrade0/AzTFramework.git
cd AzTFramework
npm install
npm run build
```

## Quick start

```bash
npm install
npm run build              # build every @azt/* package
npm test                   # run the full test suite (85+ tests)
npm run build:examples     # build the example applications
npm run start -w rest-api-example
```

```ts
// A minimal composition using @azt/core, @azt/logger and @azt/events.
import { Container, createToken } from "@azt/core";
import { createLogger, type Logger } from "@azt/logger";
import { EventBus } from "@azt/events";

interface AppEvents {
  "user.signedUp": { userId: string };
}

const LoggerToken = createToken<Logger>("logger");

const container = new Container();
container.registerSingleton(LoggerToken, () => createLogger({ name: "app" }));

const logger = container.resolve(LoggerToken);
const events = new EventBus<AppEvents>();

events.on("user.signedUp", ({ userId }) => logger.info("user signed up", { userId }));
await events.emit("user.signedUp", { userId: "u_123" });
```

## Examples

- **[`examples/rest-api`](examples/rest-api)** — a task-management REST API
  demonstrating `@azt/http`'s router, `@azt/validation` request validation,
  `@azt/config` environment loading, `@azt/logger` request logging, and
  `@azt/events` for post-mutation side effects, all wired together through
  `@azt/core`'s `Container`.
- **[`examples/event-driven-worker`](examples/event-driven-worker)** — a
  from-scratch in-memory job queue and worker with concurrency and
  exponential-backoff retries, driven by `@azt/events`.

See [ROADMAP.md](ROADMAP.md#planned-example-applications) for planned
examples (SaaS backend, AI application, authentication) gated on packages
not yet built.

## API overview

| Package           | Key exports                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- |
| `@azt/core`       | `Result`, `ok`, `err`, `AztError`, `ValidationError`, `NotFoundError`, `Container`, `createToken`, `DisposableStore` |
| `@azt/config`     | `loadConfig`, `requireConfig` (re-exports `z` from Zod)                                                              |
| `@azt/logger`     | `createLogger`, `jsonTransport`, `prettyTransport`                                                                   |
| `@azt/validation` | `validate`, `validateAsync` (re-exports `z` from Zod)                                                                |
| `@azt/events`     | `EventBus`                                                                                                           |
| `@azt/http`       | `createHttpClient`, `Router`, `createServer`, `HttpError`                                                            |
| `@azt/testing`    | `createFactory`, `MockFetch`, `expectOk`, `expectErr`                                                                |

Full type signatures are in each package's generated `.d.ts` (`npm run build`)
and inline TSDoc comments in `src/`.

## Testing

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run coverage       # with coverage report
```

85+ tests across every package and example, run in CI on Node 18/20/22.

## Development

```bash
npm run lint          # ESLint (flat config, type-aware)
npm run format        # Prettier --write
npm run format:check  # Prettier --check (used in CI)
npm run typecheck     # tsc --noEmit, per package, in dependency order
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for shipped vs. planned packages, planned
example applications, and what's explicitly out of scope.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). This
project follows the [Code of Conduct](CODE_OF_CONDUCT.md). Security issues
should be reported per [SECURITY.md](SECURITY.md), not as public issues.

## License

[MIT](LICENSE) © Thomas Azarian
