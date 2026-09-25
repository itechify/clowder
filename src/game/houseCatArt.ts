import type Phaser from "phaser"
import { FREYA_STAGES, type HouseCatPose } from "../art/manifest"
import type { HouseCatId } from "../engine"

type Graphics = Phaser.GameObjects.Graphics

/** A round cat head with pointed ears, centred on (x, y). */
function drawHead(
  g: Graphics,
  x: number,
  y: number,
  r: number,
  fill: number,
  outline: number
) {
  g.fillStyle(outline, 1)
  for (const side of [-1, 1])
    g.fillTriangle(
      x + side * r * 0.95,
      y - r * 0.2,
      x + side * r * 0.2,
      y - r * 0.75,
      x + side * r * 0.85,
      y - r * 1.35
    )
  g.fillStyle(fill, 1).lineStyle(2, outline, 1)
  g.fillCircle(x, y, r).strokeCircle(x, y, r)
}

/** Closed, contented eyes: two little arcs, smiling side up. */
function drawClosedEyes(
  g: Graphics,
  x: number,
  y: number,
  r: number,
  ink: number,
  upsideDown = false
) {
  g.lineStyle(2, ink, 1)
  for (const side of [-1, 1]) {
    g.beginPath()
    g.arc(
      x + side * r * 0.4,
      y,
      r * 0.2,
      upsideDown ? 1.1 * Math.PI : 0.1 * Math.PI,
      upsideDown ? 1.9 * Math.PI : 0.9 * Math.PI
    )
    g.strokePath()
  }
}

/** A small heart centred on (x, y), `r` across each lobe. */
function drawHeart(g: Graphics, x: number, y: number, r: number, fill: number) {
  g.fillStyle(fill, 1)
  g.fillCircle(x - r * 0.55, y, r * 0.6).fillCircle(x + r * 0.55, y, r * 0.6)
  g.fillTriangle(
    x - r * 1.12,
    y + r * 0.15,
    x + r * 1.12,
    y + r * 0.15,
    x,
    y + r * 1.25
  )
}

/** A tail `trace`d twice, as thick as fur at `size`: outline, then fill. */
function drawTail(
  g: Graphics,
  size: number,
  fill: number,
  outline: number,
  trace: () => void
) {
  for (const [width, colour] of [
    [0.08, outline],
    [0.05, fill]
  ]) {
    g.lineStyle(size * width, colour, 1)
    trace()
  }
}

const SKADI = { fill: 0x9a8f86, outline: 0x5e554e, belly: 0xf6eee4 }

/** Skadi at rest, lying on her side, relaxed and content, looking out. */
function skadiOnHerSide(g: Graphics, size: number) {
  const { fill, outline, belly } = SKADI
  const bodyY = size * 0.26
  // Her tail curled up behind her...
  drawTail(g, size, fill, outline, () => {
    g.beginPath()
    g.arc(size * 0.38, bodyY, size * 0.1, 0.5 * Math.PI, 1.6 * Math.PI, true)
    g.strokePath()
  })
  // ...her long, lazy body, belly toward the viewer...
  g.fillStyle(fill, 1).lineStyle(2, outline, 1)
  g.fillEllipse(size * 0.06, bodyY, size * 0.68, size * 0.26)
  g.strokeEllipse(size * 0.06, bodyY, size * 0.68, size * 0.26)
  g.fillStyle(belly, 1).fillEllipse(
    size * 0.06,
    bodyY + size * 0.05,
    size * 0.46,
    size * 0.12
  )
  // ...front paws stretched out ahead of her...
  g.fillStyle(fill, 1).lineStyle(1.5, outline, 1)
  for (const x of [-0.42, -0.34]) {
    g.fillEllipse(size * x, bodyY + size * 0.1, size * 0.14, size * 0.07)
    g.strokeEllipse(size * x, bodyY + size * 0.1, size * 0.14, size * 0.07)
  }
  // ...and her head up, looking out, content.
  const r = size * 0.18
  const headX = -size * 0.26
  const headY = bodyY - size * 0.14
  drawHead(g, headX, headY, r, fill, outline)
  g.fillStyle(0x2b1f1a, 1)
  g.fillEllipse(headX - r * 0.38, headY, r * 0.22, r * 0.3)
  g.fillEllipse(headX + r * 0.38, headY, r * 0.22, r * 0.3)
  g.fillStyle(0xe86f7e, 1).fillTriangle(
    headX - r * 0.1,
    headY + r * 0.3,
    headX + r * 0.1,
    headY + r * 0.3,
    headX,
    headY + r * 0.42
  )
}

