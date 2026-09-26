// Prints the balance report (scripts/balance.ts): `pnpm sim --runs 100`, with
// config overrides by path such as `--voidGrowth 3`.

import { runnerImport } from "vite"

// The simulation plays the game's own TypeScript, which Node can't load alone,
// so Vite's module runner loads it (as in scripts/brief.ts).
const load = async <T>(path: string) =>
  (await runnerImport<T>(path, { configFile: false, logLevel: "silent" }))
    .module
const { simArgs, simulate } = await load<typeof import("./balance.ts")>(
  "/scripts/balance.ts"
)
const { defaultConfig } = await load<typeof import("../src/engine/index.ts")>(
  "/src/engine/index.ts"
)

const started = Date.now()
console.log(simulate(simArgs(process.argv.slice(2), defaultConfig)))
console.error(`\nSimulated in ${((Date.now() - started) / 1000).toFixed(0)}s.`)
