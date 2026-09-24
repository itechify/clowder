// The app icons: an orange Cat's face on the living-room brown, rasterized
// without an external graphics dependency. Run with `node scripts/icons.mjs`.

import { mkdirSync, writeFileSync } from "node:fs"
import { deflateSync } from "node:zlib"

const BACKGROUND = [59, 42, 34]
const GLOW = [107, 74, 58]
const FUR = [240, 146, 60]
const EAR = [246, 176, 160]
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

/** The colour at (u, v), centred coordinates where the face spans about ±0.4. */
function paint(u, v) {
  const mirrored = Math.abs(u)
  if (triangle(mirrored, v, [0, 0.1], [0.04, 0.07], [-0.04, 0.07])) return EAR
  if (ellipse(mirrored, v, 0.11, 0.02, 0.035, 0.06)) return EYE
  if (triangle(mirrored, v, [0.26, -0.08], [0.24, -0.3], [0.1, -0.17]))
    return EAR
  if (
    ellipse(u, v, 0, 0.06, 0.32, 0.27) ||
    triangle(mirrored, v, [0.32, -0.02], [0.27, -0.38], [0.04, -0.17])
  )
    return FUR
  if (u * u + v * v < 0.2) return GLOW
  return BACKGROUND
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

/** An opaque PNG; `scale` shrinks the face (maskable icons keep a safe zone). */
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
          const colour = paint(u, v)
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
  ["icon-192.png", 192, 1],
  ["icon-512.png", 512, 1],
  ["maskable-512.png", 512, 0.8],
  ["apple-touch-icon.png", 180, 0.9]
])
  writeFileSync(`public/${name}`, png(size, scale))
