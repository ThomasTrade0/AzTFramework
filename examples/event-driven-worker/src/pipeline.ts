import type { Disposable } from "@azt/core";
import { EventBus } from "@azt/events";
import type { Logger } from "@azt/logger";
import { reserveInventory } from "./domain/inventory.js";
import type { OrderEvents } from "./domain/events.js";
import { InMemoryQueue } from "./queue.js";
import { Worker } from "./worker.js";

interface ReservationJob {
  orderId: string;
  items: string[];
}

export interface OrderPipeline extends Disposable {
  events: EventBus<OrderEvents>;
}

/**
 * Wires an event bus to a worker: `order.placed` enqueues an inventory
 * reservation job; the worker resolves it and emits `order.confirmed` or,
 * once retries are exhausted, `order.failed`.
 */
export function createOrderPipeline(logger: Logger): OrderPipeline {
  const events = new EventBus<OrderEvents>();
  const queue = new InMemoryQueue<ReservationJob>();

  events.on("order.placed", ({ orderId, items }) => {
    queue.enqueue({ orderId, items });
  });

  const worker = new Worker<ReservationJob>({
    queue,
    logger,
    concurrency: 2,
    maxAttempts: 3,
    retryDelayMs: 10,
    handler: async (job) => {
      reserveInventory(job.payload.items, job.attempts);
      await events.emit("order.confirmed", { orderId: job.payload.orderId });
    },
    onDropped: async (job, error) => {
      const reason = error instanceof Error ? error.message : "unknown error";
      await events.emit("order.failed", { orderId: job.payload.orderId, reason });
    },
  });

  worker.start();

  return {
    events,
    dispose: () => worker.dispose(),
  };
}
