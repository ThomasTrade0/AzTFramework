import { createLogger, prettyTransport } from "@azt/logger";
import { createOrderPipeline } from "./pipeline.js";

async function main() {
  const logger = createLogger({
    name: "event-driven-worker-example",
    transport: prettyTransport(),
  });
  const pipeline = createOrderPipeline(logger);

  const orders = [
    { orderId: "order-1", items: ["widget"] },
    { orderId: "order-2", items: ["flaky-warehouse-item"] },
    { orderId: "order-3", items: ["out-of-stock"] },
  ];

  const settled = new Promise<void>((resolve) => {
    let remaining = orders.length;
    const onSettled = () => {
      remaining -= 1;
      if (remaining === 0) resolve();
    };
    pipeline.events.on("order.confirmed", ({ orderId }) => {
      logger.info("order confirmed", { orderId });
      onSettled();
    });
    pipeline.events.on("order.failed", ({ orderId, reason }) => {
      logger.warn("order failed", { orderId, reason });
      onSettled();
    });
  });

  for (const order of orders) {
    await pipeline.events.emit("order.placed", order);
  }

  await settled;
  await pipeline.dispose();
  logger.info("all orders settled, worker shut down");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
