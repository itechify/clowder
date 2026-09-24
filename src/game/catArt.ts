import Phaser from "phaser"
import type { Cat, Coat, Personality } from "../engine"

const coatColour: Record<Coat, number> = {
  orange: 0xe8893a,
  black: 0x2e2a30,
  white: 0xf4efe6,
  gray: 0x8d9099,
  calico: 0xf4efe6
}

const coatOutline: Record<Coat, number> = {
  orange: 0x9c521b,
  black: 0x0e0c10,
  white: 0xa59d90,
  gray: 0x55585f,
  calico: 0x8a6b4d
}

/** Pale Coats need dark features and vice versa. */
const featureColour = (coat: Coat) => (coat === "black" ? 0xf2e5b8 : 0x2b1f1a)

/** Unit-circle points for a regular star or polygon badge icon. */
/** `inner` is the star's inner radius as a fraction; 1 draws a plain polygon. */
function ring(points: number, inner: number, radius: number) {
  return Array.from({ length: points * (inner === 1 ? 1 : 2) }, (_, i) => {
    const step = inner === 1 ? points : points * 2
    const r = inner === 1 || i % 2 === 0 ? radius : radius * inner
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / step
    return new Phaser.Math.Vector2(Math.cos(angle) * r, Math.sin(angle) * r)
  })
}

/**
 * Each Coat has a distinct icon as well as a colour, so Coats read at a glance
 * without relying on colour vision.
 */
function drawCoatIcon(g: Phaser.GameObjects.Graphics, coat: Coat, r: number) {
  g.fillStyle(0xfffaf0, 1).fillCircle(0, 0, r).lineStyle(2, 0x5a4636, 1)
  g.strokeCircle(0, 0, r)
  const s = r * 0.62
  g.fillStyle(coat === "white" ? 0xb9b2a6 : coatColour[coat], 1)
  switch (coat) {
    case "orange": // sun
      g.fillCircle(0, 0, s * 0.55)
      g.lineStyle(2, coatColour.orange, 1)
      for (const p of ring(8, 1, s))
        g.lineBetween(p.x * 0.7, p.y * 0.7, p.x, p.y)
      break
    case "black": // crescent moon
      g.fillCircle(0, 0, s)
        .fillStyle(0xfffaf0, 1)
        .fillCircle(s * 0.45, -s * 0.3, s * 0.85)
      break
    case "white": // snowflake
      g.lineStyle(2.5, 0x8fb4d6, 1)
      for (const p of ring(3, 1, s)) g.lineBetween(-p.x, -p.y, p.x, p.y)
      break
    case "gray": // diamond
      g.fillPoints(ring(4, 1, s), true)
      break
    case "calico": // patchwork star
      g.fillStyle(0xe8893a, 1).fillPoints(ring(5, 0.45, s * 1.1), true)
      g.fillStyle(0x2e2a30, 1).fillCircle(0, s * 0.1, s * 0.25)
      break
  }
}

/**
 * A Personality reads from face and pose before any text: Clingy leans in
 * with wide eyes and blush, Aloof sits tall and looks away, Sleepy loafs with
 * closed eyes.
 */
function drawFace(
  g: Phaser.GameObjects.Graphics,
  cat: Cat,
  headX: number,
  headY: number,
  r: number
) {
  const ink = featureColour(cat.coat)
  const eyeY = headY - r * 0.05
  const eyeDx = r * 0.38
  switch (cat.personality) {
    case "clingy":
      g.fillStyle(ink, 1)
      g.fillCircle(headX - eyeDx, eyeY, r * 0.16)
      g.fillCircle(headX + eyeDx, eyeY, r * 0.16)
      g.fillStyle(0xffffff, 1)
      g.fillCircle(headX - eyeDx + r * 0.05, eyeY - r * 0.06, r * 0.06)
      g.fillCircle(headX + eyeDx + r * 0.05, eyeY - r * 0.06, r * 0.06)
      g.fillStyle(0xff8fa3, 0.8)
      g.fillEllipse(headX - r * 0.6, headY + r * 0.28, r * 0.35, r * 0.18)
      g.fillEllipse(headX + r * 0.6, headY + r * 0.28, r * 0.35, r * 0.18)
      g.lineStyle(2, ink, 1).beginPath()
      g.arc(headX, headY + r * 0.25, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI)
      g.strokePath()
      break
    case "aloof": {
      // Half-lidded eyes glancing sideways, mouth a flat line.
      const look = r * 0.12
      g.lineStyle(2.5, ink, 1)
      g.lineBetween(
        headX - eyeDx - r * 0.14,
        eyeY,
        headX - eyeDx + r * 0.14,
        eyeY
      )
      g.lineBetween(
        headX + eyeDx - r * 0.14,
        eyeY,
        headX + eyeDx + r * 0.14,
        eyeY
      )
      g.fillStyle(ink, 1)
      g.fillCircle(headX - eyeDx + look, eyeY + r * 0.07, r * 0.07)
      g.fillCircle(headX + eyeDx + look, eyeY + r * 0.07, r * 0.07)
      g.lineBetween(
        headX + r * 0.02,
        headY + r * 0.35,
        headX + r * 0.24,
        headY + r * 0.33
      )
      break
    }
    case "sleepy":
      g.lineStyle(2.5, ink, 1)
      for (const dx of [-eyeDx, eyeDx]) {
        g.beginPath()
        g.arc(
          headX + dx,
          eyeY - r * 0.04,
          r * 0.15,
          0.1 * Math.PI,
          0.9 * Math.PI
        )
        g.strokePath()
      }
      g.fillStyle(ink, 1).fillCircle(headX, headY + r * 0.3, r * 0.06)
      break
  }
}

