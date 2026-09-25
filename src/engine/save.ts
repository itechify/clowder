import type { Config } from "./config"
import { coats } from "./content/coats"
import { gatherings } from "./content/gatherings"
import { personalities } from "./content/personalities"
import type { BestPlay, RunStats } from "./stats"
import type { Cat, Night, Run, Shop } from "./types"

/**
 * The shape of saved Runs. Bump it whenever Run state changes meaning, so a
 * save from before the change is discarded rather than resumed.
 */
const SAVE_VERSION = 1

/** Run state as plain text, to keep on the device between visits. */
export function serialiseRun(run: Run): string {
  return JSON.stringify({ version: SAVE_VERSION, run })
}

/** The Run a save holds, or undefined if it is corrupt or incompatible. */
export function restoreRun(saved: string): Run | undefined {
  let parsed: unknown
  try {
    parsed = JSON.parse(saved)
  } catch {
    return undefined
  }
  if (!isRecord(parsed) || parsed.version !== SAVE_VERSION) return undefined
  const { run } = parsed
  return isRun(run) && isConsistent(run) ? run : undefined
}

/** Whether a value from a save is what it should be. */
type Check = (value: unknown) => boolean

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const number: Check = Number.isFinite
const integer: Check = Number.isInteger
const string: Check = (value) => typeof value === "string"
const oneOf =
  (options: readonly unknown[]): Check =>
  (value) =>
    options.includes(value)
const nullable =
  (check: Check): Check =>
  (value) =>
    value === null || check(value)
const list =
  (check: Check): Check =>
  (value) =>
    Array.isArray(value) && value.every(check)
const recordOf =
  (check: Check): Check =>
  (value) =>
    isRecord(value) && Object.values(value).every(check)
/** An object with every field of `T`, each checked; the type insists on them all. */
const shape =
  <T>(checks: { [K in keyof T]-?: Check }): Check =>
  (value) =>
    isRecord(value) &&
    Object.entries(checks).every(([key, check]) => (check as Check)(value[key]))

const isCat = shape<Cat>({
  id: string,
  name: string,
  coat: oneOf(coats),
  personality: oneOf(personalities),
  basePurr: integer
})

const isConfig = shape<Config>({
  copiesPerCombination: integer,
  basePurr: integer,
  personalityBonus: shape<Config["personalityBonus"]>({
    clingyPerNeighbor: integer,
    aloofWithoutNeighbors: integer,
    sleepyBesideSleepy: integer
  }),
  handSize: integer,
  seats: integer,
  playsPerNight: integer,
  redrawsPerNight: integer,
  catsPerRedraw: integer,
  nights: integer,
  firstTarget: number,
  targetGrowth: number,
  clearReward: shape<Config["clearReward"]>({
    early: integer,
    earlyNights: integer,
    later: integer,
    perUnusedPlay: integer
  }),
  shop: shape<Config["shop"]>({
    catOffers: integer,
    adoptPrice: integer,
    rehomeCatPrice: integer,
    catRehomesPerVisit: integer,
    rerollPrice: integer,
    rerollPriceStep: integer
  })
})

const isRun = shape<Run>({
  seed: integer,
  config: isConfig,
  rng: integer,
  roster: list(isCat),
  catsCreated: integer,
  night: shape<Night>({
    number: integer,
    target: integer,
    score: integer,
    playsLeft: integer,
    redrawsLeft: integer,
    drawPile: list(string),
    hand: list(string),
    couch: list(nullable(string)),
    status: oneOf(["playing", "cleared", "lost"])
  }),
  shop: nullable(
    shape<Shop>({
      catOffers: list(isCat),
      catRehomesLeft: integer,
      rerollPrice: integer
    })
  ),
  discoveredGatherings: list(oneOf(gatherings.map((g) => g.id))),
  status: oneOf(["playing", "won", "lost"]),
  treats: integer,
  stats: shape<RunStats>({
    nightsCleared: integer,
    bestPlay: nullable(
      shape<BestPlay>({
        night: integer,
        couch: list(nullable(isCat)),
        score: integer
      })
    ),
    purrByCat: recordOf(integer)
  })
}) as (value: unknown) => value is Run

/**
 * Whether the Night's Cats are where they can be: seated from the Hand, and,
 * while it is in play, all in the Roster (once it is over, some may have been
 * Rehomed).
 */
function isConsistent({ config, roster, night }: Run): boolean {
  const ids = new Set(roster.map((cat) => cat.id))
  return (
    night.couch.length === config.seats &&
    night.couch.every((cat) => cat === null || night.hand.includes(cat)) &&
    (night.status !== "playing" ||
      [...night.hand, ...night.drawPile].every((cat) => ids.has(cat)))
  )
}
