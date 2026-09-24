import type { Config } from "../config"
import type { Cat } from "../types"

export const personalities = ["clingy", "aloof", "sleepy"] as const

export type Personality = (typeof personalities)[number]

type BonusRule = (
  neighbors: readonly Cat[],
  tuning: Config["personalityBonus"]
) => number

/** The bonus Purr each Personality adds to a Scoring event, given its Neighbors. */
export const personalityBonus: Record<Personality, BonusRule> = {
  clingy: (neighbors, tuning) => tuning.clingyPerNeighbor * neighbors.length,
  aloof: (neighbors, tuning) =>
    neighbors.length === 0 ? tuning.aloofWithoutNeighbors : 0,
  sleepy: (neighbors, tuning) =>
    neighbors.some((cat) => cat.personality === "sleepy")
      ? tuning.sleepyBesideSleepy
      : 0
}
