import { Container, createToken } from "@azt/core";
import type { EventBus } from "@azt/events";
import { createServer } from "@azt/http";
import { createLogger, prettyTransport, type Logger } from "@azt/logger";
import { loadEnv } from "./config.js";
import { createAppEventBus, type AppEvents } from "./domain/events.js";
import { TaskRepository } from "./domain/task.js";
import { createRouter } from "./http/create-router.js";

const LoggerToken = createToken<Logger>("logger");
const EventsToken = createToken<EventBus<AppEvents>>("events");
const TasksToken = createToken<TaskRepository>("tasks");

export interface App {
  server: ReturnType<typeof createServer>;
  env: ReturnType<typeof loadEnv>;
  logger: Logger;
}

/** Wires the example's dependencies together via `@azt/core`'s Container and returns a ready-to-listen server. */
export function buildApp(envSource?: Record<string, string | undefined>): App {
  const env = loadEnv(envSource);

  const container = new Container();
  container.registerSingleton(LoggerToken, () =>
    createLogger({ level: env.LOG_LEVEL, name: "rest-api-example", transport: prettyTransport() }),
  );
  container.registerSingleton(EventsToken, () => createAppEventBus());
  container.registerSingleton(TasksToken, () => new TaskRepository());

  const logger = container.resolve(LoggerToken);
  const events = container.resolve(EventsToken);
  const tasks = container.resolve(TasksToken);

  events.on("task.created", ({ task }) => {
    logger.info("task created", { taskId: task.id });
  });
  events.on("task.deleted", ({ id }) => {
    logger.info("task deleted", { taskId: id });
  });

  const router = createRouter({ tasks, events, logger });
  const server = createServer(router);

  return { server, env, logger };
}
