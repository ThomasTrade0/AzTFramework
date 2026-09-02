import type { Disposable } from "@azt/core";
import type { Logger } from "@azt/logger";
import type { InMemoryQueue, Job } from "./queue.js";

export interface WorkerOptions<T> {
  queue: InMemoryQueue<T>;
  handler: (job: Job<T>) => Promise<void>;
  logger: Logger;
  /** Number of jobs processed concurrently. Defaults to 1. */
  concurrency?: number;
  /** Attempts (including the first) before a job is given up on. Defaults to 3. */
  maxAttempts?: number;
  retryDelayMs?: number;
  /** Called when a job exhausts `maxAttempts` — the dead-letter hook. */
  onDropped?: (job: Job<T>, error: unknown) => void | Promise<void>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pulls jobs from an {@link InMemoryQueue} and runs `handler` for each,
 * retrying transient failures with backoff up to `maxAttempts` before
 * dropping the job. `dispose()` stops pulling new jobs once in-flight work
 * completes.
 */
export class Worker<T> implements Disposable {
  private readonly options: WorkerOptions<T> & {
    concurrency: number;
    maxAttempts: number;
    retryDelayMs: number;
  };
  private loops: Promise<void>[] = [];
  private stopped = false;

  constructor(options: WorkerOptions<T>) {
    this.options = {
      ...options,
      concurrency: options.concurrency ?? 1,
      maxAttempts: options.maxAttempts ?? 3,
      retryDelayMs: options.retryDelayMs ?? 50,
    };
  }

  start(): void {
    const { concurrency } = this.options;
    this.loops = Array.from({ length: concurrency }, (_, index) => this.runLoop(index));
  }

  private async runLoop(workerIndex: number): Promise<void> {
    const { queue, handler, logger, maxAttempts, retryDelayMs, onDropped } = this.options;

    while (!this.stopped) {
      const job = await queue.dequeue();
      if (!job) break;

      try {
        await handler(job);
        logger.info("job completed", { jobId: job.id, worker: workerIndex });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (job.attempts + 1 >= maxAttempts) {
          logger.error("job failed permanently", {
            jobId: job.id,
            attempts: job.attempts + 1,
            message,
          });
          await onDropped?.(job, error);
          continue;
        }
        logger.warn("job failed, retrying", { jobId: job.id, attempt: job.attempts + 1, message });
        await sleep(retryDelayMs * 2 ** job.attempts);
        queue.retry(job);
      }
    }
  }

  async dispose(): Promise<void> {
    this.stopped = true;
    this.options.queue.dispose();
    await Promise.all(this.loops);
  }
}
