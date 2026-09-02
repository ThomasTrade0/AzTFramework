# @azt/logger

Structured, leveled logging with child loggers and pluggable transports.

Part of [AzTFramework](https://github.com/ThomasTrade0/AzTFramework) — see the
main repo for architecture notes, the full package list, and runnable examples.

## Install

```bash
npm install @azt/logger
```

## Example

```ts
import { createLogger } from "@azt/logger";

const logger = createLogger({ name: "api" });
logger.info("request handled", { requestId: "abc-123" });
```

## Docs

Full API reference: [github.com/ThomasTrade0/AzTFramework/tree/main/packages/logger](https://github.com/ThomasTrade0/AzTFramework/tree/main/packages/logger)

## License

MIT © Thomas Azarian
