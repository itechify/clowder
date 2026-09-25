import type Phaser from "phaser"
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

/**
 * Each House Cat has its own look, since none has a Coat: Box Goblin peers
 * out of a cardboard box with gleaming eyes, and Do Not Touch puffs up in a
 * huff beside its warning sign.
 */
const looks: Record<HouseCatId, (g: Graphics, size: number) => void> = {
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

/**
 * A placeholder House Cat centred on (0, 0), about `size` pixels across,
 * sitting with its base about `size` × 0.45 below the centre.
 */
export function drawHouseCat(
  scene: Phaser.Scene,
  houseCat: HouseCatId,
  size: number
): Phaser.GameObjects.Container {
  const g = scene.add.graphics()
  looks[houseCat](g, size)
  return scene.add.container(0, 0, [g])
}
