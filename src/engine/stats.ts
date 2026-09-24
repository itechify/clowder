import type { ScoreBreakdown } from "./scoring"
import type { Cat, CatId, Run } from "./types"

/** The highest-scoring single Play of a Run, as the Couch looked then. */
export type BestPlay = {
  night: number
  /** One entry per Seat; a copy of each Cat as it was when it scored. */
  couch: (Cat | null)[]
  score: number
}

/** How the Run has gone, for the results once it ends. */
export type RunStats = {
  nightsCleared: number
  bestPlay: BestPlay | null
  /** Purr each Cat has contributed across the Run, by Cat. */
  purrByCat: Record<CatId, number>
}

export const noStats: RunStats = {
  nightsCleared: 0,
  bestPlay: null,
  purrByCat: {}
}

/** Adds a Play, scored from the Run's current Couch, to its statistics. */
export function recordPlay(run: Run, breakdown: ScoreBreakdown): RunStats {
  const { stats, night } = run
  const purrByCat = { ...stats.purrByCat }
  for (const event of breakdown.scoringEvents)
    purrByCat[event.cat] = (purrByCat[event.cat] ?? 0) + event.purr
  const best =
    breakdown.score > (stats.bestPlay?.score ?? -1)
      ? {
          night: night.number,
          couch: night.couch.map((id) =>
            id === null ? null : { ...catById(run, id) }
          ),
          score: breakdown.score
        }
      : stats.bestPlay
  return { ...stats, bestPlay: best, purrByCat }
}

/** A Cat and all the Purr it has contributed this Run. */
export type StarCat = { cat: Cat; purr: number }

/** The Cat that has contributed the most Purr this Run; earlier Roster Cats win ties. */
export function starCat(run: Run): StarCat | undefined {
  let star: StarCat | undefined
  for (const cat of run.roster) {
    const purr = run.stats.purrByCat[cat.id] ?? 0
    if (purr > (star?.purr ?? 0)) star = { cat, purr }
  }
  return star
}

function catById(run: Run, id: CatId): Cat {
  const cat = run.roster.find((c) => c.id === id)
  if (!cat) throw new Error(`No Cat ${id} in the Roster`)
  return cat
}
