import { describe, expect, it } from "vitest"
import {
  type Action,
  applyAction,
  defaultConfig,
  type Run,
  restoreRun,
  serialiseRun,
  startRun
} from "./index"
import { accepted, chooseFirstPage } from "./testing"

/** An action to take next, chosen from the Run as it stands. */
type Step = (run: Run) => Action

const seatFromHand =
  (index: number, seat: number): Step =>
  (run) => ({ type: "place", cat: run.night.hand[index], seat })
const play: Step = () => ({ type: "play" })

/** Seats five Cats from the Hand and Plays them. */
const playFive: Step[] = [0, 1, 2, 3, 4].map((i) => seatFromHand(i, i))

/** Plays full Couches until the Scrapbook opens. */
function runInScrapbook(seed: number) {
  let run = startRun(seed)
  while (!run.scrapbookPages) {
    for (const step of [...playFive, play]) run = accepted(run, step(run)).run
    if (run.status !== "playing") throw new Error("The Run ended first")
  }
  return run
}

/** Plays full Couches until the Scrapbook opens, then chooses a page for the Shop. */
const runInShop = (seed: number) => chooseFirstPage(runInScrapbook(seed)).run

const choosePage: Step = (run) => ({
  type: "choosePage",
  gathering: run.scrapbookPages![0]
})

/**
 * Saves and restores the Run, then takes the same steps in both: the saved
 * Run must behave exactly as the original would have, step by step. Every
 * part of Run state must survive this as the Run grows.
 */
function expectResumesIdentically(run: Run, steps: Step[]) {
  let original = run
  let resumed = restoreRun(serialiseRun(run))!
  expect(resumed).toStrictEqual(original)
  for (const step of steps) {
    const action = step(original)
    const expected = applyAction(original, action)
    const actual = applyAction(resumed, action)
    expect(actual).toStrictEqual(expected)
    original = expected.run
    // Saved again after every action, as the game does.
    resumed = restoreRun(serialiseRun(actual.run))!
    expect(resumed).toStrictEqual(original)
  }
  return original
}

describe("saving and resuming a Run", () => {
  it("resumes mid-Night exactly as it would have gone on", () => {
    const run = accepted(startRun(3), {
      type: "place",
      cat: startRun(3).night.hand[0],
      seat: 2
    }).run

    const end = expectResumesIdentically(run, [
      (r) => ({ type: "redraw", cats: r.night.hand.slice(0, 3) }),
      seatFromHand(1, 0),
      (r) => ({ type: "unseat", cat: r.night.hand[1] }),
      ...playFive,
      play,
      ...playFive,
      play
    ])

    expect(end.night.playsLeft).toBeLessThan(3)
  })

  it("resumes mid-Shop exactly as it would have gone on", () => {
    const run = runInShop(1)

    const end = expectResumesIdentically(run, [
      (r) => ({ type: "adopt", cat: r.shop!.catOffers[0].id }),
      (r) => ({ type: "rehome", cat: r.roster[0].id }),
      () => ({ type: "reroll" }),
      () => ({ type: "leaveShop" }),
      ...playFive,
      play
    ])

    expect(end.night.number).toBe(2)
  })

  it("resumes with House Cats on the Shelf exactly as it would have gone on", () => {
    // Treats enough to Recruit whichever House Cat is offered.
    const run = { ...runInShop(1), treats: 20 }

    const end = expectResumesIdentically(run, [
      (r) => ({ type: "recruit", houseCat: r.shop!.houseCatOffers[0] }),
      (r) => ({ type: "reorderShelf", houseCat: r.shelf[0], position: 0 }),
      () => ({ type: "leaveShop" }),
      seatFromHand(0, 0),
      seatFromHand(1, 2),
      seatFromHand(2, 4),
      play
    ])

    expect(end.shelf).toHaveLength(1)
    expect(end.night.playsLeft).toBe(2)
  })

  it("resumes mid-choice exactly as it would have gone on", () => {
    const run = runInScrapbook(1)

    const end = expectResumesIdentically(run, [
      choosePage,
      () => ({ type: "leaveShop" }),
      ...playFive,
      play
    ])

    expect(end.night.number).toBe(2)
    expect(Object.values(end.gatheringLevels)).toContain(2)
  })

  it("resumes a Disaster Night exactly as it would have gone on", () => {
    // Every Play clears its Night, so full Couches reach Night 3 at once.
    let run = startRun(1, { ...defaultConfig, basePurr: 1_000_000 })
    while (run.night.disaster === null) {
      for (const step of [...playFive, play]) run = accepted(run, step(run)).run
      run = chooseFirstPage(run).run
      run = accepted(run, { type: "leaveShop" }).run
    }

    const end = expectResumesIdentically(run, [...playFive, play, choosePage])

    expect(end.shop).not.toBeNull()
  })
})

