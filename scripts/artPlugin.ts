import { resolve, sep } from "node:path"
import { type Plugin, runnerImport, type ViteDevServer } from "vite"
import type { ArtEntry } from "../src/art/manifest.ts"
import { type Atlas, buildAtlas, pngsIn } from "./atlas.ts"

/** Where the author drops delivered images, as `<key>.png`. */
const RAW = "art/raw"
/** Where the packed atlas is served from, under the site's base. */
const OUT = "art"
const VIRTUAL = "virtual:art-atlas"
const RESOLVED = `\0${VIRTUAL}`
const MANIFEST = "/src/art/manifest.ts"

/**
 * Packs the delivered images into atlas pages (scripts/atlas.ts) and tells the
 * game where they are through `virtual:art-atlas`: the multi-atlas's URL and
 * its pages' folder, or null while nothing has been delivered. A build emits
 * the pages alongside the bundle for the service worker to precache; the dev
 * server serves them from memory and reloads the page when a delivery lands.
 */
export function artAtlas(): Plugin {
  let root = "."
  let rawDir = RAW
  let base = "/"
  let atlas: Atlas | null = null
  let server: ViteDevServer | undefined
  // The manifest is the game's own TypeScript, so Vite loads it as the game
  // would rather than the config importing it: through the dev server when
  // there is one, otherwise through a module runner of its own.
  const manifest = async () => {
    const { artManifest } = server
      ? await server.ssrLoadModule(MANIFEST)
      : (
          await runnerImport<{ artManifest: ArtEntry[] }>(MANIFEST, {
            root,
            configFile: false,
            logLevel: "silent"
          })
        ).module
    return artManifest as ArtEntry[]
  }
  const pack = async () =>
    pngsIn(rawDir).length === 0 ? null : buildAtlas(rawDir, await manifest())
  return {
    name: "clowder-art-atlas",
    configResolved(config) {
      root = config.root
      rawDir = resolve(root, RAW)
      base = config.base
    },
    async buildStart() {
      atlas = await pack()
    },
    resolveId: (id) => (id === VIRTUAL ? RESOLVED : undefined),
    load(id) {
      if (id !== RESOLVED) return
      const where = atlas && {
        url: `${base}${OUT}/${atlas.json}`,
        path: `${base}${OUT}/`
      }
      return `export default ${JSON.stringify(where)}`
    },
    generateBundle() {
      for (const { name, source } of atlas?.files ?? [])
        this.emitFile({ type: "asset", fileName: `${OUT}/${name}`, source })
    },
    configureServer(dev) {
      server = dev
      dev.watcher.add(rawDir)
      // One repack at a time, so a batch of images lands in order.
      let repacking = Promise.resolve()
      const repack = async () => {
        try {
          atlas = await pack()
        } catch (error) {
          // A bad delivery leaves the game on its fallbacks until fixed.
          dev.config.logger.error(String(error))
          atlas = null
        }
        const { moduleGraph } = dev.environments.client
        const module = moduleGraph.getModuleById(RESOLVED)
        if (module) moduleGraph.invalidateModule(module)
        dev.ws.send({ type: "full-reload" })
      }
      const redeliver = (file: string) => {
        if (file.startsWith(rawDir + sep)) repacking = repacking.then(repack)
      }
      for (const event of ["add", "change", "unlink"])
        dev.watcher.on(event, redeliver)
      dev.middlewares.use(`${base}${OUT}/`, (req, res, next) => {
        const name = req.url?.split("?")[0].slice(1)
        const file = atlas?.files.find((file) => file.name === name)
        if (!file) return next()
        res.setHeader(
          "Content-Type",
          name?.endsWith(".json") ? "application/json" : "image/webp"
        )
        res.end(file.source)
      })
    }
  }
}
