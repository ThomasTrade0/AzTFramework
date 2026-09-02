/** Optional structured detail attached to an {@link AztError}. */
export type ErrorDetails = Record<string, unknown>;

export interface AztErrorOptions {
  code?: string;
  cause?: unknown;
  details?: ErrorDetails;
}

/**
 * Base class for all framework and application errors. Carries a stable
 * machine-readable `code` (defaults to the constructor name) and optional
 * structured `details`, so callers can branch on `code` instead of parsing
 * `message` strings, and API layers can serialize errors consistently.
 */
export class AztError extends Error {
  readonly code: string;
  readonly details?: ErrorDetails;

  constructor(message: string, options: AztErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = this.constructor.name;
    this.code = options.code ?? this.constructor.name;
    this.details = options.details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON(): { name: string; code: string; message: string; details?: ErrorDetails } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}

export class ValidationError extends AztError {
  constructor(message: string, options: AztErrorOptions = {}) {
    super(message, { code: "VALIDATION_ERROR", ...options });
  }
}

export class NotFoundError extends AztError {
  constructor(message: string, options: AztErrorOptions = {}) {
    super(message, { code: "NOT_FOUND", ...options });
  }
}

export class ConflictError extends AztError {
  constructor(message: string, options: AztErrorOptions = {}) {
    super(message, { code: "CONFLICT", ...options });
  }
}

export class UnauthorizedError extends AztError {
  constructor(message: string, options: AztErrorOptions = {}) {
    super(message, { code: "UNAUTHORIZED", ...options });
  }
}

export class ConfigurationError extends AztError {
  constructor(message: string, options: AztErrorOptions = {}) {
    super(message, { code: "CONFIGURATION_ERROR", ...options });
  }
}

/** Type guard for narrowing an unknown caught value to an {@link AztError}. */
export function isAztError(value: unknown): value is AztError {
  return value instanceof AztError;
}
