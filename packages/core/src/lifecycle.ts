/** Anything that owns a resource (connection, timer, subscription) that must be released. */
export interface Disposable {
  dispose(): void | Promise<void>;
}

/**
 * Collects {@link Disposable}s registered over the lifetime of a component
 * and releases them together, in reverse registration order, from a single
 * `dispose()` call. Disposal errors are collected rather than thrown
 * immediately, so one failing resource cannot prevent the rest from closing.
 */
export class DisposableStore implements Disposable {
  private readonly disposables: Disposable[] = [];
  private disposed = false;

  add<T extends Disposable>(disposable: T): T {
    if (this.disposed) {
      void disposable.dispose();
      return disposable;
    }
    this.disposables.push(disposable);
    return disposable;
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    this.disposed = true;

    const errors: unknown[] = [];
    for (const disposable of this.disposables.reverse()) {
      try {
        await disposable.dispose();
      } catch (error) {
        errors.push(error);
      }
    }
    this.disposables.length = 0;

    if (errors.length > 0) {
      throw new AggregateError(errors, `${errors.length} error(s) occurred during disposal`);
    }
  }

  get isDisposed(): boolean {
    return this.disposed;
  }
}
