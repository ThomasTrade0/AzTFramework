import { requireConfig, z } from "@azt/config";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
});

export function loadEnv(source: Record<string, string | undefined> = process.env) {
  return requireConfig(envSchema, { source });
}
