# Architecture notes

This expands on the [README's architecture section](../README.md#architecture)
with the reasoning behind a few decisions that aren't obvious from the code
alone.

## Why `Result<T, E>` instead of exceptions

`@azt/core`'s `Result` type exists because TypeScript's `throw` carries no
type information — a function's signature doesn't tell you what it can
throw, so callers either over-catch (`try { ... } catch { /* ??? */ }`) or
don't catch at all and let the framework's global error handler paper over
it.

The convention in this repo:

- **Expected, recoverable failures** (validation failed, record not found,
  a duplicate key) are returned as `Result<T, AztError>`. The caller's type
  checker forces them to handle both branches.
- **Unexpected failures** (a bug, a truly exceptional I/O failure) are
  thrown. `@azt/http`'s `Router` catches any thrown `AztError` at the
  request boundary and maps it to the right HTTP status via `error.code`,
  so a handler can `throw result.error` from a failed `Result` and still get
  correct HTTP semantics — see `examples/rest-api/src/http/create-router.ts`
  for the pattern.

This mirrors Rust's `Result`/`panic!` split, adapted to a language where
exceptions are the ambient failure channel and can't be fully avoided (JSON
parsing, network sockets, etc. still throw).

## Why the DI container has no decorators

`@azt/core`'s `Container` is deliberately "dumb": no `@Injectable()`
decorators, no reflection-based auto-wiring, no property injection. You
register a factory against a `Token` and resolve it explicitly:

```ts
const LoggerToken = createToken<Logger>("logger");
container.registerSingleton(LoggerToken, () => createLogger({ name: "app" }));
```

The tradeoff: more boilerplate at the composition root (see
`examples/rest-api/src/app.ts`) than a decorator-based DI framework. The
benefit: `resolve(token)` is always traceable to a single `register*` call
with no build-time code generation or runtime metadata reflection involved —
important in a small library meant to be read end-to-end, not just used as a
black box.

## Why `@azt/events` is in-memory only

`EventBus` intentionally does not persist events, retry delivery, or survive
a process restart — it's a typed wrapper around the observer pattern, not a
message broker. Using it for a durable side effect (e.g. "charge the
customer") without a durable queue behind it would silently drop that side
effect on a crash mid-emit.

`examples/event-driven-worker` shows the intended pattern: `EventBus` is
used for the _trigger_ ("an order was placed"), while the actual retryable
work goes through a `Worker`/`InMemoryQueue` pair with attempt tracking and
backoff. The queue there is intentionally in-memory (a stand-in for
SQS/Redis/RabbitMQ) — see the note in that example's README and the
`@azt/queue` entry in [ROADMAP.md](../ROADMAP.md) for what a durable version
would look like.

## Why examples exist as tests, not just demos

Both `examples/*` packages have a `tests/` directory that exercises the
whole app (`examples/rest-api/tests/app.test.ts` boots the real HTTP server
on an ephemeral port; `examples/event-driven-worker/tests/pipeline.test.ts`
runs the actual worker/queue). This catches integration breakage between
packages that each package's own unit tests can't — e.g. a signature change
in `@azt/http`'s `Router` that still typechecks in isolation but breaks how
`examples/rest-api` composes it.
