import { describe, expect, it } from "vitest";
import { createLogger } from "../src/logger.js";
import type { LogRecord } from "../src/transports.js";

function captureTransport() {
  const records: LogRecord[] = [];
  return { records, transport: (record: LogRecord) => records.push(record) };
}

describe("createLogger", () => {
  it("defaults to info level and suppresses lower levels", () => {
    const { records, transport } = captureTransport();
    const logger = createLogger({ transport });

    logger.debug("hidden");
    logger.info("shown");

    expect(records).toHaveLength(1);
    expect(records[0]?.message).toBe("shown");
    expect(records[0]?.level).toBe("info");
  });

  it("respects an explicit level threshold", () => {
    const { records, transport } = captureTransport();
    const logger = createLogger({ transport, level: "error" });

    logger.warn("suppressed");
    logger.error("kept");

    expect(records).toHaveLength(1);
    expect(records[0]?.message).toBe("kept");
  });

  it("merges bound fields with per-call fields", () => {
    const { records, transport } = captureTransport();
    const logger = createLogger({ transport, fields: { service: "api" } });

    logger.info("request handled", { requestId: "abc-123" });

    expect(records[0]?.fields).toEqual({ service: "api", requestId: "abc-123" });
  });

  it("child() inherits and extends bound fields without mutating the parent", () => {
    const { records, transport } = captureTransport();
    const logger = createLogger({ transport, fields: { service: "api" } });
    const child = logger.child({ correlationId: "req-1" });

    child.info("child log");
    logger.info("parent log");

    expect(records[0]?.fields).toEqual({ service: "api", correlationId: "req-1" });
    expect(records[1]?.fields).toEqual({ service: "api" });
  });

  it("child() can override the logger name", () => {
    const { records, transport } = captureTransport();
    const logger = createLogger({ transport, name: "root" });
    const child = logger.child({}, { name: "child-scope" });

    child.info("scoped");

    expect(records[0]?.name).toBe("child-scope");
  });

  it("isLevelEnabled reflects the configured threshold", () => {
    const logger = createLogger({ level: "warn" });
    expect(logger.isLevelEnabled("info")).toBe(false);
    expect(logger.isLevelEnabled("error")).toBe(true);
  });
});
