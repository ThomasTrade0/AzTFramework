# event-driven-worker-example

An in-memory job queue and background worker driven by domain events, demonstrating:

- **`@azt/events`** — `order.placed` triggers work; the worker emits `order.confirmed` / `order.failed` back onto the same bus.
- **`@azt/logger`** — structured logs for each job attempt, retry, completion and failure.
- **`@azt/core`** — the `Worker` and `InMemoryQueue` implement `Disposable` for graceful shutdown.

`InMemoryQueue` and `Worker` (in [`src/queue.ts`](src/queue.ts) and [`src/worker.ts`](src/worker.ts)) are a from-scratch, dependency-free implementation — a stand-in for a real broker (SQS, Redis, RabbitMQ). Swap the queue implementation, not the worker, to point this at one.

The demo ([`src/index.ts`](src/index.ts)) places three orders:

1. an in-stock item — confirmed on the first attempt
2. a "flaky" item — fails once (simulating a transient error), then confirmed on retry
3. an out-of-stock item — fails every attempt and is dropped to the `order.failed` event after exhausting retries

## Run it

```bash
npm install
npm run dev -w event-driven-worker-example
```

## Tests

```bash
npx vitest run examples/event-driven-worker
```
