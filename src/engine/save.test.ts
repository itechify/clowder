import { describe, expect, it } from "vitest"
import {
  type Action,
  applyAction,
  type Run,
  restoreRun,
  serialiseRun,
  startRun
} from "./index"
import { accepted } from "./testing"

/** An action to take next, chosen from the Run as it stands. */
type Step = (run: Run) => Action

const seatFromHand =
  (index: number, seat: number): Step =>
  (run) => ({ type: "place", cat: run.night.hand[index], seat })
const play: Step = () => ({ type: "play" })

/** Seats five Cats from the Hand and Plays them. */
const playFive: Step[] = [0, 1, 2, 3, 4].map((i) => seatFromHand(i, i))

/** Plays full Couches until the Shop opens. */
function runInShop(seed: number) {
  let run = startRun(seed)
  while (!run.shop) {
    for (const step of [...playFive, play]) run = accepted(run, step(run)).run
    if (run.status !== "playing") throw new Error("The Run ended first")
  }
  return run
}

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
})

describe("a save that cannot be resumed", () => {
  it("is refused when it is not a save at all", () => {
    for (const saved of ["", "not json", "null", "42", "[]", "{}"])
      expect(restoreRun(saved)).toBeUndefined()
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
  it("is refused wherever it is damaged, mid-Night or mid-Shop", () => {
    const midNight = accepted(startRun(3), {
      type: "place",
      cat: startRun(3).night.hand[0],
      seat: 2
    }).run
    for (const run of [midNight, runInShop(1)]) {
      const saved = serialiseRun(run)
      const refusedAt = paths(JSON.parse(saved).run)
        .map((path) => ["run", ...path])
        .filter((path) => restoreRun(damaged(saved, path)) !== undefined)

      expect(refusedAt).toEqual([])
    }
  })

  it("is refused when the Night holds a Cat that is not in the Roster", () => {
    const run = startRun(1)
    const stray = { ...run, roster: run.roster.slice(1) }

    expect(restoreRun(serialiseRun(stray))).toBeUndefined()
  })
})
