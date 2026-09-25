import type Phaser from "phaser"
import {
  type Action,
  type HouseCatId,
  houseCat,
  type Run,
  type ScoreBreakdown
} from "../engine"
import { font, WIDTH } from "./CouchScene"
import { drawHouseCat } from "./houseCatArt"

type Add = <T extends Phaser.GameObjects.GameObject>(object: T) => T

/** Slot centres, spread evenly along the Shelf. */
export const shelfSlotX = (slots: number) =>
  Array.from(
    { length: slots },
    (_, slot) => 20 + ((WIDTH - 40) / slots) * (slot + 0.5)
  )

/** Where a House Cat of `size` sits on a Shelf whose plank's top is at `y`. */
export const onShelf = (y: number, size: number) => y - size * 0.45

/**
 * What each House Cat adds to a Play, as a note to float above it; one that
 * adds nothing to this Play has none.
 */
export function shelfNotes(
  breakdown: ScoreBreakdown
): Partial<Record<HouseCatId, string>> {
  const notes: Partial<Record<HouseCatId, string>> = {}
  for (const effect of breakdown.wholePlayEffects)
    notes[effect.houseCat] = `+${effect.mult} Mult`
  for (const effect of breakdown.timesEffects)
    notes[effect.houseCat] = `×${effect.times}`
  return notes
}

/**
 * Draws the Shelf: a plank with a slot per House Cat it can hold, each House
 * Cat named beneath it, the `held` one glowing. With `onTap`, each slot
 * answers a tap. Returns the House Cats drawn, to animate during scoring.
 */
export function drawShelf(
  scene: Phaser.Scene,
  add: Add,
  {
    run,
    y,
    size,
    held = null,
    notes = {},
    onTap
  }: {
    run: Run
    y: number
    size: number
    held?: HouseCatId | null
    notes?: Partial<Record<HouseCatId, string>>
    onTap?: (slot: number) => void
  }
) {
  const xs = shelfSlotX(run.config.shelfSlots)
  const width = (WIDTH - 40) / xs.length
  const sitY = onShelf(y, size)
  const g = add(scene.add.graphics())
  g.fillStyle(0x8a5a3b, 1).fillRoundedRect(12, y, WIDTH - 24, 10, 3)
  // Brackets between slots, clear of the names beneath the House Cats.
  g.fillStyle(0x6e4630, 1)
  for (let slot = 1; slot < xs.length; slot += 2)
    g.fillRect((xs[slot - 1] + xs[slot]) / 2 - 4, y + 10, 8, 14)

  const sprites = new Map<HouseCatId, Phaser.GameObjects.Container>()
  xs.forEach((x, slot) => {
    const id = run.shelf[slot]
    if (id === undefined) {
      g.lineStyle(2, 0x8a5a3b, 0.35)
      g.strokeRoundedRect(x - size / 2, sitY - size / 2, size, size, 12)
    } else {
      if (id === held)
        g.fillStyle(0xfff4c2, 0.9).fillRoundedRect(
          x - width / 2 + 4,
          sitY - size / 2 - 8,
          width - 8,
          size + 10,
          14
        )
      sprites.set(id, add(drawHouseCat(scene, id, size)).setPosition(x, sitY))
      add(
        scene.add
          .text(x, y + 18, houseCat(id).name, font(10, "#4a3426", "800"))
          .setOrigin(0.5)
      )
      const note = notes[id]
      if (note) {
        const label = scene.add
          .text(x, sitY - size * 0.62, note, font(12, "#c2410c", "900"))
          .setOrigin(0.5)
        add(scene.add.graphics())
          .fillStyle(0xfff4dc, 0.95)
          .fillRoundedRect(
            x - label.width / 2 - 6,
            label.y - 10,
            label.width + 12,
            20,
            10
          )
        add(label)
      }
    }
    if (onTap)
      add(scene.add.zone(x, sitY + 4, width - 4, size + 28))
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => onTap(slot))
  })
  return sprites
}

/**
 * A tap on a Shelf slot, while `held` is the House Cat picked up (if any):
 * picks up the slot's House Cat, lets go of the held one, or moves the held
 * one there, to the end of the Shelf if the slot is empty.
 */
export function tapShelf(
  run: Run,
  held: HouseCatId | null,
  slot: number
): { held: HouseCatId | null; action?: Action } {
  const at = run.shelf[slot]
  if (held === null || !run.shelf.includes(held)) return { held: at ?? null }
  if (at === held) return { held: null }
  return {
    held: null,
    action: {
      type: "reorderShelf",
      houseCat: held,
      slot: Math.min(slot, run.shelf.length - 1)
    }
  }
}
