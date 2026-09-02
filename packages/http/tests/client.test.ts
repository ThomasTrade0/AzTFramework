import { describe, expect, it, vi } from "vitest";
import { createHttpClient } from "../src/client.js";
import { HttpError } from "../src/errors.js";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("createHttpClient", () => {
  it("performs a GET request against baseUrl + path", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }));
    const client = createHttpClient({ baseUrl: "https://api.example.com", fetchImpl });

    const result = await client.get<{ id: number }>("/users/1");

    expect(result).toEqual({ id: 1 });
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.example.com/users/1");
    expect(init.method).toBe("GET");
  });

  it("sends a JSON body and content-type header for POST", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createHttpClient({ baseUrl: "https://api.example.com", fetchImpl });

    await client.post("/users", { name: "Ada" });

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify({ name: "Ada" }));
    expect((init.headers as Record<string, string>)["content-type"]).toBe("application/json");
  });

  it("appends query parameters", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}));
    const client = createHttpClient({ baseUrl: "https://api.example.com", fetchImpl });

    await client.get("/search", { query: { q: "typescript", page: 2, ignore: undefined } });

    const [url] = fetchImpl.mock.calls[0] as [string];
    expect(url).toBe("https://api.example.com/search?q=typescript&page=2");
  });

  it("throws HttpError immediately for a 4xx response without retrying", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ message: "bad input" }, { status: 400 }));
    const client = createHttpClient({ baseUrl: "https://api.example.com", fetchImpl, retries: 3 });

    await expect(client.get("/x")).rejects.toBeInstanceOf(HttpError);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("retries a 5xx response and succeeds once the server recovers", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ recovered: true }));
    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      fetchImpl,
      retries: 1,
      retryDelayMs: 1,
    });

    const result = await client.get<{ recovered: boolean }>("/flaky");

    expect(result).toEqual({ recovered: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("wraps a network-level rejection as an HttpError after exhausting retries", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("network down"));
    const client = createHttpClient({
      baseUrl: "https://api.example.com",
      fetchImpl,
      retries: 1,
      retryDelayMs: 1,
    });

    await expect(client.get("/x")).rejects.toBeInstanceOf(HttpError);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
