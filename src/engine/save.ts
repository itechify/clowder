import type { Config } from "./config"
import { coats } from "./content/coats"
import { disasters } from "./content/disasters"
import { gatherings } from "./content/gatherings"
import { houseCats } from "./content/houseCats"
import { personalities } from "./content/personalities"
import type { BestPlay, RunStats } from "./stats"
import type { Cat, Night, NightStatus, Run, RunStatus, Shop } from "./types"

/**
 * The shape of saved Runs. Bump it whenever Run state changes meaning, so a
 * save from before the change is discarded rather than resumed.
 */
const SAVE_VERSION = 5

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

const finite: Check = Number.isFinite
const integer: Check = Number.isInteger
const text: Check = (value) => typeof value === "string"
const oneOf =
  (options: readonly unknown[]): Check =>
  (value) =>
    options.includes(value)
/** One of every member of a union, which the type makes sure are all listed. */
const memberOf = <T extends string>(members: Record<T, true>): Check =>
  oneOf(Object.keys(members))
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

const isDisaster = oneOf(disasters.map((disaster) => disaster.id))
const isHouseCat = oneOf(houseCats.map((houseCat) => houseCat.id))
/** A whole number for every House Cat. */
const perHouseCat: Check = (value) =>
  isRecord(value) && houseCats.every(({ id }) => integer(value[id]))

const isCat = shape<Cat>({
  id: text,
  name: text,
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
  shelfSize: integer,
  playsPerNight: integer,
  redrawsPerNight: integer,
  catsPerRedraw: integer,
  nights: integer,
  firstTarget: finite,
  targetGrowth: finite,
  disasterNights: list(integer),
  disasterTargetFactor: finite,
  voidGrowth: integer,
  clearReward: shape<Config["clearReward"]>({
    early: integer,
    earlyNights: integer,
    later: integer,
    disaster: integer,
    perUnusedPlay: integer
  }),
  shop: shape<Config["shop"]>({
    catOffers: integer,
    adoptPrice: integer,
    rehomeCatPrice: integer,
    catRehomesPerVisit: integer,
    houseCatOffers: integer,
    recruitPrices: perHouseCat,
    rerollPrice: integer,
    rerollPriceStep: integer
  })
})

const isRun = shape<Run>({
  seed: integer,
  config: isConfig,
  rng: integer,
  roster: list(isCat),
  shelf: list(isHouseCat),
  catsCreated: integer,
  disasters: list(isDisaster),
  night: shape<Night>({
    number: integer,
    disaster: nullable(isDisaster),
    target: integer,
    catsPerPlay: integer,
    score: integer,
    playsLeft: integer,
    redrawsLeft: integer,
    warmPlays: integer,
    drawPile: list(text),
    hand: list(text),
    couch: list(nullable(text)),
    status: memberOf<NightStatus>({ playing: true, cleared: true, lost: true })
  }),
  shop: nullable(
    shape<Shop>({
      catOffers: list(isCat),
      catRehomesLeft: integer,
      houseCatOffers: list(isHouseCat),
      rerollPrice: integer,
      nextDisaster: nullable(isDisaster)
    })
  ),
  discoveredGatherings: list(oneOf(gatherings.map((g) => g.id))),
  status: memberOf<RunStatus>({ playing: true, won: true, lost: true }),
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
 * Rehomed). The Shelf holds each House Cat at most once, and no more than fit.
 */
function isConsistent({ config, roster, shelf, night }: Run): boolean {
  const ids = new Set(roster.map((cat) => cat.id))
  return (
    new Set(shelf).size === shelf.length &&
    shelf.length <= config.shelfSize &&
    night.couch.length === config.seats &&
    night.couch.every((cat) => cat === null || night.hand.includes(cat)) &&
    (night.status !== "playing" ||
      [...night.hand, ...night.drawPile].every((cat) => ids.has(cat)))
  )
}
