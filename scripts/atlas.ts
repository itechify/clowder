// Packs the delivered images in art/raw into compressed atlas pages that the
// game loads as one multi-atlas, each image a frame named by its art key
// (ADR-0005). See scripts/artPlugin.ts for how the build ships them.

import { createHash } from "node:crypto"
import { existsSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import sharp from "sharp"
import type { ArtEntry } from "../src/art/manifest.ts"

type Rect = { key: string; width: number; height: number }
export type Placement = Rect & { x: number; y: number }
export type Page = { width: number; height: number; placements: Placement[] }

/** The largest page every WebGL device the game targets can hold. */
const MAX_PAGE = 4096
/** Clear pixels between frames, so filtering never bleeds a neighbour in. */
const PADDING = 2

/**
 * Packs rectangles into as few pages of at most `maxSize` square as a simple
 * shelf packer manages: tallest first, left to right, a row at a time.
 */
export function packAtlas(
  rects: Rect[],
  maxSize = MAX_PAGE,
  padding = 0
): Page[] {
  const pages: Page[] = []
  let page: Page | null = null
  let x = 0
  let y = 0
  let rowHeight = 0
  const sorted = [...rects].sort(
    (a, b) => b.height - a.height || a.key.localeCompare(b.key)
  )
  for (const rect of sorted) {
    if (rect.width > maxSize || rect.height > maxSize)
      throw new Error(
        `${rect.key} is ${rect.width}×${rect.height}, too large for a ${maxSize}×${maxSize} atlas page.`
      )
    if (page && x + rect.width > maxSize) {
      x = 0
      y += rowHeight + padding
      rowHeight = 0
    }
    if (!page || y + rect.height > maxSize) {
      page = { width: 0, height: 0, placements: [] }
      pages.push(page)
      x = 0
      y = 0
      rowHeight = 0
    }
    page.placements.push({ ...rect, x, y })
    page.width = Math.max(page.width, x + rect.width)
    page.height = Math.max(page.height, y + rect.height)
    x += rect.width + padding
    rowHeight = Math.max(rowHeight, rect.height)
  }
  return pages
}

/** Every delivered image under a raw-assets folder. */
export function pngsIn(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return pngsIn(path)
    return name.endsWith(".png") ? [path] : []
  })
}

/** An image's opaque pixels, cropped to where they are on its canvas. */
async function trimmed(file: string, key: string, entry?: ArtEntry) {
  if (!entry)
    throw new Error(`${file} is not named for a key in the art manifest.`)
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const { canvas } = entry
  if (width !== canvas.width || height !== canvas.height)
    throw new Error(
      `${file} is ${width}×${height}; ${key} needs ${canvas.width}×${canvas.height}.`
    )
  let left = width
  let top = height
  let right = -1
  let bottom = -1
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++)
      if (data[(y * width + x) * 4 + 3] > 0) {
        left = Math.min(left, x)
        right = Math.max(right, x)
        top = Math.min(top, y)
        bottom = Math.max(bottom, y)
      }
  // A wholly clear image keeps one pixel, so it is still a frame.
  if (right < 0) [left, top, right, bottom] = [0, 0, 0, 0]
  const crop = {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1
  }
  const pixels = await sharp(data, { raw: { width, height, channels: 4 } })
    .extract(crop)
    .raw()
    .toBuffer()
  return { key, pixels, crop, width, height }
}

export type Atlas = {
  /** The multi-atlas JSON's file name, among `files`. */
  json: string
  files: { name: string; source: Buffer }[]
}

/**
 * Packs every PNG under `rawDir`, named `<key>.png` for a key in the art
 * `manifest` and exactly its canvas size, into WebP atlas pages and a Phaser
 * multi-atlas JSON naming each frame by its key. Returns null when nothing
 * has been delivered yet.
 */
export async function buildAtlas(
  rawDir: string,
  manifest: readonly ArtEntry[]
): Promise<Atlas | null> {
  const files = pngsIn(rawDir)
  if (files.length === 0) return null
  const entries = new Map(manifest.map((entry) => [entry.key, entry]))
  const images = await Promise.all(
    files.map((file) => {
      const key = relative(rawDir, file)
        .replaceAll("\\", "/")
        .replace(/\.png$/, "")
      return trimmed(file, key, entries.get(key))
    })
  )
  const byKey = new Map(images.map((image) => [image.key, image]))
  const pages = packAtlas(
    images.map(({ key, crop }) => ({
      key,
      width: crop.width,
      height: crop.height
    })),
    MAX_PAGE,
    PADDING
  )
  const encoded = await Promise.all(
    pages.map((page) =>
      sharp({
        create: {
          width: page.width,
          height: page.height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite(
          page.placements.map(({ key, x, y, width, height }) => ({
            input: byKey.get(key)!.pixels,
            raw: { width, height, channels: 4 as const },
            left: x,
            top: y
          }))
        )
        .webp({ quality: 90, alphaQuality: 100, effort: 4 })
        .toBuffer()
    )
  )
  const hash = createHash("sha256")
  for (const page of encoded) hash.update(page)
  for (const image of images) hash.update(image.key)
  const name = `atlas.${hash.digest("hex").slice(0, 10)}`
  const json = {
    textures: pages.map((page, index) => ({
      image: `${name}.${index}.webp`,
      format: "RGBA8888",
      size: { w: page.width, h: page.height },
      scale: 1,
      frames: page.placements.map(({ key, x, y, width, height }) => {
        const image = byKey.get(key)!
        return {
          filename: key,
          rotated: false,
          trimmed: true,
          sourceSize: { w: image.width, h: image.height },
          spriteSourceSize: {
            x: image.crop.left,
            y: image.crop.top,
            w: width,
            h: height
          },
          frame: { x, y, w: width, h: height }
        }
      })
    }))
  }
  return {
    json: `${name}.json`,
    files: [
      { name: `${name}.json`, source: Buffer.from(JSON.stringify(json)) },
      ...encoded.map((source, index) => ({
        name: `${name}.${index}.webp`,
        source
      }))
    ]
  }
}
