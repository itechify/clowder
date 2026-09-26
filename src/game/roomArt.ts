import type Phaser from "phaser"
import {
  type ArtEntry,
  MOON_PHASES,
  ROOM_SCALE,
  type RoomPiece,
  type UiPiece
} from "../art/manifest"
import { defaultConfig } from "../engine"
import { displayFont, OUTLINE } from "./fonts"
import { seatX, shelfX, WIDTH } from "./layout"

type Graphics = Phaser.GameObjects.Graphics
type Paint = (g: Graphics, ctx: CanvasRenderingContext2D) => void

/** The night sky through the window, which the moon's shadow matches. */
const NIGHT_SKY = 0x2d3561
/** The sky by day, through the window and the open front door. */
const DAY_SKY = 0x9fd3f0
/** The bold dark-brown outline round everything drawn in the game's style. */
export const INK = 0x3b2a22
/** The red of a Disaster, wherever one is announced. */
export const DISASTER_RED = 0x8a3a2e

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

type Point = [x: number, y: number]

/** Traces a closed outline through `points`, ready to fill or stroke. */
function trace(g: Graphics, points: readonly Point[]) {
  g.beginPath()
  for (const [i, [x, y]] of points.entries())
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  return g.closePath()
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
  },
  disasterSign: (g) => {
    // A string from the nail to the sign's top corners.
    g.lineStyle(2, INK, 1)
      .lineBetween(82, 5, 22, 18)
      .lineBetween(82, 5, 142, 18)
    g.fillStyle(DISASTER_RED, 1).fillRoundedRect(3, 16, 158, 44, 12)
    g.lineStyle(2, 0xf0b28c, 1).strokeRoundedRect(8, 21, 148, 34, 8)
    g.lineStyle(3, INK, 1).strokeRoundedRect(3, 16, 158, 44, 12)
    g.fillStyle(0x5e3a25, 1).fillCircle(82, 5, 3.5)
  },
  dayWindow: (g) => {
    g.fillStyle(DAY_SKY, 1).fillRoundedRect(6, 5, 160, 70, 8)
    // A few soft clouds low in a clear sky.
    g.fillStyle(0xffffff, 0.8)
      .fillEllipse(40, 58, 34, 12)
      .fillEllipse(54, 54, 22, 12)
      .fillEllipse(128, 62, 30, 10)
    g.lineStyle(6, 0xfaf3e6, 1).strokeRoundedRect(6, 5, 160, 70, 8)
    g.lineBetween(86, 5, 86, 75)
  },
  sun: (g) => {
    g.fillStyle(0xfff1b0, 0.5).fillCircle(18, 18, 17)
    g.fillStyle(0xf6c453, 1).fillCircle(18, 18, 12)
    g.fillStyle(0xfff1b0, 1).fillCircle(14, 14, 4)
    g.lineStyle(2, 0xe8893a, 1).strokeCircle(18, 18, 12)
  },
  sunbeam: (g) => {
    // Daylight slanting in from the front door, softest at its edges.
    trace(g.fillStyle(0xfff1b0, 0.14), [
      [40, 0],
      [260, 0],
      [300, 120],
      [0, 120]
    ]).fillPath()
    trace(g.fillStyle(0xfff1b0, 0.16), [
      [80, 0],
      [220, 0],
      [250, 120],
      [50, 120]
    ]).fillPath()
  },
  stormClouds: (g) => {
    for (const [x, y, w, h, shade] of [
      [38, 26, 60, 28, 0x6b6f86],
      [72, 18, 64, 30, 0x7d8198],
      [112, 26, 62, 26, 0x6b6f86],
      [58, 30, 70, 20, 0x5a5d73],
      [100, 32, 72, 18, 0x5a5d73]
    ])
      g.fillStyle(shade, 1).fillEllipse(x, y, w, h)
    g.lineStyle(2, INK, 0.6).strokeEllipse(72, 18, 64, 30)
    // A flash of lightning beneath.
    trace(g.fillStyle(0xf6d743, 1), [
      [84, 30],
      [94, 30],
      [88, 37],
      [95, 37],
      [80, 44],
      [85, 36],
      [79, 36]
    ]).fillPath()
  },
  frontDoor: (g) => {
    // A wide doorway onto a sunny day, its two doors swung open either side.
    g.fillStyle(DAY_SKY, 1).fillRect(34, 6, 304, 70)
    g.fillStyle(0x9ccf7a, 1).fillRect(34, 58, 304, 34)
    trace(g.fillStyle(0xe9d8b4, 1), [
      [160, 58],
      [212, 58],
      [250, 92],
      [122, 92]
    ]).fillPath()
    g.fillStyle(0xfff1b0, 0.35).fillRect(34, 6, 304, 86)
    g.lineStyle(6, 0xfaf3e6, 1).strokeRect(34, 6, 304, 90)
    for (const [hinge, edge] of [
      [34, 4],
      [338, 368]
    ]) {
      const door: Point[] = [
        [hinge, 6],
        [edge, 0],
        [edge, 100],
        [hinge, 96]
      ]
      trace(g.fillStyle(0x7a5a3c, 1), door).fillPath()
      trace(g.lineStyle(2.5, INK, 1), door).strokePath()
    }
    // A doormat on the threshold.
    g.fillStyle(0xc98a4b, 1).fillRoundedRect(136, 84, 100, 14, 4)
    g.lineStyle(2, INK, 1).strokeRoundedRect(136, 84, 100, 14, 4)
  },
  disasterNote: (g) => {
    // A red note pinned to the wall, a corner curling.
    g.fillStyle(DISASTER_RED, 1).fillRoundedRect(4, 8, 156, 50, 6)
    g.lineStyle(2, 0xf0b28c, 1).strokeRoundedRect(9, 13, 146, 40, 4)
    g.lineStyle(3, INK, 1).strokeRoundedRect(4, 8, 156, 50, 6)
    g.fillStyle(0xf6c453, 1).fillCircle(82, 9, 4.5)
    g.lineStyle(2, INK, 1).strokeCircle(82, 9, 4.5)
  },
  offerTag: (g) => {
    // A cream luggage tag hung from a string, a hole at its top.
    g.lineStyle(1.5, INK, 1).lineBetween(43, 0, 43, 6)
    g.fillStyle(0xfdf6ea, 1).fillRoundedRect(2, 5, 82, 45, 7)
    g.lineStyle(2.5, INK, 1).strokeRoundedRect(2, 5, 82, 45, 7)
    g.fillStyle(0xe9cfa9, 1).fillCircle(43, 10, 2.5)
  },
  countBadge: (g) => {
    g.fillStyle(0xfdf6ea, 1).fillRoundedRect(1.5, 1.5, 29, 17, 8.5)
    g.lineStyle(2.5, INK, 1).strokeRoundedRect(1.5, 1.5, 29, 17, 8.5)
  }
}

