import { describe, expect, it } from "vitest"
import { startRun } from "./index"

describe("starting a Run", () => {
  it("builds a 30-Cat Roster with two of each Coat/Personality combination", () => {
    const run = startRun(1)

    expect(run.roster).toHaveLength(30)
    const combinations = new Map<string, number>()
    for (const cat of run.roster) {
      const key = `${cat.coat}/${cat.personality}`
      combinations.set(key, (combinations.get(key) ?? 0) + 1)
    }
    expect(combinations.size).toBe(15)
    expect([...combinations.values()].every((n) => n === 2)).toBe(true)
  })

  it("names every Cat individually", () => {
    const run = startRun(1)

    const names = run.roster.map((cat) => cat.name)
    expect(new Set(names).size).toBe(30)
    expect(names.every((name) => name.length > 0)).toBe(true)
  })

  it("gives every Cat 10 base Purr", () => {
    const run = startRun(1)

    expect(run.roster.every((cat) => cat.basePurr === 10)).toBe(true)
  })
})

describe("the start of a Night", () => {
  it("shuffles the whole Roster into the Draw pile and draws a Hand of 8", () => {
    const run = startRun(1)

    expect(run.night.hand).toHaveLength(8)
    expect(run.night.drawPile).toHaveLength(22)
    const drawn = [...run.night.hand, ...run.night.drawPile].sort()
    expect(drawn).toEqual(run.roster.map((cat) => cat.id).sort())
  })

  it("leaves the Couch empty", () => {
    const run = startRun(1)

    expect(run.night.couch).toEqual([null, null, null, null, null])
  })

  it("gives the same draws and names for the same seed", () => {
    const a = startRun(42)
    const b = startRun(42)

    expect(b.night.hand).toEqual(a.night.hand)
    expect(b.night.drawPile).toEqual(a.night.drawPile)
    expect(b.roster).toEqual(a.roster)
  })

  it("gives different draws for different seeds", () => {
    const a = startRun(1)
    const b = startRun(2)

    expect(b.night.hand).not.toEqual(a.night.hand)
  })

  it("starts Night 1 with a Target of 300 and three Plays", () => {
    const run = startRun(1)

    expect(run.night.number).toBe(1)
    expect(run.night.target).toBe(300)
    expect(run.night.playsLeft).toBe(3)
    expect(run.night.score).toBe(0)
    expect(run.night.status).toBe("playing")
  })
})
