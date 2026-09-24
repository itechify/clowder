import type { Config } from "./config"
import type { Coat } from "./content/coats"
import type { GatheringId } from "./content/gatherings"
import type { Personality } from "./content/personalities"
import type { RngState } from "./rng"

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
  drawPile: CatId[]
  /** Every drawn, unplayed Cat, including those seated on the Couch. */
  hand: CatId[]
  /** One entry per Seat, left to right; null is an empty Seat. */
  couch: (CatId | null)[]
  status: NightStatus
}

/** A Run is plain, serialisable data; every rule reads it and none mutate it. */
export type Run = {
  config: Config
  rng: RngState
  roster: Cat[]
  night: Night
  /** Gatherings activated by any Play so far this Run, in discovery order. */
  discoveredGatherings: GatheringId[]
}
