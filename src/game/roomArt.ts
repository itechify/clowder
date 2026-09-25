import type Phaser from "phaser"
import {
  type ArtEntry,
  MOON_PHASES,
  ROOM_SCALE,
  type RoomPiece,
  type UiPiece
} from "../art/manifest"
import { defaultConfig } from "../engine"
import { seatX, shelfX, WIDTH } from "./layout"

type Graphics = Phaser.GameObjects.Graphics
type Paint = (g: Graphics, ctx: CanvasRenderingContext2D) => void

/** The night sky through the window, which the moon's shadow matches. */
const NIGHT_SKY = 0x2d3561

/**
 * Like a delivered image, the Couch and the Shelf are drawn once for a Run as
 * configured by default: five Seats and four Shelf positions.
 */
const seatCentres = seatX(defaultConfig.seats)

/**
 * The brackets of a Shelf `width` across, centred as the scene shows it,
 * between pairs of positions, from its left edge.
 */
function bracketsX(width: number) {
  const xs = shelfX(defaultConfig.shelfSize)
  const left = (WIDTH - width) / 2
  const brackets: number[] = []
  for (let position = 1; position < xs.length; position += 2)
    brackets.push((xs[position - 1] + xs[position]) / 2 - 4 - left)
  return brackets
}

/** Waxing across the Run: the moon's shadow slides off until it is full. */
function moon(g: Graphics, phase: number) {
  g.fillStyle(0xf6ecc9, 1).fillCircle(16, 16, 12)
  if (phase >= MOON_PHASES) return
  const away = 1 + (2 * (phase - 1)) / (MOON_PHASES - 1)
  g.fillStyle(NIGHT_SKY, 1).fillCircle(16 + 6 * away, 16 - 4 * away, 10)
}

/** The Couch's upholstery, from its shadows to its highlights, and outline. */
const upholstery = {
  deep: 0x587558,
  shade: 0x5c7a5f,
  cloth: 0x6f8f72,
  pad: 0x86a888,
  light: 0xa3c3a2,
  outline: 0x33402f
}

/** The Shelf's wood, lit along its top. */
const wood = { top: 0xb07a52, front: 0x8a5a3b, dark: 0x5e3a25 }

const room: Record<RoomPiece, (g: Graphics, entry: ArtEntry) => void> = {
  wall: (g) => {
    g.fillStyle(0xf3dfc1, 1).fillRect(0, 0, 390, 844)
    g.fillStyle(0xe9cfa9, 1)
    for (let x = 12; x < 390; x += 36) g.fillRect(x, 0, 12, 400)
    // Floorboards from just behind the Couch's feet, below a skirting board.
    g.fillStyle(0xb98b62, 1).fillRect(0, 408, 390, 844 - 408)
    g.lineStyle(1.5, 0xa47650, 1)
    for (let y = 440; y < 844; y += 44) g.lineBetween(0, y, 390, y)
    g.fillStyle(0xfaf3e6, 1).fillRect(0, 398, 390, 10)
    g.fillStyle(0xa47650, 1).fillRect(0, 408, 390, 4)
  },
  window: (g) => {
    g.fillStyle(NIGHT_SKY, 1).fillRoundedRect(6, 5, 160, 70, 8)
    g.lineStyle(6, 0xfaf3e6, 1).strokeRoundedRect(6, 5, 160, 70, 8)
    g.lineBetween(86, 5, 86, 75)
  },
  moon: (g, entry) => moon(g, entry.kind === "room" ? (entry.phase ?? 1) : 1),
  couch: (g) => {
    const { deep, shade, cloth, pad, outline } = upholstery
    // A tall back, tufted and seamed behind each Seat.
    g.fillStyle(cloth, 1).fillRoundedRect(16, 2, 358, 112, 30)
    g.fillStyle(pad, 1).fillRoundedRect(36, 10, 318, 10, 5)
    g.lineStyle(3, outline, 1).strokeRoundedRect(16, 2, 358, 112, 30)
    g.lineStyle(2, shade, 1)
    seatCentres.slice(1).forEach((x, i) => {
      const seam = (seatCentres[i] + x) / 2
      g.lineBetween(seam, 26, seam, 96)
    })
    g.fillStyle(shade, 1)
    for (const x of seatCentres) g.fillCircle(x, 50, 3.5)
    // The base the Seats' pads rest on, and its legs.
    g.fillStyle(0x4a3426, 1)
      .fillRoundedRect(30, 146, 12, 20, 3)
      .fillRoundedRect(348, 146, 12, 20, 3)
    g.fillStyle(shade, 1).fillRoundedRect(10, 104, 370, 46, 12)
    g.lineStyle(3, outline, 1).strokeRoundedRect(10, 104, 370, 46, 12)
    // Rolled arms at either end.
    for (const x of [1, 367]) {
      g.fillStyle(deep, 1).fillRoundedRect(x, 44, 22, 104, 11)
      g.fillStyle(cloth, 1).fillRoundedRect(x, 40, 22, 22, 11)
      g.lineStyle(3, outline, 1)
        .strokeRoundedRect(x, 44, 22, 104, 11)
        .strokeRoundedRect(x, 40, 22, 22, 11)
    }
  },
  seatPad: (g) => {
    const { cloth, pad, light, outline } = upholstery
    g.fillStyle(pad, 1).fillRoundedRect(1.5, 1.5, 63, 35, 12)
    g.fillStyle(light, 1).fillRoundedRect(6, 4, 54, 10, 5)
    g.lineStyle(1.5, cloth, 1).lineBetween(9, 18, 57, 18)
    g.lineStyle(3, outline, 1).strokeRoundedRect(1.5, 1.5, 63, 35, 12)
  },
  rug: (g) => {
    // Tasselled at the ends nearest and furthest from the Couch.
    g.lineStyle(2, 0xf0d9b5, 1)
    for (let x = 30; x <= 340; x += 8) {
      g.lineBetween(x, 0, x, 8)
      g.lineBetween(x, 212, x, 220)
    }
    g.fillStyle(0xd46a4f, 1).fillRoundedRect(8, 6, 354, 208, 22)
    g.lineStyle(3, 0x7a3526, 1).strokeRoundedRect(8, 6, 354, 208, 22)
    g.lineStyle(3, 0xf0b28c, 1).strokeRoundedRect(20, 18, 330, 184, 16)
    g.lineStyle(2, 0xe9956f, 1).strokeRoundedRect(32, 30, 306, 160, 12)
    g.fillStyle(0xe28a67, 1)
      .fillTriangle(115, 110, 185, 70, 255, 110)
      .fillTriangle(115, 110, 185, 150, 255, 110)
  },
  shelf: (g, entry) => {
    const width = entry.canvas.width / ROOM_SCALE
    // Brackets fixing the plank to the wall, then the plank, lit along its top.
    g.fillStyle(wood.dark, 1)
    for (const x of bracketsX(width)) {
      g.fillRect(x, 14, 8, 18)
      g.fillTriangle(x + 8, 14, x + 18, 14, x + 8, 26)
    }
    g.fillStyle(wood.front, 1).fillRoundedRect(0, 0, width, 16, 3)
    g.fillStyle(wood.top, 1).fillRect(2, 1, width - 4, 4)
    g.lineStyle(1, wood.dark, 0.5)
    for (const [x, y, length] of [
      [30, 9, 60],
      [140, 11, 44],
      [230, 8, 70],
      [320, 11, 34]
    ])
      g.lineBetween(x, y, x + length, y)
    g.lineStyle(2, wood.dark, 1).strokeRoundedRect(0, 0, width, 16, 3)
  },
  treatJar: (g) => {
    g.fillStyle(0xe8893a, 1)
    for (const [x, y] of [
      [14, 42],
      [26, 44],
      [20, 34],
      [31, 33]
    ])
      g.fillEllipse(x, y, 10, 6)
    g.fillStyle(0xdff1f7, 0.45).lineStyle(2, 0x8fb4d6, 1)
    g.fillRoundedRect(4, 14, 36, 37, 10).strokeRoundedRect(4, 14, 36, 37, 10)
    g.fillStyle(0xd46a4f, 1).fillRoundedRect(7, 5, 30, 10, 4)
  }
}

