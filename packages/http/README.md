# @azt/http

A fetch-based HTTP client with retries/timeouts, and a minimal Node HTTP router.

Part of [AzTFramework](https://github.com/ThomasTrade0/AzTFramework) — see the
main repo for architecture notes, the full package list, and runnable examples.

## Install

```bash
npm install @azt/http
```

## Example

```ts
import { createHttpClient, Router, createServer } from "@azt/http";

const client = createHttpClient({ baseUrl: "https://api.example.com" });

const router = new Router();
router.get("/health", (ctx) => ctx.json({ status: "ok" }));
createServer(router).listen(3000);
```

## Docs

Full API reference: [github.com/ThomasTrade0/AzTFramework/tree/main/packages/http](https://github.com/ThomasTrade0/AzTFramework/tree/main/packages/http)

## License

MIT © Thomas Azarian
