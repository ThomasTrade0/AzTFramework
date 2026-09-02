import { describe, expect, it } from "vitest";
import { InMemoryQueue } from "../src/queue.js";

describe("InMemoryQueue", () => {
  it("dequeues items already in the queue immediately", async () => {
    const queue = new InMemoryQueue<string>();
    queue.enqueue("a");
    queue.enqueue("b");

    expect((await queue.dequeue())?.payload).toBe("a");
    expect((await queue.dequeue())?.payload).toBe("b");
  });

  it("suspends dequeue() until an item is enqueued", async () => {
    const queue = new InMemoryQueue<string>();
    const pending = queue.dequeue();

    queue.enqueue("later");

    const job = await pending;
    expect(job?.payload).toBe("later");
  });

  it("retry() re-enqueues with an incremented attempt count", async () => {
    const queue = new InMemoryQueue<string>();
    queue.enqueue("x");
    const job = await queue.dequeue();
    expect(job?.attempts).toBe(0);

    queue.retry(job!);
    const retried = await queue.dequeue();
    expect(retried?.attempts).toBe(1);
  });

  it("resolves pending and future dequeue() calls with null once disposed", async () => {
    const queue = new InMemoryQueue<string>();
    const pending = queue.dequeue();

    queue.dispose();

    expect(await pending).toBeNull();
    expect(await queue.dequeue()).toBeNull();
  });

  it("throws if enqueue() is called after dispose", () => {
    const queue = new InMemoryQueue<string>();
    queue.dispose();
    expect(() => queue.enqueue("x")).toThrow();
  });
});
