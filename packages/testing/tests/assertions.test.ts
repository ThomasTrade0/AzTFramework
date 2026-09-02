import { err, ok } from "@azt/core";
import { describe, expect, it } from "vitest";
import { expectErr, expectOk } from "../src/assertions.js";

describe("expectOk", () => {
  it("returns the value for an Ok result", () => {
    expect(expectOk(ok(42))).toBe(42);
  });

  it("throws a descriptive error for an Err result", () => {
    expect(() => expectOk(err("boom"))).toThrow(/Expected Ok but got Err/);
  });
});

describe("expectErr", () => {
  it("returns the error for an Err result", () => {
    expect(expectErr(err("boom"))).toBe("boom");
  });

  it("throws a descriptive error for an Ok result", () => {
    expect(() => expectErr(ok(1))).toThrow(/Expected Err but got Ok/);
  });
});