function drawEars(
  g: Phaser.GameObjects.Graphics,
  headX: number,
  headY: number,
  r: number,
  tilt: number
) {
  for (const side of [-1, 1]) {
    const bx = headX + side * r * 0.55
    const by = headY - r * 0.55
    g.fillTriangle(
      bx - r * 0.35,
      by + r * 0.1,
      bx + r * 0.35,
      by + r * 0.1,
      bx + side * r * 0.15 + tilt,
      by - r * 0.6
    )
  }
}

/** Where the head sits relative to the body, by Personality pose. */
const pose: Record<
  Personality,
  { headDx: number; headDy: number; bodyH: number; tilt: number }
> = {
  clingy: { headDx: 0.12, headDy: -0.55, bodyH: 0.9, tilt: 0.1 },
  aloof: { headDx: -0.2, headDy: -0.8, bodyH: 1.05, tilt: 0 },
  sleepy: { headDx: 0.3, headDy: -0.2, bodyH: 0.62, tilt: -0.15 }
}

/**
 * A placeholder Cat centred on (0, 0), about `size` pixels across: a Coat
 * coloured body with a Coat icon badge and a face and pose per Personality.
 */
export function drawCat(
  scene: Phaser.Scene,
  cat: Cat,
  size: number
): Phaser.GameObjects.Container {
  const g = scene.add.graphics()
  const r = size * 0.24
  const p = pose[cat.personality]
  const bodyW = size * 0.66
  const bodyH = size * 0.5 * p.bodyH
  const bodyY = size * 0.28 - bodyH / 2
  const headX = p.headDx * size * 0.5
  const headY = bodyY + p.headDy * size * 0.5
  const fill = coatColour[cat.coat]
  const outline = coatOutline[cat.coat]

  // Tail curls out behind the body.
  g.lineStyle(size * 0.08, outline, 1).beginPath()
  g.arc(
    -bodyW * 0.45,
    bodyY - bodyH * 0.1,
    bodyH * 0.45,
    0.5 * Math.PI,
    1.3 * Math.PI
  )
  g.strokePath()
  g.lineStyle(size * 0.05, fill, 1).beginPath()
  g.arc(
    -bodyW * 0.45,
    bodyY - bodyH * 0.1,
    bodyH * 0.45,
    0.5 * Math.PI,
    1.3 * Math.PI
  )
  g.strokePath()

  g.fillStyle(fill, 1).lineStyle(2, outline, 1)
  g.fillEllipse(0, bodyY, bodyW, bodyH).strokeEllipse(0, bodyY, bodyW, bodyH)
  g.fillStyle(outline, 1)
  drawEars(g, headX, headY, r, p.tilt * size)
  g.fillStyle(fill, 1)
  drawEars(g, headX, headY + r * 0.12, r * 0.72, p.tilt * size)
  g.fillCircle(headX, headY, r).strokeCircle(headX, headY, r)
  if (cat.coat === "calico") {
    g.fillStyle(0xe8893a, 1).fillEllipse(
      -bodyW * 0.15,
      bodyY - bodyH * 0.1,
      bodyW * 0.35,
      bodyH * 0.45
    )
    g.fillStyle(0x2e2a30, 1).fillEllipse(
      bodyW * 0.22,
      bodyY + bodyH * 0.1,
      bodyW * 0.25,
      bodyH * 0.35
    )
    g.fillStyle(0xe8893a, 1).fillCircle(
      headX - r * 0.45,
      headY - r * 0.35,
      r * 0.4
    )
  }
  drawFace(g, cat, headX, headY, r)
  if (cat.personality === "sleepy") {
    g.lineStyle(2, 0x6b7fd7, 1)
    const zx = headX + r * 0.9
    const zy = headY - r * 1.1
    const z = r * 0.35
    g.lineBetween(zx, zy, zx + z, zy)
    g.lineBetween(zx + z, zy, zx, zy + z)
    g.lineBetween(zx, zy + z, zx + z, zy + z)
  }

  const badge = scene.add.graphics({ x: size * 0.3, y: size * 0.24 })
  drawCoatIcon(badge, cat.coat, size * 0.13)
  return scene.add.container(0, 0, [g, badge])
}
