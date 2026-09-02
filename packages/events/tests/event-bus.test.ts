import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../src/event-bus.js";

interface Events {
  "task.created": { id: string; title: string };
  "task.completed": { id: string };
}

describe("EventBus", () => {
  it("invokes subscribed handlers with the emitted payload", async () => {
    const bus = new EventBus<Events>();
    const handler = vi.fn();
    bus.on("task.created", handler);

    await bus.emit("task.created", { id: "1", title: "Write docs" });

    expect(handler).toHaveBeenCalledWith({ id: "1", title: "Write docs" });
  });

  it("supports multiple independent handlers for the same event", async () => {
    const bus = new EventBus<Events>();
    const first = vi.fn();
    const second = vi.fn();
    bus.on("task.created", first);
    bus.on("task.created", second);

    await bus.emit("task.created", { id: "1", title: "x" });

    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("on() returns an unsubscribe function", async () => {
    const bus = new EventBus<Events>();
    const handler = vi.fn();
    const unsubscribe = bus.on("task.created", handler);

    unsubscribe();
    await bus.emit("task.created", { id: "1", title: "x" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("once() fires exactly one time then auto-unsubscribes", async () => {
    const bus = new EventBus<Events>();
    const handler = vi.fn();
    bus.once("task.completed", handler);

    await bus.emit("task.completed", { id: "1" });
    await bus.emit("task.completed", { id: "1" });

    expect(handler).toHaveBeenCalledOnce();
  });

  it("isolates a throwing handler and still runs its siblings", async () => {
    const bus = new EventBus<Events>();
    const errors: unknown[] = [];
    bus.onError((error) => errors.push(error));

    bus.on("task.created", () => {
      throw new Error("boom");
    });
    const sibling = vi.fn();
    bus.on("task.created", sibling);

    await bus.emit("task.created", { id: "1", title: "x" });

    expect(sibling).toHaveBeenCalledOnce();
    expect(errors).toHaveLength(1);
  });

  it("awaits async handlers before emit() resolves", async () => {
    const bus = new EventBus<Events>();
    let completed = false;
    bus.on("task.created", async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      completed = true;
    });

    await bus.emit("task.created", { id: "1", title: "x" });

    expect(completed).toBe(true);
  });

  it("listenerCount reflects current subscriptions", () => {
    const bus = new EventBus<Events>();
    expect(bus.listenerCount("task.created")).toBe(0);
    const unsubscribe = bus.on("task.created", () => {});
    expect(bus.listenerCount("task.created")).toBe(1);
    unsubscribe();
    expect(bus.listenerCount("task.created")).toBe(0);
  });
});
