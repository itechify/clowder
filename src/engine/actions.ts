import { startNight } from "./run"
import { previewPlay, type ScoringEvent } from "./scoring"
import { recordPlay } from "./stats"
import type { CatId, Night, Run } from "./types"

export type Action =
  | { type: "place"; cat: CatId; seat: number }
  | { type: "unseat"; cat: CatId }
  | { type: "play" }

/** What happened, in order: the script the renderer animates. */
export type RunEvent =
  | ({ type: "catScored" } & ScoringEvent)
  | { type: "scoreTotal"; purr: number; mult: number; score: number }
  | { type: "catsDrawn"; cats: CatId[] }
  | { type: "nightCleared"; score: number }
  | {
      type: "treatsAwarded"
      forNight: number
      forUnusedPlays: number
      treats: number
    }
  | { type: "nightLost"; score: number }
  | { type: "runEnded"; outcome: "won" | "lost" }

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
  const breakdown = previewPlay(run)
  const events: RunEvent[] = [
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
  const played = run.night.couch.filter((cat) => cat !== null)
  const night: Night = {
    ...run.night,
    score: run.night.score + breakdown.score,
    playsLeft: run.night.playsLeft - 1,
    hand: run.night.hand.filter((cat) => !played.includes(cat)),
    couch: run.night.couch.map(() => null)
  }
  const scored: Run = { ...run, stats: recordPlay(run, breakdown), night }
  if (night.score >= night.target)
    return clearNight(
      { ...scored, night: { ...night, status: "cleared" } },
      events
    )
  if (night.playsLeft === 0) {
    events.push(
      { type: "nightLost", score: night.score },
      { type: "runEnded", outcome: "lost" }
    )
    return {
      ok: true,
      run: { ...scored, night: { ...night, status: "lost" }, status: "lost" },
      events
    }
  }
  // The Draw pile never reshuffles mid-Night, so the Hand may come up short.
  const drawn = night.drawPile.slice(0, run.config.handSize - night.hand.length)
  events.push({ type: "catsDrawn", cats: drawn })
  return {
    ok: true,
    run: {
      ...scored,
      night: {
        ...night,
        hand: [...night.hand, ...drawn],
        drawPile: night.drawPile.slice(drawn.length)
      }
    },
    events
  }
}

/** Pays the cleared Night's Treats, then starts the next Night or wins the Run. */
function clearNight(run: Run, events: RunEvent[]): ActionResult {
  const { config, night } = run
  const reward = config.clearReward
  const forNight =
    night.number <= reward.earlyNights ? reward.early : reward.later
  const forUnusedPlays = reward.perUnusedPlay * night.playsLeft
  const treats = forNight + forUnusedPlays
  events.push(
    { type: "nightCleared", score: night.score },
    { type: "treatsAwarded", forNight, forUnusedPlays, treats }
  )
  const paid: Run = {
    ...run,
    treats: run.treats + treats,
    stats: { ...run.stats, nightsCleared: run.stats.nightsCleared + 1 }
  }
  if (night.number < config.nights)
    return { ok: true, run: startNight(paid, night.number + 1), events }
  events.push({ type: "runEnded", outcome: "won" })
  return { ok: true, run: { ...paid, status: "won" }, events }
}
