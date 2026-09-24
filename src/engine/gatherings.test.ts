import { describe, expect, it } from "vitest"
import { type Action, applyAction, previewPlay, type Run } from "./index"
import { runWithCouch } from "./testing"

function accepted(run: Run, action: Action) {
  const result = applyAction(run, action)
  if (!result.ok) throw new Error(result.reason)
  return result
}

const active = (breakdown: ReturnType<typeof previewPlay>) =>
  breakdown.gatherings.map((g) => g.gathering)

describe("Cuddle Puddle", () => {
  it("adds +3 Mult for three same-Coat Cats in consecutive occupied Seats", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange clingy", "orange clingy", "orange aloof"])
    )

    expect(breakdown.gatherings).toEqual([
      {
        gathering: "cuddlePuddle",
        name: "Cuddle Puddle",
        mult: 3,
        seats: [0, 1, 2]
      }
    ])
    expect(breakdown.mult).toBe(4)
    expect(breakdown.purr).toBe(45)
    expect(breakdown.score).toBe(180)
  })
})

describe("Nap Club", () => {
  it("adds +3 Mult for three Sleepy Cats in consecutive occupied Seats", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange sleepy", "black sleepy", "white sleepy"])
    )

    expect(breakdown.gatherings).toEqual([
      { gathering: "napClub", name: "Nap Club", mult: 3, seats: [0, 1, 2] }
    ])
    expect(breakdown.mult).toBe(4)
  })

  it("is broken by an empty Seat", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange sleepy", "black sleepy", null, "white sleepy"])
    )

    expect(active(breakdown)).toEqual([])
    expect(breakdown.mult).toBe(1)
  })
})

describe("Personal Space", () => {
  it("adds +2 Mult for at least two Cats played with no Neighbors", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange aloof", null, "black clingy", null, "white aloof"])
    )

    expect(breakdown.gatherings).toEqual([
      {
        gathering: "personalSpace",
        name: "Personal Space",
        mult: 2,
        seats: [0, 2, 4]
      }
    ])
    expect(breakdown.mult).toBe(3)
  })

  it("needs at least two Cats", () => {
    expect(active(previewPlay(runWithCouch([null, "aloof"])))).toEqual([])
  })

  it("is broken by any two Cats being Neighbors", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange aloof", null, "black clingy", "white aloof"])
    )

    expect(active(breakdown)).toEqual([])
  })
})

describe("Variety Pack", () => {
  it("adds +3 Mult for at least four different Coats on the Couch", () => {
    const breakdown = previewPlay(
      runWithCouch([
        "orange clingy",
        "black clingy",
        "white clingy",
        "gray clingy"
      ])
    )

    expect(breakdown.gatherings).toEqual([
      {
        gathering: "varietyPack",
        name: "Variety Pack",
        mult: 3,
        seats: [0, 1, 2, 3]
      }
    ])
    expect(breakdown.mult).toBe(4)
  })

  it("needs four different Coats, not four Cats", () => {
    const breakdown = previewPlay(
      runWithCouch([
        "orange clingy",
        "black clingy",
        "white clingy",
        "orange aloof"
      ])
    )

    expect(active(breakdown)).toEqual([])
  })
})

describe("Full Sofa", () => {
  it("adds +1 Mult when all five Seats are occupied", () => {
    const breakdown = previewPlay(
      runWithCouch([
        "orange clingy",
        "black clingy",
        "orange aloof",
        "black aloof",
        "orange sleepy"
      ])
    )

    expect(breakdown.gatherings).toEqual([
      {
        gathering: "fullSofa",
        name: "Full Sofa",
        mult: 1,
        seats: [0, 1, 2, 3, 4]
      }
    ])
    expect(breakdown.mult).toBe(2)
  })

  it("needs every Seat", () => {
    const breakdown = previewPlay(
      runWithCouch([
        "orange clingy",
        "black clingy",
        "orange aloof",
        "black aloof"
      ])
    )

    expect(active(breakdown)).toEqual([])
  })
})

describe("Gatherings together", () => {
  it("scores three Orange Sleepy Cats seated together as 60 Purr × 7 Mult = 420", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange sleepy", "orange sleepy", "orange sleepy"], {
        config: { copiesPerCombination: 3 }
      })
    )

    expect(active(breakdown)).toEqual(["cuddlePuddle", "napClub"])
    expect(breakdown.purr).toBe(60)
    expect(breakdown.mult).toBe(7)
    expect(breakdown.score).toBe(420)
  })

  it("applies every qualifying Gathering", () => {
    const breakdown = previewPlay(
      runWithCouch([
        "orange sleepy",
        "orange sleepy",
        "black sleepy",
        "white clingy",
        "gray clingy"
      ])
    )

    expect(active(breakdown)).toEqual(["napClub", "varietyPack", "fullSofa"])
    expect(breakdown.mult).toBe(8)
  })

  it("applies each Gathering at most once per Play", () => {
    const breakdown = previewPlay(
      runWithCouch(
        [
          "orange clingy",
          "orange clingy",
          "orange clingy",
          null,
          "black clingy",
          "black clingy",
          "black clingy"
        ],
        { config: { seats: 7, copiesPerCombination: 3 } }
      )
    )

    expect(breakdown.gatherings).toEqual([
      {
        gathering: "cuddlePuddle",
        name: "Cuddle Puddle",
        mult: 3,
        seats: [0, 1, 2, 4, 5, 6]
      }
    ])
    expect(breakdown.mult).toBe(4)
  })

  it("leaves Mult at 1 when no Gathering forms", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange clingy", "black aloof"])
    )

    expect(breakdown.gatherings).toEqual([])
    expect(breakdown.mult).toBe(1)
  })
})

describe("Gatherings in a Play", () => {
  it("activate before any Cat scores", () => {
    const run = runWithCouch(["orange sleepy", "orange sleepy", "black sleepy"])

    const { events } = accepted(run, { type: "play" })

    expect(events.map((event) => event.type).slice(0, 2)).toEqual([
      "gatheringActivated",
      "catScored"
    ])
    expect(events[0]).toEqual({
      type: "gatheringActivated",
      gathering: "napClub",
      name: "Nap Club",
      mult: 3,
      seats: [0, 1, 2],
      firstTime: true
    })
  })

  it("are discovered for the rest of the Run the first time they activate", () => {
    const run = runWithCouch(["orange aloof", null, "black aloof"])
    expect(run.discoveredGatherings).toEqual([])

    const first = accepted(run, { type: "play" })
    const [a, b] = first.run.night.hand
    const again = accepted(
      accepted(accepted(first.run, { type: "place", cat: a, seat: 0 }).run, {
        type: "place",
        cat: b,
        seat: 2
      }).run,
      { type: "play" }
    )

    expect(first.run.discoveredGatherings).toEqual(["personalSpace"])
    expect(again.events[0]).toMatchObject({
      type: "gatheringActivated",
      gathering: "personalSpace",
      firstTime: false
    })
    expect(again.run.discoveredGatherings).toEqual(["personalSpace"])
  })

  it("are not discovered by arranging Cats without Playing", () => {
    const run = runWithCouch(["orange aloof", null, "black aloof"])

    expect(previewPlay(run).gatherings).toHaveLength(1)
    expect(run.discoveredGatherings).toEqual([])
  })
})
