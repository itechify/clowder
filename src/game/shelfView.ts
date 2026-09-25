import type Phaser from "phaser"
import {
  type Action,
  clearTreats,
  copying,
  type HouseCatId,
  houseCat,
  type Run,
  type ScoreBreakdown
} from "../engine"
import { font, WIDTH } from "./CouchScene"
import { drawHouseCat } from "./houseCatArt"

type Add = <T extends Phaser.GameObjects.GameObject>(object: T) => T

/** Position centres, spread evenly along the Shelf. */
export const shelfX = (positions: number) =>
  Array.from(
    { length: positions },
    (_, position) => 20 + ((WIDTH - 40) / positions) * (position + 0.5)
  )

/** Where a House Cat of `size` sits on a Shelf whose plank's top is at `y`. */
export const onShelf = (y: number, size: number) => y - size * 0.45

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`

/**
 * What each House Cat adds to the Play as it stands, as a note to float above
 * it; one that adds nothing to this Play has none. Freya always shows where
 * she has warmed up to, and Treat Dealer what clearing the Night now would pay.
 */
export function shelfNotes(
  run: Run,
  breakdown: ScoreBreakdown
): Partial<Record<HouseCatId, string>> {
  const notes: Partial<Record<HouseCatId, string>> = {}
  const tally = (counts: Map<HouseCatId, number>, id: HouseCatId, n: number) =>
    counts.set(id, (counts.get(id) ?? 0) + n)
  const mult = new Map<HouseCatId, number>()
  const repeats = new Map<HouseCatId, number>()
  const grows = new Map<HouseCatId, number>()
  for (const effect of breakdown.wholePlayEffects)
    tally(mult, effect.houseCat, effect.mult)
  for (const event of breakdown.scoringEvents) {
    for (const from of event.multFrom) tally(mult, from.houseCat, from.mult)
    if (event.source !== "seat") tally(repeats, event.source, 1)
  }
  for (const growth of breakdown.growth) tally(grows, growth.houseCat, 1)
  for (const [id, added] of mult) notes[id] = `+${added} Mult`
  for (const [id, count] of repeats) notes[id] = plural(count, "Repeat")
  for (const [id, count] of grows) notes[id] = `grows ${plural(count, "Cat")}`
  for (const effect of breakdown.timesEffects)
    notes[effect.houseCat] = `×${effect.times.toFixed(1)}`
  for (const paid of clearTreats(run.shelf, run.night))
    notes[paid.houseCat] = `+${plural(paid.treats, "Treat")}`
  return notes
}

/**
 * Draws the Shelf: a plank with a position per House Cat it can hold, each House
 * Cat named beneath it, the `held` one glowing. With `onTap`, each position
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
    onTap?: (position: number) => void
  }
) {
  const xs = shelfX(run.config.shelfSize)
  const width = (WIDTH - 40) / xs.length
  const sitY = onShelf(y, size)
  const g = add(scene.add.graphics())
  g.fillStyle(0x8a5a3b, 1).fillRoundedRect(12, y, WIDTH - 24, 10, 3)
  // Brackets between positions, clear of the names beneath the House Cats.
  g.fillStyle(0x6e4630, 1)
  for (let position = 1; position < xs.length; position += 2)
    g.fillRect((xs[position - 1] + xs[position]) / 2 - 4, y + 10, 8, 14)

  const sprites = new Map<HouseCatId, Phaser.GameObjects.Container>()
  const copied = copying(run.shelf)
  xs.forEach((x, position) => {
    const id = run.shelf[position]
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
      // A Copycat with nothing to copy is greyed out; one copying says whom.
      const inert = id === "copycat" && copied[position] === null
      sprites.set(
        id,
        add(drawHouseCat(scene, id, size))
          .setPosition(x, sitY)
          .setAlpha(inert ? 0.35 : 1)
      )
      const copiedName = copied[position] && houseCat(copied[position]).name
      const label = add(
        scene.add
          .text(
            x,
            y + 12,
            copiedName ? `Copycat as ${copiedName}` : houseCat(id).name,
            {
              ...font(10, inert ? "#9c8672" : "#4a3426", "800"),
              align: "center",
              wordWrap: { width: width - 4 }
            }
          )
          .setOrigin(0.5, 0)
      )
      label.setLineSpacing(-2)
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
        .on("pointerdown", () => onTap(position))
  })
  return sprites
}

/**
 * A tap on a Shelf position, while `held` is the House Cat picked up (if any):
 * picks up the position's House Cat, lets go of the held one, or moves the held
 * one there, to the end of the Shelf if the position is empty.
 */
export function tapShelf(
  run: Run,
  held: HouseCatId | null,
  position: number
): { held: HouseCatId | null; action?: Action } {
  const at = run.shelf[position]
  if (held === null || !run.shelf.includes(held)) return { held: at ?? null }
  if (at === held) return { held: null }
  return {
    held: null,
    action: {
      type: "reorderShelf",
      houseCat: held,
      position: Math.min(position, run.shelf.length - 1)
    }
  }
}
