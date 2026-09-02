# @azt/events

A small, strongly-typed in-process event bus with async emit and isolated handler errors.

Part of [AzTFramework](https://github.com/ThomasTrade0/AzTFramework) — see the
main repo for architecture notes, the full package list, and runnable examples.

## Install

```bash
npm install @azt/events
```

## Example

```ts
import { EventBus } from "@azt/events";

interface Events {
  "user.created": { id: string };
}
const bus = new EventBus<Events>();
bus.on("user.created", ({ id }) => console.log(id));
```

## Docs

Full API reference: [github.com/ThomasTrade0/AzTFramework/tree/main/packages/events](https://github.com/ThomasTrade0/AzTFramework/tree/main/packages/events)

## License

MIT © Thomas Azarian
