import type { Config } from "./config"
import type { Coat } from "./content/coats"
import type { DisasterId } from "./content/disasters"
import type { GatheringId } from "./content/gatherings"
import type { HouseCatId } from "./content/houseCats"
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

/** One entry per Seat, left to right; null is an empty Seat. */
export type Couch = readonly (Cat | null)[]

export type NightStatus = "playing" | "cleared" | "lost"

export type Night = {
  number: number
  /** The Disaster changing this Night's rules, if it is a Disaster Night. */
  disaster: DisasterId | null
  target: number
  /** The most Cats the Couch may hold at once this Night. */
  catsPerPlay: number
  /** Scores of this Night's Plays so far, summed. */
  score: number
  playsLeft: number
  redrawsLeft: number
  /** This Night's Plays that warmed up a House Cat, as Freya counts them. */
  warmPlays: number
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
  /** House Cats not on the Shelf that may be Recruited. */
  houseCatOffers: HouseCatId[]
  /** What the next Reroll costs; it rises with each Reroll this visit. */
  rerollPrice: number
  /** The Disaster the next Night brings, revealed so the player can prepare. */
  nextDisaster: DisasterId | null
}

/** A Run is plain, serialisable data; every rule reads it and none mutate it. */
export type Run = {
  /** Together with the actions applied, reproduces the Run exactly. */
  seed: number
  config: Config
  rng: RngState
  roster: Cat[]
  /** The equipped House Cats, left to right; each at most once. */
  shelf: HouseCatId[]
  /** Cats created this Run, Roster and Shop offers alike; numbers new ids. */
  catsCreated: number
  night: Night
  /** The Disasters in the order this Run meets them, one per Disaster Night. */
  disasters: DisasterId[]
  /** Open between a cleared Night and the next; null during a Night. */
  shop: Shop | null
  /**
   * Gatherings activated by any Play, or revealed by a Scrapbook page, so far
   * this Run, in discovery order.
   */
  discoveredGatherings: GatheringId[]
  /** Every Gathering's Gathering level, each starting at 1. */
  gatheringLevels: Record<GatheringId, number>
  /**
   * The Gatherings of the Scrapbook pages offered after a cleared Night,
   * until one is chosen and the Shop opens; null otherwise.
   */
  scrapbookPages: GatheringId[] | null
  status: RunStatus
  treats: number
  stats: RunStats
}
