import { describe, expect, it } from "vitest"
import { defaultConfig, startRun } from "../engine"
import { accepted } from "../engine/testing"
import { stage } from "./staging"

describe("staging", () => {
  it("lays a fresh Night's eight Hand Cats across the rug's two rows, front row first", () => {
    const run = startRun(7)
    const [a, b, c, d, e, f, g, h] = run.night.hand

    expect(stage(run).cats).toEqual([
      { cat: a, placement: { on: "rug", row: "front", slot: 0 } },
      { cat: b, placement: { on: "rug", row: "front", slot: 1 } },
      { cat: c, placement: { on: "rug", row: "front", slot: 2 } },
      { cat: d, placement: { on: "rug", row: "front", slot: 3 } },
      { cat: e, placement: { on: "rug", row: "back", slot: 0 } },
      { cat: f, placement: { on: "rug", row: "back", slot: 1 } },
      { cat: g, placement: { on: "rug", row: "back", slot: 2 } },
      { cat: h, placement: { on: "rug", row: "back", slot: 3 } }
    ])
  })

  it("seats Cats on their Seats, empty Seats between them, while the rug closes up", () => {
    let run = startRun(7)
    const [a, b, c, d, e, f, g, h] = run.night.hand
    run = accepted(run, { type: "place", cat: b, seat: 0 }).run
    run = accepted(run, { type: "place", cat: e, seat: 2 }).run
    run = accepted(run, { type: "place", cat: f, seat: 4 }).run

    expect(stage(run).cats).toEqual([
      { cat: b, placement: { on: "couch", seat: 0 } },
      { cat: e, placement: { on: "couch", seat: 2 } },
      { cat: f, placement: { on: "couch", seat: 4 } },
      { cat: a, placement: { on: "rug", row: "front", slot: 0 } },
      { cat: c, placement: { on: "rug", row: "front", slot: 1 } },
      { cat: d, placement: { on: "rug", row: "front", slot: 2 } },
      { cat: g, placement: { on: "rug", row: "front", slot: 3 } },
      { cat: h, placement: { on: "rug", row: "back", slot: 0 } }
    ])
  })

  it("settles an unseated Cat back into its place on the rug", () => {
    let run = startRun(7)
    const [a, b] = run.night.hand
    run = accepted(run, { type: "place", cat: a, seat: 1 }).run
    run = accepted(run, { type: "place", cat: b, seat: 3 }).run
    run = accepted(run, { type: "unseat", cat: a }).run

    expect(stage(run).cats.find((staged) => staged.cat === a)).toEqual({
      cat: a,
      placement: { on: "rug", row: "front", slot: 0 }
    })
    expect(stage(run).cats.map((staged) => staged.placement)).toContainEqual({
      on: "couch",
      seat: 3
    })
  })

  it("lays a Cat drawn by a Redraw where the Cat it replaced lay", () => {
    let run = startRun(7)
    const [, b, , d] = run.night.hand
    run = accepted(run, { type: "place", cat: b, seat: 2 }).run
    run = accepted(run, { type: "redraw", cats: [d] }).run
    const drawn = run.night.hand[3]

    expect(stage(run).cats.find((staged) => staged.cat === drawn)).toEqual({
      cat: drawn,
      placement: { on: "rug", row: "front", slot: 2 }
    })
  })

  it("stages a Couch already played, as the household falls asleep on it", () => {
    let run = startRun(7)
    const [a, b, c] = run.night.hand
    run = accepted(run, { type: "place", cat: a, seat: 0 }).run
    run = accepted(run, { type: "place", cat: b, seat: 1 }).run
    const played = run.night.couch
    run = accepted(run, { type: "play" }).run

    const staged = stage(run, played).cats
    expect(staged.slice(0, 2)).toEqual([
      { cat: a, placement: { on: "couch", seat: 0 } },
      { cat: b, placement: { on: "couch", seat: 1 } }
    ])
    expect(staged.find((cat) => cat.cat === c)?.placement).toEqual({
      on: "rug",
      row: "front",
      slot: 0
    })
    expect(staged).toHaveLength(2 + run.night.hand.length)
  })

  it("keeps a smaller Hand to the front row", () => {
    const run = startRun(7, { ...defaultConfig, handSize: 6 })
    const [a, b, c, d] = run.night.hand

    expect(stage(run).cats.slice(0, 4)).toEqual([
      { cat: a, placement: { on: "rug", row: "front", slot: 0 } },
      { cat: b, placement: { on: "rug", row: "front", slot: 1 } },
      { cat: c, placement: { on: "rug", row: "front", slot: 2 } },
      { cat: d, placement: { on: "rug", row: "back", slot: 0 } }
    ])
  })
})
