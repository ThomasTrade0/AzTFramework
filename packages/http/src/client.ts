import { HttpError } from "./errors.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  /** Per-request override of the client's default timeout. */
  timeoutMs?: number;
  /** Per-request override of the client's default retry count. */
  retries?: number;
  signal?: AbortSignal;
}

export interface HttpClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  /** Number of retry attempts for network errors and 5xx responses. Defaults to 2. */
  retries?: number;
  /** Base delay for exponential backoff between retries, in ms. Defaults to 200. */
  retryDelayMs?: number;
  fetchImpl?: typeof fetch;
}

export interface HttpClient {
  get<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
  post<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T = unknown>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
  request<T = unknown>(
    method: HttpMethod,
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<T>;
}

function buildUrl(
  baseUrl: string | undefined,
  path: string,
  query?: RequestOptions["query"],
): string {
  const url = new URL(path, baseUrl ?? "http://localhost");
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return baseUrl ? url.toString() : url.pathname + url.search;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json().catch(() => undefined);
  }
  const text = await response.text().catch(() => "");
  return text.length > 0 ? text : undefined;
}

/**
 * Creates an {@link HttpClient} backed by the platform `fetch`. Retries GET
 * and transient failures (network errors, 5xx) with exponential backoff;
 * 4xx responses are treated as non-retryable client errors and surfaced
 * immediately as an {@link HttpError}.
 */
export function createHttpClient(options: HttpClientOptions = {}): HttpClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const defaultRetries = options.retries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 200;
  const defaultTimeoutMs = options.timeoutMs ?? 10_000;

  async function request<T>(
    method: HttpMethod,
    path: string,
    body: unknown,
    requestOptions: RequestOptions = {},
  ): Promise<T> {
    const url = buildUrl(options.baseUrl, path, requestOptions.query);
    const maxAttempts = (requestOptions.retries ?? defaultRetries) + 1;
    const timeoutMs = requestOptions.timeoutMs ?? defaultTimeoutMs;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      requestOptions.signal?.addEventListener("abort", () => controller.abort());

      try {
        const response = await fetchImpl(url, {
          method,
          headers: {
            ...(body !== undefined ? { "content-type": "application/json" } : {}),
            ...options.headers,
            ...requestOptions.headers,
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          const responseBody = await parseBody(response);
          const error = new HttpError(`Request to ${url} failed with status ${response.status}`, {
            status: response.status,
            body: responseBody,
          });
          if (response.status < 500 || attempt === maxAttempts) throw error;
          lastError = error;
          await sleep(retryDelayMs * 2 ** (attempt - 1));
          continue;
        }

        return (await parseBody(response)) as T;
      } catch (error) {
        clearTimeout(timeout);
        if (error instanceof HttpError) throw error;

        lastError = error;
        if (attempt === maxAttempts) {
          throw new HttpError(`Request to ${url} failed: ${(error as Error).message}`, {
            cause: error,
          });
        }
        await sleep(retryDelayMs * 2 ** (attempt - 1));
      }
    }

    throw lastError instanceof Error ? lastError : new HttpError(`Request to ${url} failed`);
  }

  return {
    get: (path, requestOptions) => request("GET", path, undefined, requestOptions),
    post: (path, body, requestOptions) => request("POST", path, body, requestOptions),
    put: (path, body, requestOptions) => request("PUT", path, body, requestOptions),
    patch: (path, body, requestOptions) => request("PATCH", path, body, requestOptions),
    delete: (path, requestOptions) => request("DELETE", path, undefined, requestOptions),
    request,
  };
}
