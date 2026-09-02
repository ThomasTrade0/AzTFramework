import { describe, expect, it } from "vitest";
import { jsonMockResponse, MockFetch } from "../src/mock-fetch.js";

describe("MockFetch", () => {
  it("routes a matching request to its handler", async () => {
    const mock = new MockFetch().route({
      method: "GET",
      path: "/users/1",
      respond: () => jsonMockResponse({ id: 1, name: "Ada" }),
    });

    const response = await mock.fetch("https://api.example.com/users/1");

    expect(await response.json()).toEqual({ id: 1, name: "Ada" });
  });

  it("matches paths using a RegExp", async () => {
    const mock = new MockFetch().route({
      path: /^\/users\/\d+$/,
      respond: () => jsonMockResponse({ matched: true }),
    });

    const response = await mock.fetch("https://api.example.com/users/42");
    expect(await response.json()).toEqual({ matched: true });
  });

  it("returns a 404 when no route matches", async () => {
    const mock = new MockFetch();
    const response = await mock.fetch("https://api.example.com/unknown");
    expect(response.status).toBe(404);
  });

  it("records every call for later assertions", async () => {
    const mock = new MockFetch().route({ path: "/ping", respond: () => jsonMockResponse({}) });

    await mock.fetch("https://api.example.com/ping", { method: "POST" });

    expect(mock.calls).toHaveLength(1);
    expect(mock.calls[0]?.method).toBe("POST");
    expect(mock.calls[0]?.url).toBe("https://api.example.com/ping");
  });
});
