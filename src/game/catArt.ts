import Phaser from "phaser"
import type { Eye as ArtEye } from "../art/eyes"
import type { CatPose } from "../art/manifest"
import type { Coat, Personality } from "../engine"
import { INK } from "./roomArt"

/** How far below its centre a Cat sits, as a fraction of its size. */
export const CAT_BASE = 0.28
/** A Coat badge's radius, and where it sits from its Cat's centre, by size. */
export const BADGE = { r: 0.13, x: 0.3, y: 0.24 }

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

/** A Coat's fur colour, as its code-drawn Cats wear it. */
export const coatFill = (coat: Coat) => coatColour[coat]

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
 * without relying on colour vision: a chunky token with a bold outline and a
 * drop shadow, in the room's style. Centred on (0, 0), `r` in radius.
 */
export function paintCoatBadge(
  g: Phaser.GameObjects.Graphics,
  coat: Coat,
  r: number
) {
  const line = Math.max(2, r * 0.2)
  g.fillStyle(INK, 0.35).fillCircle(r * 0.12, r * 0.16, r)
  g.fillStyle(0xfff6e2, 1).fillCircle(0, 0, r)
  g.fillStyle(0xf1dcb6, 1).fillCircle(0, r * 0.2, r * 0.78)
  g.fillStyle(0xfff6e2, 1).fillCircle(0, 0, r * 0.74)
  g.lineStyle(line, INK, 1).strokeCircle(0, 0, r)
  const s = r * 0.58
  const icon = coat === "white" ? 0xb9d3ec : coatColour[coat]
  g.fillStyle(icon, 1).lineStyle(line * 0.6, INK, 1)
  switch (coat) {
    case "orange": // sun
      for (const p of ring(8, 1, s))
        g.lineBetween(p.x * 0.55, p.y * 0.55, p.x * 1.05, p.y * 1.05)
      g.fillCircle(0, 0, s * 0.55).strokeCircle(0, 0, s * 0.55)
      break
    case "black": // crescent moon
      g.fillCircle(0, 0, s).strokeCircle(0, 0, s)
      g.fillStyle(0xfff6e2, 1).fillCircle(s * 0.5, -s * 0.35, s * 0.8)
      break
    case "white": // snowflake
      g.lineStyle(line, INK, 1)
      for (const p of ring(3, 1, s)) g.lineBetween(-p.x, -p.y, p.x, p.y)
      g.lineStyle(line * 0.5, icon, 1)
      for (const p of ring(3, 1, s * 0.9)) g.lineBetween(-p.x, -p.y, p.x, p.y)
      break
    case "gray": // diamond
      g.fillPoints(ring(4, 1, s), true).strokePoints(ring(4, 1, s), true)
      break
    case "calico": {
      // patchwork star
      const star = ring(5, 0.45, s * 1.1)
      g.fillStyle(0xe8893a, 1).fillPoints(star, true).strokePoints(star, true)
      g.fillStyle(0x2e2a30, 1).fillCircle(0, s * 0.1, s * 0.25)
      break
    }
  }
}

/** An open eye, as `Eye` in src/art/eyes.ts but drawn in code, needing no lid colour. */
type Eye = Omit<ArtEye, "lid">

/** Where a pose puts the head and body, and how far it leans, by size. */
type Shape = {
  headDx: number
  headDy: number
  bodyW: number
  bodyH: number
  /** How far the ears tip toward the viewer's right. */
  tilt: number
  /** How far the whole Cat leans toward the viewer's right, in radians. */
  lean: number
}

/**
 * A Personality reads from pose before any text. Content, Clingy sits eager,
 * Aloof sits tall and looks away, Sleepy loafs. Reacting, each turns to the
 * viewer's right: Clingy leans in to snuggle, Aloof lifts its nose and
 * flattens its ears, offended, and Sleepy curls up low to nap.
 */
