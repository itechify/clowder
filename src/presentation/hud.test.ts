import { describe, expect, it } from "vitest"
import { disasterById, startRun } from "../engine"
import { startNight } from "../engine/run"
import { accepted } from "../engine/testing"
import { hud, purrMeter } from "./hud"

/** The Run on its `number`th Night, as a fresh household would meet it. */
const onNight = (number: number, seed = 7) => startNight(startRun(seed), number)

describe("the HUD", () => {
  it("shows a fresh Run's first Night in full", () => {
    expect(hud(startRun(7))).toEqual({
      night: { moon: 1, label: "Night 1/9" },
      treats: 0,
      meter: { filled: 0, label: "0 / 300" },
      plays: { left: 3, of: 3 },
      redraws: { left: 2, of: 2 },
      drawPile: 22,
      disaster: null
    })
  })

  it("waxes the moon with the Night", () => {
    const later = onNight(5)
    expect(hud(later).night).toEqual({
      moon: 5,
      label: `Night 5/${later.config.nights}`
    })
  })

  it("spends a pip for each Play and Redraw used, keeping the rest", () => {
    let run = startRun(7)
    const [a, b] = run.night.hand
    run = accepted(run, { type: "redraw", cats: [a] }).run
    run = accepted(run, { type: "place", cat: b, seat: 0 }).run
    run = accepted(run, { type: "play" }).run

    expect(hud(run)).toMatchObject({
      plays: { left: 2, of: 3 },
      redraws: { left: 1, of: 2 }
    })
    expect(hud(run).meter.label).toBe(`${run.night.score} / 300`)
    // A played Cat and a Redrawn one are gone from the Draw pile's count too.
    expect(hud(run).drawPile).toBe(run.night.drawPile.length)
  })

  it("counts the Treats in the jar", () => {
    const run = { ...startRun(7), treats: 12 }
    expect(hud(run).treats).toBe(12)
  })

  it("names tonight's Disaster and the rule it changes, throughout its Night", () => {
    const run = onNight(3)
    const disaster = disasterById(run.night.disaster!)

    expect(hud(run).disaster).toEqual({
      name: disaster.name,
      rule: disaster.rule
    })
  })

  it("gives a Disaster Night only the pips its rules allow", () => {
    // Each seed meets the Disasters in its own order; find one of each.
    const nightWith = (id: string) => {
      for (let seed = 1; ; seed++) {
        const run = onNight(3, seed)
        if (run.night.disaster === id) return run
      }
    }
    expect(hud(nightWith("humanWakesUp")).plays).toEqual({ left: 2, of: 2 })
    expect(hud(nightWith("doorbell")).redraws).toEqual({ left: 1, of: 1 })
  })
})

describe("the purr meter", () => {
  it("fills toward the Target, showing the exact Score", () => {
    expect(purrMeter(75, 300)).toEqual({ filled: 0.25, label: "75 / 300" })
  })

  it("stays full past the Target, still counting", () => {
    expect(purrMeter(4560, 300)).toEqual({ filled: 1, label: "4560 / 300" })
  })
})
