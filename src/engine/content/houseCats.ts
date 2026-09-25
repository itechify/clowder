import type { Cat, Couch, Night } from "../types"

export type HouseCatId =
  | "oneBraincell"
  | "bigLoaf"
  | "boxGoblin"
  | "doNotTouch"
  | "skadi"
  | "copycat"
  | "freya"
  | "theVoid"
  | "treatDealer"

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
  /** Phase 2: Mult added by each Scoring event of `cat`. */
  perScoreMult?: (cat: Cat) => number | null
  /** Phase 2: Repeats given to the Cat in `seat`, after its Scoring event. */
  repeats?: (couch: Couch, seat: number) => number
  /**
   * After the Play: base Purr a played Cat gains for good, given how many
   * Gatherings the Play activated.
   */
  grows?: (cat: Cat, gatherings: number) => number | null
  /** Treats it pays on clearing `night`, as the Night stands when cleared. */
  paysOnClear?: (night: Night) => number | null
  /** Whether the Play warms it up, raising its × for the rest of the Night. */
  warmsUp?: (couch: Couch) => boolean
  /** Phase 3: multiplies the Play's Mult. */
  times?: (couch: Couch, night: Night) => number | null
}

const catsPlayed = (couch: Couch) => couch.filter((cat) => cat !== null).length

/** Whether an Aloof Cat on the Couch has no Neighbors. */
const aloofAlone = (couch: Couch) =>
  couch.some(
    (cat, seat) =>
      cat?.personality === "aloof" && !couch[seat - 1] && !couch[seat + 1]
  )

/** Every House Cat that may be Recruited, in no particular order. */
export const houseCats: readonly HouseCat[] = [
  {
    id: "oneBraincell",
    name: "One Braincell",
    ability: "+2 Mult each time an Orange Cat scores",
    perScoreMult: (cat) => (cat.coat === "orange" ? 2 : null)
  },
  {
    id: "bigLoaf",
    name: "The Big Loaf",
    ability: "Played Sleepy Cats get one Repeat",
    repeats: (couch, seat) => (couch[seat]?.personality === "sleepy" ? 1 : 0)
  },
  {
    id: "doNotTouch",
    name: "Do Not Touch",
    ability: "+2 Mult per empty Seat",
    wholePlayMult: (couch) => {
      const empty = couch.length - catsPlayed(couch)
      return empty > 0 ? 2 * empty : null
    }
  },
  {
    id: "skadi",
    name: "Skadi (Belly Up)",
    ability: "Cats in Seats 1 and 5 get one Repeat",
    repeats: (couch, seat) =>
      couch[seat] && (seat === 0 || seat === couch.length - 1) ? 1 : 0
  },
  {
    id: "copycat",
    name: "Copycat",
    ability: "Copies the House Cat to its left"
  },
  {
    id: "theVoid",
    name: "The Void",
    ability: "After a Play with a Gathering, its Black Cats gain +2 base Purr",
    grows: (cat, gatherings) =>
      gatherings > 0 && cat.coat === "black" ? 2 : null
  },
  {
    id: "freya",
    name: "Freya (Slow to Warm Up)",
    ability: "×1, +×0.5 per Play tonight an Aloof Cat has no Neighbors",
    warmsUp: aloofAlone,
    times: (couch, night) =>
      1 + 0.5 * (night.warmPlays + (aloofAlone(couch) ? 1 : 0))
  },
  {
    id: "treatDealer",
    name: "Treat Dealer",
    ability: "+1 Treat per unused Redraw when a Night is cleared",
    paysOnClear: (night) => (night.redrawsLeft > 0 ? night.redrawsLeft : null)
  },
  {
    id: "boxGoblin",
    name: "Box Goblin",
    ability: "×2 Mult if exactly three Cats are played",
    times: (couch) => (catsPlayed(couch) === 3 ? 2 : null)
  }
]

export const houseCat = (id: HouseCatId): HouseCat =>
  houseCats.find((h) => h.id === id)!

/**
 * What each Shelf position's Copycat copies: the House Cat immediately to its
 * left, unless there is none or it is another Copycat. Null for any other
 * House Cat, and for a Copycat copying nothing.
 */
export const copying = (shelf: readonly HouseCatId[]): (HouseCatId | null)[] =>
  shelf.map((id, position) => {
    const left = shelf[position - 1]
    return id === "copycat" && left !== undefined && left !== "copycat"
      ? left
      : null
  })

/**
 * The Shelf's House Cats in order, as they act on a Play: each a Copycat
 * takes on the abilities of the House Cat it copies, keeping its own id and
 * name, and an inert Copycat is left out.
 */
export const actingShelf = (shelf: readonly HouseCatId[]): HouseCat[] => {
  const copied = copying(shelf)
  return shelf.flatMap((id, position) => {
    const acts = id === "copycat" ? copied[position] : id
    return acts === null
      ? []
      : [{ ...houseCat(acts), id, name: houseCat(id).name }]
  })
}

/** Treats a House Cat pays for clearing a Night. */
export type HouseCatTreats = {
  houseCat: HouseCatId
  name: string
  treats: number
}

/** What the Shelf's House Cats pay for clearing `night`, as it stands. */
export const clearTreats = (
  shelf: readonly HouseCatId[],
  night: Night
): HouseCatTreats[] =>
  actingShelf(shelf).flatMap(({ id, name, paysOnClear }) => {
    const treats = paysOnClear?.(night) ?? null
    return treats === null ? [] : [{ houseCat: id, name, treats }]
  })