/** Skadi rolled right over, when Belly Up triggers. */
function skadiBellyUp(g: Graphics, size: number) {
  const { fill, outline, belly } = SKADI
  const bodyY = size * 0.22
  // Paws in the air...
  g.lineStyle(size * 0.09, outline, 1)
  for (const x of [-0.2, -0.06, 0.1, 0.22])
    g.lineBetween(size * x, bodyY, size * (x + 0.02), bodyY - size * 0.26)
  g.lineStyle(size * 0.06, fill, 1)
  for (const x of [-0.2, -0.06, 0.1, 0.22])
    g.lineBetween(size * x, bodyY, size * (x + 0.02), bodyY - size * 0.25)
  g.fillStyle(belly, 1)
  for (const x of [-0.2, -0.06, 0.1, 0.22])
    g.fillCircle(size * (x + 0.02), bodyY - size * 0.27, size * 0.045)
  // ...and the belly, offered to all.
  g.fillStyle(fill, 1).lineStyle(2, outline, 1)
  g.fillEllipse(0, bodyY, size * 0.72, size * 0.3)
  g.strokeEllipse(0, bodyY, size * 0.72, size * 0.3)
  g.fillStyle(belly, 1).fillEllipse(
    size * 0.02,
    bodyY - size * 0.02,
    size * 0.44,
    size * 0.17
  )
  // Her head upside down at one end, ears pointing down.
  const r = size * 0.17
  const headX = -size * 0.36
  const headY = bodyY + size * 0.02
  g.fillStyle(outline, 1)
  for (const side of [-1, 1])
    g.fillTriangle(
      headX + side * r * 0.95,
      headY + r * 0.2,
      headX + side * r * 0.2,
      headY + r * 0.75,
      headX + side * r * 0.85,
      headY + r * 1.35
    )
  g.fillStyle(fill, 1).lineStyle(2, outline, 1)
  g.fillCircle(headX, headY, r).strokeCircle(headX, headY, r)
  drawClosedEyes(g, headX, headY + r * 0.05, r, 0x2b1f1a, true)
  drawHeart(g, size * 0.3, -size * 0.2, size * 0.07, 0xe86f7e)
}

/** How far Freya has warmed up in a pose, from reserved (0) to affectionate (1). */
function freyaWarmth(pose: HouseCatPose) {
  const stage = pose.match(/^warming(\d+)$/)?.[1]
  if (stage) return Math.min(1, Number(stage) / FREYA_STAGES)
  // Her triggered pose is a warm moment, glimpsed while still reserved.
  return pose === "triggered" ? 2 / 3 : 0
}

/** Where Freya's hearts float, the first beside her, more as she warms up. */
const FREYA_HEARTS = [
  [0.36, -0.14],
  [0.46, -0.32],
  [0.26, -0.46],
  [-0.3, -0.46]
] as const

/**
 * Each House Cat has its own look, since none has a Coat: Box Goblin peers
 * out of a cardboard box with gleaming eyes; Do Not Touch puffs up in a huff
 * beside its warning sign; One Braincell's lone braincell glows over its head;
 * The Big Loaf dozes as one enormous loaf; Skadi lies on her side, rolling
 * belly up with paws in the air as she triggers; Freya peeks shyly over her
 * shoulder, blushing, and turns to the viewer as she warms up; The Void is a
 * starry darkness with eyes; Copycat sits beside its own ghostly double; and
 * Treat Dealer lurks in a trench coat with a fish treat to hand.
 */
const looks: Record<
  HouseCatId,
  (g: Graphics, size: number, pose: HouseCatPose) => void
