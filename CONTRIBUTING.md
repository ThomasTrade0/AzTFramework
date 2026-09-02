# Contributing to AzTFramework

Thanks for considering a contribution. This is a young, pre-1.0 project, so
process is intentionally lightweight.

## Getting started

```bash
git clone https://github.com/ThomasTrade0/AzTFramework.git
cd AzTFramework
npm install
npm run build
npm test
```

## Project layout

- `packages/*` — the published `@azt/*` packages (see [README.md](README.md#package-structure))
- `examples/*` — runnable applications built on the packages, used as integration tests
- Each package/example has its own `src/`, `tests/`, `package.json`, and `tsconfig.json`

## Making a change

1. Create a branch off `main`.
2. Make your change. If you're touching a package's public API, add or update
   tests in that package's `tests/` directory.
3. Run the full check suite before opening a PR. Build the packages first —
   `@azt/*` packages resolve each other through `node_modules` →
   `dist/index.d.ts`, not source path-mapping, so lint and typecheck need a
   build to see accurate cross-package types:

   ```bash
   npm run build
   npm run lint
   npm run typecheck
   npm test
   npm run build:examples
   ```

4. Open a pull request describing **why**, not just what — the diff already
   shows what changed.

## Style

- TypeScript strict mode; avoid `any` (the lint config enforces this).
- Prefer `Result<T, E>` from `@azt/core` over throwing for expected,
  recoverable failures; reserve exceptions for programmer errors and truly
  exceptional conditions.
- No comments that restate what the code does — only comments that explain a
  non-obvious _why_.
- Run `npm run format` before committing; CI enforces `prettier --check`.

## Adding a new package

A new `@azt/*` package should only be added if it solves a problem the
existing packages don't — see the philosophy section in
[README.md](README.md#philosophy). Follow the structure of an existing
package (e.g. `packages/logger`) for `package.json`, `tsconfig.json`, and
`tsup.config.ts`.

## Commit messages

Write commit messages that explain the _why_ behind a change. There's no
enforced commit convention (e.g. Conventional Commits) yet.

## Code of Conduct

This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).
