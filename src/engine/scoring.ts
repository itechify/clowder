import type { Config } from "./config"
import {
  type GatheringBonus,
  type GatheringId,
  gatheringById,
  gatherings
} from "./content/gatherings"
import { actingShelf, type HouseCatId } from "./content/houseCats"
import { personalityBonus } from "./content/personalities"
import type { Cat, CatId, Run } from "./types"

/**
 * A Gathering formed on the Couch, adding its Purr and Mult, at its Gathering
 * level, once to the Play.
 */
export type ActiveGathering = {
  gathering: GatheringId
  name: string
  level: number
  purr: number
  mult: number
  /** The Seats forming it, left to right. */
  seats: number[]
}

/**
 * What a Gathering adds at `level`: its own Mult, and for each level above 1
 * the configured Purr and Mult more.
 */
export function gatheringBonus(
  config: Config,
  gathering: GatheringId,
  level: number
): GatheringBonus {
  const perLevel = config.gatheringLevelBonus[gathering]
  return {
    purr: (level - 1) * perLevel.purr,
    mult: gatheringById(gathering).mult + (level - 1) * perLevel.mult
  }
}

/** Mult a House Cat adds. */
export type MultEffect = {
  houseCat: HouseCatId
  name: string
  mult: number
}

/** A House Cat adding Mult once to the whole Play, alongside the Gatherings. */
export type WholePlayEffect = MultEffect

/**
 * What gave a Cat its Scoring event: its Seat, when the Play scores it, or the
 * House Cat granting a Repeat.
 */
export type ScoringSource = "seat" | HouseCatId

/**
 * One Cat adding its base Purr plus its Personality bonus; a Repeat is another,
 * complete one.
 */
export type ScoringEvent = {
  seat: number
  cat: CatId
  source: ScoringSource
  basePurr: number
  bonus: number
  purr: number
  /** Mult added by effects that fire when this Cat scores... */
  mult: number
  /** ...each House Cat's share of it, in Shelf order. */
  multFrom: MultEffect[]
}

/** Base Purr a played Cat gains for good from a House Cat, once the Play is scored. */
export type Growth = {
  seat: number
  cat: CatId
  houseCat: HouseCatId
  name: string
  purr: number
}

/** A House Cat warmed up by the Play, and the × it reaches. */
export type WarmUp = {
  houseCat: HouseCatId
  name: string
  times: number
}

/** A House Cat multiplying the Play's Mult, after every Scoring event. */
export type TimesEffect = {
  houseCat: HouseCatId
  name: string
  times: number
}

/** A Play's Score, phase by phase (ADR-0001). */
export type ScoreBreakdown = {
  /** Phase 1: Gatherings, each adding Purr, and Mult to the starting 1... */
  gatherings: ActiveGathering[]
  /** ...and whole-Play House Cat effects, in Shelf order. */
  wholePlayEffects: WholePlayEffect[]
  /** Phase 2: in scoring order, left to right by Seat. */
  scoringEvents: ScoringEvent[]
  /** House Cats this Play warms up, before... */
  warmUps: WarmUp[]
  /** ...phase 3: × effects, each multiplying Mult in turn, in Shelf order. */
  timesEffects: TimesEffect[]
  purr: number
  mult: number
  /** Phase 4: total Purr × Mult, rounded down once. */
  score: number
  /** Afterward, from the next Play on: played Cats growing, left to right. */
  growth: Growth[]
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

  // Phase 1: Gatherings add Purr and Mult, and whole-Play effects Mult.
  const active: ActiveGathering[] = []
  for (const { id, name, seats: forming } of gatherings) {
    const seats = forming(couch)
    const level = run.gatheringLevels[id]
    if (seats.length > 0)
      active.push({
        gathering: id,
        name,
        level,
        ...gatheringBonus(run.config, id, level),
        seats
      })
  }
  const shelf = actingShelf(run.shelf)
  const wholePlayEffects: WholePlayEffect[] = []
  for (const { id, name, wholePlayMult } of shelf) {
    const mult = wholePlayMult?.(couch) ?? null
    if (mult !== null) wholePlayEffects.push({ houseCat: id, name, mult })
  }
  const addedMult = [...active, ...wholePlayEffects].reduce(
    (sum, effect) => sum + effect.mult,
    1
  )

  // Phase 2: each Cat's Scoring event adds Purr, then any Repeats of it.
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
    const multFrom = shelf.flatMap(({ id, name, perScoreMult }) => {
      const mult = perScoreMult?.(cat) ?? null
      return mult === null ? [] : [{ houseCat: id, name, mult }]
    })
    const scores = (source: ScoringSource): ScoringEvent => ({
      seat,
      cat: cat.id,
      source,
      basePurr: cat.basePurr,
      bonus,
      purr: cat.basePurr + bonus,
      mult: multFrom.reduce((sum, from) => sum + from.mult, 0),
      multFrom
    })
    scoringEvents.push(scores("seat"))
    // Repeats come only from the Seat's Scoring event, so never chain.
    for (const { id, repeats: grants } of shelf) {
      const repeats = grants?.(couch, seat) ?? 0
      for (let repeat = 0; repeat < repeats; repeat++)
        scoringEvents.push(scores(id))
    }
  })
  const purr = scoringEvents.reduce(
    (sum, event) => sum + event.purr,
    active.reduce((sum, gathering) => sum + gathering.purr, 0)
  )

  // Phase 3: × effects multiply Mult, some warmed up by this Play.
  const warmUps: WarmUp[] = []
  const timesEffects: TimesEffect[] = []
  for (const { id, name, times, warmsUp } of shelf) {
    const factor = times?.(couch, run.night) ?? null
    if (factor !== null && warmsUp?.(couch))
      warmUps.push({ houseCat: id, name, times: factor })
    if (factor !== null)
      timesEffects.push({ houseCat: id, name, times: factor })
  }
  const mult = timesEffects.reduce(
    (product, effect) => product * effect.times,
    scoringEvents.reduce((sum, event) => sum + event.mult, addedMult)
  )

  // Afterward, played Cats may grow for the Plays to come.
  const growth: Growth[] = []
  couch.forEach((cat, seat) => {
    if (!cat) return
    for (const { id, name, grows } of shelf) {
      const purr = grows?.(cat, active.length) ?? null
      if (purr !== null)
        growth.push({ seat, cat: cat.id, houseCat: id, name, purr })
    }
  })

  // Phase 4: Purr × Mult, rounded down only here.
  return {
    gatherings: active,
    wholePlayEffects,
    scoringEvents,
    warmUps,
    timesEffects,
    purr,
    mult,
    score: Math.floor(purr * mult),
    growth
  }
}
