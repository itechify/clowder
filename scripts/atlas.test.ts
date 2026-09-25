import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import sharp from "sharp"
import { describe, expect, it } from "vitest"
import { artEntry, artManifest } from "../src/art/manifest"
import { buildAtlas, packAtlas } from "./atlas"

describe("packing images into atlas pages", () => {
  it("places every image without overlap, within the page size", () => {
    const images = Array.from({ length: 30 }, (_, i) => ({
      key: `image${i}`,
      width: 100 + ((i * 37) % 300),
      height: 80 + ((i * 53) % 260)
    }))
    const pages = packAtlas(images, 1024)
    const placed = pages.flatMap((page, index) =>
      page.placements.map((p) => ({ ...p, page: index }))
    )
    expect(placed.map((p) => p.key).sort()).toEqual(
      images.map((i) => i.key).sort()
    )
    for (const [index, page] of pages.entries()) {
      expect(page.width).toBeLessThanOrEqual(1024)
      expect(page.height).toBeLessThanOrEqual(1024)
      const onPage = placed.filter((p) => p.page === index)
      for (const a of onPage) {
        expect(a.x + a.width).toBeLessThanOrEqual(page.width)
        expect(a.y + a.height).toBeLessThanOrEqual(page.height)
        for (const b of onPage)
          if (a !== b)
            expect(
              a.x + a.width <= b.x ||
                b.x + b.width <= a.x ||
                a.y + a.height <= b.y ||
                b.y + b.height <= a.y
            ).toBe(true)
      }
    }
  })

  it("opens another page when one is full", () => {
    const images = Array.from({ length: 5 }, (_, i) => ({
      key: `big${i}`,
      width: 600,
      height: 600
    }))
    expect(packAtlas(images, 1024)).toHaveLength(5)
  })

  it("refuses an image larger than a page", () => {
    expect(() =>
      packAtlas([{ key: "huge", width: 5000, height: 10 }], 4096)
    ).toThrow(/huge/)
  })
})

/** A raw-assets folder holding these PNGs, by key. */
async function rawAssets(images: Record<string, [number, number]>) {
  const dir = mkdtempSync(join(tmpdir(), "clowder-art-"))
  for (const [key, [width, height]] of Object.entries(images)) {
    const file = join(dir, `${key}.png`)
    mkdirSync(dirname(file), { recursive: true })
    // A transparent canvas with an opaque square in its middle.
    const square = await sharp({
      create: {
        width: width / 2,
        height: height / 2,
        channels: 4,
        background: { r: 200, g: 120, b: 60, alpha: 1 }
      }
    })
      .png()
      .toBuffer()
    writeFileSync(
      file,
      await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([{ input: square, left: width / 4, top: height / 4 }])
        .png()
        .toBuffer()
    )
  }
  return dir
}

describe("building the atlas from delivered images", () => {
  it("has nothing to build when no image is delivered", async () => {
    expect(await buildAtlas(await rawAssets({}), artManifest)).toBeNull()
  })

  it("makes each delivered image a frame named by its key, trimmed but keeping its canvas", async () => {
    const key = "cat/orange/clingy/content"
    const dir = await rawAssets({ [key]: [512, 512] })
    const atlas = (await buildAtlas(dir, artManifest))!
    const json = JSON.parse(
      atlas.files.find((file) => file.name === atlas.json)!.source.toString()
    )
    const [page] = json.textures
    expect(atlas.files.map((file) => file.name)).toContain(page.image)
    expect(page.image).toMatch(/\.webp$/)
    const [frame] = page.frames
    expect(frame.filename).toBe(key)
    expect(frame.sourceSize).toEqual({ w: 512, h: 512 })
    expect(frame.spriteSourceSize).toEqual({ x: 128, y: 128, w: 256, h: 256 })
    expect(frame.frame).toMatchObject({ w: 256, h: 256 })
  })

  it("names its files by their content, so a new delivery is a new URL", async () => {
    const key = "badge/orange"
    const first = await buildAtlas(
      await rawAssets({ [key]: [128, 128] }),
      artManifest
    )
    const again = await buildAtlas(
      await rawAssets({ [key]: [128, 128] }),
      artManifest
    )
    const other = await buildAtlas(
      await rawAssets({ "badge/gray": [128, 128] }),
      artManifest
    )
    expect(again!.json).toBe(first!.json)
    expect(other!.json).not.toBe(first!.json)
  })

  it("refuses an image for a key the manifest does not list", async () => {
    const dir = await rawAssets({ "cat/tabby/clingy/content": [512, 512] })
    await expect(buildAtlas(dir, artManifest)).rejects.toThrow(/cat\/tabby/)
  })

  it("refuses an image that is not its key's canvas size", async () => {
    const key = "cat/black/aloof/reacting"
    expect(artEntry(key).canvas).toEqual({ width: 512, height: 512 })
    const dir = await rawAssets({ [key]: [500, 500] })
    await expect(buildAtlas(dir, artManifest)).rejects.toThrow(
      /500×500.*512×512/
    )
  })
})
