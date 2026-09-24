// Fails the build unless the service worker precaches every file the game
// ships, so a missed glob or an oversized bundle can't break offline play.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

const MAX_BYTES = 2 * 1024 * 1024

if (!existsSync("dist/sw.js"))
  throw new Error("No service worker in dist/sw.js.")
const precached = new Set(
  [...readFileSync("dist/sw.js", "utf8").matchAll(/url:"([^"]+)"/g)].map(
    ([, url]) => url
  )
)

const shipped = []
function walk(dir) {
  for (const file of readdirSync(dir)) {
    const path = join(dir, file)
    if (statSync(path).isDirectory()) walk(path)
    // The service worker and its runtime are never precached themselves.
    else if (!/^(sw|workbox-[\w-]+)\.js(\.map)?$/.test(file))
      shipped.push(relative("dist", path).replaceAll("\\", "/"))
  }
}
walk("dist")

for (const required of ["index.html", "manifest.webmanifest"])
  if (!shipped.includes(required)) throw new Error(`Not built: ${required}`)
for (const file of shipped) {
  if (statSync(join("dist", file)).size > MAX_BYTES)
    throw new Error(`Too large to precache: ${file}`)
  if (!precached.has(file)) throw new Error(`Missing from precache: ${file}`)
}
console.log(`Precache verified: all ${shipped.length} files, each below 2 MiB.`)
