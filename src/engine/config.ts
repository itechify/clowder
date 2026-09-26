import type { HouseCatId } from "./content/houseCats"

/** Tuning numbers for a Run. Playtesting changes belong here, not in rules. */
export type Config = {
  /** Cats of each Coat/Personality combination in a starting Roster. */
  copiesPerCombination: number
  basePurr: number
  personalityBonus: {
    clingyPerNeighbor: number
    aloofWithoutNeighbors: number
    sleepyBesideSleepy: number
  }
  handSize: number
  seats: number
  /** The most House Cats the Shelf holds. */
  shelfSize: number
  playsPerNight: number
  redrawsPerNight: number
  /** The most Cats one Redraw may swap. */
  catsPerRedraw: number
  /** Clearing the last Night wins the Run. */
  nights: number
  firstTarget: number
  /** Night n's Target is firstTarget × targetGrowth^(n − 1), rounded. */
  targetGrowth: number
  /** The Nights that are Disasters, each meeting the next in the Run's order. */
  disasterNights: number[]
  /** A Disaster Night's Target is the Night's normal Target × this, rounded. */
  disasterTargetFactor: number
  /** Base Purr The Void grows each Black Cat after a Play with a Gathering. */
  voidGrowth: number
  /**
   * Treats for clearing a Night: `early` through Night `earlyNights`, `later`
   * after, and `disaster` for any Disaster Night.
   */
  clearReward: {
    early: number
    earlyNights: number
    later: number
    disaster: number
    perUnusedPlay: number
  }
  shop: {
    /** Cats offered for Adoption on each visit. */
    catOffers: number
    adoptPrice: number
    rehomeCatPrice: number
    catRehomesPerVisit: number
    /** House Cats offered to Recruit on each visit, while any are unowned. */
    houseCatOffers: number
    /** Each House Cat's Recruit price, by strength; Rehoming refunds half. */
    recruitPrices: Record<HouseCatId, number>
    /** The first Reroll of a visit costs `rerollPrice`; each costs `rerollPriceStep` more. */
    rerollPrice: number
    rerollPriceStep: number
  }
}

export const defaultConfig: Config = {
  copiesPerCombination: 2,
  basePurr: 10,
  personalityBonus: {
    clingyPerNeighbor: 5,
    aloofWithoutNeighbors: 15,
    sleepyBesideSleepy: 10
  },
  handSize: 8,
  seats: 5,
  shelfSize: 4,
  playsPerNight: 3,
  redrawsPerNight: 2,
  catsPerRedraw: 3,
  nights: 9,
  firstTarget: 300,
  targetGrowth: 1.6,
  disasterNights: [3, 6, 9],
  disasterTargetFactor: 1,
  voidGrowth: 5,
  clearReward: {
    early: 3,
    earlyNights: 2,
    later: 4,
    disaster: 6,
    perUnusedPlay: 1
  },
  shop: {
    catOffers: 2,
    adoptPrice: 3,
    rehomeCatPrice: 1,
    catRehomesPerVisit: 1,
    houseCatOffers: 2,
    recruitPrices: {
      oneBraincell: 7,
      bigLoaf: 7,
      boxGoblin: 6,
      doNotTouch: 5,
      skadi: 6,
      copycat: 8,
      freya: 7,
      theVoid: 6,
      treatDealer: 5
    },
    rerollPrice: 1,
    rerollPriceStep: 1
  }
}
