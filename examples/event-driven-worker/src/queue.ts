import type { Disposable } from "@azt/core";

export interface Job<T> {
  readonly id: string;
  readonly payload: T;
  readonly attempts: number;
}

let jobSequence = 0;

/**
 * A tiny in-memory FIFO queue with a pull-based `dequeue()` that suspends
 * until an item is available or the queue is disposed. Stands in for a real
 * broker (SQS, Redis, RabbitMQ) in this example — swap the implementation,
 * not the `Worker`, to point at one.
 */
export class InMemoryQueue<T> implements Disposable {
  private readonly items: Job<T>[] = [];
  private readonly waiters: Array<(job: Job<T> | null) => void> = [];
  private closed = false;

  enqueue(payload: T, attempts = 0): void {
    if (this.closed) throw new Error("Cannot enqueue onto a disposed queue");
    const job: Job<T> = { id: `job-${++jobSequence}`, payload, attempts };
    const waiter = this.waiters.shift();
    if (waiter) {
      waiter(job);
    } else {
      this.items.push(job);
    }
  }

  /** Re-queues a job, incrementing its attempt count — used by {@link Worker} for retries. */
  retry(job: Job<T>): void {
    this.enqueue(job.payload, job.attempts + 1);
  }

  /** Resolves with the next job, or `null` once the queue has been disposed and drained. */
  dequeue(): Promise<Job<T> | null> {
    const job = this.items.shift();
    if (job) return Promise.resolve(job);
    if (this.closed) return Promise.resolve(null);
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  get size(): number {
    return this.items.length;
  }

  dispose(): void {
    this.closed = true;
    while (this.waiters.length > 0) {
      this.waiters.shift()?.(null);
    }
  }
}
