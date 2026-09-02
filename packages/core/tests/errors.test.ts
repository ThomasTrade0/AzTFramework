import { describe, expect, it } from "vitest";
import { AztError, NotFoundError, ValidationError, isAztError } from "../src/errors.js";

describe("AztError", () => {
  it("defaults code to the constructor name", () => {
    const error = new AztError("something went wrong");
    expect(error.code).toBe("AztError");
    expect(error.name).toBe("AztError");
  });

  it("subclasses set a fixed, overridable-by-caller code", () => {
    const error = new NotFoundError("user not found");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.name).toBe("NotFoundError");
  });

  it("carries structured details and a cause", () => {
    const cause = new Error("db timeout");
    const error = new ValidationError("invalid payload", {
      details: { field: "email" },
      cause,
    });
    expect(error.details).toEqual({ field: "email" });
    expect(error.cause).toBe(cause);
  });

  it("serializes to a stable JSON shape", () => {
    const error = new ValidationError("invalid payload", { details: { field: "email" } });
    expect(error.toJSON()).toEqual({
      name: "ValidationError",
      code: "VALIDATION_ERROR",
      message: "invalid payload",
      details: { field: "email" },
    });
  });

  it("isAztError narrows unknown caught values", () => {
    expect(isAztError(new NotFoundError("x"))).toBe(true);
    expect(isAztError(new Error("plain"))).toBe(false);
    expect(isAztError("not an error")).toBe(false);
  });
});
