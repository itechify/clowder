import { type GatheringId, gatherings } from "./content/gatherings"
import { personalityBonus } from "./content/personalities"
import type { Cat, CatId, Run } from "./types"

/** A Gathering formed on the Couch, adding its Mult once to the Play. */
export type ActiveGathering = {
  gathering: GatheringId
  name: string
  mult: number
  /** The Seats forming it, left to right. */
  seats: number[]
}

/**
 * What gave a Cat its Scoring event: its Seat, when the Play scores it. Repeats
 * will name the House Cat that grants them.
 */
export type ScoringSource = "seat"

/** One Cat adding its base Purr plus its Personality bonus. */
export type ScoringEvent = {
  seat: number
  cat: CatId
  source: ScoringSource
  basePurr: number
  bonus: number
  purr: number
  /** Mult added by effects that fire when this Cat scores. */
  mult: number
}

/** An effect multiplying the Play's Mult, applied after every Scoring event. */
export type TimesEffect = {
  name: string
  times: number
}

/** A Play's Score, phase by phase (ADR-0001). */
export type ScoreBreakdown = {
  /** Phase 1: Gatherings, each adding Mult to the starting 1. */
  gatherings: ActiveGathering[]
  /** Phase 2: in scoring order, left to right by Seat. */
  scoringEvents: ScoringEvent[]
  /** Phase 3: × effects, each multiplying Mult in turn. */
  timesEffects: TimesEffect[]
  purr: number
  mult: number
  /** Phase 4: total Purr × Mult, rounded down once. */
  score: number
}

/**
 * Scores the current Couch. Play commits exactly this result, so the preview
 * can always be trusted (ADR-0002).
 */
export function previewPlay(run: Run): ScoreBreakdown {
  const couch = run.night.couch.map((id) =>
    id ? run.roster.find((c) => c.id === id)! : null
  )
  const catAt = (seat: number): Cat | undefined => couch[seat] ?? undefined

  // Phase 1: Gatherings add Mult.
  const active: ActiveGathering[] = []
  for (const gathering of gatherings) {
    const seats = gathering.seats(couch)
    if (seats.length > 0)
      active.push({
        gathering: gathering.id,
        name: gathering.name,
        mult: gathering.mult,
        seats
      })
  }
  const gatheringMult = active.reduce((sum, g) => sum + g.mult, 1)

  // Phase 2: each Cat's Scoring event adds Purr.
  const scoringEvents: ScoringEvent[] = []
  couch.forEach((cat, seat) => {
    if (!cat) return
    // Only the occupied Seats directly beside count; the Couch does not wrap.
    const neighbors = [catAt(seat - 1), catAt(seat + 1)].filter(
      (c) => c !== undefined
    )
    const bonus = personalityBonus[cat.personality](
      neighbors,
      run.config.personalityBonus
    )
    scoringEvents.push({
      seat,
      cat: cat.id,
      source: "seat",
      basePurr: cat.basePurr,
      bonus,
      purr: cat.basePurr + bonus,
      mult: 0
    })
  })
  const purr = scoringEvents.reduce((sum, event) => sum + event.purr, 0)

  // Phase 3: × effects multiply Mult. None exist before House Cats.
  const timesEffects: TimesEffect[] = []
  const mult = timesEffects.reduce(
    (product, effect) => product * effect.times,
    scoringEvents.reduce((sum, event) => sum + event.mult, gatheringMult)
  )

  // Phase 4: Purr × Mult, rounded down only here.
  return {
    gatherings: active,
    scoringEvents,
    timesEffects,
    purr,
    mult,
    score: Math.floor(purr * mult)
  }
}
