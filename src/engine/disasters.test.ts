import { describe, expect, it } from "vitest"
import {
  applyAction,
  type Config,
  type DisasterId,
  defaultConfig,
  type Run,
  startRun
} from "./index"
import { accepted } from "./testing"

/** A Run in which every Play, however small, clears its Night. */
const easyRun = (seed = 1, config: Partial<Config> = {}) =>
  startRun(seed, { ...defaultConfig, basePurr: 1_000_000, ...config })

/** Plays the first Hand Cat alone; in an easy Run that clears the Night. */
function playOne(run: Run) {
  const cat = run.night.hand[0]
  return accepted(accepted(run, { type: "place", cat, seat: 0 }).run, {
    type: "play"
  })
}

/** Clears the Night with one lone Cat, then leaves the Shop for the next. */
function playOnToNextNight(run: Run) {
  const cleared = playOne(run).run
  return cleared.shop ? accepted(cleared, { type: "leaveShop" }).run : cleared
}

/** An easy Run, played on to the Night of the given Disaster. */
function runOn(disaster: DisasterId) {
  let run = easyRun()
  while (run.night.disaster !== disaster) run = playOnToNextNight(run)
  return run
}

/** Seats the first `count` Hand Cats from Seat 0. */
function seatFromHand(run: Run, count: number) {
  let next = run
  run.night.hand.slice(0, count).forEach((cat, seat) => {
    next = accepted(next, { type: "place", cat, seat }).run
  })
  return next
}

describe("the Disaster order", () => {
  it("holds each of the three Disasters once", () => {
    expect([...startRun(1).disasters].sort()).toEqual([
      "doorbell",
      "humanWakesUp",
      "vacuum"
    ])
  })

  it("is the same for the same seed", () => {
    expect(startRun(42).disasters).toEqual(startRun(42).disasters)
  })

  it("is shuffled differently across Runs", () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, seed) => startRun(seed).disasters.join())
    )

    expect(orders.size).toBeGreaterThan(1)
  })
})

describe("Disaster Nights", () => {
  it("are Nights 3, 6, and 9, meeting the Disasters in the Run's order", () => {
    let run = easyRun()
    const byNight = [run.night.disaster]
    while (run.status === "playing") {
      run = playOnToNextNight(run)
      if (run.status === "playing") byNight.push(run.night.disaster)
    }
    const [first, second, third] = run.disasters

    expect(byNight).toEqual([
      null,
      null,
      first,
      null,
      null,
      second,
      null,
      null,
      third
    ])
  })
})

describe("a Disaster Night's Target", () => {
  it("is 1.5× what a normal Night at that point would require", () => {
    let run = easyRun()
    const targets = [run.night.target]
    for (let night = 1; night < 9; night++) {
      run = playOnToNextNight(run)
      targets.push(run.night.target)
    }

    // Normally 768, 3146, and 12885 on Nights 3, 6, and 9.
    expect(targets).toEqual([
      300, 480, 1152, 1229, 1966, 4719, 5033, 8053, 19328
    ])
  })
})

describe("The Vacuum", () => {
  it("rejects placing a fifth Cat on the Couch", () => {
    const run = seatFromHand(runOn("vacuum"), 4)
    const fifth = run.night.hand[4]

    const result = applyAction(run, { type: "place", cat: fifth, seat: 4 })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(run)
  })

  it("still lets a Cat swap in for a seated one, or change Seats", () => {
    const run = seatFromHand(runOn("vacuum"), 4)
    const [first, , , , fifth] = run.night.hand

    const swapped = accepted(run, { type: "place", cat: fifth, seat: 0 }).run
    const moved = accepted(run, { type: "place", cat: first, seat: 4 }).run

    expect(swapped.night.couch).toEqual([fifth, ...run.night.couch.slice(1)])
    expect(moved.night.couch).toEqual([
      null,
      ...run.night.couch.slice(1, 4),
      first
    ])
  })

  it("leaves the Couch whole on other Nights", () => {
    const run = seatFromHand(runOn("doorbell"), 5)

    expect(run.night.couch.every((cat) => cat !== null)).toBe(true)
  })
})

describe("The Doorbell", () => {
  it("gives one Redraw for its Night", () => {
    const run = runOn("doorbell")
    const once = accepted(run, { type: "redraw", cats: [run.night.hand[0]] })

    expect(run.night.redrawsLeft).toBe(1)
    expect(
      applyAction(once.run, { type: "redraw", cats: [once.run.night.hand[0]] })
        .ok
    ).toBe(false)
  })
})

describe("The Human Wakes Up", () => {
  it("gives two Plays for its Night", () => {
    // An unreachable Target, so the Night is lost once its Plays are gone.
    let run = runOn("humanWakesUp")
    run = { ...run, night: { ...run.night, target: Number.POSITIVE_INFINITY } }
    expect(run.night.playsLeft).toBe(2)

    run = accepted(seatFromHand(run, 1), { type: "play" }).run
    expect(run.status).toBe("playing")
    run = accepted(seatFromHand(run, 1), { type: "play" }).run

    expect(run.status).toBe("lost")
  })
})

describe("the Nights after a Disaster", () => {
  it("return to the usual Plays, Redraws, and Couch", () => {
    let run = easyRun()
    const after: Run[] = []
    while (run.status === "playing") {
      const disaster = run.night.disaster
      run = playOnToNextNight(run)
      if (disaster) after.push(run)
    }

    for (const next of after.slice(0, 2)) {
      expect(next.night.disaster).toBeNull()
      expect(next.night.playsLeft).toBe(3)
      expect(next.night.redrawsLeft).toBe(2)
      expect(next.night.catsPerPlay).toBe(5)
    }
  })
})

describe("clearing a Disaster Night", () => {
  it("pays 6 Treats, +1 per unused Play", () => {
    let run = easyRun()
    const paid: Record<string, unknown> = {}
    while (run.status === "playing") {
      const { disaster } = run.night
      const { run: cleared, events } = playOne(run)
      if (disaster)
        paid[disaster] = events.find((event) => event.type === "treatsAwarded")
      run = cleared.shop
        ? accepted(cleared, { type: "leaveShop" }).run
        : cleared
    }

    // Each is cleared on its first Play; The Human Wakes Up has one to spare.
    const award = (forUnusedPlays: number) => ({
      type: "treatsAwarded",
      forNight: 6,
      forUnusedPlays,
      treats: 6 + forUnusedPlays
    })
    expect(paid).toEqual({
      vacuum: award(2),
      doorbell: award(2),
      humanWakesUp: award(1)
    })
  })
})

describe("the Shop", () => {
  it("reveals the next Night's Disaster in the visit before it", () => {
    let run = easyRun()
    const revealed: (DisasterId | null)[] = []
    while (run.status === "playing") {
      run = playOne(run).run
      if (!run.shop) break
      revealed.push(run.shop.nextDisaster)
      run = accepted(run, { type: "leaveShop" }).run
      expect(run.night.disaster).toBe(revealed.at(-1))
    }
    const [first, second, third] = run.disasters

    // Visits come before Nights 2 to 9.
    expect(revealed).toEqual([
      null,
      first,
      null,
      null,
      second,
      null,
      null,
      third
    ])
  })
})
