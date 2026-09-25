import { describe, expect, it } from "vitest"
import {
  applyAction,
  defaultConfig,
  type HouseCatId,
  previewPlay,
  type Run,
  startRun
} from "./index"
import { accepted, runWithCouch } from "./testing"

/** A Run in Night 1 with the given Shelf, as if Recruited on earlier visits. */
const withShelf = (shelf: HouseCatId[], run: Run = startRun(1)): Run => ({
  ...run,
  shelf
})

describe("Do Not Touch", () => {
  it("adds +2 Mult per empty Seat in the whole-Play phase", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange aloof", null, "black clingy"], {
        shelf: ["doNotTouch"]
      })
    )

    expect(breakdown.wholePlayEffects).toEqual([
      { houseCat: "doNotTouch", name: "Do Not Touch", mult: 6 }
    ])
    // 1, Personal Space +2, Do Not Touch +6 for three empty Seats.
    expect(breakdown.mult).toBe(9)
    expect(breakdown.purr).toBe(35)
    expect(breakdown.score).toBe(315)
  })
})

describe("Box Goblin", () => {
  it("multiplies Mult ×2 in the × phase when exactly three Cats are played", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange sleepy", "orange sleepy", "black sleepy"], {
        shelf: ["boxGoblin"]
      })
    )

    expect(breakdown.timesEffects).toEqual([
      { houseCat: "boxGoblin", name: "Box Goblin", times: 2 }
    ])
    // Nap Club: (1 + 3) × 2.
    expect(breakdown.mult).toBe(8)
    expect(breakdown.score).toBe(480)
  })

  it("does nothing with two or four Cats played", () => {
    for (const specs of [
      ["aloof", null, "aloof"],
      ["aloof", null, "aloof", "clingy", "clingy"]
    ] as const) {
      const breakdown = previewPlay(
        runWithCouch([...specs], { shelf: ["boxGoblin"] })
      )

      expect(breakdown.timesEffects).toEqual([])
    }
  })

  it("applies after whole-Play Mult, whatever the Shelf order", () => {
    const specs = ["aloof", null, "clingy", null, "aloof"] as const
    const score = (shelf: ("boxGoblin" | "doNotTouch")[]) =>
      previewPlay(runWithCouch([...specs], { shelf }))

    // (1 + Personal Space 2 + Do Not Touch 4) × 2.
    expect(score(["boxGoblin", "doNotTouch"]).mult).toBe(14)
    expect(score(["doNotTouch", "boxGoblin"]).mult).toBe(14)
  })
})

describe("a Play with House Cats", () => {
  it("scripts whole-Play effects after Gatherings and × effects after Scoring events", () => {
    const run = runWithCouch(["aloof", null, "clingy", null, "aloof"], {
      shelf: ["boxGoblin", "doNotTouch"]
    })

    const { events } = accepted(run, { type: "play" })

    expect(events.map((event) => event.type).slice(0, 7)).toEqual([
      "gatheringActivated",
      "wholePlayEffect",
      "catScored",
      "catScored",
      "catScored",
      "timesEffect",
      "scoreTotal"
    ])
    expect(events[1]).toEqual({
      type: "wholePlayEffect",
      houseCat: "doNotTouch",
      name: "Do Not Touch",
      mult: 4,
      tally: { purr: 0, mult: 7 }
    })
    expect(events[5]).toEqual({
      type: "timesEffect",
      houseCat: "boxGoblin",
      name: "Box Goblin",
      times: 2,
      tally: { purr: 60, mult: 14 }
    })
    expect(events[6]).toMatchObject({ purr: 60, mult: 14, score: 840 })
  })
})

describe("reordering the Shelf", () => {
  it("moves a House Cat to another slot during a Night", () => {
    const run = withShelf(["boxGoblin", "doNotTouch"])

    const { run: after, events } = accepted(run, {
      type: "reorderShelf",
      houseCat: "doNotTouch",
      slot: 0
    })

    expect(after.shelf).toEqual(["doNotTouch", "boxGoblin"])
    expect(after.night).toBe(run.night)
    expect(events).toEqual([
      { type: "shelfReordered", shelf: ["doNotTouch", "boxGoblin"] }
    ])
  })

  it("is allowed in the Shop, and the order lasts into the next Night", () => {
    const easy = startRun(1, { ...defaultConfig, basePurr: 1_000_000 })
    let run = withShelf(["boxGoblin", "doNotTouch"], easy)
    run = accepted(run, { type: "place", cat: run.night.hand[0], seat: 0 }).run
    run = accepted(run, { type: "play" }).run
    expect(run.shop).not.toBeNull()

    run = accepted(run, {
      type: "reorderShelf",
      houseCat: "boxGoblin",
      slot: 1
    }).run
    run = accepted(run, { type: "leaveShop" }).run

    expect(run.shelf).toEqual(["doNotTouch", "boxGoblin"])
  })

  it("is rejected for a House Cat not on the Shelf, or a slot beyond it", () => {
    const run = withShelf(["boxGoblin"])

    for (const action of [
      { type: "reorderShelf", houseCat: "doNotTouch", slot: 0 },
      { type: "reorderShelf", houseCat: "boxGoblin", slot: 1 },
      { type: "reorderShelf", houseCat: "boxGoblin", slot: -1 },
      { type: "reorderShelf", houseCat: "boxGoblin", slot: 0.5 }
    ] as const)
      expect(applyAction(run, action).ok).toBe(false)
  })

  it("is rejected once the Run is over", () => {
    const run: Run = {
      ...withShelf(["boxGoblin", "doNotTouch"]),
      status: "lost"
    }

    expect(
      applyAction(run, { type: "reorderShelf", houseCat: "boxGoblin", slot: 1 })
        .ok
    ).toBe(false)
  })
})
