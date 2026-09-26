import type Phaser from "phaser"
import { art } from "../art/manifest"
import type { ScrapbookView } from "../presentation/scrapbook"
import { addArt } from "./art"
import { display, font, OUTLINE } from "./fonts"
import { WIDTH } from "./layout"

type Add = <T extends Phaser.GameObjects.GameObject>(object: T) => T
type Point = { x: number; y: number }

/**
 * The Scrapbook, open over the rug by night or by day: its centre, and its
 * title across the top.
 */
export const OPEN_SCRAPBOOK = { y: 574, titleY: 472 }
/**
 * Opened from the room, a row for each Gathering, the first at `top`, each
 * `step` below the last; its name and requirement from the left, its level
 * and what it adds from the right; and how to close it beneath.
 */
const ROWS = { top: 504, step: 36, left: 30, right: 360 }
const HINT_Y = 678
/** The closed Scrapbook's tap area, around it. */
const TAP_AREA = { w: 64, h: 48 }

/**
 * The Scrapbook lying closed in the room at `at`, answering a tap with
 * `onTap`. Returns the Scrapbook and its tap area.
 */
export function drawClosedScrapbook(
  scene: Phaser.Scene,
  add: Add,
  at: Point,
  onTap: () => void
) {
  const book = add(addArt(scene, art.room.scrapbook, at.x, at.y))
  const area = add(scene.add.zone(at.x, at.y, TAP_AREA.w, TAP_AREA.h))
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", onTap)
  return { book, area }
}

/** The Scrapbook, open over the rug: the title across its top. */
export function drawOpenScrapbook(
  scene: Phaser.Scene,
  add: Add,
  title: string
) {
  return [
    add(addArt(scene, art.room.scrapbookOpen, WIDTH / 2, OPEN_SCRAPBOOK.y)),
    add(
      scene.add
        .text(WIDTH / 2, OPEN_SCRAPBOOK.titleY, title, display(22, "#fdf6ea"))
        .setOrigin(0.5)
        .setStroke(OUTLINE, 5)
    )
  ]
}

/**
 * The Scrapbook opened from the room: a row for every Gathering, its name
 * and what forms it, its level and all it adds at that level; one not yet
 * discovered this Run shows only "???". A tap anywhere closes it.
 */
export function drawScrapbookView(
  scene: Phaser.Scene,
  add: Add,
  { title, entries }: ScrapbookView
) {
  drawOpenScrapbook(scene, add, title)
  const { top, step, left, right } = ROWS
  entries.forEach((entry, row) => {
    const y = top + row * step
    add(
      scene.add
        .text(left, y - 8, entry.name, display(16, "#4a3426"))
        .setOrigin(0, 0.5)
    )
    add(
      scene.add
        .text(left, y + 9, entry.requirement, font(11, "#7a5a3c", "700"))
        .setOrigin(0, 0.5)
    )
    if (!entry.discovered) return
    add(
      scene.add
        .text(right, y - 8, entry.label.level, font(16, "#4a3426", "800"))
        .setOrigin(1, 0.5)
    )
    add(
      scene.add
        .text(right, y + 9, entry.label.adds, font(12, "#b4561f", "800"))
        .setOrigin(1, 0.5)
    )
  })
  add(
    scene.add
      .text(WIDTH / 2, HINT_Y, "Tap to close", font(12, "#7a5a3c", "800"))
      .setOrigin(0.5)
  )
}
