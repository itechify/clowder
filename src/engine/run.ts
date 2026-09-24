import { type Config, defaultConfig } from "./config"
import { catNames } from "./content/catNames"
import { coats } from "./content/coats"
import { personalities } from "./content/personalities"
import { shuffle } from "./rng"
import { noStats } from "./stats"
import type { Cat, Night, Run } from "./types"

export function startRun(seed: number, config: Config = defaultConfig): Run {
  const [names, rng] = shuffle(seed | 0, catNames)
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
      status: "playing",
      treats: 0,
      stats: noStats
    },
    1
  )
}

/** Shuffles the whole Roster into a fresh Draw pile and draws a Hand. */
export function startNight(run: Omit<Run, "night">, number: number): Run {
  const { config, roster } = run
  const [shuffled, rng] = shuffle(
    run.rng,
    roster.map((cat) => cat.id)
  )
  const night: Night = {
    number,
    target: Math.round(
      config.firstTarget * config.targetGrowth ** (number - 1)
    ),
    score: 0,
    playsLeft: config.playsPerNight,
    drawPile: shuffled.slice(config.handSize),
    hand: shuffled.slice(0, config.handSize),
    couch: Array.from({ length: config.seats }, () => null),
    status: "playing"
  }
  return { ...run, rng, night }
}
