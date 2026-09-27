import { describe, expect, it } from "vitest"
import { defaultConfig, previewPlay, type Run, startRun } from "../engine"
import { accepted, runWithCouch } from "../engine/testing"
import { clowderLabel, scrapbookChoice, scrapbookView } from "./scrapbook"

/** A Run with its first Night cleared and the Scrapbook open. */
function choosing(seed = 1): Run {
  const run = startRun(seed, { ...defaultConfig, basePurr: 1_000_000 })
  const cat = run.night.hand[0]
  const seated = accepted(run, { type: "place", cat, seat: 0 }).run
  return accepted(seated, { type: "play" }).run
}

describe("the Scrapbook choice", () => {
  it("shows nothing while the Scrapbook is closed", () => {
    expect(scrapbookChoice(startRun(1))).toBeNull()
  })

  it("shows each offered page's Clowder, requirement, and exact level change", () => {
    const run: Run = {
      ...choosing(),
      scrapbookPages: ["napClub", "fullSofa", "personalSpace"],
      clowderLevels: {
        ...choosing().clowderLevels,
        napClub: 2,
        personalSpace: 4
      }
    }

    expect(scrapbookChoice(run)).toEqual({
      title: "Choose a Scrapbook page",
      pages: [
        {
          clowder: "napClub",
          name: "Nap Club",
          requirement: "Three Sleepy Cats side by side",
          level: { from: 2, to: 3 },
          change: { purr: 10, mult: 1 },
          label: { levels: "Lv 2 → 3", adds: "+1 Mult +10 Purr" },
          action: { type: "choosePage", clowder: "napClub" }
        },
        {
          clowder: "fullSofa",
          name: "Full Sofa",
          requirement: "A Cat on every Seat",
          level: { from: 1, to: 2 },
          change: { purr: 5, mult: 1 },
          label: { levels: "Lv 1 → 2", adds: "+1 Mult +5 Purr" },
          action: { type: "choosePage", clowder: "fullSofa" }
        },
        {
          clowder: "personalSpace",
          name: "Personal Space",
          requirement: "Two or more Cats, none with a Neighbor",
          level: { from: 4, to: 5 },
          change: { purr: 5, mult: 1 },
          label: { levels: "Lv 4 → 5", adds: "+1 Mult +5 Purr" },
          action: { type: "choosePage", clowder: "personalSpace" }
        }
      ]
    })
  })

  it("takes each page's change from config, leaving out Purr it doesn't add", () => {
    const run = choosing()
    const [page] = run.scrapbookPages!
    const tuned: Run = {
      ...run,
      config: {
        ...run.config,
        clowderLevelBonus: {
          ...run.config.clowderLevelBonus,
          [page]: { purr: 0, mult: 3 }
        }
      }
    }

    expect(scrapbookChoice(tuned)!.pages[0]).toMatchObject({
      change: { purr: 0, mult: 3 },
      label: { levels: "Lv 1 → 2", adds: "+3 Mult" }
    })
  })

  it("offers actions the Run accepts", () => {
    const run = choosing()

    for (const page of scrapbookChoice(run)!.pages)
      expect(accepted(run, page.action).run.shop).not.toBeNull()
  })
})

describe("a Clowder's label", () => {
  it("names it with its level, leaving what it adds to the Scrapbook", () => {
    const run = runWithCouch(
      ["orange sleepy", "black sleepy", "white sleepy"],
      {
        clowderLevels: { napClub: 3 }
      }
    )

    const [napClub] = previewPlay(run).clowders

    expect(clowderLabel(napClub)).toBe("Nap Club Lv 3")
  })
})

describe("the Scrapbook", () => {
  it("lists every Clowder with its level and requirement, hiding undiscovered ones", () => {
    const run: Run = {
      ...startRun(1),
      discoveredClowders: ["fullSofa", "napClub"],
      clowderLevels: { ...startRun(1).clowderLevels, napClub: 3 }
    }

    expect(scrapbookView(run)).toEqual({
      title: "Scrapbook",
      entries: [
        { discovered: false, name: "???", requirement: "???" },
        {
          discovered: true,
          clowder: "napClub",
          name: "Nap Club",
          requirement: "Three Sleepy Cats side by side",
          level: 3,
          label: { level: "Lv 3", adds: "+5 Mult +20 Purr" }
        },
        { discovered: false, name: "???", requirement: "???" },
        { discovered: false, name: "???", requirement: "???" },
        {
          discovered: true,
          clowder: "fullSofa",
          name: "Full Sofa",
          requirement: "A Cat on every Seat",
          level: 1,
          label: { level: "Lv 1", adds: "+1 Mult" }
        }
      ]
    })
  })

  it("hides every Clowder at the start of a Run", () => {
    const { entries } = scrapbookView(startRun(1))

    expect(entries.map((entry) => entry.name)).toEqual([
      "???",
      "???",
      "???",
      "???",
      "???"
    ])
  })
})
