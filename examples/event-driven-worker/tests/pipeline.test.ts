import { createLogger } from "@azt/logger";
import { afterEach, describe, expect, it } from "vitest";
import { createOrderPipeline, type OrderPipeline } from "../src/pipeline.js";

function silentLogger() {
  return createLogger({ level: "fatal" });
}

describe("createOrderPipeline", () => {
  let pipeline: OrderPipeline | undefined;

  afterEach(async () => {
    await pipeline?.dispose();
    pipeline = undefined;
  });

  it("confirms an order for an in-stock item", async () => {
    pipeline = createOrderPipeline(silentLogger());
    const confirmed = new Promise<string>((resolve) => {
      pipeline!.events.on("order.confirmed", ({ orderId }) => resolve(orderId));
    });

    await pipeline.events.emit("order.placed", { orderId: "order-1", items: ["widget"] });

    await expect(confirmed).resolves.toBe("order-1");
  });

  it("recovers a transient failure via retry and still confirms the order", async () => {
    pipeline = createOrderPipeline(silentLogger());
    const confirmed = new Promise<string>((resolve) => {
      pipeline!.events.on("order.confirmed", ({ orderId }) => resolve(orderId));
    });
    const failed = new Promise((resolve) => pipeline!.events.on("order.failed", resolve));

    await pipeline.events.emit("order.placed", {
      orderId: "order-2",
      items: ["flaky-warehouse-item"],
    });

    const result = await Promise.race([confirmed, failed]);
    expect(result).toBe("order-2");
  });

  it("gives up after exhausting retries for a permanently failing item", async () => {
    pipeline = createOrderPipeline(silentLogger());
    const failed = new Promise<{ orderId: string; reason: string }>((resolve) => {
      pipeline!.events.on("order.failed", (payload) => resolve(payload));
    });

    await pipeline.events.emit("order.placed", { orderId: "order-3", items: ["out-of-stock"] });

    const result = await failed;
    expect(result.orderId).toBe("order-3");
    expect(result.reason).toMatch(/out of stock/);
  });
});
