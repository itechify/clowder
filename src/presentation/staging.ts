import type { CatId, Run } from "../engine"

/**
 * The presentation model's staging: what the living room shows for a Run as
 * it stands, including a Couch still being arranged before a Play. Pure data
 * from Run state, so the scene only draws it and computes no layout itself.
 */

/** The rug's rows: the front row nearest the player, the back row behind it. */
export type RugRow = "front" | "back"

/** Where a Cat is: on a Seat of the Couch, or lounging at a position on the rug. */
export type Placement =
  | { on: "couch"; seat: number }
  | { on: "rug"; row: RugRow; position: number }

export type StagedCat = { cat: CatId; placement: Placement }

export type Staging = {
  /** Every Cat in view: the seated Cats by Seat, then the rug's by position. */
  cats: StagedCat[]
}

/** How many Cats each rug row holds, so a full Hand fills both rows. */
export const rugPositions = (run: Run) => Math.ceil(run.config.handSize / 2)

/**
 * Stages the Run as it stands; or, given the `couch` of a Play already made,
 * with those Cats back on their Seats, as when the household falls asleep.
 */
export function stage(
  run: Run,
  couch: readonly (CatId | null)[] = run.night.couch
): Staging {
  const { hand } = run.night
  const perRow = rugPositions(run)
  const seated: StagedCat[] = couch.flatMap((cat, seat) =>
    cat ? [{ cat, placement: { on: "couch", seat } }] : []
  )
  // The rest of the Hand lounges on the rug in Hand order, the front row
  // filling first and closing up behind any Cat that leaves it.
  const lounging: StagedCat[] = hand
    .filter((cat) => !couch.includes(cat))
    .map((cat, i) => ({
      cat,
      placement: {
        on: "rug",
        row: i < perRow ? "front" : "back",
        position: i % perRow
      }
    }))
  return { cats: [...seated, ...lounging] }
}