const shapes: Record<Personality, Record<CatPose, Shape>> = {
  clingy: {
    content: {
      headDx: 0.12,
      headDy: -0.55,
      bodyW: 1,
      bodyH: 0.9,
      tilt: 0.1,
      lean: 0
    },
    reacting: {
      headDx: 0.3,
      headDy: -0.5,
      bodyW: 1,
      bodyH: 0.9,
      tilt: 0.12,
      lean: 0.22
    }
  },
  aloof: {
    content: {
      headDx: -0.2,
      headDy: -0.8,
      bodyW: 1,
      bodyH: 1.05,
      tilt: 0,
      lean: 0
    },
    reacting: {
      headDx: 0.24,
      headDy: -0.9,
      bodyW: 1,
      bodyH: 1.05,
      tilt: -0.18,
      lean: -0.08
    }
  },
  sleepy: {
    content: {
      headDx: 0.3,
      headDy: -0.2,
      bodyW: 1,
      bodyH: 0.62,
      tilt: -0.15,
      lean: 0
    },
    reacting: {
      headDx: 0.46,
      headDy: -0.06,
      bodyW: 1.15,
      bodyH: 0.5,
      tilt: -0.2,
      lean: 0
    }
  }
}

/** The head's centre and radius for a pose, from the Cat's centre. */
function head(personality: Personality, pose: CatPose, size: number) {
  const p = shapes[personality][pose]
  const bodyY = size * CAT_BASE - (size * 0.5 * p.bodyH) / 2
  return {
    x: p.headDx * size * 0.5,
    y: bodyY + p.headDy * size * 0.5,
    r: size * 0.24
  }
}

/**
 * The open eyes of a code-drawn pose, from the Cat's centre, for the game to
 * tint and blink: Clingy's and Aloof's while content; the rest are shut.
 */
export function paintedEyes(
  personality: Personality,
  pose: CatPose,
  size: number
): Eye[] {
  if (pose !== "content" || personality === "sleepy") return []
  const { x, y, r } = head(personality, pose, size)
  const eyeY = y - r * 0.05
  return [-1, 1].map((side) =>
    personality === "clingy"
      ? { x: x + side * r * 0.38, y: eyeY, rx: r * 0.2, ry: r * 0.2 }
      : {
          x: x + side * r * 0.38,
          y: eyeY + r * 0.06,
          rx: r * 0.16,
          ry: r * 0.09
        }
  )
}

/** Eyes shut: a curve each, smiling side up or down, or a flat line. */
function shutEyes(
  g: Phaser.GameObjects.Graphics,
  ink: number,
  headX: number,
  eyeY: number,
  r: number,
  how: "happy" | "asleep" | "disdain"
) {
  g.lineStyle(2.5, ink, 1)
  for (const side of [-1, 1]) {
    const x = headX + side * r * 0.38
    if (how === "disdain") {
      g.lineBetween(
        x - r * 0.15,
        eyeY - r * 0.02,
        x + r * 0.15,
        eyeY + r * 0.04
      )
      continue
    }
    g.beginPath()
    if (how === "happy")
      g.arc(x, eyeY + r * 0.08, r * 0.15, 1.1 * Math.PI, 1.9 * Math.PI)
    else g.arc(x, eyeY - r * 0.04, r * 0.15, 0.1 * Math.PI, 0.9 * Math.PI)
    g.strokePath()
  }
}

/**
 * A Personality's face for a pose. Open eyes have a pale iris the game tints
 * with the Cat's eye colour (see `paintedEyes`).
 */
