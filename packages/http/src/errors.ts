import { AztError, type AztErrorOptions } from "@azt/core";

/** Thrown by {@link HttpClient} when a request fails after exhausting retries. */
export class HttpError extends AztError {
  readonly status?: number;
  readonly body?: unknown;

  constructor(
    message: string,
    options: AztErrorOptions & { status?: number; body?: unknown } = {},
  ) {
    super(message, {
      code: options.code ?? "HTTP_ERROR",
      cause: options.cause,
      details: options.details,
    });
    this.status = options.status;
    this.body = options.body;
  }
}
