import type { Result } from "@azt/core";

/** Asserts `result` is `Ok` and returns its value, for use inside test assertions. */
export function expectOk<T, E>(result: Result<T, E>): T {
  if (!result.ok) {
    throw new Error(`Expected Ok but got Err: ${JSON.stringify(result.error)}`);
  }
  return result.value;
}

/** Asserts `result` is `Err` and returns its error, for use inside test assertions. */
export function expectErr<T, E>(result: Result<T, E>): E {
  if (result.ok) {
    throw new Error(`Expected Err but got Ok: ${JSON.stringify(result.value)}`);
  }
  return result.error;
}
