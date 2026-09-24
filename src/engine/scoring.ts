import { personalityBonus } from "./content/personalities"
import type { Cat, CatId, Run } from "./types"

/** One Cat adding its base Purr plus its Personality bonus. */
export type ScoringEvent = {
  seat: number
  cat: CatId
  basePurr: number
  bonus: number
  purr: number
}

export type ScoreBreakdown = {
  /** In scoring order: left to right by Seat. */
  scoringEvents: ScoringEvent[]
  purr: number
  mult: number
  score: number
}

/**
 * Scores the current Couch. Play commits exactly this result, so the preview
 * can always be trusted (ADR-0002).
 */
export function previewPlay(run: Run): ScoreBreakdown {
  const { couch } = run.night
  const catAt = (seat: number): Cat | undefined => {
    const id = couch[seat]
    return id ? run.roster.find((c) => c.id === id) : undefined
  }
  const scoringEvents: ScoringEvent[] = []
  couch.forEach((_, seat) => {
    const cat = catAt(seat)
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
      basePurr: cat.basePurr,
      bonus,
      purr: cat.basePurr + bonus
    })
  })
  const purr = scoringEvents.reduce((sum, event) => sum + event.purr, 0)
  const mult = 1
  return { scoringEvents, purr, mult, score: Math.floor(purr * mult) }
}
