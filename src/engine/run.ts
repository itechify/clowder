import { type Config, defaultConfig } from "./config"
import { catNames } from "./content/catNames"
import { coats } from "./content/coats"
import { type DisasterId, disasterById, disasters } from "./content/disasters"
import { personalities } from "./content/personalities"
import { shuffle } from "./rng"
import { noStats } from "./stats"
import type { Cat, Night, Run } from "./types"

export function startRun(seed: number, config: Config = defaultConfig): Run {
  const [names, afterNames] = shuffle(seed | 0, catNames)
  const [order, rng] = shuffle(
    afterNames,
    disasters.map((disaster) => disaster.id)
  )
  const roster: Cat[] = []
  for (const coat of coats)
    for (const personality of personalities)
      for (let copy = 0; copy < config.copiesPerCombination; copy++)
        roster.push({
          id: `cat-${roster.length + 1}`,
          name: names[roster.length],
          coat,
          personality,
          basePurr: config.basePurr
        })
  return startNight(
    {
      seed,
      config,
      rng,
      roster,
      shelf: [],
      catsCreated: roster.length,
      disasters: order,
      shop: null,
      discoveredGatherings: [],
      status: "playing",
      treats: 0,
      stats: noStats
    },
    1
  )
}

/** The Disaster the given Night brings, if it is a Disaster Night. */
export function disasterOn(
  run: Pick<Run, "config" | "disasters">,
  night: number
): DisasterId | null {
  return run.disasters[run.config.disasterNights.indexOf(night)] ?? null
}

/** Night `number`'s Target, raised if it is a Disaster Night. */
export function nightTarget(
  config: Config,
  number: number,
  disaster: boolean
): number {
  const target = Math.round(
    config.firstTarget * config.targetGrowth ** (number - 1)
  )
  return disaster ? Math.round(target * config.disasterTargetFactor) : target
}

/** Shuffles the whole Roster into a fresh Draw pile and draws a Hand. */
export function startNight(run: Omit<Run, "night">, number: number): Run {
  const { config, roster } = run
  const [shuffled, rng] = shuffle(
    run.rng,
    roster.map((cat) => cat.id)
  )
  const disaster = disasterOn(run, number)
  const rules = {
    catsPerPlay: config.seats,
    plays: config.playsPerNight,
    redraws: config.redrawsPerNight,
    ...(disaster && disasterById(disaster).changes)
  }
  const night: Night = {
    number,
    disaster,
    target: nightTarget(config, number, disaster !== null),
    catsPerPlay: rules.catsPerPlay,
    score: 0,
    playsLeft: rules.plays,
    redrawsLeft: rules.redraws,
    warmPlays: 0,
    drawPile: shuffled.slice(config.handSize),
    hand: shuffled.slice(0, config.handSize),
    couch: Array.from({ length: config.seats }, () => null),
    status: "playing"
  }
  return { ...run, rng, night }
}