function drawFace(
  g: Phaser.GameObjects.Graphics,
  coat: Coat,
  personality: Personality,
  pose: CatPose,
  size: number
) {
  const ink = featureColour(coat)
  const { x: headX, y: headY, r } = head(personality, pose, size)
  const eyeY = headY - r * 0.05
  const blush = (scale: number) => {
    g.fillStyle(0xff8fa3, 0.8)
    for (const side of [-1, 1])
      g.fillEllipse(
        headX + side * r * 0.6,
        headY + r * 0.28,
        r * 0.35 * scale,
        r * 0.18 * scale
      )
  }
  const smile = () => {
    g.lineStyle(2, ink, 1).beginPath()
    g.arc(headX, headY + r * 0.25, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI)
    g.strokePath()
  }
  const eyes = paintedEyes(personality, pose, size)
  for (const eye of eyes) {
    g.fillStyle(0xfdf3d6, 1).lineStyle(2, ink, 1)
    g.fillEllipse(eye.x, eye.y, eye.rx * 2, eye.ry * 2)
    g.strokeEllipse(eye.x, eye.y, eye.rx * 2, eye.ry * 2)
  }
  switch (`${personality} ${pose}`) {
    case "clingy content":
      g.fillStyle(0x1c1412, 1)
      for (const eye of eyes)
        g.fillCircle(eye.x + r * 0.02, eye.y + r * 0.02, eye.rx * 0.62)
      g.fillStyle(0xffffff, 1)
      for (const eye of eyes)
        g.fillCircle(eye.x + r * 0.06, eye.y - r * 0.06, eye.rx * 0.28)
      blush(1)
      smile()
      break
    case "clingy reacting":
      shutEyes(g, ink, headX, eyeY, r, "happy")
      blush(1.3)
      smile()
      break
    case "aloof content": {
      // Half-lidded, glancing sideways, the mouth a flat line.
      g.fillStyle(0x1c1412, 1)
      for (const eye of eyes)
        g.fillCircle(eye.x + eye.rx * 0.45, eye.y + eye.ry * 0.1, eye.ry * 0.85)
      g.lineStyle(3, ink, 1)
      for (const eye of eyes)
        g.lineBetween(
          eye.x - eye.rx * 1.1,
          eye.y - eye.ry * 0.9,
          eye.x + eye.rx * 1.1,
          eye.y - eye.ry * 0.9
        )
      g.lineStyle(2.5, ink, 1).lineBetween(
        headX + r * 0.02,
        headY + r * 0.35,
        headX + r * 0.24,
        headY + r * 0.33
      )
      break
    }
    case "aloof reacting":
      // Nose in the air, eyes shut in disdain.
      shutEyes(g, ink, headX, eyeY, r, "disdain")
      g.lineStyle(2.5, ink, 1).lineBetween(
        headX + r * 0.08,
        headY + r * 0.3,
        headX + r * 0.26,
        headY + r * 0.26
      )
      break
    case "sleepy content":
    case "sleepy reacting":
      shutEyes(g, ink, headX, eyeY, r, "asleep")
      g.fillStyle(ink, 1).fillCircle(headX, headY + r * 0.3, r * 0.06)
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

/**
 * Draws a code-drawn Cat of a Coat and Personality in a pose, centred on
 * (0, 0) and about `size` pixels across, its base `CAT_BASE` × `size` below
 * the centre. A reacting pose faces the viewer's right, like delivered art.
 * Its Coat badge is separate art.
 */
export function paintCat(
  g: Phaser.GameObjects.Graphics,
  coat: Coat,
  personality: Personality,
  size: number,
  pose: CatPose = "content"
) {
  const p = shapes[personality][pose]
  const { x: headX, y: headY, r } = head(personality, pose, size)
  const bodyW = size * 0.66 * p.bodyW
  const bodyH = size * 0.5 * p.bodyH
  const bodyY = size * CAT_BASE - bodyH / 2
  const fill = coatColour[coat]
  const outline = coatOutline[coat]

  // A lean tips the whole Cat over its base.
  g.save()
  g.translateCanvas(0, size * CAT_BASE)
  g.rotateCanvas(p.lean)
  g.translateCanvas(0, -size * CAT_BASE)

  // Tail curls out behind the body.
  for (const [width, colour] of [
    [0.08, outline],
    [0.05, fill]
  ]) {
    g.lineStyle(size * width, colour, 1).beginPath()
    g.arc(
      -bodyW * 0.45,
      bodyY - bodyH * 0.1,
      bodyH * 0.45,
      0.5 * Math.PI,
      1.3 * Math.PI
    )
    g.strokePath()
  }

  g.fillStyle(fill, 1).lineStyle(2, outline, 1)
  g.fillEllipse(0, bodyY, bodyW, bodyH).strokeEllipse(0, bodyY, bodyW, bodyH)
  g.fillStyle(outline, 1)
  drawEars(g, headX, headY, r, p.tilt * size)
  g.fillStyle(fill, 1)
  drawEars(g, headX, headY + r * 0.12, r * 0.72, p.tilt * size)
  g.fillCircle(headX, headY, r).strokeCircle(headX, headY, r)
  if (coat === "calico") {
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
  drawFace(g, coat, personality, pose, size)
  if (personality === "sleepy") {
    g.lineStyle(2, 0x6b7fd7, 1)
    const zx = headX + r * 0.9
    const zy = headY - r * 1.1
    const z = r * 0.35
    g.lineBetween(zx, zy, zx + z, zy)
    g.lineBetween(zx + z, zy, zx, zy + z)
    g.lineBetween(zx, zy + z, zx + z, zy + z)
  }
  g.restore()
}
