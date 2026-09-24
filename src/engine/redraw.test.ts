import { describe, expect, it } from "vitest"
import { applyAction, defaultConfig, type Run, startRun } from "./index"
import { accepted, runWithCouch } from "./testing"

/** A Night too long to end by Plays or Score, so only the Cats can run out. */
const longNight = () =>
  startRun(1, { ...defaultConfig, playsPerNight: 10, firstTarget: 10_000 })

/** Seats up to five Hand Cats from Seat 0 and Plays them. */
function playFullCouch(run: Run) {
  let seated = run
  for (const [seat, cat] of run.night.hand.slice(0, 5).entries())
    seated = accepted(seated, { type: "place", cat, seat }).run
  return accepted(seated, { type: "play" })
}

/** The 22 Cats waiting in the Draw pile last four full Couches, with 2 left over. */
function playFullCouches(plays: number, run = longNight()) {
  let next = run
  for (let play = 0; play < plays; play++) next = playFullCouch(next).run
  return next
}

describe("Redraw", () => {
  it("swaps the selected Hand Cats for the same number from the Draw pile", () => {
    const run = startRun(1)
    const [a, b, c, d] = run.night.hand
    const nextDraws = run.night.drawPile.slice(0, 2)

    const result = accepted(run, { type: "redraw", cats: [b, d] })

    expect(result.run.night.hand).toEqual([
      a,
      nextDraws[0],
      c,
      nextDraws[1],
      ...run.night.hand.slice(4)
    ])
    expect(result.run.night.drawPile).toEqual(run.night.drawPile.slice(2))
    expect(result.events).toEqual([
      { type: "catsRedrawn", sentOut: [b, d], drawn: nextDraws }
    ])
  })

  it("sends a seated Cat off the Couch, leaving its Seat empty", () => {
    const run = runWithCouch(["clingy", "aloof", "sleepy"])
    const [left, middle, right] = run.night.couch

    const after = accepted(run, { type: "redraw", cats: [middle!] }).run

    expect(after.night.couch).toEqual([left, null, right, null, null])
    expect(after.night.hand).not.toContain(middle)
    expect(after.night.hand).toHaveLength(3)
  })

  it("is allowed twice per Night, then rejected", () => {
    let run = startRun(1)
    expect(run.night.redrawsLeft).toBe(2)
    run = accepted(run, { type: "redraw", cats: [run.night.hand[0]] }).run
    run = accepted(run, { type: "redraw", cats: [run.night.hand[0]] }).run
    expect(run.night.redrawsLeft).toBe(0)

    const result = applyAction(run, {
      type: "redraw",
      cats: [run.night.hand[0]]
    })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(run)
  })

  it("takes its number per Night from config", () => {
    const run = startRun(1, { ...defaultConfig, redrawsPerNight: 4 })

    expect(run.night.redrawsLeft).toBe(4)
  })

  it("is rejected when the Draw pile is empty", () => {
    const run = playFullCouches(5)
    expect(run.night.drawPile).toEqual([])

    const result = applyAction(run, {
      type: "redraw",
      cats: [run.night.hand[0]]
    })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(run)
  })

  it("is rejected when the Draw pile holds fewer Cats than selected", () => {
    const run = playFullCouches(4)
    expect(run.night.drawPile).toHaveLength(2)

    const result = applyAction(run, {
      type: "redraw",
      cats: run.night.hand.slice(0, 3)
    })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(run)
  })

  it("takes one to three Cats", () => {
    const run = startRun(1)
    const { hand } = run.night

    expect(applyAction(run, { type: "redraw", cats: [] }).ok).toBe(false)
    expect(accepted(run, { type: "redraw", cats: hand.slice(0, 3) }).ok).toBe(
      true
    )
    expect(
      applyAction(run, { type: "redraw", cats: hand.slice(0, 4) }).ok
    ).toBe(false)
  })

  it("is rejected for a Cat not in the Hand", () => {
    const run = startRun(1)

    const result = applyAction(run, {
      type: "redraw",
      cats: [run.night.drawPile[5]]
    })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(run)
  })

  it("is rejected when the same Cat is selected twice", () => {
    const run = startRun(1)
    const cat = run.night.hand[0]

    expect(applyAction(run, { type: "redraw", cats: [cat, cat] }).ok).toBe(
      false
    )
  })

  it("keeps redrawn Cats out for the rest of the Night, with no reshuffle", () => {
    let run = longNight()
    const out = run.night.hand.slice(0, 3)
    run = accepted(run, { type: "redraw", cats: out }).run
    const seen = new Set(run.night.hand)

    while (run.night.status === "playing") {
      run = playFullCouch(run).run
      for (const cat of run.night.hand) seen.add(cat)
    }

    for (const cat of out) expect(seen).not.toContain(cat)
    expect(seen.size).toBe(27)
  })
})
