import {
  AztError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@azt/core";
import type { IncomingMessage, ServerResponse } from "node:http";

const STATUS_BY_ERROR_TYPE = new Map<abstract new (...args: never[]) => AztError, number>([
  [ValidationError, 400],
  [UnauthorizedError, 401],
  [NotFoundError, 404],
  [ConflictError, 409],
]);

function statusForError(error: AztError): number {
  for (const [errorType, status] of STATUS_BY_ERROR_TYPE) {
    if (error instanceof errorType) return status;
  }
  return 500;
}

export type HttpMethodName = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestContext {
  readonly req: IncomingMessage;
  readonly res: ServerResponse;
  readonly method: HttpMethodName;
  readonly path: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: URLSearchParams;
  readonly body: unknown;
  status(code: number): this;
  json(payload: unknown): void;
  send(text: string): void;
  noContent(): void;
}

export type Handler = (ctx: RequestContext) => void | Promise<void>;
export type NextFn = () => Promise<void>;
export type Middleware = (ctx: RequestContext, next: NextFn) => void | Promise<void>;

interface Route {
  method: HttpMethodName;
  segments: string[];
  handler: Handler;
}

function splitPath(path: string): string[] {
  return path.split("/").filter((segment) => segment.length > 0);
}

function matchRoute(
  route: Route,
  method: HttpMethodName,
  segments: string[],
): Record<string, string> | null {
  if (route.method !== method || route.segments.length !== segments.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < route.segments.length; i++) {
    const routeSegment = route.segments[i] as string;
    const actualSegment = segments[i] as string;
    if (routeSegment.startsWith(":")) {
      params[routeSegment.slice(1)] = decodeURIComponent(actualSegment);
    } else if (routeSegment !== actualSegment) {
      return null;
    }
  }
  return params;
}

function composeMiddleware(middlewares: Middleware[], handler: Handler): Handler {
  return function dispatch(ctx: RequestContext): Promise<void> {
    let index = -1;
    async function run(i: number): Promise<void> {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      if (i === middlewares.length) {
        await handler(ctx);
        return;
      }
      const middleware = middlewares[i] as Middleware;
      await middleware(ctx, () => run(i + 1));
    }
    return run(0);
  };
}

/**
 * A minimal, dependency-free HTTP router for Node's `http` module: path
 * params, query parsing, JSON body parsing, and Koa-style `(ctx, next)`
 * middleware. Intentionally does not attempt to be a full framework — reach
 * for something like Express/Fastify/Hono if you need streaming bodies,
 * wildcard routes, or a plugin ecosystem.
 */
export class Router {
  private readonly routes: Route[] = [];
  private readonly middlewares: Middleware[] = [];

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  private register(method: HttpMethodName, path: string, handler: Handler): this {
    this.routes.push({ method, segments: splitPath(path), handler });
    return this;
  }

  get(path: string, handler: Handler): this {
    return this.register("GET", path, handler);
  }
  post(path: string, handler: Handler): this {
    return this.register("POST", path, handler);
  }
  put(path: string, handler: Handler): this {
    return this.register("PUT", path, handler);
  }
  patch(path: string, handler: Handler): this {
    return this.register("PATCH", path, handler);
  }
  delete(path: string, handler: Handler): this {
    return this.register("DELETE", path, handler);
  }

  private async readBody(req: IncomingMessage): Promise<unknown> {
    if (req.method === "GET" || req.method === "DELETE") return undefined;
    const contentType = req.headers["content-type"] ?? "";
    if (!contentType.includes("application/json")) return undefined;

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const raw = Buffer.concat(chunks).toString("utf8");
    if (raw.length === 0) return undefined;
    return JSON.parse(raw);
  }

  private createContext(
    req: IncomingMessage,
    res: ServerResponse,
    method: HttpMethodName,
    path: string,
    params: Record<string, string>,
    query: URLSearchParams,
    body: unknown,
  ): RequestContext {
    let statusCode = 200;
    const ctx: RequestContext = {
      req,
      res,
      method,
      path,
      params,
      query,
      body,
      status(code) {
        statusCode = code;
        return ctx;
      },
      json(payload) {
        res.statusCode = statusCode;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(payload));
      },
      send(text) {
        res.statusCode = statusCode;
        res.setHeader("content-type", "text/plain");
        res.end(text);
      },
      noContent() {
        res.statusCode = 204;
        res.end();
      },
    };
    return ctx;
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = (req.method ?? "GET").toUpperCase() as HttpMethodName;
    const url = new URL(req.url ?? "/", "http://localhost");
    const segments = splitPath(url.pathname);

    for (const route of this.routes) {
      const params = matchRoute(route, method, segments);
      if (!params) continue;

      const body = await this.readBody(req);
      const ctx = this.createContext(
        req,
        res,
        method,
        url.pathname,
        params,
        url.searchParams,
        body,
      );
      try {
        await composeMiddleware(this.middlewares, route.handler)(ctx);
      } catch (error) {
        if (res.headersSent) throw error;
        if (error instanceof AztError) {
          ctx.status(statusForError(error)).json({ error: error.toJSON() });
        } else {
          const message = error instanceof Error ? error.message : "Internal server error";
          ctx.status(500).json({ error: { code: "INTERNAL_ERROR", message } });
        }
      }
      return;
    }

    res.statusCode = 404;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        error: { code: "NOT_FOUND", message: `No route for ${method} ${url.pathname}` },
      }),
    );
  }
}