const ui: Record<UiPiece, (g: Graphics, ready: boolean) => void> = {
  playButton: (g, ready) =>
    g
      .fillStyle(ready ? 0x4a3426 : 0x9c8672, 1)
      .fillRoundedRect(0, 0, 230, 58, 29),
  redrawButton: (g, ready) =>
    g
      .fillStyle(ready ? 0x4a3426 : 0x9c8672, 1)
      .fillRoundedRect(0, 0, 108, 58, 29),
  pip: (g, ready) => {
    if (ready) g.fillStyle(0xf6c453, 1).fillCircle(7, 7, 6)
    g.lineStyle(1.5, ready ? 0x4a3426 : 0x9c8672, 1).strokeCircle(7, 7, 6)
  }
}

const bunting = [0xe8893a, 0x2e2a30, 0xf4efe6, 0x8d9099, 0xd46a4f]

function gathering(
  g: Graphics,
  ctx: CanvasRenderingContext2D,
  entry: ArtEntry & { kind: "gathering" }
) {
  const { width } = entry.canvas
  const w = width / 3
  switch (entry.gathering) {
    case "fullSofa":
      g.lineStyle(5, 0xf6c453, 0.9).strokeRoundedRect(4, 4, 382, 158, 24)
      break
    case "personalSpace":
      g.fillStyle(0xdff1f7, 0.35).fillCircle(34, 34, 32)
      g.lineStyle(2, 0xa7d3e3, 0.9).strokeCircle(34, 34, 32)
      break
    case "varietyPack":
      g.lineStyle(2, 0x7a5a3c, 1).lineBetween(0, 1, w, 1)
      for (let x = 8, i = 0; x < w - 8; x += 18, i++)
        g.fillStyle(bunting[i % bunting.length], 1).fillTriangle(
          x - 6,
          1,
          x + 6,
          1,
          x,
          13
        )
      break
    case "cuddlePuddle":
      g.fillStyle(0xf2c6c2, 0.95).fillRoundedRect(0, 0, w, 18, 8)
      g.lineStyle(2, 0xd98f8a, 1)
      for (let x = 12; x < w - 6; x += 16) g.lineBetween(x, 3, x, 15)
      break
    case "napClub":
      ctx.font = "900 15px system-ui, sans-serif"
      ctx.fillStyle = "#6b7fd7"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("z Z", 21, 12.5)
      break
  }
}

/**
 * The code-drawn fallback for a room, UI, or Gathering key, in design pixels
 * from the top left of its canvas.
 */
export function paintRoomArt(entry: ArtEntry): Paint {
  return (g, ctx) => {
    if (entry.kind === "room") room[entry.piece](g, entry)
    else if (entry.kind === "ui") ui[entry.piece](g, entry.ready)
    else if (entry.kind === "gathering") gathering(g, ctx, entry)
  }
}
