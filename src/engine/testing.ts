import { type Action, applyAction } from "./actions"
import { type Config, defaultConfig } from "./config"
import type { Coat } from "./content/coats"
import type { HouseCatId } from "./content/houseCats"
import type { Personality } from "./content/personalities"
import { startRun } from "./run"
import type { CatId, Run } from "./types"

/** A Cat to seat: its Personality, optionally with a Coat; null leaves the Seat empty. */
export type SeatSpec = Personality | `${Coat} ${Personality}` | null

/**
 * A fresh Run whose Hand holds Roster Cats matching the specs, seated in order
 * from Seat 0, with the given Shelf. Test-only: stands in for a lucky draw and
 * the Shop visits before it.
 */
export function runWithCouch(
  specs: SeatSpec[],
  {
    seed = 1,
    config = {},
    shelf = []
  }: { seed?: number; config?: Partial<Config>; shelf?: HouseCatId[] } = {}
): Run {
  const run = startRun(seed, { ...defaultConfig, ...config })
  const chosen: (CatId | null)[] = []
  for (const spec of specs) {
    if (spec === null) {
      chosen.push(null)
      continue
    }
    const [coat, personality] = spec.includes(" ")
      ? spec.split(" ")
      : [undefined, spec]
    const cat = run.roster.find(
      (c) =>
        c.personality === personality &&
        (coat === undefined || c.coat === coat) &&
        !chosen.includes(c.id)
    )
    if (!cat) throw new Error(`The Roster has no spare ${spec} Cat`)
    chosen.push(cat.id)
  }
  const hand = chosen.filter((id) => id !== null)
  let next: Run = {
    ...run,
    shelf,
    night: {
      ...run.night,
      hand,
      drawPile: run.roster.map((c) => c.id).filter((id) => !hand.includes(id))
    }
  }
  chosen.forEach((cat, seat) => {
    if (cat) next = applyAction(next, { type: "place", cat, seat }).run
  })
  return next
}

/** Applies an action that must be accepted, returning the next Run and its events. */
export function accepted(run: Run, action: Action) {
  const result = applyAction(run, action)
  if (!result.ok) throw new Error(result.reason)
  return result
}
