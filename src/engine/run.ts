import { type Config, defaultConfig } from "./config"
import { catNames } from "./content/catNames"
import { coats } from "./content/coats"
import { personalities } from "./content/personalities"
import { type RngState, shuffle } from "./rng"
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
  const [night, afterNight] = startNight(rng, config, roster)
  return { config, rng: afterNight, roster, night }
}

function startNight(
  rng: RngState,
  config: Config,
  roster: Cat[]
): [Night, RngState] {
  const [shuffled, next] = shuffle(
    rng,
    roster.map((cat) => cat.id)
  )
  const night: Night = {
    number: 1,
    target: config.firstTarget,
    score: 0,
    playsLeft: config.playsPerNight,
    redrawsLeft: config.redrawsPerNight,
    drawPile: shuffled.slice(config.handSize),
    hand: shuffled.slice(0, config.handSize),
    couch: Array.from({ length: config.seats }, () => null),
    status: "playing"
  }
  return [night, next]
}
