/**
 * Simulates an inventory check for a demo: `"out-of-stock"` always fails
 * (permanent), `"flaky-warehouse-item"` fails once then succeeds on retry
 * (transient), anything else succeeds immediately.
 */
export function reserveInventory(items: string[], attempt: number): void {
  if (items.includes("out-of-stock")) {
    throw new Error("Item is permanently out of stock");
  }
  if (items.includes("flaky-warehouse-item") && attempt === 0) {
    throw new Error("Warehouse system timed out, try again");
  }
}
