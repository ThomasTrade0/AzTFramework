import { describe, expect, it } from "vitest";
import {
  andThen,
  err,
  isErr,
  isOk,
  map,
  mapErr,
  ok,
  tryCatch,
  tryCatchAsync,
  unwrap,
  unwrapOr,
} from "../src/result.js";

describe("Result", () => {
  it("creates Ok and Err values", () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(err("bad")).toEqual({ ok: false, error: "bad" });
  });

  it("narrows with isOk / isErr", () => {
    const result = ok(42);
    if (isOk(result)) {
      expect(result.value).toBe(42);
    } else {
      throw new Error("expected Ok");
    }
    expect(isErr(err("x"))).toBe(true);
  });

  it("map transforms only Ok values", () => {
    expect(map(ok(2), (n) => n * 2)).toEqual(ok(4));
    expect(map(err<number, string>("e"), (n) => n * 2)).toEqual(err("e"));
  });

  it("mapErr transforms only Err values", () => {
    expect(mapErr(err("boom"), (e) => e.toUpperCase())).toEqual(err("BOOM"));
    expect(mapErr(ok(1), (e: string) => e.toUpperCase())).toEqual(ok(1));
  });

  it("andThen chains fallible operations and short-circuits", () => {
    const parsePositive = (n: number) => (n > 0 ? ok(n) : err("must be positive"));
    expect(andThen(ok(5), parsePositive)).toEqual(ok(5));
    expect(andThen(ok(-5), parsePositive)).toEqual(err("must be positive"));
    expect(andThen(err<number, string>("upstream"), parsePositive)).toEqual(err("upstream"));
  });

  it("unwrapOr returns fallback for Err", () => {
    expect(unwrapOr(ok(1), 0)).toBe(1);
    expect(unwrapOr(err("e"), 0)).toBe(0);
  });

  it("unwrap returns the value for Ok and throws for Err", () => {
    expect(unwrap(ok(1))).toBe(1);
    expect(() => unwrap(err(new Error("boom")))).toThrow("boom");
    expect(() => unwrap(err("plain string"))).toThrow(/plain string/);
  });

  it("tryCatch converts a thrown value into an Err", () => {
    expect(tryCatch(() => 1)).toEqual(ok(1));
    const result = tryCatch(() => {
      throw new Error("nope");
    });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) expect(result.error.message).toBe("nope");
  });

  it("tryCatchAsync converts a rejection into an Err", async () => {
    await expect(tryCatchAsync(async () => 1)).resolves.toEqual(ok(1));
    const result = await tryCatchAsync(async () => {
      throw new Error("async nope");
    });
    expect(isErr(result)).toBe(true);
  });
});
