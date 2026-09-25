import {
  clearTreats,
  type HouseCatId,
  type HouseCatTreats
} from "./content/houseCats"
import {
  type ActiveGathering,
  type Growth,
  previewPlay,
  type ScoringEvent,
  type TimesEffect,
  type WarmUp,
  type WholePlayEffect
} from "./scoring"
import {
  applyShopAction,
  isShopAction,
  openShop,
  type ShopAction
} from "./shop"
import { recordPlay } from "./stats"
import type { Cat, CatId, Night, Run, RunStatus } from "./types"

export type Action =
  | { type: "place"; cat: CatId; seat: number }
  | { type: "unseat"; cat: CatId }
  | { type: "play" }
  | { type: "redraw"; cats: CatId[] }
  /** Moves a House Cat to another position; the others close up around it. */
  | { type: "reorderShelf"; houseCat: HouseCatId; position: number }
  | ShopAction

/** A Play's Purr and Mult so far, as its Score builds up event by event. */
export type Tally = { purr: number; mult: number }

/** What happened, in order: the script the renderer animates. */
export type RunEvent =
  | ({
      type: "gatheringActivated"
      firstTime: boolean
      tally: Tally
    } & ActiveGathering)
  | ({ type: "wholePlayEffect"; tally: Tally } & WholePlayEffect)
  | ({ type: "catScored"; tally: Tally } & ScoringEvent)
  /** Another, complete Scoring event for the Cat that just scored. */
  | ({ type: "repeat"; tally: Tally } & ScoringEvent)
  | ({ type: "houseCatWarmedUp" } & WarmUp)
  | ({ type: "timesEffect"; tally: Tally } & TimesEffect)
  /** A played Cat grown for good, to `basePurr`, once the Play is scored. */
  | ({ type: "catGrew"; basePurr: number } & Growth)
  | {
      type: "scoreTotal"
      purr: number
      mult: number
      score: number
      /** The Night's Scores summed, this Play's included. */
      nightScore: number
    }
  | { type: "catsDrawn"; cats: CatId[] }
  | { type: "catsRedrawn"; sentOut: CatId[]; drawn: CatId[] }
  | { type: "nightCleared"; score: number }
  | {
      type: "treatsAwarded"
      forNight: number
      forUnusedPlays: number
      /** What each paying House Cat adds, in Shelf order. */
      forHouseCats: HouseCatTreats[]
      treats: number
    }
  | { type: "shopOpened" }
  | { type: "catAdopted"; cat: Cat; price: number }
  | { type: "catRehomed"; cat: Cat; price: number }
  | { type: "houseCatRecruited"; houseCat: HouseCatId; price: number }
  | { type: "houseCatRehomed"; houseCat: HouseCatId; refund: number }
  | {
      type: "offersRerolled"
      catOffers: Cat[]
      houseCatOffers: HouseCatId[]
      price: number
    }
  | { type: "shelfReordered"; shelf: HouseCatId[] }
  | { type: "nightStarted"; night: number }
  | { type: "nightLost"; score: number }
  | { type: "runEnded"; outcome: Exclude<RunStatus, "playing"> }

export type ActionResult =
  | { ok: true; run: Run; events: RunEvent[] }
  | { ok: false; run: Run; reason: string }

