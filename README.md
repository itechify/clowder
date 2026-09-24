# Clowder

A cozy cat-collecting roguelike. See `CONTEXT.md` for the domain vocabulary and
`docs/adr/` for the decisions behind the rules engine and renderer.

## Development

```sh
pnpm install
pnpm dev          # serve the game
pnpm test         # rules engine (Vitest)
pnpm test:e2e     # Playwright: smoke test on the dev server, PWA on a build
pnpm typecheck
pnpm check        # Biome
pnpm build        # production build, then verifies the precache
pnpm deploy       # build and publish to Cloudflare via Wrangler
```

`?seed=<n>` in the URL starts a reproducible Run. In development builds,
`window.__clowder` exposes the Run to end-to-end tests.

## Installing and offline play

Production builds are an installable PWA: `vite-plugin-pwa` generates the
manifest and a Workbox service worker that precaches the whole game, and
`scripts/check-precache.mjs` fails the build if any shipped file is missing
from the precache. The shell offers to install where the browser supports it
and asks before a new version takes over (`src/shell/pwa.ts`). The service
worker is not registered in development. `pnpm icons` regenerates the icons in
`public/`.
