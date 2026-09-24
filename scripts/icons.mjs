// Two Cats make a Clowder: shared artwork for app icons and tiny favicons,
// rasterized without an external graphics dependency. Run with `pnpm icons`.

import { mkdirSync, writeFileSync } from "node:fs"
import { deflateSync } from "node:zlib"

const BACKGROUND = [59, 42, 34]
const ORANGE = [240, 146, 60]
const CREAM = [255, 225, 177]
const EYE = [46, 31, 25]

const ellipse = (u, v, cx, cy, rx, ry) =>
  ((u - cx) / rx) ** 2 + ((v - cy) / ry) ** 2 < 1

const triangle = (u, v, [ax, ay], [bx, by], [cx, cy]) => {
  const side = (px, py, qx, qy) => (u - qx) * (py - qy) - (px - qx) * (v - qy)
  const d1 = side(ax, ay, bx, by)
  const d2 = side(bx, by, cx, cy)
  const d3 = side(cx, cy, ax, ay)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

/** A Cat in local coordinates; tiny favicons use only the silhouette. */
function cat(u, v, fur, tiny) {
  const mirrored = Math.abs(u)
  if (!tiny) {
    if (ellipse(mirrored, v, 0.08, 0.025, 0.018, 0.028)) return EYE
    if (triangle(u, v, [-0.023, 0.077], [0.023, 0.077], [0, 0.1])) return EYE
  }
  if (
    ellipse(u, v, 0, 0.035, 0.24, 0.2) ||
    triangle(mirrored, v, [0.235, -0.005], [0.225, -0.3], [0.075, -0.15])
  )
    return fur
  return null
}

/** Stagger the heads so all four ears and both faces remain visible. */
function paint(u, v, tiny) {
  return (
    cat((u - 0.19) / 0.94, (v - 0.13) / 0.94, CREAM, tiny) ??
    cat(u + 0.13, v + 0.055, ORANGE, tiny) ??
    BACKGROUND
  )
}

const crc = (bytes) => {
  let c = 0xffffffff
  for (const b of bytes) {
    c ^= b
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0)
  }
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (name, data) => {
  const type = Buffer.from(name)
  const length = Buffer.alloc(4)
  const check = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  check.writeUInt32BE(crc(Buffer.concat([type, data])))
  return Buffer.concat([length, type, data, check])
}

/** An opaque PNG; `scale` keeps both Cats inside the maskable safe zone. */
function png(size, scale) {
  const SAMPLES = 4
  const row = size * 3 + 1
  const raw = Buffer.alloc(row * size)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0]
      for (let sy = 0; sy < SAMPLES; sy++)
        for (let sx = 0; sx < SAMPLES; sx++) {
          const u = ((x + (sx + 0.5) / SAMPLES) / size - 0.5) / scale
          const v = ((y + (sy + 0.5) / SAMPLES) / size - 0.5) / scale
          const colour = paint(u, v, size <= 32)
          for (let i = 0; i < 3; i++) sum[i] += colour[i]
        }
      raw.set(
        sum.map((c) => Math.round(c / SAMPLES ** 2)),
        y * row + 1 + x * 3
      )
    }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 2 // truecolour
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ])
}

mkdirSync("public", { recursive: true })
for (const [name, size, scale] of [
  ["favicon-16.png", 16, 1],
  ["favicon-32.png", 32, 1],
  ["icon-192.png", 192, 1],
  ["icon-512.png", 512, 1],
  ["maskable-512.png", 512, 0.75],
  ["apple-touch-icon.png", 180, 0.9]
])
  writeFileSync(`public/${name}`, png(size, scale))
