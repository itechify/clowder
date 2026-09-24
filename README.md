# Clowder

A cozy cat-collecting roguelike. See `CONTEXT.md` for the domain vocabulary and
`docs/adr/` for the decisions behind the rules engine and renderer.

## Development

```sh
pnpm install
pnpm dev          # serve the game
pnpm test         # rules engine (Vitest)
pnpm test:e2e     # smoke test (Playwright, drives the dev server)
pnpm typecheck
pnpm check        # Biome
```

`?seed=<n>` in the URL starts a reproducible Run. In development builds,
`window.__clowder` exposes the Run to end-to-end tests.
