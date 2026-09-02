import { EventBus } from "@azt/events";
import type { Task } from "./task.js";

export interface AppEvents {
  "task.created": { task: Task };
  "task.updated": { task: Task };
  "task.deleted": { id: string };
}

export function createAppEventBus(): EventBus<AppEvents> {
  return new EventBus<AppEvents>();
}