/** Applies one action; an illegal action is rejected and the Run is returned unchanged. */
export function applyAction(run: Run, action: Action): ActionResult {
  const reject = (reason: string): ActionResult => ({ ok: false, run, reason })
  const { night } = run
  if (run.status !== "playing") return reject("The Run is over")
  // A Play resolves at once, so the Shelf is always outside one here.
  if (action.type === "reorderShelf") return reorderShelf(run, action)
  if (isShopAction(action)) {
    if (!run.shop) return reject("The Shop is closed")
    return applyShopAction(run, run.shop, action)
  }
  if (run.shop) return reject("The Night is over; leave the Shop first")
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
      const seated = night.couch.filter((cat) => cat !== null).length
      const joining =
        !night.couch.includes(action.cat) && night.couch[action.seat] === null
      if (joining && seated >= night.catsPerPlay)
        return reject(`At most ${night.catsPerPlay} Cats per Play tonight`)
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

function reorderShelf(
  run: Run,
  { houseCat, position }: Extract<Action, { type: "reorderShelf" }>
): ActionResult {
  if (!run.shelf.includes(houseCat))
    return { ok: false, run, reason: "That House Cat is not on the Shelf" }
  if (!Number.isInteger(position) || !(position in run.shelf))
    return { ok: false, run, reason: "There is no such position on the Shelf" }
  const shelf = run.shelf.filter((id) => id !== houseCat)
  shelf.splice(position, 0, houseCat)
  return {
    ok: true,
    run: { ...run, shelf },
    events: [{ type: "shelfReordered", shelf }]
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
  const breakdown = previewPlay(run)
  const newlyDiscovered = breakdown.gatherings
    .map((active) => active.gathering)
    .filter((gathering) => !run.discoveredGatherings.includes(gathering))
  // Each phase in turn (ADR-0001), tallying the Score as it builds.
  const tally: Tally = { purr: 0, mult: 1 }
  const events: RunEvent[] = [
    ...breakdown.gatherings.map((active): RunEvent => {
      tally.mult += active.mult
      return {
        type: "gatheringActivated",
        ...active,
        firstTime: newlyDiscovered.includes(active.gathering),
        tally: { ...tally }
      }
    }),
    ...breakdown.wholePlayEffects.map((effect): RunEvent => {
      tally.mult += effect.mult
      return { type: "wholePlayEffect", ...effect, tally: { ...tally } }
    }),
    ...breakdown.scoringEvents.map((event): RunEvent => {
      tally.purr += event.purr
      tally.mult += event.mult
      return {
        type: event.source === "seat" ? "catScored" : "repeat",
        ...event,
        tally: { ...tally }
      }
    }),
    ...breakdown.warmUps.map(
      (warmUp): RunEvent => ({ type: "houseCatWarmedUp", ...warmUp })
    ),
    ...breakdown.timesEffects.map((effect): RunEvent => {
      tally.mult *= effect.times
      return { type: "timesEffect", ...effect, tally: { ...tally } }
    }),
    {
      type: "scoreTotal",
      purr: breakdown.purr,
      mult: breakdown.mult,
      score: breakdown.score,
      nightScore: run.night.score + breakdown.score
    }
  ]
  // Grown Cats score their new base Purr from the next Play on.
  const grownTo = new Map<CatId, number>()
  for (const growth of breakdown.growth) {
    const basePurr =
      (grownTo.get(growth.cat) ??
        run.roster.find((cat) => cat.id === growth.cat)!.basePurr) + growth.purr
    grownTo.set(growth.cat, basePurr)
    events.push({ type: "catGrew", ...growth, basePurr })
  }
  const roster = run.roster.map((cat) => {
    const basePurr = grownTo.get(cat.id)
    return basePurr === undefined ? cat : { ...cat, basePurr }
  })
  const played = run.night.couch.filter((cat) => cat !== null)
  const night: Night = {
    ...run.night,
    score: run.night.score + breakdown.score,
    playsLeft: run.night.playsLeft - 1,
    warmPlays: run.night.warmPlays + (breakdown.warmUps.length > 0 ? 1 : 0),
    hand: run.night.hand.filter((cat) => !played.includes(cat)),
    couch: run.night.couch.map(() => null)
  }
  const scored: Run = {
    ...run,
    roster,
    night,
    stats: recordPlay(run, breakdown),
    discoveredGatherings: [...run.discoveredGatherings, ...newlyDiscovered]
  }
  if (night.score >= night.target)
    return clearNight(
      { ...scored, night: { ...night, status: "cleared" } },
      events
    )
  if (night.playsLeft === 0) return loseRun(scored, events)
  // The Draw pile never reshuffles mid-Night, so the Hand may come up short.
  const drawn = night.drawPile.slice(0, run.config.handSize - night.hand.length)
  events.push({ type: "catsDrawn", cats: drawn })
  const refilled: Run = {
    ...scored,
    night: {
      ...night,
      hand: [...night.hand, ...drawn],
      drawPile: night.drawPile.slice(drawn.length)
    }
  }
  // With no Cats left to seat, the remaining Plays can never be made.
  if (refilled.night.hand.length === 0) return loseRun(refilled, events)
  return { ok: true, run: refilled, events }
}

/** Loses the Night, and with it the Run. */
function loseRun(run: Run, events: RunEvent[]): ActionResult {
  events.push(
    { type: "nightLost", score: run.night.score },
    { type: "runEnded", outcome: "lost" }
  )
  return {
    ok: true,
    run: { ...run, night: { ...run.night, status: "lost" }, status: "lost" },
    events
  }
}

/** Pays the cleared Night's Treats, then opens the Shop or wins the Run. */
function clearNight(run: Run, events: RunEvent[]): ActionResult {
  const { config, night } = run
  const reward = config.clearReward
  const forNight = night.disaster
    ? reward.disaster
    : night.number <= reward.earlyNights
      ? reward.early
      : reward.later
  const forUnusedPlays = reward.perUnusedPlay * night.playsLeft
  const forHouseCats = clearTreats(run.shelf, night)
  const treats = forHouseCats.reduce(
    (sum, paid) => sum + paid.treats,
    forNight + forUnusedPlays
  )
  events.push(
    { type: "nightCleared", score: night.score },
    { type: "treatsAwarded", forNight, forUnusedPlays, forHouseCats, treats }
  )
  const paid: Run = {
    ...run,
    treats: run.treats + treats,
    stats: { ...run.stats, nightsCleared: run.stats.nightsCleared + 1 }
  }
  if (night.number < config.nights) {
    events.push({ type: "shopOpened" })
    return { ok: true, run: openShop(paid), events }
  }
  events.push({ type: "runEnded", outcome: "won" })
  return { ok: true, run: { ...paid, status: "won" }, events }
}
