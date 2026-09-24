import { describe, expect, it } from "vitest"
import {
  type Action,
  applyAction,
  type Config,
  defaultConfig,
  type Run,
  starCat,
  startRun
} from "./index"
import { runWithCouch } from "./testing"

function accepted(run: Run, action: Action) {
  const result = applyAction(run, action)
  if (!result.ok) throw new Error(result.reason)
  return result
}

/** Seats the first `count` Cats of the Hand from Seat 0 and Plays them. */
function playFromHand(run: Run, count = 1) {
  let next = run
  run.night.hand.slice(0, count).forEach((cat, seat) => {
    next = accepted(next, { type: "place", cat, seat }).run
  })
  return accepted(next, { type: "play" })
}

/** A Run in which every Play, however small, clears its Night. */
const easyRun = (seed = 1, config: Partial<Config> = {}) =>
  startRun(seed, { ...defaultConfig, basePurr: 1_000_000, ...config })

describe("clearing a Night", () => {
  it("starts the next Night with a fresh Hand of 8 and three Plays", () => {
    const run = easyRun()

    const { run: after } = playFromHand(run)

    expect(after.night.number).toBe(2)
    expect(after.night.status).toBe("playing")
    expect(after.night.score).toBe(0)
    expect(after.night.playsLeft).toBe(3)
    expect(after.night.hand).toHaveLength(8)
    expect(after.night.drawPile).toHaveLength(22)
    expect(after.night.couch).toEqual([null, null, null, null, null])
  })
})

describe("a Run's nine Nights", () => {
  it("raise the Target from 300 by ×1.6 each Night", () => {
    let run = easyRun()
    const targets = [run.night.target]
    for (let night = 1; night < 9; night++) {
      run = playFromHand(run).run
      targets.push(run.night.target)
    }

    expect(targets).toEqual([
      300, 480, 768, 1229, 1966, 3146, 5033, 8053, 12885
    ])
  })
})

describe("Treats", () => {
  it("start at none", () => {
    expect(startRun(1).treats).toBe(0)
  })

  it("pay 3 for clearing Nights 1–2 and 4 later, +1 per unused Play", () => {
    let run = easyRun()
    const payouts: number[] = []
    for (let night = 1; night <= 9; night++) {
      const before = run.treats
      run = playFromHand(run).run
      payouts.push(run.treats - before)
    }

    // Each Night is cleared on its first Play, leaving two unused.
    expect(payouts).toEqual([5, 5, 6, 6, 6, 6, 6, 6, 6])
    expect(run.treats).toBe(52)
  })

  it("pay nothing extra when the Night is cleared on its last Play", () => {
    const run = startRun(1, {
      ...defaultConfig,
      playsPerNight: 1,
      firstTarget: 10
    })

    const { run: after, events } = playFromHand(run)

    expect(after.night.number).toBe(2)
    expect(after.treats).toBe(3)
    expect(events).toContainEqual({
      type: "treatsAwarded",
      forNight: 3,
      forUnusedPlays: 0,
      treats: 3
    })
  })

  it("are not paid for a lost Night", () => {
    const run = startRun(1, { ...defaultConfig, playsPerNight: 1 })

    expect(playFromHand(run).run.treats).toBe(0)
  })
})