/**
 * A chunky pill of a button, `w` × `h`: a face over a darker lip, so it looks
 * pressable, and flattened onto its lip when it is not.
 */
function button(g: Graphics, w: number, h: number, face: number, lip: number) {
  g.fillStyle(lip, 1).fillRoundedRect(1.5, 1.5, w - 3, h - 3, (h - 3) / 2)
  g.fillStyle(face, 1).fillRoundedRect(1.5, 1.5, w - 3, h - 9, (h - 9) / 2)
  g.fillStyle(0xffffff, 0.22).fillRoundedRect(h / 3, 6, w - (2 * h) / 3, 7, 3.5)
  g.lineStyle(3, INK, 1).strokeRoundedRect(1.5, 1.5, w - 3, h - 3, (h - 3) / 2)
}

/** A pressable button's face and lip, then a pressed-flat one's. */
const buttonColours = {
  primary: { face: 0xe8893a, lip: 0xa8541f },
  secondary: { face: 0x7a5a3c, lip: 0x4a3426 },
  disabled: { face: 0xcbb69c, lip: 0xa8927a }
}

/** The purr meter's channel, and the glow filling it. */
const meter = {
  cloth: 0xf3e3c8,
  channel: 0xd9bf98,
  glow: 0xe8893a,
  shine: 0xf8c07a
}

