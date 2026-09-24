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
  playsPerNight: number
  /** Clearing the last Night wins the Run. */
  nights: number
  firstTarget: number
  /** Night n's Target is firstTarget × targetGrowth^(n − 1), rounded. */
  targetGrowth: number
  /** Treats for clearing a Night: `early` through Night `earlyNights`, `later` after. */
  clearReward: {
    early: number
    earlyNights: number
    later: number
    perUnusedPlay: number
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
  playsPerNight: 3,
  nights: 9,
  firstTarget: 300,
  targetGrowth: 1.6,
  clearReward: { early: 3, earlyNights: 2, later: 4, perUnusedPlay: 1 }
}
