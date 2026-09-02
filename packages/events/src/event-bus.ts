/** Maps event names to the payload type each event carries. */
export type EventMap = Record<string, unknown>;

/**
 * A self-referential constraint (`T extends Record<keyof T, unknown>`)
 * instead of `T extends EventMap` — plain object types/interfaces declared
 * with fixed keys don't structurally satisfy `Record<string, unknown>` as a
 * generic constraint (TypeScript requires an explicit index signature for
 * that), but they always satisfy `Record<keyof T, unknown>` since `keyof T`
 * is derived from `T` itself. This lets consumers declare their event map as
 * a plain `interface { "foo.bar": Payload }` with no extra boilerplate.
 */
export type Handler<T> = (payload: T) => void | Promise<void>;

export type Unsubscribe = () => void;

export type ErrorHandler<Events extends Record<keyof Events, unknown>> = (
  error: unknown,
  event: keyof Events,
) => void;

/**
 * A strongly-typed, in-process publish/subscribe bus. `emit` runs handlers
 * concurrently and waits for all of them; a handler that throws does not
 * prevent its siblings from running — the error is reported to any
 * registered {@link ErrorHandler}s instead of rejecting `emit`.
 *
 * Not a substitute for a durable message queue: state lives only in memory
 * and is lost on process restart. Use {@link EventBus} for in-process
 * decoupling (e.g. "task created" triggering a notification), and a real
 * queue (`@azt/queue`, on the roadmap) for anything that must survive a
 * crash or cross a process boundary.
 */
export class EventBus<Events extends Record<keyof Events, unknown>> {
  private readonly handlers = new Map<keyof Events, Set<Handler<unknown>>>();
  private readonly errorHandlers = new Set<ErrorHandler<Events>>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): Unsubscribe {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as unknown as Handler<unknown>);
    this.handlers.set(event, set);
    return () => this.off(event, handler);
  }

  once<K extends keyof Events>(event: K, handler: Handler<Events[K]>): Unsubscribe {
    const wrapped: Handler<Events[K]> = async (payload) => {
      unsubscribe();
      await handler(payload);
    };
    const unsubscribe = this.on(event, wrapped);
    return unsubscribe;
  }

  off<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    this.handlers.get(event)?.delete(handler as unknown as Handler<unknown>);
  }

  onError(handler: ErrorHandler<Events>): Unsubscribe {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  listenerCount<K extends keyof Events>(event: K): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  async emit<K extends keyof Events>(event: K, payload: Events[K]): Promise<void> {
    const set = this.handlers.get(event);
    if (!set || set.size === 0) return;

    await Promise.all(
      [...set].map(async (handler) => {
        try {
          await handler(payload);
        } catch (error) {
          this.reportError(error, event);
        }
      }),
    );
  }

  private reportError(error: unknown, event: keyof Events): void {
    if (this.errorHandlers.size === 0) {
      console.error(`Unhandled error in handler for event "${String(event)}":`, error);
      return;
    }
    for (const handler of this.errorHandlers) handler(error, event);
  }
}
