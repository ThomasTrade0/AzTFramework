import { describe, expect, it } from "vitest";
import { DisposableStore } from "../src/lifecycle.js";

describe("DisposableStore", () => {
  it("disposes registered disposables in reverse order", async () => {
    const order: string[] = [];
    const store = new DisposableStore();
    store.add({ dispose: () => order.push("first") });
    store.add({ dispose: () => order.push("second") });

    await store.dispose();

    expect(order).toEqual(["second", "first"]);
    expect(store.isDisposed).toBe(true);
  });

  it("disposes a disposable added after the store is already disposed", async () => {
    const store = new DisposableStore();
    await store.dispose();

    let disposed = false;
    store.add({ dispose: () => (disposed = true) });

    expect(disposed).toBe(true);
  });

  it("collects errors from failing disposables into an AggregateError", async () => {
    const store = new DisposableStore();
    store.add({
      dispose: () => {
        throw new Error("first failure");
      },
    });
    store.add({
      dispose: () => {
        throw new Error("second failure");
      },
    });

    await expect(store.dispose()).rejects.toThrow(AggregateError);
  });

  it("is idempotent", async () => {
    let disposeCalls = 0;
    const store = new DisposableStore();
    store.add({ dispose: () => disposeCalls++ });

    await store.dispose();
    await store.dispose();

    expect(disposeCalls).toBe(1);
  });
});
