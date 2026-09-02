import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { App } from "../src/app.js";

describe("rest-api-example", () => {
  let app: App;
  let baseUrl: string;

  beforeEach(async () => {
    app = buildApp({ LOG_LEVEL: "fatal" });
    await new Promise<void>((resolve) => app.server.listen(0, resolve));
    const { port } = app.server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => app.server.close(() => resolve()));
  });

  it("reports healthy on /health", async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("creates, lists, updates and deletes a task end to end", async () => {
    const created = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Write the README" }),
    });
    expect(created.status).toBe(201);
    const task = await created.json();
    expect(task.title).toBe("Write the README");
    expect(task.completed).toBe(false);

    const list = await fetch(`${baseUrl}/tasks`);
    expect((await list.json()).tasks).toHaveLength(1);

    const updated = await fetch(`${baseUrl}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    expect((await updated.json()).completed).toBe(true);

    const deleted = await fetch(`${baseUrl}/tasks/${task.id}`, { method: "DELETE" });
    expect(deleted.status).toBe(204);

    const missing = await fetch(`${baseUrl}/tasks/${task.id}`);
    expect(missing.status).toBe(404);
  });

  it("returns a 400 with validation details for an invalid task", async () => {
    const response = await fetch(`${baseUrl}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error.code).toBe("VALIDATION_ERROR");
  });
});
