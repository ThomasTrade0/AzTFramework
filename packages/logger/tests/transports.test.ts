import { describe, expect, it } from "vitest";
import { jsonTransport, prettyTransport } from "../src/transports.js";
import type { LogRecord } from "../src/transports.js";

const record: LogRecord = {
  level: "info",
  message: "hello",
  time: "2024-01-01T00:00:00.000Z",
  name: "app",
  fields: { userId: "u1" },
};

describe("jsonTransport", () => {
  it("writes a single JSON line containing level, name, message and fields", () => {
    let line = "";
    jsonTransport((l) => (line = l))(record);
    expect(JSON.parse(line)).toEqual({
      time: record.time,
      level: "info",
      name: "app",
      message: "hello",
      userId: "u1",
    });
  });
});

describe("prettyTransport", () => {
  it("writes a readable line including the scope and extra fields", () => {
    let line = "";
    prettyTransport((l) => (line = l))(record);
    expect(line).toContain("[app]");
    expect(line).toContain("hello");
    expect(line).toContain("u1");
  });
});
