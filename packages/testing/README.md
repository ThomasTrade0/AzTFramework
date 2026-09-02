# @azt/testing

Test utilities for AzTFramework applications: factories, a scriptable fetch mock, and Result assertions.

Part of [AzTFramework](https://github.com/ThomasTrade0/AzTFramework) — see the
main repo for architecture notes, the full package list, and runnable examples.

## Install

```bash
npm install @azt/testing
```

## Example

```ts
import { createFactory, MockFetch, expectOk } from "@azt/testing";

const userFactory = createFactory(() => ({ id: "1", name: "Ada" }));
```

## Docs

Full API reference: [github.com/ThomasTrade0/AzTFramework/tree/main/packages/testing](https://github.com/ThomasTrade0/AzTFramework/tree/main/packages/testing)

## License

MIT © Thomas Azarian
