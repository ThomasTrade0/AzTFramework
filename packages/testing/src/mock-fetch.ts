export interface MockRoute {
  method?: string;
  /** Matched against the request URL's pathname, either exactly or via RegExp. */
  path: string | RegExp;
  respond: (request: Request) => Response | Promise<Response>;
}

export interface MockFetchCall {
  method: string;
  url: string;
  request: Request;
}

/**
 * A minimal scriptable `fetch` replacement for unit-testing code built on
 * `@azt/http`'s client (or any `fetch`-based code). Register routes, pass
 * `.fetch` as `fetchImpl`, then assert against `.calls`.
 */
export class MockFetch {
  readonly calls: MockFetchCall[] = [];
  private readonly routes: MockRoute[] = [];

  route(route: MockRoute): this {
    this.routes.push(route);
    return this;
  }

  fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const request = input instanceof Request ? input : new Request(input, init);
    const url = new URL(request.url);
    this.calls.push({ method: request.method, url: request.url, request });

    const match = this.routes.find(
      (route) =>
        (!route.method || route.method === request.method) &&
        (typeof route.path === "string"
          ? route.path === url.pathname
          : route.path.test(url.pathname)),
    );

    if (!match) {
      return new Response(JSON.stringify({ error: "no mock route matched" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    return match.respond(request);
  };
}

export function jsonMockResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
}
