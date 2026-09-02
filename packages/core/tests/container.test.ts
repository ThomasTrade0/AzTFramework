import { describe, expect, it } from "vitest";
import { Container, createToken } from "../src/container.js";
import { ConfigurationError } from "../src/errors.js";

interface Clock {
  now(): number;
}

describe("Container", () => {
  it("resolves a registered value", () => {
    const token = createToken<string>("greeting");
    const container = new Container();
    container.registerValue(token, "hello");
    expect(container.resolve(token)).toBe("hello");
  });

  it("throws a ConfigurationError for an unregistered token", () => {
    const token = createToken<string>("missing");
    const container = new Container();
    expect(() => container.resolve(token)).toThrow(ConfigurationError);
  });

  it("invokes the factory on every resolve for a transient registration", () => {
    const token = createToken<{ id: number }>("transient");
    let calls = 0;
    const container = new Container();
    container.registerFactory(token, () => ({ id: ++calls }));

    expect(container.resolve(token).id).toBe(1);
    expect(container.resolve(token).id).toBe(2);
  });

  it("caches the instance for a singleton registration", () => {
    const token = createToken<Clock>("clock");
    let calls = 0;
    const container = new Container();
    container.registerSingleton(token, () => {
      calls += 1;
      return { now: () => Date.now() };
    });

    const first = container.resolve(token);
    const second = container.resolve(token);
    expect(first).toBe(second);
    expect(calls).toBe(1);
  });

  it("lets a factory resolve other dependencies from the same container", () => {
    const nameToken = createToken<string>("name");
    const greeterToken = createToken<() => string>("greeter");
    const container = new Container();
    container.registerValue(nameToken, "Ada");
    container.registerFactory(greeterToken, (c) => () => `Hello, ${c.resolve(nameToken)}!`);

    expect(container.resolve(greeterToken)()).toBe("Hello, Ada!");
  });

  it("falls back to the parent container for tokens not registered on the scope", () => {
    const token = createToken<string>("shared");
    const parent = new Container();
    parent.registerValue(token, "from-parent");
    const scope = parent.createScope();

    expect(scope.resolve(token)).toBe("from-parent");

    const overrideToken = createToken<string>("scoped");
    parent.registerValue(overrideToken, "parent-value");
    scope.registerValue(overrideToken, "scope-value");
    expect(scope.resolve(overrideToken)).toBe("scope-value");
    expect(parent.resolve(overrideToken)).toBe("parent-value");
  });
});