const ui: Record<UiPiece, (g: Graphics, ready: boolean) => void> = {
  playButton: (g, ready) => {
    const { face, lip } = buttonColours[ready ? "primary" : "disabled"]
    button(g, 230, 58, face, lip)
  },
  redrawButton: (g, ready) => {
    const { face, lip } = buttonColours[ready ? "secondary" : "disabled"]
    button(g, 108, 58, face, lip)
  },
  pip: (g, ready) => {
    g.fillStyle(ready ? 0xf6c453 : INK, ready ? 1 : 0.25).fillCircle(7, 7, 5.5)
    if (ready) g.fillStyle(0xfff1b0, 1).fillCircle(5.5, 5.5, 1.8)
    g.lineStyle(2, INK, ready ? 1 : 0.6).strokeCircle(7, 7, 5.5)
  },
  purrMeter: (g, ready) => {
    g.fillStyle(meter.cloth, 1).fillRoundedRect(1.5, 1.5, 297, 23, 11.5)
    if (ready) {
      g.fillStyle(meter.glow, 1).fillRoundedRect(5, 5, 290, 16, 8)
      g.fillStyle(meter.shine, 1).fillRoundedRect(10, 7, 280, 4, 2)
    } else g.fillStyle(meter.channel, 1).fillRoundedRect(5, 5, 290, 16, 8)
    g.lineStyle(3, INK, 1).strokeRoundedRect(1.5, 1.5, 297, 23, 11.5)
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
      // A warm halo, softest furthest out.
      g.lineStyle(9, 0xf6c453, 0.25).strokeRoundedRect(5, 5, 380, 156, 24)
      g.lineStyle(4, 0xf6c453, 1).strokeRoundedRect(5, 5, 380, 156, 24)
      break
    case "personalSpace":
      g.fillStyle(0xdff1f7, 0.3).fillCircle(34, 34, 32)
      g.lineStyle(2.5, 0x5d9ab8, 0.9).strokeCircle(34, 34, 32)
      g.lineStyle(3, 0xffffff, 0.8).beginPath()
      g.arc(34, 34, 26, Math.PI * 1.1, Math.PI * 1.4).strokePath()
      break
    case "varietyPack":
      g.lineStyle(2, INK, 1).lineBetween(0, 1.5, w, 1.5)
      for (let x = 9, i = 0; x < w - 8; x += 18, i++) {
        g.fillStyle(bunting[i % bunting.length], 1)
        g.fillTriangle(x - 6, 1.5, x + 6, 1.5, x, 12.5)
        g.lineStyle(1.5, INK, 1).strokeTriangle(x - 6, 1.5, x + 6, 1.5, x, 12.5)
      }
      break
    case "cuddlePuddle":
      g.fillStyle(0xf2c6c2, 1).fillRoundedRect(1, 1, w - 2, 16, 8)
      g.lineStyle(2, 0xd98f8a, 1)
      for (let x = 12; x < w - 6; x += 16) g.lineBetween(x, 4, x, 14)
      g.lineStyle(2, INK, 1).strokeRoundedRect(1, 1, w - 2, 16, 8)
      break
    case "napClub":
      ctx.font = displayFont(15)
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.lineJoin = "round"
      ctx.lineWidth = 3
      ctx.strokeStyle = OUTLINE
      ctx.strokeText("z Z", 21, 12.5)
      ctx.fillStyle = "#a9b6f2"
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
