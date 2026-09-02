import { isErr, isOk, ValidationError } from "@azt/core";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validate, validateAsync } from "../src/validate.js";

const userSchema = z.object({
  email: z.string().email(),
  age: z.number().int().min(18),
});

describe("validate", () => {
  it("returns Ok with the parsed value for valid input", () => {
    const result = validate(userSchema, { email: "a@example.com", age: 30 });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) expect(result.value).toEqual({ email: "a@example.com", age: 30 });
  });

  it("returns Err with a ValidationError carrying per-field issues", () => {
    const result = validate(userSchema, { email: "not-an-email", age: 10 });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(ValidationError);
      const issues = result.error.details?.issues as Array<{ path: string }>;
      expect(issues.map((i) => i.path)).toEqual(expect.arrayContaining(["email", "age"]));
    }
  });
});

describe("validateAsync", () => {
  it("supports schemas with async refinements", async () => {
    const asyncSchema = z.object({
      username: z.string().refine(async (value) => value !== "taken", "username is taken"),
    });

    const okResult = await validateAsync(asyncSchema, { username: "available" });
    expect(isOk(okResult)).toBe(true);

    const errResult = await validateAsync(asyncSchema, { username: "taken" });
    expect(isErr(errResult)).toBe(true);
  });
});