> = {
  oneBraincell: (g, size) => {
    const fill = 0xe8893a
    const outline = 0x9c521b
    const ink = 0x2b1f1a
    g.fillStyle(fill, 1).lineStyle(2, outline, 1)
    g.fillEllipse(0, size * 0.24, size * 0.56, size * 0.36)
    g.strokeEllipse(0, size * 0.24, size * 0.56, size * 0.36)
    const r = size * 0.23
    const headY = -size * 0.04
    drawHead(g, 0, headY, r, fill, outline)
    // Eyes looking two different ways, and a tongue left out.
    g.fillStyle(0xfffaf0, 1)
    g.fillCircle(-r * 0.4, headY - r * 0.05, r * 0.26)
    g.fillCircle(r * 0.4, headY - r * 0.05, r * 0.26)
    g.fillStyle(ink, 1)
    g.fillCircle(-r * 0.3, headY - r * 0.15, r * 0.12)
    g.fillCircle(r * 0.52, headY + r * 0.05, r * 0.12)
    g.fillStyle(0xe86f7e, 1).fillEllipse(
      r * 0.1,
      headY + r * 0.62,
      r * 0.22,
      r * 0.3
    )
    // The one braincell, glowing.
    const cellY = headY - r * 1.75
    g.fillStyle(0xfff2a8, 0.6).fillCircle(0, cellY, r * 0.42)
    g.fillStyle(0xf59ab3, 1).fillCircle(0, cellY, r * 0.24)
    g.lineStyle(1.5, 0xf6d743, 1)
    for (const angle of [0, 1, 2, 3].map(
      (i) => (i * Math.PI) / 2 + Math.PI / 4
    ))
      g.lineBetween(
        Math.cos(angle) * r * 0.5,
        cellY + Math.sin(angle) * r * 0.5,
        Math.cos(angle) * r * 0.7,
        cellY + Math.sin(angle) * r * 0.7
      )
  },
  bigLoaf: (g, size) => {
    const fill = 0xc9b8a0
    const outline = 0x7d6a55
    // One enormous loaf, paws tucked out of sight.
    g.fillStyle(fill, 1).lineStyle(2, outline, 1)
    g.fillRoundedRect(
      -size * 0.46,
      -size * 0.02,
      size * 0.92,
      size * 0.46,
      size * 0.2
    )
    g.strokeRoundedRect(
      -size * 0.46,
      -size * 0.02,
      size * 0.92,
      size * 0.46,
      size * 0.2
    )
    g.lineStyle(2, outline, 0.6)
    for (const x of [-0.18, 0, 0.18])
      g.lineBetween(
        size * (x - 0.03),
        size * 0.04,
        size * (x + 0.03),
        size * 0.14
      )
    const r = size * 0.2
    const headY = size * 0.02
    drawHead(g, -size * 0.18, headY, r, fill, outline)
    drawClosedEyes(g, -size * 0.18, headY, r, 0x2b1f1a)
    // Asleep, of course.
    g.lineStyle(2, 0x6b7fd7, 1)
    g.lineBetween(size * 0.1, -size * 0.2, size * 0.2, -size * 0.2)
    g.lineBetween(size * 0.2, -size * 0.2, size * 0.1, -size * 0.1)
    g.lineBetween(size * 0.1, -size * 0.1, size * 0.2, -size * 0.1)
  },
  skadi: (g, size, pose) =>
    pose === "idle" ? skadiOnHerSide(g, size) : skadiBellyUp(g, size),
  freya: (g, size, pose) => {
    const fill = 0xf1e2cc
    const outline = 0x9c8468
    const ink = 0x2b1f1a
    // From reserved (0) to affectionate (1), she turns toward the viewer.
    const warmth = freyaWarmth(pose)
    const toward = (from: number, to: number) => from + (to - from) * warmth
    const bodyX = size * toward(0.06, 0)
    g.fillStyle(fill, 1).lineStyle(2, outline, 1)
    g.fillEllipse(bodyX, size * 0.2, size * 0.5, size * 0.46)
    g.strokeEllipse(bodyX, size * 0.2, size * 0.5, size * 0.46)
    if (warmth < 1) {
      // Her tail wrapped round...
      g.lineStyle(size * 0.08, outline, 1).beginPath()
      g.arc(bodyX, size * 0.3, size * 0.26, 0.05 * Math.PI, 0.75 * Math.PI)
      g.strokePath()
      g.lineStyle(size * 0.05, fill, 1).beginPath()
      g.arc(bodyX, size * 0.3, size * 0.26, 0.07 * Math.PI, 0.73 * Math.PI)
      g.strokePath()
    } else {
      // ...until it goes up like a question mark.
      drawTail(g, size, fill, outline, () => {
        g.lineBetween(-size * 0.2, size * 0.3, -size * 0.3, -size * 0.04)
        g.beginPath()
        g.arc(
          -size * 0.38,
          -size * 0.04,
          size * 0.08,
          1.1 * Math.PI,
          2 * Math.PI
        )
        g.strokePath()
      })
    }
    // Peeking back over her shoulder at first, blushing, then facing the
    // viewer with softening eyes and a shy smile, then eyes closed happily.
    const r = size * 0.21
    const headX = size * toward(-0.12, 0)
    const headY = -size * 0.06
    drawHead(g, headX, headY, r, fill, outline)
    if (warmth < 1) {
      g.fillStyle(ink, 1)
      for (const x of [toward(-0.45, -0.38), toward(0.2, 0.38)])
        g.fillEllipse(
          headX + r * x,
          headY - r * 0.02,
          r * 0.2,
          r * toward(0.3, 0.14)
        )
    } else drawClosedEyes(g, headX, headY - r * 0.02, r, ink, true)
    g.fillStyle(0xf4a3a8, toward(0.6, 1))
    for (const x of [toward(-0.62, -0.58), toward(0.42, 0.58)])
      g.fillEllipse(headX + r * x, headY + r * 0.35, r * 0.34, r * 0.18)
    if (warmth > 0) {
      g.lineStyle(1.5, ink, 1).beginPath()
      g.arc(headX, headY + r * 0.42, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI)
      g.strokePath()
    }
    // A heart to begin with, and another for each stage she warms up.
    const hearts = 1 + Math.round(warmth * FREYA_STAGES)
    for (const [x, y] of FREYA_HEARTS.slice(0, hearts))
      drawHeart(g, size * x, size * y, size * 0.06, 0xe86f7e)
  },
  theVoid: (g, size) => {
    // Hardly a cat at all: a starry darkness, with eyes.
    const fill = 0x141018
    const r = size * 0.36
    const y = size * 0.08
    g.fillStyle(fill, 1)
    for (const side of [-1, 1])
      g.fillTriangle(
        side * r * 0.95,
        y - r * 0.2,
        side * r * 0.25,
        y - r * 0.8,
        side * r * 0.85,
        y - r * 1.3
      )
    g.fillCircle(0, y, r)
    g.fillStyle(0xdfe3ff, 0.9)
    for (const [sx, sy] of [
      [-0.55, 0.35],
      [0.5, 0.45],
      [-0.1, 0.7],
      [0.65, -0.1],
      [-0.7, -0.15]
    ])
      g.fillCircle(sx * r, y + sy * r, size * 0.015)
    g.fillStyle(0xf6d743, 1)
    g.fillCircle(-r * 0.35, y - r * 0.1, r * 0.2)
    g.fillCircle(r * 0.35, y - r * 0.1, r * 0.2)
    g.fillStyle(fill, 1)
    g.fillEllipse(-r * 0.35, y - r * 0.1, r * 0.08, r * 0.3)
    g.fillEllipse(r * 0.35, y - r * 0.1, r * 0.08, r * 0.3)
  },
  copycat: (g, size) => {
    const fill = 0xb7b0c4
    const outline = 0x6d6680
    const r = size * 0.2
    // Its double, a step to the left: whoever it is copying.
    g.lineStyle(2, outline, 0.55)
    g.strokeEllipse(-size * 0.18, size * 0.24, size * 0.36, size * 0.34)
    g.strokeCircle(-size * 0.18, -size * 0.02, r)
    for (const side of [-1, 1])
      g.strokeTriangle(
        -size * 0.18 + side * r * 0.95,
        -size * 0.02 - r * 0.2,
        -size * 0.18 + side * r * 0.2,
        -size * 0.02 - r * 0.75,
        -size * 0.18 + side * r * 0.85,
        -size * 0.02 - r * 1.35
      )
    g.fillStyle(fill, 1).lineStyle(2, outline, 1)
    g.fillEllipse(size * 0.14, size * 0.24, size * 0.36, size * 0.34)
    g.strokeEllipse(size * 0.14, size * 0.24, size * 0.36, size * 0.34)
    drawHead(g, size * 0.14, -size * 0.02, r, fill, outline)
    g.fillStyle(0x2b1f1a, 1)
    g.fillCircle(size * 0.14 - r * 0.55, -size * 0.02, r * 0.12)
    g.fillCircle(size * 0.14 + r * 0.25, -size * 0.02, r * 0.12)
  },
  treatDealer: (g, size) => {
    const fill = 0x8d9099
    const outline = 0x55585f
    const coat = 0xa8804f
    // A trench coat, collar up.
    g.fillStyle(coat, 1).lineStyle(2, 0x6e4f2c, 1)
    g.fillRoundedRect(
      -size * 0.26,
      size * 0.02,
      size * 0.52,
      size * 0.42,
      size * 0.08
    )
    g.strokeRoundedRect(
      -size * 0.26,
      size * 0.02,
      size * 0.52,
      size * 0.42,
      size * 0.08
    )
    g.lineBetween(0, size * 0.1, 0, size * 0.44)
    g.fillStyle(0x6e4f2c, 1)
    g.fillTriangle(
      -size * 0.2,
      size * 0.02,
      0,
      size * 0.02,
      -size * 0.04,
      size * 0.16
    )
    g.fillTriangle(
      size * 0.2,
      size * 0.02,
      0,
      size * 0.02,
      size * 0.04,
      size * 0.16
    )
    const r = size * 0.2
    const headY = -size * 0.12
    drawHead(g, 0, headY, r, fill, outline)
    // Heavy-lidded, knowing eyes.
    const ink = 0x2b1f1a
    g.fillStyle(0xf6d743, 1)
    g.fillEllipse(-r * 0.4, headY, r * 0.36, r * 0.2)
    g.fillEllipse(r * 0.4, headY, r * 0.36, r * 0.2)
    g.lineStyle(2, ink, 1)
    g.lineBetween(-r * 0.62, headY - r * 0.08, -r * 0.18, headY - r * 0.08)
    g.lineBetween(r * 0.18, headY - r * 0.08, r * 0.62, headY - r * 0.08)
    // A fish treat, offered from inside the coat.
    const fx = size * 0.34
    const fy = size * 0.2
    g.fillStyle(0xf2a65a, 1).lineStyle(1.5, 0x9c521b, 1)
    g.fillEllipse(fx, fy, size * 0.16, size * 0.08)
    g.strokeEllipse(fx, fy, size * 0.16, size * 0.08)
    g.fillTriangle(
      fx + size * 0.07,
      fy,
      fx + size * 0.13,
      fy - size * 0.05,
      fx + size * 0.13,
      fy + size * 0.05
    )
  },
  boxGoblin: (g, size) => {
    const r = size * 0.24
    const boxW = size * 0.8
    const boxH = size * 0.42
    const boxTop = size * 0.05
    drawHead(g, 0, boxTop - r * 0.35, r, 0x5b4a3f, 0x2e241e)
    // Big gleaming eyes, just over the rim.
    g.fillStyle(0xf6d743, 1)
    g.fillCircle(-r * 0.4, boxTop - r * 0.45, r * 0.26)
    g.fillCircle(r * 0.4, boxTop - r * 0.45, r * 0.26)
    g.fillStyle(0x1a1410, 1)
    g.fillEllipse(-r * 0.4, boxTop - r * 0.45, r * 0.12, r * 0.36)
    g.fillEllipse(r * 0.4, boxTop - r * 0.45, r * 0.12, r * 0.36)
    // The box, with its flaps folded open.
    g.fillStyle(0xc9a06a, 1).lineStyle(2, 0x8a6a3e, 1)
    g.fillRect(-boxW / 2, boxTop, boxW, boxH)
    g.strokeRect(-boxW / 2, boxTop, boxW, boxH)
    for (const side of [-1, 1]) {
      g.fillTriangle(
        (side * boxW) / 2,
        boxTop,
        side * (boxW / 2 + size * 0.14),
        boxTop - size * 0.1,
        side * (boxW / 2 - size * 0.06),
        boxTop - size * 0.02
      )
    }
    g.lineStyle(2, 0x8a6a3e, 1).lineBetween(
      -boxW * 0.2,
      boxTop + boxH * 0.45,
      boxW * 0.2,
      boxTop + boxH * 0.45
    )
  },
  doNotTouch: (g, size) => {
    const fill = 0xe9d8c4
    const outline = 0x8a7358
    // Fur on end: a spiky, puffed-up body.
    const bodyY = size * 0.2
    g.fillStyle(outline, 1)
    for (let i = 0; i < 9; i++) {
      const angle = Math.PI * (0.95 + (i / 8) * 1.1)
      g.fillCircle(
        Math.cos(angle) * size * 0.32,
        bodyY + Math.sin(angle) * size * 0.2,
        size * 0.07
      )
    }
    g.fillStyle(fill, 1).lineStyle(2, outline, 1)
    g.fillEllipse(0, bodyY, size * 0.64, size * 0.44)
    g.strokeEllipse(0, bodyY, size * 0.64, size * 0.44)
    const r = size * 0.22
    const headY = -size * 0.12
    drawHead(g, -size * 0.06, headY, r, fill, outline)
    // Narrowed eyes under cross brows, and a scowl.
    const ink = 0x2b1f1a
    g.lineStyle(2.5, ink, 1)
    g.lineBetween(
      -size * 0.06 - r * 0.6,
      headY - r * 0.3,
      -size * 0.06 - r * 0.15,
      headY - r * 0.1
    )
    g.lineBetween(
      -size * 0.06 + r * 0.6,
      headY - r * 0.3,
      -size * 0.06 + r * 0.15,
      headY - r * 0.1
    )
    g.fillStyle(ink, 1)
    g.fillCircle(-size * 0.06 - r * 0.38, headY + r * 0.08, r * 0.11)
    g.fillCircle(-size * 0.06 + r * 0.38, headY + r * 0.08, r * 0.11)
    g.beginPath()
    g.arc(
      -size * 0.06,
      headY + r * 0.62,
      r * 0.22,
      1.15 * Math.PI,
      1.85 * Math.PI
    )
    g.strokePath()
    // The warning sign: a red circle, struck through.
    const signX = size * 0.3
    const signY = size * 0.2
    const signR = size * 0.13
    g.fillStyle(0xfffaf0, 1).fillCircle(signX, signY, signR)
    g.lineStyle(3, 0xd0342c, 1).strokeCircle(signX, signY, signR)
    g.lineBetween(
      signX - signR * 0.7,
      signY - signR * 0.7,
      signX + signR * 0.7,
      signY + signR * 0.7
    )
  }
}

/** How far below its centre a House Cat sits, as a fraction of its size. */
export const HOUSE_CAT_BASE = 0.45

/**
 * Draws a code-drawn House Cat in `pose`, centred on (0, 0), about `size`
 * pixels across, sitting with its base `HOUSE_CAT_BASE` × `size` below the
 * centre. Skadi's and Freya's poses are each drawn, Skadi's triggered one as
 * her belly-up roll; the other House Cats are drawn at rest in every pose.
 */
export const paintHouseCat = (
  g: Graphics,
  houseCat: HouseCatId,
  size: number,
  pose: HouseCatPose
) => looks[houseCat](g, size, pose)
