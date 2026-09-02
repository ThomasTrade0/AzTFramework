export interface Factory<T> {
  /** Builds a single instance, applying `overrides` on top of the base defaults. */
  build(overrides?: Partial<T>): T;
  /** Builds `count` instances. `overrides` may be a static object or a per-index function. */
  buildList(count: number, overrides?: Partial<T> | ((index: number) => Partial<T>)): T[];
}

/**
 * Creates a test-data factory from a `defaults` function, which is called
 * fresh for every `build()` so objects (and any embedded counters) aren't
 * accidentally shared/mutated across test cases.
 */
export function createFactory<T>(defaults: () => T): Factory<T> {
  return {
    build(overrides = {}) {
      return { ...defaults(), ...overrides };
    },
    buildList(count, overrides = {}) {
      return Array.from({ length: count }, (_, index) => {
        const perItemOverrides = typeof overrides === "function" ? overrides(index) : overrides;
        return { ...defaults(), ...perItemOverrides };
      });
    },
  };
}

let sequenceCounter = 0;

/** Resets the shared counter used by {@link sequence}. Call in `beforeEach` for deterministic tests. */
export function resetSequence(): void {
  sequenceCounter = 0;
}

/** Returns a monotonically increasing integer, handy for unique ids/emails in factories. */
export function sequence(): number {
  sequenceCounter += 1;
  return sequenceCounter;
}
