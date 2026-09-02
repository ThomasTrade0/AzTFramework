# @azt/validation

Result-typed validation helpers built on Zod schemas.

Part of [AzTFramework](https://github.com/ThomasTrade0/AzTFramework) — see the
main repo for architecture notes, the full package list, and runnable examples.

## Install

```bash
npm install @azt/validation
```

## Example

```ts
import { validate, z } from "@azt/validation";

const result = validate(z.object({ email: z.string().email() }), input);
```

## Docs

Full API reference: [github.com/ThomasTrade0/AzTFramework/tree/main/packages/validation](https://github.com/ThomasTrade0/AzTFramework/tree/main/packages/validation)

## License

MIT © Thomas Azarian
