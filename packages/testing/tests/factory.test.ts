import { describe, expect, it } from "vitest";
import { createFactory, resetSequence, sequence } from "../src/factory.js";

interface User {
  id: number;
  name: string;
  active: boolean;
}

describe("createFactory", () => {
  it("builds an object from defaults", () => {
    const userFactory = createFactory<User>(() => ({ id: 1, name: "Ada", active: true }));
    expect(userFactory.build()).toEqual({ id: 1, name: "Ada", active: true });
  });

  it("applies overrides on top of defaults", () => {
    const userFactory = createFactory<User>(() => ({ id: 1, name: "Ada", active: true }));
    expect(userFactory.build({ active: false })).toEqual({ id: 1, name: "Ada", active: false });
  });

  it("builds a list, applying static overrides to every item", () => {
    const userFactory = createFactory<User>(() => ({ id: 1, name: "Ada", active: true }));
    const users = userFactory.buildList(3, { active: false });
    expect(users).toHaveLength(3);
    expect(users.every((u) => u.active === false)).toBe(true);
  });

  it("builds a list with per-index overrides", () => {
    const userFactory = createFactory<User>(() => ({ id: 0, name: "Ada", active: true }));
    const users = userFactory.buildList(3, (index) => ({ id: index }));
    expect(users.map((u) => u.id)).toEqual([0, 1, 2]);
  });

  it("does not share mutable state produced by the defaults function across builds", () => {
    const listFactory = createFactory(() => ({ tags: [] as string[] }));
    const a = listFactory.build();
    a.tags.push("x");
    const b = listFactory.build();
    expect(b.tags).toEqual([]);
  });
});

describe("sequence", () => {
  it("increments on each call and can be reset", () => {
    resetSequence();
    expect(sequence()).toBe(1);
    expect(sequence()).toBe(2);
    resetSequence();
    expect(sequence()).toBe(1);
  });
});
