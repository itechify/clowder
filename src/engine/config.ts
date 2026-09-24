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
  firstTarget: number
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
  firstTarget: 300
}
