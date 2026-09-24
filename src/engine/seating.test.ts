import { describe, expect, it } from "vitest"
import { applyAction, startRun } from "./index"

function seated(seed = 1) {
  const run = startRun(seed)
  return { run, hand: run.night.hand }
}

describe("placing Cats on the Couch", () => {
  it("seats a Cat from the Hand in an empty Seat", () => {
    const { run, hand } = seated()

    const result = applyAction(run, { type: "place", cat: hand[0], seat: 2 })

    expect(result.ok).toBe(true)
    expect(result.run.night.couch).toEqual([null, null, hand[0], null, null])
  })

  it("keeps a seated Cat in the Hand until it is played", () => {
    const { run, hand } = seated()

    const result = applyAction(run, { type: "place", cat: hand[0], seat: 2 })

    expect(result.run.night.hand).toEqual(hand)
  })

  it("rejects a Cat that is not in the Hand, leaving the Run unchanged", () => {
    const { run } = seated()
    const notInHand = run.night.drawPile[0]

    const result = applyAction(run, { type: "place", cat: notInHand, seat: 0 })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(run)
  })

  it("rejects a Seat that is not on the Couch", () => {
    const { run, hand } = seated()

    expect(applyAction(run, { type: "place", cat: hand[0], seat: 5 }).ok).toBe(
      false
    )
    expect(applyAction(run, { type: "place", cat: hand[0], seat: -1 }).ok).toBe(
      false
    )
  })

  it("does not change the Run it was given", () => {
    const { run, hand } = seated()
    const before = structuredClone(run)

    applyAction(run, { type: "place", cat: hand[0], seat: 2 })

    expect(run).toEqual(before)
  })
})

describe("rearranging the Couch", () => {
  it("lets Seats be left empty anywhere", () => {
    const { run, hand } = seated()

    let next = applyAction(run, { type: "place", cat: hand[0], seat: 0 }).run
    next = applyAction(next, { type: "place", cat: hand[1], seat: 4 }).run

    expect(next.night.couch).toEqual([hand[0], null, null, null, hand[1]])
  })

  it("returns an unseated Cat to the Hand, leaving its Seat empty", () => {
    const { run, hand } = seated()
    const placed = applyAction(run, {
      type: "place",
      cat: hand[0],
      seat: 1
    }).run

    const result = applyAction(placed, { type: "unseat", cat: hand[0] })

    expect(result.ok).toBe(true)
    expect(result.run.night.couch).toEqual([null, null, null, null, null])
    expect(result.run.night.hand).toEqual(hand)
  })

  it("rejects unseating a Cat that is not on the Couch", () => {
    const { run, hand } = seated()

    expect(applyAction(run, { type: "unseat", cat: hand[0] }).ok).toBe(false)
  })

  it("swaps a Cat from the Hand with the Cat in an occupied Seat", () => {
    const { run, hand } = seated()
    const placed = applyAction(run, {
      type: "place",
      cat: hand[0],
      seat: 1
    }).run

    const result = applyAction(placed, { type: "place", cat: hand[1], seat: 1 })

    expect(result.ok).toBe(true)
    expect(result.run.night.couch).toEqual([null, hand[1], null, null, null])
    expect(result.run.night.hand).toEqual(hand)
  })

  it("moves a seated Cat to another Seat, swapping with any Cat already there", () => {
    const { run, hand } = seated()
    let next = applyAction(run, { type: "place", cat: hand[0], seat: 0 }).run
    next = applyAction(next, { type: "place", cat: hand[1], seat: 3 }).run

    const moved = applyAction(next, {
      type: "place",
      cat: hand[0],
      seat: 2
    }).run
    expect(moved.night.couch).toEqual([null, null, hand[0], hand[1], null])

    const swapped = applyAction(moved, {
      type: "place",
      cat: hand[0],
      seat: 3
    }).run
    expect(swapped.night.couch).toEqual([null, null, hand[1], hand[0], null])
  })
})
