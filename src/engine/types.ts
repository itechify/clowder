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

/** The visit between Nights where Treats are spent. */
export type Shop = {
  /** New Cats, not yet in the Roster, that may be Adopted. */
  catOffers: Cat[]
  catRehomesLeft: number
  /** What the next Reroll costs; it rises with each Reroll this visit. */
  rerollPrice: number
}

/** A Run is plain, serialisable data; every rule reads it and none mutate it. */
export type Run = {
  /** Together with the actions applied, reproduces the Run exactly. */
  seed: number
  config: Config
  rng: RngState
  roster: Cat[]
  /** Cats created this Run, Roster and Shop offers alike; numbers new ids. */
  catsCreated: number
  night: Night
  /** Open between a cleared Night and the next; null during a Night. */
  shop: Shop | null
  /** Gatherings activated by any Play so far this Run, in discovery order. */
  discoveredGatherings: GatheringId[]
  status: RunStatus
  treats: number
  stats: RunStats
}
