import { ConfigurationError } from "./errors.js";

/**
 * A typed token identifying a dependency. Using a token (instead of a bare
 * string) lets `resolve()` infer the registered type without casts.
 */
export interface Token<T> {
  readonly id: symbol;
  readonly description: string;
  /** Phantom property only — never assigned. Encodes `T` in the type. */
  readonly __type?: T;
}

export function createToken<T>(description: string): Token<T> {
  return { id: Symbol(description), description };
}

type Factory<T> = (container: Container) => T;

type Registration<T> =
  | { kind: "value"; value: T }
  | { kind: "factory"; factory: Factory<T>; singleton: boolean; instance?: T };

/**
 * A minimal dependency injection container. Supports registering plain
 * values, transient factories, and singleton factories, resolved by typed
 * {@link Token}. Deliberately has no decorators, reflection, or auto-wiring —
 * dependencies are wired explicitly at the composition root, which keeps
 * behavior easy to trace.
 */
export class Container {
  private readonly registrations = new Map<symbol, Registration<unknown>>();

  constructor(private readonly parent?: Container) {}

  registerValue<T>(token: Token<T>, value: T): this {
    this.registrations.set(token.id, { kind: "value", value });
    return this;
  }

  registerFactory<T>(token: Token<T>, factory: Factory<T>): this {
    this.registrations.set(token.id, { kind: "factory", factory, singleton: false });
    return this;
  }

  registerSingleton<T>(token: Token<T>, factory: Factory<T>): this {
    this.registrations.set(token.id, { kind: "factory", factory, singleton: true });
    return this;
  }

  has(token: Token<unknown>): boolean {
    return this.registrations.has(token.id);
  }

  resolve<T>(token: Token<T>): T {
    const registration = this.registrations.get(token.id) as Registration<T> | undefined;
    if (!registration) {
      if (this.parent) return this.parent.resolve(token);
      throw new ConfigurationError(`No registration found for token "${token.description}"`, {
        details: { token: token.description },
      });
    }

    if (registration.kind === "value") {
      return registration.value;
    }

    if (registration.singleton) {
      if (registration.instance === undefined) {
        registration.instance = registration.factory(this);
      }
      return registration.instance;
    }

    return registration.factory(this);
  }

  /** Creates a child container that falls back to this container for unresolved tokens. */
  createScope(): Container {
    return new Container(this);
  }
}
