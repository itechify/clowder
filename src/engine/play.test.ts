import { describe, expect, it } from "vitest"
import {
  type Action,
  applyAction,
  defaultConfig,
  previewPlay,
  type Run,
  startRun
} from "./index"
import { accepted, runWithCouch } from "./testing"

function apply(run: Run, ...actions: Action[]) {
  let next = run
  for (const action of actions) {
    const result = applyAction(next, action)
    if (!result.ok) throw new Error(result.reason)
    next = result.run
  }
  return next
}

/** Seats the first `count` Cats of the Hand from Seat 0. */
function seatFromHand(run: Run, count: number) {
  return apply(
    run,
    ...run.night.hand
      .slice(0, count)
      .map((cat, seat): Action => ({ type: "place", cat, seat }))
  )
}

describe("Play", () => {
  it("is rejected with an empty Couch", () => {
    const run = startRun(1)

    const result = applyAction(run, { type: "play" })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(run)
  })

  it("adds the previewed Score to the Night and uses up a Play", () => {
    const run = runWithCouch([
      "orange clingy",
      "black clingy",
      "orange aloof",
      null,
      "black sleepy"
    ])
    const preview = previewPlay(run)

    const result = applyAction(run, { type: "play" })

    expect(preview.score).toBe(55)
    expect(result.run.night.score).toBe(55)
    expect(result.run.night.playsLeft).toBe(2)
  })

  it("emits each Scoring event, then the Score total", () => {
    const run = runWithCouch(["clingy", "clingy", null, "aloof"])
    const preview = previewPlay(run)

    const { events } = accepted(run, { type: "play" })

    expect(events.slice(0, 4)).toEqual([
      { type: "catScored", ...preview.scoringEvents[0] },
      { type: "catScored", ...preview.scoringEvents[1] },
      { type: "catScored", ...preview.scoringEvents[2] },
      { type: "scoreTotal", purr: 55, mult: 1, score: 55 }
    ])
  })

  it("sends played Cats away for the rest of the Night and clears the Couch", () => {
    const run = seatFromHand(startRun(1), 3)
    const played = run.night.hand.slice(0, 3)

    const after = apply(run, { type: "play" })

    expect(after.night.couch).toEqual([null, null, null, null, null])
    for (const cat of played) {
      expect(after.night.hand).not.toContain(cat)
      expect(after.night.drawPile).not.toContain(cat)
    }
  })

  it("keeps unplayed Cats in the Hand and refills it to 8 from the Draw pile", () => {
    const run = seatFromHand(startRun(1), 3)
    const unplayed = run.night.hand.slice(3)
    const nextDraws = run.night.drawPile.slice(0, 3)

    const result = accepted(run, { type: "play" })

    expect(result.run.night.hand).toEqual([...unplayed, ...nextDraws])
    expect(result.run.night.drawPile).toEqual(run.night.drawPile.slice(3))
    expect(result.events).toContainEqual({ type: "catsDrawn", cats: nextDraws })
  })

  it("refills the Hand only partially when the Draw pile runs short", () => {
    let run = startRun(1, {
      ...defaultConfig,
      playsPerNight: 6,
      firstTarget: 10_000
    })
    // 22 Cats wait in the Draw pile; four full Couches draw 20 of them.
    for (let play = 0; play < 4; play++)
      run = apply(seatFromHand(run, 5), { type: "play" })
    expect(run.night.drawPile).toHaveLength(2)

    const after = apply(seatFromHand(run, 5), { type: "play" })

    expect(after.night.hand).toHaveLength(5)
    expect(after.night.drawPile).toEqual([])
  })

  it("equals the preview for any seeded arrangement", () => {
    for (let seed = 1; seed <= 200; seed++) {
      let run = startRun(seed)
      // Seat a seed-dependent selection of Hand Cats in seed-dependent Seats.
      run.night.hand.forEach((cat, i) => {
        const seat = (seed * (i + 3) + i) % 7
        if (seat < 5) run = apply(run, { type: "place", cat, seat })
      })
      if (run.night.couch.every((cat) => cat === null)) continue
      const preview = previewPlay(run)

      const result = accepted(run, { type: "play" })

      expect(result.run.night.score).toBe(preview.score)
      expect(result.events).toContainEqual({
        type: "scoreTotal",
        purr: preview.purr,
        mult: preview.mult,
        score: preview.score
      })
    }
  })
})

describe("the end of a Night", () => {
  it("clears the Night as soon as the summed Scores reach the Target", () => {
    const run = runWithCouch(["sleepy", "sleepy", "sleepy", "sleepy"], {
      config: { firstTarget: 320 }
    })

    const result = accepted(run, { type: "play" })

    expect(result.run.night.score).toBe(320)
    expect(result.run.night.status).toBe("cleared")
    expect(result.run.night.playsLeft).toBe(2)
    expect(result.events).toContainEqual({ type: "nightCleared", score: 320 })
  })

  it("loses the Night when no Plays remain short of the Target", () => {
    let run = startRun(1)
    for (let play = 0; play < 3; play++) {
      expect(run.night.status).toBe("playing")
      run = apply(seatFromHand(run, 1), { type: "play" })
    }

    expect(run.night.playsLeft).toBe(0)
    expect(run.night.status).toBe("lost")
  })

  it("emits Night lost on the final Play", () => {
    const run = seatFromHand(
      startRun(1, { ...defaultConfig, playsPerNight: 1 }),
      1
    )

    const result = accepted(run, { type: "play" })

    expect(result.events).toContainEqual({ type: "nightLost", score: 10 })
  })

  it("loses the Night when Plays remain but no Cats are left to seat", () => {
    let run = startRun(1, {
      ...defaultConfig,
      playsPerNight: 10,
      firstTarget: 10_000
    })
    // The 30-Cat Roster fills six Couches; the sixth Plays the last of them.
    for (let play = 0; play < 5; play++)
      run = apply(seatFromHand(run, 5), { type: "play" })
    expect(run.night.drawPile).toEqual([])

    const result = accepted(seatFromHand(run, 5), { type: "play" })

    expect(result.run.night.hand).toEqual([])
    expect(result.run.night.playsLeft).toBe(4)
    expect(result.run.night.status).toBe("lost")
    expect(result.events).toContainEqual({
      type: "nightLost",
      score: result.run.night.score
    })
  })

  it("rejects every action once the Night is over", () => {
    const run = runWithCouch(["aloof"], { config: { firstTarget: 10 } })
    const over = apply(run, { type: "play" })
    const cat = over.night.hand[0]

    expect(applyAction(over, { type: "place", cat, seat: 0 }).ok).toBe(false)
    expect(applyAction(over, { type: "play" }).ok).toBe(false)
  })
})