describe("a save that cannot be resumed", () => {
  it("is refused when it is not a save at all", () => {
    for (const saved of ["", "not json", "null", "42", "[]", "{}"])
      expect(restoreRun(saved)).toBeUndefined()
  })

  it("is refused when it was saved before Disasters", () => {
    const save = JSON.parse(serialiseRun(startRun(1)))
    const { run } = save
    delete run.disasters
    delete run.night.disaster
    delete run.night.catsPerPlay
    delete run.config.disasterNights
    delete run.config.disasterTargetFactor
    delete run.config.clearReward.disaster
    save.version = 1

    expect(restoreRun(JSON.stringify(save))).toBeUndefined()
  })

  it("is refused when it was saved by an incompatible version", () => {
    const saved = JSON.parse(serialiseRun(startRun(1)))
    saved.version = -1

    expect(restoreRun(JSON.stringify(saved))).toBeUndefined()
  })
})

/** Every place in a plain value where another value could go, as key paths. */
function paths(
  value: unknown,
  at: (string | number)[] = []
): (string | number)[][] {
  if (typeof value !== "object" || value === null) return [at]
  return [
    at,
    ...Object.entries(value).flatMap(([key, inner]) =>
      paths(inner, [...at, Array.isArray(value) ? Number(key) : key])
    )
  ]
}

/** The save with the value at `path` swapped for one of the wrong kind. */
function damaged(saved: string, path: (string | number)[]) {
  const save = JSON.parse(saved)
  let parent = save
  for (const key of path.slice(0, -1)) parent = parent[key]
  const key = path.at(-1)!
  parent[key] = typeof parent[key] === "string" ? 0 : "wrong"
  return JSON.stringify(save)
}

describe("a damaged save", () => {
  it("is refused wherever it is damaged, mid-Night, mid-choice, or mid-Shop", () => {
    const midNight = accepted(startRun(3), {
      type: "place",
      cat: startRun(3).night.hand[0],
      seat: 2
    }).run
    const inShop = { ...runInShop(1), treats: 20 }
    const withShelf = accepted(inShop, {
      type: "recruit",
      houseCat: inShop.shop!.houseCatOffers[0]
    }).run
    for (const run of [midNight, runInScrapbook(1), runInShop(1), withShelf]) {
      const saved = serialiseRun(run)
      const refusedAt = paths(JSON.parse(saved).run)
        .map((path) => ["run", ...path])
        .filter((path) => restoreRun(damaged(saved, path)) !== undefined)

      expect(refusedAt).toEqual([])
    }
  })

  it("is refused when the Shelf holds a House Cat twice, or too many", () => {
    const run = startRun(1)
    const twice: Run = { ...run, shelf: ["boxGoblin", "boxGoblin"] }
    const tooMany: Run = {
      ...run,
      config: { ...run.config, shelfSize: 1 },
      shelf: ["boxGoblin", "doNotTouch"]
    }

    expect(restoreRun(serialiseRun(twice))).toBeUndefined()
    expect(restoreRun(serialiseRun(tooMany))).toBeUndefined()
  })

  it("is refused when the Scrapbook offers a Gathering twice, mid-Night, or with the Shop open", () => {
    const run = runInScrapbook(1)
    const [page] = run.scrapbookPages!
    const twice: Run = { ...run, scrapbookPages: [page, page, page] }
    const midNight: Run = { ...startRun(1), scrapbookPages: [page] }
    const withShop: Run = { ...runInShop(1), scrapbookPages: [page] }

    for (const refused of [twice, midNight, withShop])
      expect(restoreRun(serialiseRun(refused))).toBeUndefined()
  })

  it("is refused when the Night holds a Cat that is not in the Roster", () => {
    const run = startRun(1)
    const stray = { ...run, roster: run.roster.slice(1) }

    expect(restoreRun(serialiseRun(stray))).toBeUndefined()
  })
})
