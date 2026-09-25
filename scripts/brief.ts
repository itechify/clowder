// Writes the art brief (src/art/brief.ts) to art/brief.md, marking each image
// delivered or still on fallback by whether its file is in the repo.

import { existsSync, writeFileSync } from "node:fs"
import { runnerImport } from "vite"

// The brief and manifest are the game's own TypeScript, which Node can't load
// alone, so Vite's module runner loads them (as in scripts/artPlugin.ts).
const load = async <T>(path: string) =>
  (await runnerImport<T>(path, { configFile: false, logLevel: "silent" }))
    .module
const { artBrief, BRIEF } =
  await load<typeof import("../src/art/brief.ts")>("/src/art/brief.ts")
const { artManifest } = await load<typeof import("../src/art/manifest.ts")>(
  "/src/art/manifest.ts"
)

writeFileSync(BRIEF, artBrief(artManifest, existsSync))
console.log(`Wrote the art brief to ${BRIEF}.`)
