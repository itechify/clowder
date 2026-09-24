import { describe, expect, it } from "vitest"
import { previewPlay } from "./index"
import { runWithCouch } from "./testing"

const bonuses = (breakdown: ReturnType<typeof previewPlay>) =>
  breakdown.scoringEvents.map((event) => event.bonus)

describe("a Play's Score", () => {
  it("is total Purr × Mult, with each Cat adding its 10 base Purr", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange aloof", "black sleepy", "white aloof"])
    )

    expect(breakdown.purr).toBe(30)
    expect(breakdown.mult).toBe(1)
    expect(breakdown.score).toBe(30)
  })

  it("scores Cats left to right by Seat", () => {
    const run = runWithCouch([null, "clingy", null, "sleepy", "aloof"])

    const breakdown = previewPlay(run)

    expect(breakdown.scoringEvents.map((event) => event.seat)).toEqual([
      1, 3, 4
    ])
    expect(breakdown.scoringEvents.map((event) => event.cat)).toEqual(
      run.night.couch.filter((cat) => cat !== null)
    )
  })
})

describe("Neighbors and Clingy", () => {
  it("gives a Clingy Cat +5 Purr per Neighbor", () => {
    const breakdown = previewPlay(
      runWithCouch(["clingy", "clingy", "clingy", null, null])
    )

    expect(bonuses(breakdown)).toEqual([5, 10, 5])
    expect(breakdown.purr).toBe(50)
  })

  it("does not count Cats across an empty Seat as Neighbors", () => {
    const breakdown = previewPlay(
      runWithCouch(["clingy", null, "clingy", "clingy", null])
    )

    expect(bonuses(breakdown)).toEqual([0, 5, 5])
  })

  it("does not wrap the Couch around from the last Seat to the first", () => {
    const breakdown = previewPlay(
      runWithCouch(["clingy", null, null, null, "clingy"])
    )

    expect(bonuses(breakdown)).toEqual([0, 0])
  })
})

describe("Aloof", () => {
  it("gives +15 Purr to an Aloof Cat alone on the Couch", () => {
    expect(bonuses(previewPlay(runWithCouch([null, null, "aloof"])))).toEqual([
      15
    ])
  })

  it("gives +15 Purr to an Aloof Cat with no Neighbors", () => {
    const breakdown = previewPlay(
      runWithCouch(["aloof", null, "clingy", null, "aloof"])
    )

    expect(bonuses(breakdown)).toEqual([15, 0, 15])
  })

  it("gives nothing to an Aloof Cat with a Neighbor", () => {
    const breakdown = previewPlay(runWithCouch(["aloof", "clingy"]))

    expect(bonuses(breakdown)).toEqual([0, 5])
  })
})

describe("Sleepy", () => {
  it("gives a flat +10 Purr to a Sleepy Cat with at least one Sleepy Neighbor", () => {
    const breakdown = previewPlay(runWithCouch(["sleepy", "sleepy", "sleepy"]))

    expect(bonuses(breakdown)).toEqual([10, 10, 10])
  })

  it("gives nothing to a Sleepy Cat whose Neighbors are not Sleepy", () => {
    const breakdown = previewPlay(runWithCouch(["clingy", "sleepy", "aloof"]))

    expect(bonuses(breakdown)).toEqual([5, 0, 0])
  })

  it("gives nothing to Sleepy Cats separated by an empty Seat", () => {
    const breakdown = previewPlay(runWithCouch(["sleepy", null, "sleepy"]))

    expect(bonuses(breakdown)).toEqual([0, 0])
  })
})
