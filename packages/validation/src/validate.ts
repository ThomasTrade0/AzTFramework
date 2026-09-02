import { err, ok, ValidationError, type Result } from "@azt/core";
import type { z } from "zod";

export interface ValidationIssue {
  path: string;
  message: string;
}

function toIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "(root)",
    message: issue.message,
  }));
}

/** Validates `input` against `schema`, returning a typed value or a {@link ValidationError}. */
export function validate<Schema extends z.ZodTypeAny>(
  schema: Schema,
  input: unknown,
): Result<z.infer<Schema>, ValidationError> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return ok(parsed.data as z.infer<Schema>);

  const issues = toIssues(parsed.error);
  return err(
    new ValidationError(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "), {
      details: { issues },
    }),
  );
}

/** Async variant of {@link validate}, for schemas with async refinements/transforms. */
export async function validateAsync<Schema extends z.ZodTypeAny>(
  schema: Schema,
  input: unknown,
): Promise<Result<z.infer<Schema>, ValidationError>> {
  const parsed = await schema.safeParseAsync(input);
  if (parsed.success) return ok(parsed.data as z.infer<Schema>);

  const issues = toIssues(parsed.error);
  return err(
    new ValidationError(issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "), {
      details: { issues },
    }),
  );
}
