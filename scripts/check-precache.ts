// Fails the build unless the service worker precaches every file the game
// ships, each within the precache's size limit and all within the install
// budget, so a missed glob or oversized art can't break offline play; and
// unless it ships no recorded sound, since all sound is synthesized (ADR-0004).

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import {
  MAX_TOTAL_BYTES,
  precacheProblems,
  precacheTotal,
  type ShippedFile
} from "./precache.ts"

if (!existsSync("dist/sw.js"))
  throw new Error("No service worker in dist/sw.js.")
const precached = new Set(
  [...readFileSync("dist/sw.js", "utf8").matchAll(/url:"([^"]+)"/g)].map(
    ([, url]) => url
  )
)

const shipped: ShippedFile[] = []
function walk(dir: string) {
  for (const file of readdirSync(dir)) {
    const path = join(dir, file)
    const stats = statSync(path)
    if (stats.isDirectory()) walk(path)
    // The service worker and its runtime are never precached themselves.
    else if (!/^(sw|workbox-[\w-]+)\.js(\.map)?$/.test(file))
      shipped.push({
        file: relative("dist", path).replaceAll("\\", "/"),
        size: stats.size
      })
  }
}
walk("dist")

const problems = precacheProblems(shipped, precached)
if (problems.length > 0) throw new Error(problems.join("\n"))
const total = precacheTotal(shipped)
console.log(
  `Precache verified: all ${shipped.length} files, each below 2 MiB, ` +
    `${(total / 1e6).toFixed(1)} of ${MAX_TOTAL_BYTES / 1e6} MB.`
)
