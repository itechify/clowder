import type Phaser from "phaser"
import {
  type ArtEntry,
  MOON_PHASES,
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

/** The Shelf's brackets, between pairs of positions, from its left edge. */
function bracketsX() {
  const xs = shelfX(defaultConfig.shelfSize)
  const left = (WIDTH - 366) / 2
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

const room: Record<RoomPiece, (g: Graphics, entry: ArtEntry) => void> = {
  wall: (g) => {
    g.fillStyle(0xf3dfc1, 1).fillRect(0, 0, 390, 844)
    g.fillStyle(0xe9cfa9, 1)
    for (let x = 12; x < 390; x += 36) g.fillRect(x, 0, 12, 470)
    g.fillStyle(0xb98b62, 1).fillRect(0, 470, 390, 844 - 470)
    g.fillStyle(0xa47650, 1).fillRect(0, 470, 390, 8)
  },
  window: (g) => {
    g.fillStyle(NIGHT_SKY, 1).fillRoundedRect(6, 5, 160, 70, 8)
    g.lineStyle(6, 0xfaf3e6, 1).strokeRoundedRect(6, 5, 160, 70, 8)
    g.lineBetween(86, 5, 86, 75)
  },
  moon: (g, entry) => moon(g, entry.kind === "room" ? (entry.phase ?? 1) : 1),
  couch: (g) => {
    g.fillStyle(0x6f8f72, 1).fillRoundedRect(8, 0, 374, 112, 22)
    g.fillStyle(0x5c7a5f, 1).fillRoundedRect(8, 110, 374, 40, 12)
    g.fillStyle(0x86a888, 1)
    for (const x of seatCentres) g.fillRoundedRect(x - 33, 38, 66, 80, 14)
    g.fillStyle(0x587558, 1)
    g.fillRoundedRect(0, 38, 22, 110, 10).fillRoundedRect(368, 38, 22, 110, 10)
    g.fillStyle(0x4a3426, 1)
      .fillRect(24, 148, 10, 18)
      .fillRect(356, 148, 10, 18)
  },
  rug: (g) => {
    g.fillStyle(0xd46a4f, 1).fillRoundedRect(0, 0, 350, 245, 28)
    g.lineStyle(3, 0xf0b28c, 1).strokeRoundedRect(12, 12, 326, 221, 22)
  },
  shelf: (g) => {
    g.fillStyle(0x8a5a3b, 1).fillRoundedRect(0, 0, 366, 10, 3)
    g.fillStyle(0x6e4630, 1)
    for (const x of bracketsX()) g.fillRect(x, 10, 8, 14)
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
