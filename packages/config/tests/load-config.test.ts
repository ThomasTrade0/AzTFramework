import { ConfigurationError, isErr, isOk } from "@azt/core";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { loadConfig, requireConfig } from "../src/load-config.js";

const schema = z.object({
  PORT: z.coerce.number().int().positive(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
});

describe("loadConfig", () => {
  it("returns Ok with coerced, validated values on success", () => {
    const result = loadConfig(schema, {
      source: { PORT: "3000", DATABASE_URL: "postgres://localhost:5432/db" },
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toEqual({
        PORT: 3000,
        NODE_ENV: "development",
        DATABASE_URL: "postgres://localhost:5432/db",
      });
    }
  });

  it("returns Err with a ConfigurationError listing every failing field", () => {
    const result = loadConfig(schema, { source: { PORT: "not-a-number" } });

    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(ConfigurationError);
      expect(result.error.details?.issues).toEqual(
        expect.arrayContaining([
          expect.stringContaining("PORT"),
          expect.stringContaining("DATABASE_URL"),
        ]),
      );
    }
  });

  it("defaults to process.env when no source is given", () => {
    process.env.PORT = "4000";
    process.env.DATABASE_URL = "postgres://localhost:5432/db";
    const result = loadConfig(schema);
    expect(isOk(result)).toBe(true);
    delete process.env.PORT;
    delete process.env.DATABASE_URL;
  });
});

describe("requireConfig", () => {
  it("returns the validated config directly", () => {
    const config = requireConfig(schema, {
      source: { PORT: "8080", DATABASE_URL: "postgres://localhost:5432/db" },
    });
    expect(config.PORT).toBe(8080);
  });

  it("throws the ConfigurationError on invalid input", () => {
    expect(() => requireConfig(schema, { source: {} })).toThrow(ConfigurationError);
  });
});
