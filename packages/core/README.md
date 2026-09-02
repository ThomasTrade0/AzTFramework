# @azt/core

Result type, error model, a lightweight DI container and disposable lifecycles.

Part of [AzTFramework](https://github.com/ThomasTrade0/AzTFramework) — see the
main repo for architecture notes, the full package list, and runnable examples.

## Install

```bash
npm install @azt/core
```

## Example

```ts
import { Container, createToken, ok, err, type Result } from "@azt/core";

function parsePort(value: string): Result<number, Error> {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? ok(port) : err(new Error("invalid port"));
}
```

## Docs

Full API reference: [github.com/ThomasTrade0/AzTFramework/tree/main/packages/core](https://github.com/ThomasTrade0/AzTFramework/tree/main/packages/core)

## License

MIT © Thomas Azarian
