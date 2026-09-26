import { describe, expect, it } from "vitest"
import {
  type Action,
  applyAction,
  type Config,
  defaultConfig,
  gatherings,
  previewPlay,
  type Run,
  restoreRun,
  serialiseRun,
  startRun
} from "./index"
import { accepted, runWithCouch } from "./testing"

/** A Run in which every Play, however small, clears its Night. */
const easyRun = (seed = 1, config: Partial<Config> = {}) =>
  startRun(seed, { ...defaultConfig, basePurr: 1_000_000, ...config })

/** Plays the first Hand Cat alone; in an easy Run that clears the Night. */
function playOne(run: Run) {
  const cat = run.night.hand[0]
  return accepted(accepted(run, { type: "place", cat, seat: 0 }).run, {
    type: "play"
  })
}

/** An easy Run with its first Night cleared and the Scrapbook open. */
const choosing = (seed = 1) => playOne(easyRun(seed)).run

const allGatherings = gatherings.map((gathering) => gathering.id)

describe("the Scrapbook", () => {
  it("offers three different Gatherings once a Night is cleared, before the Shop", () => {
    const { run, events } = playOne(easyRun())

    const pages = run.scrapbookPages!
    expect(pages).toHaveLength(3)
    expect(new Set(pages).size).toBe(3)
    for (const page of pages) expect(allGatherings).toContain(page)
    expect(run.shop).toBeNull()
    expect(events).toContainEqual({ type: "scrapbookOpened", pages })
    expect(events).not.toContainEqual({ type: "shopOpened" })
  })

  it("is not open during a Night", () => {
    expect(startRun(1).scrapbookPages).toBeNull()
  })

  it("opens after every Night but the last", () => {
    let run = easyRun()
    const opened: number[] = []
    while (run.status === "playing") {
      run = playOne(run).run
      if (run.scrapbookPages) {
        opened.push(run.night.number)
        const gathering = run.scrapbookPages[0]
        run = accepted(run, { type: "choosePage", gathering }).run
        run = accepted(run, { type: "leaveShop" }).run
      }
    }

    expect(run.status).toBe("won")
    expect(run.scrapbookPages).toBeNull()
    expect(opened).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it("offers the same pages for the same seed", () => {
    expect(choosing(5).scrapbookPages).toEqual(choosing(5).scrapbookPages)
  })

  it("draws its pages from every Gathering, at random", () => {
    const offered = new Set<string>()
    const sets = new Set<string>()
    for (let seed = 1; seed <= 20; seed++) {
      const pages = choosing(seed).scrapbookPages!
      for (const page of pages) offered.add(page)
      sets.add([...pages].sort().join())
    }

    expect([...offered].sort()).toEqual([...allGatherings].sort())
    expect(sets.size).toBeGreaterThan(1)
  })
})

describe("choosing a Scrapbook page", () => {
  it("raises that Gathering's level by one, closes the Scrapbook, and opens the Shop", () => {
    const run = choosing()
    const gathering = run.scrapbookPages![1]

    const { run: after, events } = accepted(run, {
      type: "choosePage",
      gathering
    })

    expect(after.gatheringLevels[gathering]).toBe(2)
    for (const other of allGatherings.filter((id) => id !== gathering))
      expect(after.gatheringLevels[other]).toBe(1)
    expect(after.scrapbookPages).toBeNull()
    expect(after.shop).not.toBeNull()
    expect(events).toEqual([
      { type: "pageChosen", gathering, level: 2, discovered: true },
      { type: "shopOpened" }
    ])
  })

  it("keeps raising a Gathering's level, without limit", () => {
    const run = choosing()
    const [gathering] = run.scrapbookPages!
    const levelled = {
      ...run,
      gatheringLevels: { ...run.gatheringLevels, [gathering]: 12 }
    }

    const after = accepted(levelled, { type: "choosePage", gathering }).run

    expect(after.gatheringLevels[gathering]).toBe(13)
  })

  it("reveals a Gathering not yet discovered", () => {
    const run = choosing()
    const gathering = run.scrapbookPages!.find(
      (page) => !run.discoveredGatherings.includes(page)
    )!

    const after = accepted(run, { type: "choosePage", gathering }).run

    expect(after.discoveredGatherings).toEqual([
      ...run.discoveredGatherings,
      gathering
    ])
  })

  it("leaves a discovered Gathering discovered once", () => {
    const run = choosing()
    const [gathering] = run.scrapbookPages!
    const discovered = { ...run, discoveredGatherings: [gathering] }

    const { run: after, events } = accepted(discovered, {
      type: "choosePage",
      gathering
    })

    expect(after.discoveredGatherings).toEqual([gathering])
    expect(events[0]).toEqual({
      type: "pageChosen",
      gathering,
      level: 2,
      discovered: false
    })
  })

  it("is rejected for a Gathering that was not offered", () => {
    const run = choosing()
    const gathering = allGatherings.find(
      (id) => !run.scrapbookPages!.includes(id)
    )!

    const result = applyAction(run, { type: "choosePage", gathering })

    expect(result).toEqual({
      ok: false,
      run,
      reason: "That page is not offered"
    })
  })

  it("is rejected while the Scrapbook is closed", () => {
    const run = startRun(1)
    const inShop = accepted(choosing(), {
      type: "choosePage",
      gathering: choosing().scrapbookPages![0]
    }).run

    for (const closed of [run, inShop])
      expect(
        applyAction(closed, { type: "choosePage", gathering: "napClub" }).ok
      ).toBe(false)
  })

  it("is the only thing to do while the Scrapbook is open", () => {
    const run = { ...choosing(), treats: 50, shelf: ["boxGoblin" as const] }
    const cat = run.night.hand[0]
    const refused: Action[] = [
      { type: "place", cat, seat: 0 },
      { type: "play" },
      { type: "redraw", cats: [cat] },
      { type: "reorderShelf", houseCat: "boxGoblin", position: 0 },
      { type: "leaveShop" },
      { type: "reroll" },
      { type: "rehome", cat: run.roster[0].id },
      { type: "rehome", houseCat: "boxGoblin" }
    ]

    for (const action of refused)
      expect(applyAction(run, action)).toEqual({
        ok: false,
        run,
        reason: "Choose a Scrapbook page first"
      })
  })
})

describe("a Run saved mid-choice", () => {
  it("resumes with the same pages, and chooses as it would have", () => {
    const run = choosing(3)
    const gathering = run.scrapbookPages![2]

    const resumed = restoreRun(serialiseRun(run))!

    expect(resumed).toStrictEqual(run)
    expect(
      applyAction(resumed, { type: "choosePage", gathering })
    ).toStrictEqual(applyAction(run, { type: "choosePage", gathering }))
  })
})

describe("Gathering levels", () => {
  it("all start at 1", () => {
    expect(startRun(1).gatheringLevels).toEqual({
      cuddlePuddle: 1,
      napClub: 1,
      personalSpace: 1,
      varietyPack: 1,
      fullSofa: 1
    })
  })

  it("add each level's configured Purr and Mult once per Play, before any Cat scores", () => {
    // Nap Club at level 3 adds 3 + 2 × 2 Mult, and 2 × 10 Purr.
    const run = runWithCouch(
      ["orange sleepy", "black sleepy", "white sleepy"],
      {
        config: {
          gatheringLevelBonus: {
            ...defaultConfig.gatheringLevelBonus,
            napClub: { purr: 10, mult: 2 }
          }
        },
        gatheringLevels: { napClub: 3 }
      }
    )

    const breakdown = previewPlay(run)

    expect(breakdown.gatherings).toEqual([
      {
        gathering: "napClub",
        name: "Nap Club",
        level: 3,
        purr: 20,
        mult: 7,
        seats: [0, 1, 2]
      }
    ])
    // Three Sleepy Cats side by side each score 10 + 10.
    expect(breakdown.purr).toBe(20 + 60)
    expect(breakdown.mult).toBe(8)
    expect(breakdown.score).toBe(640)
  })

  it("add nothing at level 1 beyond the Gathering's Mult", () => {
    const run = runWithCouch(["orange sleepy", "black sleepy", "white sleepy"])

    expect(previewPlay(run).gatherings).toEqual([
      {
        gathering: "napClub",
        name: "Nap Club",
        level: 1,
        purr: 0,
        mult: 3,
        seats: [0, 1, 2]
      }
    ])
  })

  it("show in the Play's events, and the Play scores as previewed", () => {
    // A Cuddle Puddle that is also a Nap Club.
    const run = runWithCouch(
      ["orange sleepy", "orange sleepy", "orange sleepy"],
      {
        config: { copiesPerCombination: 3 },
        gatheringLevels: { cuddlePuddle: 2, napClub: 4 }
      }
    )
    const preview = previewPlay(run)
    const [puddle, club] = preview.gatherings

    const { events } = accepted(run, { type: "play" })

    const activated = events.filter((e) => e.type === "gatheringActivated")
    expect(activated).toEqual([
      expect.objectContaining({
        gathering: "cuddlePuddle",
        level: 2,
        purr: puddle.purr,
        mult: puddle.mult,
        tally: { purr: puddle.purr, mult: 1 + puddle.mult }
      }),
      expect.objectContaining({
        gathering: "napClub",
        level: 4,
        purr: club.purr,
        mult: club.mult,
        tally: {
          purr: puddle.purr + club.purr,
          mult: 1 + puddle.mult + club.mult
        }
      })
    ])
    expect(puddle.purr).toBeGreaterThan(0)
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "scoreTotal",
        purr: preview.purr,
        mult: preview.mult,
        score: preview.score
      })
    )
  })
})
