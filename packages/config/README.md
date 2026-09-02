# @azt/config

Typed, validated configuration loading from environment variables (built on Zod).

Part of [AzTFramework](https://github.com/ThomasTrade0/AzTFramework) — see the
main repo for architecture notes, the full package list, and runnable examples.

## Install

```bash
npm install @azt/config
```

## Example

```ts
import { loadConfig, z } from "@azt/config";

const result = loadConfig(z.object({ PORT: z.coerce.number().default(3000) }));
```

## Docs

Full API reference: [github.com/ThomasTrade0/AzTFramework/tree/main/packages/config](https://github.com/ThomasTrade0/AzTFramework/tree/main/packages/config)

## License

MIT © Thomas Azarian