describe("the end of a Run", () => {
  it("is a win once Night 9 is cleared", () => {
    let run = easyRun()
    for (let night = 1; night < 9; night++) run = playFromHand(run).run
    expect(run.status).toBe("playing")

    const { run: won, events } = playFromHand(run)

    expect(won.status).toBe("won")
    expect(won.night.number).toBe(9)
    expect(won.night.status).toBe("cleared")
    expect(events).toContainEqual({ type: "runEnded", outcome: "won" })
  })

  it("is a loss when a Night's Plays run out short of its Target", () => {
    let run = startRun(1)
    for (let play = 0; play < 2; play++) run = playFromHand(run).run
    expect(run.status).toBe("playing")

    const { run: lost, events } = playFromHand(run)

    expect(lost.status).toBe("lost")
    expect(lost.night.number).toBe(1)
    expect(events).toContainEqual({ type: "runEnded", outcome: "lost" })
  })

  it("can come on a later Night", () => {
    // One-Cat Plays score 10 to 25, so three always reach Night 2's Target of
    // 30 and never Night 3's of 90.
    let run = startRun(7, {
      ...defaultConfig,
      firstTarget: 10,
      targetGrowth: 3
    })
    while (run.status === "playing") run = playFromHand(run).run

    expect(run.status).toBe("lost")
    expect(run.night.number).toBe(3)
  })

  it("rejects every action once it is over", () => {
    const won = playFromHand(easyRun(1, { nights: 1 })).run
    const lost = playFromHand(
      startRun(1, { ...defaultConfig, playsPerNight: 1 })
    ).run

    for (const run of [won, lost]) {
      const cat = run.night.hand[0]
      expect(applyAction(run, { type: "place", cat, seat: 0 }).ok).toBe(false)
      expect(applyAction(run, { type: "play" }).ok).toBe(false)
    }
  })
})

describe("Run statistics", () => {
  it("count the Nights cleared", () => {
    let won = easyRun()
    while (won.status === "playing") won = playFromHand(won).run
    let lost = startRun(7, {
      ...defaultConfig,
      firstTarget: 10,
      targetGrowth: 3
    })
    while (lost.status === "playing") lost = playFromHand(lost).run

    expect(startRun(1).stats.nightsCleared).toBe(0)
    expect(won.stats.nightsCleared).toBe(9)
    expect(lost.stats.nightsCleared).toBe(2)
  })

  it("keep the best single Play's Couch layout, Score, and Night", () => {
    const run = runWithCouch(["clingy", "clingy", null, "aloof"])
    const couch = run.night.couch

    const after = accepted(run, { type: "play" }).run

    expect(after.stats.bestPlay).toEqual({
      night: 1,
      score: 55,
      couch: couch.map((id) => run.roster.find((cat) => cat.id === id) ?? null)
    })
  })

  it("replace the best Play only with a higher Score", () => {
    // A lone Cat scores at most 25; five Cats score at least 50.
    let run = startRun(1)
    run = playFromHand(run, 1).run
    const lone = run.stats.bestPlay
    const five = run.night.hand.slice(0, 5)
    run = playFromHand(run, 5).run
    const best = run.stats.bestPlay

    expect(best?.score).toBeGreaterThan(lone?.score ?? 0)
    expect(best?.couch.map((cat) => cat?.id)).toEqual(five)
    expect(playFromHand(run, 1).run.stats.bestPlay).toEqual(best)
  })

  it("sum the Purr each Cat has contributed", () => {
    const run = runWithCouch(["clingy", "clingy", null, "aloof"])
    const [clingyA, clingyB, , aloof] = run.night.couch as string[]

    const first = accepted(run, { type: "play" })
    const second = playFromHand(first.run, 5)
    const secondPurr = second.events.find((e) => e.type === "scoreTotal")?.purr
    const { purrByCat } = second.run.stats

    expect(first.run.stats.purrByCat).toEqual({
      [clingyA]: 15,
      [clingyB]: 15,
      [aloof]: 25
    })
    const total = Object.values(purrByCat).reduce((a, b) => a + b)
    expect(total).toBe(55 + (secondPurr ?? Number.NaN))
  })

  it("name the star Cat: the one that contributed the most Purr", () => {
    const run = runWithCouch(["clingy", "clingy", null, "aloof"])
    const aloof = run.roster.find((cat) => cat.id === run.night.couch[3])

    const after = accepted(run, { type: "play" }).run

    expect(starCat(after)).toEqual({ cat: aloof, purr: 25 })
    expect(starCat(run)).toBeUndefined()
  })
})
