import { err, NotFoundError, ok, type Result } from "@azt/core";
import { z } from "@azt/validation";

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completed: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** An in-memory task store. A real service would swap this for `@azt/data` over Postgres. */
export class TaskRepository {
  private readonly tasks = new Map<string, Task>();
  private nextId = 1;

  list(): Task[] {
    return [...this.tasks.values()];
  }

  get(id: string): Result<Task, NotFoundError> {
    const task = this.tasks.get(id);
    return task ? ok(task) : err(new NotFoundError(`Task "${id}" not found`, { details: { id } }));
  }

  create(input: CreateTaskInput): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: String(this.nextId++),
      title: input.title,
      description: input.description,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  update(id: string, patch: UpdateTaskInput): Result<Task, NotFoundError> {
    const existing = this.tasks.get(id);
    if (!existing) return err(new NotFoundError(`Task "${id}" not found`, { details: { id } }));

    const updated: Task = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    this.tasks.set(id, updated);
    return ok(updated);
  }

  remove(id: string): Result<void, NotFoundError> {
    if (!this.tasks.delete(id)) {
      return err(new NotFoundError(`Task "${id}" not found`, { details: { id } }));
    }
    return ok(undefined);
  }
}
