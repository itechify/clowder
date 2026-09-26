import { describe, expect, it } from "vitest"
import {
  type Action,
  applyAction,
  defaultConfig,
  type HouseCatId,
  houseCats,
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

/** A seed-dependent Shelf of up to four House Cats, in seed-dependent order. */
function seededShelf(seed: number): HouseCatId[] {
  const ids = houseCats.map((houseCat) => houseCat.id)
  const shelf: HouseCatId[] = []
  for (let i = 0; i < seed % 5; i++) {
    const unused = ids.filter((id) => !shelf.includes(id))
    shelf.push(unused[(seed * (i + 7) + i * i) % unused.length])
  }
  return shelf
}

/** Seats a seed-dependent selection of Hand Cats in seed-dependent Seats. */
function seatSeeded(run: Run, seed: number) {
  let next = run
  run.night.hand.forEach((cat, i) => {
    const seat = (seed * (i + 5) + 2 * i) % (7 + (seed % 9))
    if (seat < 5) next = apply(next, { type: "place", cat, seat })
  })
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
    const [first, second, , third] = run.night.couch

    const { events } = accepted(run, { type: "play" })

    expect(events.slice(0, 4)).toEqual([
      {
        type: "catScored",
        seat: 0,
        cat: first,
        source: "seat",
        basePurr: 10,
        bonus: 5,
        purr: 15,
        mult: 0,
        multFrom: [],
        tally: { purr: 15, mult: 1 }
      },
      {
        type: "catScored",
        seat: 1,
        cat: second,
        source: "seat",
        basePurr: 10,
        bonus: 5,
        purr: 15,
        mult: 0,
        multFrom: [],
        tally: { purr: 30, mult: 1 }
      },
      {
        type: "catScored",
        seat: 3,
        cat: third,
        source: "seat",
        basePurr: 10,
        bonus: 15,
        purr: 25,
        mult: 0,
        multFrom: [],
        tally: { purr: 55, mult: 1 }
      },
      { type: "scoreTotal", purr: 55, mult: 1, score: 55, nightScore: 55 }
    ])
  })

  it("scripts a Night-clearing Play phase by phase, then its Treats and the Scrapbook", () => {
    const run = runWithCouch([
      "orange sleepy",
      "orange sleepy",
      "black sleepy",
      null,
      "white aloof"
    ])
    const [a, b, c, , d] = run.night.couch
    const scored = (seat: number, cat: string | null, bonus: number) => ({
      type: "catScored",
      seat,
      cat,
      source: "seat",
      basePurr: 10,
      bonus,
      purr: 10 + bonus,
      mult: 0,
      multFrom: []
    })

    const { run: after, events } = accepted(run, { type: "play" })

    expect(events).toEqual([
      {
        type: "gatheringActivated",
        gathering: "napClub",
        name: "Nap Club",
        level: 1,
        purr: 0,
        mult: 3,
        seats: [0, 1, 2],
        firstTime: true,
        tally: { purr: 0, mult: 4 }
      },
      { ...scored(0, a, 10), tally: { purr: 20, mult: 4 } },
      { ...scored(1, b, 10), tally: { purr: 40, mult: 4 } },
      { ...scored(2, c, 10), tally: { purr: 60, mult: 4 } },
      { ...scored(4, d, 15), tally: { purr: 85, mult: 4 } },
      {
        type: "scoreTotal",
        purr: 85,
        mult: 4,
        score: 340,
        nightScore: 340
      },
      { type: "nightCleared", score: 340 },
      {
        type: "treatsAwarded",
        forNight: 3,
        forUnusedPlays: 2,
        forHouseCats: [],
        treats: 5
      },
      { type: "scrapbookOpened", pages: after.scrapbookPages }
    ])
  })

  it("scripts events that add up to the Score, each tallying the Play so far", () => {
    const config = { ...defaultConfig, firstTarget: Number.POSITIVE_INFINITY }
    for (let seed = 1; seed <= 200; seed++) {
      let run: Run = { ...startRun(seed, config), shelf: seededShelf(seed) }
      for (let play = 0; play < run.config.playsPerNight; play++) {
        run = seatSeeded(run, seed + play)
        if (run.night.couch.every((cat) => cat === null)) break
        const { run: after, events } = accepted(run, { type: "play" })

        // Replays the phases (ADR-0001) from the events alone.
        let purr = 0
        let mult = 1
        let phase = 1
        let scoring: string | undefined
        for (const event of events) {
          if (
            event.type === "gatheringActivated" ||
            event.type === "wholePlayEffect"
          ) {
            expect(phase).toBe(1)
            mult += event.mult
          } else if (event.type === "catScored" || event.type === "repeat") {
            expect(phase).toBeLessThanOrEqual(2)
            phase = 2
            // A Cat's Repeats follow its Scoring event, each from a House Cat.
            if (event.type === "catScored") {
              expect(event.source).toBe("seat")
              scoring = event.cat
            } else {
              expect(event.cat).toBe(scoring)
              expect(run.shelf).toContain(event.source)
            }
            purr += event.purr
            mult += event.mult
            expect(
              event.multFrom.reduce((sum, from) => sum + from.mult, 0)
            ).toBe(event.mult)
          } else if (event.type === "houseCatWarmedUp") {
            expect(phase).toBeLessThanOrEqual(3)
            phase = 3
            continue
          } else if (event.type === "timesEffect") {
            expect(phase).toBeLessThanOrEqual(3)
            phase = 3
            mult *= event.times
          } else if (event.type === "scoreTotal") {
            phase = 4
            expect(event).toEqual({
              type: "scoreTotal",
              purr,
              mult,
              score: Math.floor(purr * mult),
              nightScore: run.night.score + event.score
            })
            expect(event.score).toBe(previewPlay(run).score)
            continue
          } else continue
          expect(event.tally).toEqual({ purr, mult })
        }
        expect(phase).toBe(4)
        run = after
      }
    }
  })

  it("totals the Night's Score so far with each Play", () => {
    const first = apply(runWithCouch(["aloof"]), { type: "play" })
    const second = seatFromHand(first, 1)

    const { events } = accepted(second, { type: "play" })

    expect(events).toContainEqual(
      expect.objectContaining({
        type: "scoreTotal",
        nightScore: 25 + previewPlay(second).score
      })
    )
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

  it("equals the preview for any seeded arrangement and Shelf, Play after Play", () => {
    // An unreachable Target keeps the Night, and its Score, open after the Play.
    const config = { ...defaultConfig, firstTarget: Number.POSITIVE_INFINITY }
    for (let seed = 1; seed <= 200; seed++) {
      let run: Run = { ...startRun(seed, config), shelf: seededShelf(seed) }
      for (let play = 0; play < run.config.playsPerNight; play++) {
        run = seatSeeded(run, seed * 3 + play)
        if (run.night.couch.every((cat) => cat === null)) break
        const preview = previewPlay(run)

        const result = accepted(run, { type: "play" })

        expect(result.run.night.score).toBe(run.night.score + preview.score)
        expect(result.events).toContainEqual({
          type: "scoreTotal",
          purr: preview.purr,
          mult: preview.mult,
          score: preview.score,
          nightScore: run.night.score + preview.score
        })
        run = result.run
      }
    }
  })
})

describe("the end of a Night", () => {
  it("clears the Night as soon as the summed Scores reach the Target", () => {
    const run = runWithCouch(["sleepy", "sleepy", "sleepy", "sleepy"], {
      config: { firstTarget: 320 }
    })

    const result = accepted(run, { type: "play" })

    expect(result.events).toContainEqual({ type: "nightCleared", score: 320 })
    expect(result.run.night.status).toBe("cleared")
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
    expect(result.run.status).toBe("lost")
    expect(result.events).toContainEqual({
      type: "nightLost",
      score: result.run.night.score
    })
  })

  it("rejects every action once the Night is lost", () => {
    const run = runWithCouch(["aloof"], { config: { playsPerNight: 1 } })
    const over = apply(run, { type: "play" })
    const cat = over.night.hand[0]

    expect(applyAction(over, { type: "place", cat, seat: 0 }).ok).toBe(false)
    expect(applyAction(over, { type: "play" }).ok).toBe(false)
  })
})
