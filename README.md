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

## Art

Every image is named by a key in the art manifest (`src/art/manifest.ts`,
ADR-0005). To deliver one, save a PNG of exactly its canvas size as
`art/raw/<key>.png`, for example `art/raw/cat/orange/clingy/content.png`; the
game uses it in place of the code-drawn fallback with no code change. The dev
server reloads when one lands, and the build packs them into WebP atlases. A
file named for no key, or the wrong size, fails the build.

The art brief, `art/brief.md`, lists every image for Astra to generate, in
delivery batches, with a ready-to-paste prompt, size, anchor, what to attach,
and file name for each. It is written from the manifest by `pnpm brief` (prompts
live in `src/art/brief.ts`), which also marks what is delivered; rerun it after
delivering images, since `pnpm test` fails while the brief is out of date. The
style reference sheet goes in `art/reference/`, and the photos of Skadi and
Freya in `art/reference/photos/`, which git ignores.

## Sound

All music and sound effects are synthesized at runtime with Web Audio
(ADR-0004); no audio files ship. The game asks for sound only by name: the
cues and themes in `src/audio/cues.ts`. Each cue's voice is in
`src/audio/voices.ts` (a Cat's scoring cue gets a pitch step that climbs with
each Scoring event), and each theme is note data in `src/audio/themes.ts`, so
either can be rewritten without touching the game. Audio starts at the
player's first tap or key, and follows the Music and SFX volumes and mute in
Settings. In development builds, `window.__clowder.cues()` lists every cue
fired.

## Installing and offline play

Production builds are an installable PWA: `vite-plugin-pwa` generates the
manifest and a Workbox service worker that precaches the whole game, and
`scripts/check-precache.ts` fails the build if any shipped file is missing
from the precache, any file is over 2 MiB, the whole game is over 15 MB, or
an audio file ships. The shell offers to install where the browser supports it
and asks before a new version takes over (`src/shell/pwa.ts`). The service
worker is not registered in development. `pnpm icons` regenerates the icons in
`public/`: simplified 16/32px favicons, 192/512px app icons, a 180px Apple
touch icon, and a 512px maskable icon with both Cats inside the safe zone.
