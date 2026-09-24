import { previewPlay, type ScoringEvent } from "./scoring"
import type { CatId, Night, Run } from "./types"

export type Action =
  | { type: "place"; cat: CatId; seat: number }
  | { type: "unseat"; cat: CatId }
  | { type: "play" }
  | { type: "redraw"; cats: CatId[] }

/** What happened, in order: the script the renderer animates. */
export type RunEvent =
  | ({ type: "catScored" } & ScoringEvent)
  | { type: "scoreTotal"; purr: number; mult: number; score: number }
  | { type: "catsDrawn"; cats: CatId[] }
  | { type: "catsRedrawn"; sentOut: CatId[]; drawn: CatId[] }
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
    case "redraw": {
      const { cats } = action
      if (cats.length === 0) return reject("Choose a Cat to Redraw")
      if (cats.length > run.config.catsPerRedraw)
        return reject(`Redraw at most ${run.config.catsPerRedraw} Cats`)
      if (!cats.every((cat) => night.hand.includes(cat)))
        return reject("That Cat is not in the Hand")
      if (new Set(cats).size !== cats.length)
        return reject("A Cat can only be redrawn once")
      if (night.redrawsLeft === 0) return reject("No Redraws remain tonight")
      // The Draw pile never reshuffles mid-Night, so it can run out of swaps.
      if (night.drawPile.length < cats.length)
        return reject("The Draw pile is too small")
      return redraw(run, cats)
    }
  }
}

/** Swaps Hand Cats for fresh draws; the Cats sent out are gone for the Night. */
function redraw(run: Run, sentOut: CatId[]): ActionResult {
  const { night } = run
  const drawn = night.drawPile.slice(0, sentOut.length)
  // Each new Cat takes the place in the Hand of the Cat it replaces.
  const hand = night.hand.map((cat) =>
    sentOut.includes(cat) ? drawn[sentOut.indexOf(cat)] : cat
  )
  return {
    ok: true,
    run: {
      ...run,
      night: {
        ...night,
        redrawsLeft: night.redrawsLeft - 1,
        hand,
        drawPile: night.drawPile.slice(drawn.length),
        couch: night.couch.map((cat) =>
          cat && sentOut.includes(cat) ? null : cat
        )
      }
    },
    events: [{ type: "catsRedrawn", sentOut, drawn }]
  }
}

function play(run: Run): ActionResult {
  const { night } = run
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
    // With no Cats left to seat, the remaining Plays can never be made.
    if (next.hand.length === 0) {
      next = { ...next, status: "lost" }
      events.push({ type: "nightLost", score: next.score })
    }
  }
  return { ok: true, run: { ...run, night: next }, events }
}
