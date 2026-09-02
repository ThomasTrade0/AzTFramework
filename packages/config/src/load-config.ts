import { ConfigurationError, err, ok, type Result } from "@azt/core";
import type { z } from "zod";

export interface LoadConfigOptions {
  /** Key/value source to validate against. Defaults to `process.env`. */
  source?: Record<string, string | undefined>;
}

/**
 * Validates a key/value source (by default `process.env`) against a Zod
 * schema and returns a typed {@link Result}. Use `z.coerce.number()` /
 * `z.coerce.boolean()` in the schema for non-string fields, since every
 * environment variable arrives as a string.
 */
export function loadConfig<Schema extends z.ZodTypeAny>(
  schema: Schema,
  options: LoadConfigOptions = {},
): Result<z.infer<Schema>, ConfigurationError> {
  const source = options.source ?? process.env;
  const parsed = schema.safeParse(source);

  if (parsed.success) {
    return ok(parsed.data as z.infer<Schema>);
  }

  const issues = parsed.error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
  return err(
    new ConfigurationError(`Invalid configuration:\n  - ${issues.join("\n  - ")}`, {
      details: { issues },
    }),
  );
}

/** Like {@link loadConfig}, but throws the {@link ConfigurationError} instead of returning it. */
export function requireConfig<Schema extends z.ZodTypeAny>(
  schema: Schema,
  options: LoadConfigOptions = {},
): z.infer<Schema> {
  const result = loadConfig(schema, options);
  if (!result.ok) throw result.error;
  return result.value;
}
