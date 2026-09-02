# rest-api-example

A small task-management REST API demonstrating how the AzTFramework packages compose:

- **`@azt/config`** — validates `PORT` / `LOG_LEVEL` from the environment at startup.
- **`@azt/core`** — `Container` wires dependencies (logger, event bus, repository); `Result` powers the repository's fallible lookups.
- **`@azt/logger`** — structured request logging via middleware.
- **`@azt/validation`** — validates request bodies against Zod schemas, returning a `ValidationError` on failure.
- **`@azt/http`** — the `Router`/`createServer` pair, including automatic mapping of thrown `AztError`s to HTTP status codes.
- **`@azt/events`** — an in-process event bus (`task.created`, `task.updated`, `task.deleted`) that a logging handler subscribes to.

This is a reference implementation, not a deployed service.

## Run it

```bash
npm install
npm run build -w rest-api-example
npm run start -w rest-api-example
# or, for local development with hot reload:
npm run dev -w rest-api-example
```

## Endpoints

| Method | Path         | Description                               |
| ------ | ------------ | ----------------------------------------- |
| GET    | `/health`    | Liveness check                            |
| GET    | `/tasks`     | List all tasks                            |
| GET    | `/tasks/:id` | Get a single task (404 if missing)        |
| POST   | `/tasks`     | Create a task (`{ title, description? }`) |
| PATCH  | `/tasks/:id` | Partially update a task                   |
| DELETE | `/tasks/:id` | Delete a task                             |

```bash
curl -X POST localhost:3000/tasks \
  -H 'content-type: application/json' \
  -d '{"title":"Write the README"}'
```

## Tests

```bash
npx vitest run examples/rest-api
```
