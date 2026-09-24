import type { Config } from "./config"
import type { Coat } from "./content/coats"
import type { GatheringId } from "./content/gatherings"
import type { Personality } from "./content/personalities"
import type { RngState } from "./rng"
import type { RunStats } from "./stats"

export type CatId = string

export type Cat = {
  id: CatId
  name: string
  coat: Coat
  personality: Personality
  basePurr: number
}

export type NightStatus = "playing" | "cleared" | "lost"

export type Night = {
  number: number
  target: number
  /** Scores of this Night's Plays so far, summed. */
  score: number
  playsLeft: number
  redrawsLeft: number
  drawPile: CatId[]
  /** Every drawn, unplayed Cat, including those seated on the Couch. */
  hand: CatId[]
  /** One entry per Seat, left to right; null is an empty Seat. */
  couch: (CatId | null)[]
  status: NightStatus
}

export type RunStatus = "playing" | "won" | "lost"

/** A Run is plain, serialisable data; every rule reads it and none mutate it. */
export type Run = {
  /** Together with the actions applied, reproduces the Run exactly. */
  seed: number
  config: Config
  rng: RngState
  roster: Cat[]
  night: Night
  /** Gatherings activated by any Play so far this Run, in discovery order. */
  discoveredGatherings: GatheringId[]
  status: RunStatus
  treats: number
  stats: RunStats
}
