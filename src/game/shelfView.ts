import type Phaser from "phaser"
import { art } from "../art/manifest"
import {
  type Action,
  clearTreats,
  type HouseCatId,
  type Run,
  type ScoreBreakdown
} from "../engine"
import { stageShelf } from "../presentation/staging"
import { addArt } from "./art"
import { drawHouseCat } from "./characters"
import { font, numbers } from "./fonts"
import { shelfX, WIDTH } from "./layout"

type Add = <T extends Phaser.GameObjects.GameObject>(object: T) => T

/**
 * How much narrower than its position a House Cat's name wraps, to stay clear
 * of the brackets beneath the plank either side of it.
 */
const BRACKET_CLEARANCE = 16

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
 * Cat at rest, named beneath it with whatever it has built up so far, the
 * `held` one glowing. With `onTap`, each position
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
  // The plank's brackets fall between positions, and the names beneath the
  // House Cats wrap short of them.
  add(addArt(scene, art.room.shelf, WIDTH / 2, y))
  const g = add(scene.add.graphics())

  const sprites = new Map<HouseCatId, Phaser.GameObjects.Container>()
  const staged = stageShelf(run)
  xs.forEach((x, position) => {
    if (!staged[position]) {
      // A free position: a little mat waiting on the plank.
      g.fillStyle(0xfaf3e6, 0.55).fillEllipse(x, y + 2, size * 0.9, 7)
      g.lineStyle(1.5, 0xb07a52, 0.8).strokeEllipse(x, y + 2, size * 0.9, 7)
    } else {
      const { houseCat: id, pose, name, state, inert } = staged[position]
      if (id === held)
        g.fillStyle(0xfff4c2, 0.9).fillRoundedRect(
          x - width / 2 + 4,
          sitY - size / 2 - 8,
          width - 8,
          size + 10,
          14
        )
      // A Copycat with nothing to copy is greyed out; one copying says whom.
      sprites.set(
        id,
        add(drawHouseCat(scene, pose, size))
          .setPosition(x, sitY)
          .setAlpha(inert ? 0.35 : 1)
      )
      const label = add(
        scene.add
          .text(x, y + 18, name, {
            ...font(10, inert ? "#9c8672" : "#4a3426", "800"),
            align: "center",
            wordWrap: { width: width - BRACKET_CLEARANCE }
          })
          .setOrigin(0.5, 0)
      )
      label.setLineSpacing(-2)
      // What it has built up so far, on a tag at its feet.
      if (state) {
        const tag = scene.add
          .text(x - size * 0.5, y - 10, state, numbers(11, "#f6d743"))
          .setOrigin(0.5)
        add(scene.add.graphics())
          .fillStyle(0x141018, 0.92)
          .fillRoundedRect(
            tag.x - tag.width / 2 - 5,
            tag.y - 8,
            tag.width + 10,
            16,
            8
          )
        add(tag)
      }
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
