import { type ActiveGathering, previewPlay, type ScoringEvent } from "./scoring"
import type { CatId, Night, Run } from "./types"

export type Action =
  | { type: "place"; cat: CatId; seat: number }
  | { type: "unseat"; cat: CatId }
  | { type: "play" }

/** What happened, in order: the script the renderer animates. */
export type RunEvent =
  | ({ type: "gatheringActivated"; firstTime: boolean } & ActiveGathering)
  | ({ type: "catScored" } & ScoringEvent)
  | { type: "scoreTotal"; purr: number; mult: number; score: number }
  | { type: "catsDrawn"; cats: CatId[] }
  | { type: "nightCleared"; score: number }
  | { type: "nightLost"; score: number }

export type ActionResult =
  | { ok: true; run: Run; events: RunEvent[] }
  | { ok: false; run: Run; reason: string }

/** Applies one action; an illegal action is rejected and the Run is returned unchanged. */
export function applyAction(run: Run, action: Action): ActionResult {
  const reject = (reason: string): ActionResult => ({ ok: false, run, reason })
  const { night } = run
  if (night.status !== "playing") return reject("The Night is over")
  const withCouch = (couch: (CatId | null)[]): ActionResult => ({
    ok: true,
    run: { ...run, night: { ...night, couch } },
    events: []
  })
  switch (action.type) {
    case "place": {
      if (!night.hand.includes(action.cat))
        return reject("That Cat is not in the Hand")
      if (!Number.isInteger(action.seat) || !(action.seat in night.couch))
        return reject("There is no such Seat")
      // A Cat moving between Seats trades places with the Seat's occupant; a
      // Cat coming from the Hand sends the occupant back to the Hand.
      const couch = [...night.couch]
      const from = couch.indexOf(action.cat)
      if (from !== -1) couch[from] = couch[action.seat]
      couch[action.seat] = action.cat
      return withCouch(couch)
    }
    case "unseat": {
      const seat = night.couch.indexOf(action.cat)
      if (seat === -1) return reject("That Cat is not on the Couch")
      const couch = [...night.couch]
      couch[seat] = null
      return withCouch(couch)
    }
    case "play": {
      if (night.couch.every((cat) => cat === null))
        return reject("Seat at least one Cat to Play")
      return play(run)
    }
  }
}

function play(run: Run): ActionResult {
  const { night } = run
  const breakdown = previewPlay(run)
  const newlyDiscovered = breakdown.gatherings
    .map((active) => active.gathering)
    .filter((gathering) => !run.discoveredGatherings.includes(gathering))
  const events: RunEvent[] = [
    ...breakdown.gatherings.map(
      (active): RunEvent => ({
        type: "gatheringActivated",
        ...active,
        firstTime: newlyDiscovered.includes(active.gathering)
      })
    ),
    ...breakdown.scoringEvents.map(
      (event): RunEvent => ({ type: "catScored", ...event })
    ),
    {
      type: "scoreTotal",
      purr: breakdown.purr,
      mult: breakdown.mult,
      score: breakdown.score
    }
  ]
  const played = night.couch.filter((cat) => cat !== null)
  let next: Night = {
    ...night,
    score: night.score + breakdown.score,
    playsLeft: night.playsLeft - 1,
    hand: night.hand.filter((cat) => !played.includes(cat)),
    couch: night.couch.map(() => null)
  }
  if (next.score >= next.target) {
    next = { ...next, status: "cleared" }
    events.push({ type: "nightCleared", score: next.score })
  } else if (next.playsLeft === 0) {
    next = { ...next, status: "lost" }
    events.push({ type: "nightLost", score: next.score })
  } else {
    // The Draw pile never reshuffles mid-Night, so the Hand may come up short.
    const drawn = next.drawPile.slice(0, run.config.handSize - next.hand.length)
    next = {
      ...next,
      hand: [...next.hand, ...drawn],
      drawPile: next.drawPile.slice(drawn.length)
    }
    events.push({ type: "catsDrawn", cats: drawn })
  }
  return {
    ok: true,
    run: {
      ...run,
      night: next,
      discoveredGatherings: [...run.discoveredGatherings, ...newlyDiscovered]
    },
    events
  }
}
