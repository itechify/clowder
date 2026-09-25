import { type GatheringId, gatherings } from "./content/gatherings"
import { type HouseCatId, houseCat } from "./content/houseCats"
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

/** A House Cat adding Mult once to the whole Play, alongside the Gatherings. */
export type WholePlayEffect = {
  houseCat: HouseCatId
  name: string
  mult: number
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

/** A House Cat multiplying the Play's Mult, after every Scoring event. */
export type TimesEffect = {
  houseCat: HouseCatId
  name: string
  times: number
}

/** A Play's Score, phase by phase (ADR-0001). */
export type ScoreBreakdown = {
  /** Phase 1: Gatherings, each adding Mult to the starting 1... */
  gatherings: ActiveGathering[]
  /** ...and whole-Play House Cat effects, in Shelf order. */
  wholePlayEffects: WholePlayEffect[]
  /** Phase 2: in scoring order, left to right by Seat. */
  scoringEvents: ScoringEvent[]
  /** Phase 3: × effects, each multiplying Mult in turn, in Shelf order. */
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

  // Phase 1: Gatherings and whole-Play effects add Mult.
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
  const wholePlayEffects: WholePlayEffect[] = []
  for (const id of run.shelf) {
    const { name, wholePlayMult } = houseCat(id)
    const mult = wholePlayMult?.(couch) ?? null
    if (mult !== null) wholePlayEffects.push({ houseCat: id, name, mult })
  }
  const addedMult = [...active, ...wholePlayEffects].reduce(
    (sum, effect) => sum + effect.mult,
    1
  )

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

  // Phase 3: × effects multiply Mult.
  const timesEffects: TimesEffect[] = []
  for (const id of run.shelf) {
    const { name, times } = houseCat(id)
    const by = times?.(couch) ?? null
    if (by !== null) timesEffects.push({ houseCat: id, name, times: by })
  }
  const mult = timesEffects.reduce(
    (product, effect) => product * effect.times,
    scoringEvents.reduce((sum, event) => sum + event.mult, addedMult)
  )

  // Phase 4: Purr × Mult, rounded down only here.
  return {
    gatherings: active,
    wholePlayEffects,
    scoringEvents,
    timesEffects,
    purr,
    mult,
    score: Math.floor(purr * mult)
  }
}
