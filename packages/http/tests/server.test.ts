import { NotFoundError, ValidationError } from "@azt/core";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";
import { Router } from "../src/router.js";
import type { Server } from "node:http";

describe("Router + createServer", () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    const router = new Router();

    router.use(async (ctx, next) => {
      ctx.res.setHeader("x-request-id", "test-request");
      await next();
    });

    const tasks = new Map<string, { id: string; title: string }>([
      ["1", { id: "1", title: "Write docs" }],
    ]);

    router.get("/tasks/:id", (ctx) => {
      const task = tasks.get(ctx.params.id as string);
      if (!task) throw new NotFoundError(`Task ${ctx.params.id} not found`);
      ctx.json(task);
    });

    router.post("/tasks", (ctx) => {
      const body = ctx.body as { title?: string } | undefined;
      if (!body?.title) throw new ValidationError("title is required");
      const id = String(tasks.size + 1);
      const task = { id, title: body.title };
      tasks.set(id, task);
      ctx.status(201).json(task);
    });

    router.get("/search", (ctx) => {
      ctx.json({ q: ctx.query.get("q") });
    });

    server = createServer(router);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("matches path params and returns JSON", async () => {
    const response = await fetch(`${baseUrl}/tasks/1`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ id: "1", title: "Write docs" });
  });

  it("parses a JSON body and returns 201 on creation", async () => {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Ship feature" }),
    });
    expect(response.status).toBe(201);
    expect((await response.json()).title).toBe("Ship feature");
  });

  it("parses query parameters", async () => {
    const response = await fetch(`${baseUrl}/search?q=typescript`);
    expect(await response.json()).toEqual({ q: "typescript" });
  });

  it("maps a thrown NotFoundError to a 404 JSON error body", async () => {
    const response = await fetch(`${baseUrl}/tasks/missing`);
    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.error.code).toBe("NOT_FOUND");
  });

  it("maps a thrown ValidationError to a 400 JSON error body", async () => {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 for an unmatched route", async () => {
    const response = await fetch(`${baseUrl}/does-not-exist`);
    expect(response.status).toBe(404);
  });

  it("runs global middleware before the handler", async () => {
    const response = await fetch(`${baseUrl}/tasks/1`);
    expect(response.headers.get("x-request-id")).toBe("test-request");
  });
});
