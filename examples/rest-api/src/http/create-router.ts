import { validate } from "@azt/validation";
import { Router } from "@azt/http";
import type { Logger } from "@azt/logger";
import type { EventBus } from "@azt/events";
import { createTaskSchema, updateTaskSchema, type TaskRepository } from "../domain/task.js";
import type { AppEvents } from "../domain/events.js";

export interface RouterDependencies {
  tasks: TaskRepository;
  events: EventBus<AppEvents>;
  logger: Logger;
}

export function createRouter({ tasks, events, logger }: RouterDependencies): Router {
  const router = new Router();

  router.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    logger.info("request handled", {
      method: ctx.method,
      path: ctx.path,
      status: ctx.res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  router.get("/health", (ctx) => {
    ctx.json({ status: "ok" });
  });

  router.get("/tasks", (ctx) => {
    ctx.json({ tasks: tasks.list() });
  });

  router.get("/tasks/:id", (ctx) => {
    const result = tasks.get(ctx.params.id as string);
    if (!result.ok) throw result.error;
    ctx.json(result.value);
  });

  router.post("/tasks", async (ctx) => {
    const input = validate(createTaskSchema, ctx.body);
    if (!input.ok) throw input.error;

    const task = tasks.create(input.value);
    await events.emit("task.created", { task });
    ctx.status(201).json(task);
  });

  router.patch("/tasks/:id", async (ctx) => {
    const input = validate(updateTaskSchema, ctx.body);
    if (!input.ok) throw input.error;

    const result = tasks.update(ctx.params.id as string, input.value);
    if (!result.ok) throw result.error;

    await events.emit("task.updated", { task: result.value });
    ctx.json(result.value);
  });

  router.delete("/tasks/:id", async (ctx) => {
    const result = tasks.remove(ctx.params.id as string);
    if (!result.ok) throw result.error;

    await events.emit("task.deleted", { id: ctx.params.id as string });
    ctx.noContent();
  });

  return router;
}
