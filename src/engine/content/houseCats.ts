import type { Couch } from "../types"

export type HouseCatId = "boxGoblin" | "doNotTouch"

/**
 * A named character on the Shelf that changes how Plays score. It is never
 * drawn or played, so it has no Coat or Personality for rules purposes.
 * Each effect belongs to one scoring phase (ADR-0001) and returns null when
 * it does not apply to the Play.
 */
export type HouseCat = {
  id: HouseCatId
  name: string
  /** What it does, as the Shop and the Shelf describe it. */
  ability: string
  /** Phase 1: Mult added once to the Play. */
  wholePlayMult?: (couch: Couch) => number | null
  /** Phase 3: multiplies the Play's Mult. */
  times?: (couch: Couch) => number | null
}

const played = (couch: Couch) => couch.filter((cat) => cat !== null).length

/** Every House Cat that may be Recruited, in no particular order. */
export const houseCats: readonly HouseCat[] = [
  {
    id: "doNotTouch",
    name: "Do Not Touch",
    ability: "+2 Mult per empty Seat",
    wholePlayMult: (couch) => {
      const empty = couch.length - played(couch)
      return empty > 0 ? 2 * empty : null
    }
  },
  {
    id: "boxGoblin",
    name: "Box Goblin",
    ability: "×2 Mult if exactly three Cats are played",
    times: (couch) => (played(couch) === 3 ? 2 : null)
  }
]

export const houseCat = (id: HouseCatId): HouseCat =>
  houseCats.find((h) => h.id === id)!
