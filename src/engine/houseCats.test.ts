import { describe, expect, it } from "vitest"
import {
  applyAction,
  copying,
  defaultConfig,
  type HouseCatId,
  previewPlay,
  type Run,
  startRun
} from "./index"
import { accepted, runWithCouch, seatFromHand } from "./testing"

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
    const breakdown = (shelf: HouseCatId[]) =>
      previewPlay(runWithCouch([...specs], { shelf }))

    // (1 + Personal Space 2 + Do Not Touch 4) × 2.
    expect(breakdown(["boxGoblin", "doNotTouch"]).mult).toBe(14)
    expect(breakdown(["doNotTouch", "boxGoblin"]).mult).toBe(14)
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
  it("moves a House Cat to another position during a Night", () => {
    const run = withShelf(["boxGoblin", "doNotTouch"])

    const { run: after, events } = accepted(run, {
      type: "reorderShelf",
      houseCat: "doNotTouch",
      position: 0
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
      position: 1
    }).run
    run = accepted(run, { type: "leaveShop" }).run

    expect(run.shelf).toEqual(["doNotTouch", "boxGoblin"])
  })

  it("is rejected for a House Cat not on the Shelf, or a position beyond it", () => {
    const run = withShelf(["boxGoblin"])

    for (const action of [
      { type: "reorderShelf", houseCat: "doNotTouch", position: 0 },
      { type: "reorderShelf", houseCat: "boxGoblin", position: 1 },
      { type: "reorderShelf", houseCat: "boxGoblin", position: -1 },
      { type: "reorderShelf", houseCat: "boxGoblin", position: 0.5 }
    ] as const)
      expect(applyAction(run, action).ok).toBe(false)
  })

  it("is rejected once the Run is over", () => {
    const run: Run = {
      ...withShelf(["boxGoblin", "doNotTouch"]),
      status: "lost"
    }

    expect(
      applyAction(run, {
        type: "reorderShelf",
        houseCat: "boxGoblin",
        position: 1
      }).ok
    ).toBe(false)
  })
})

describe("One Braincell, The Big Loaf, and Box Goblin", () => {
  it("score three Orange Sleepy Cats 120 Purr × ((7 + 12) × 2) = 4,560", () => {
    const breakdown = previewPlay(
      runWithCouch(["orange sleepy", "orange sleepy", "orange sleepy"], {
        shelf: ["oneBraincell", "bigLoaf", "boxGoblin"],
        config: { copiesPerCombination: 3 }
      })
    )

    // Each Cat scores 20 twice; each Scoring event adds +2 Mult.
    expect(breakdown.scoringEvents.map((event) => event.purr)).toEqual([
      20, 20, 20, 20, 20, 20
    ])
    expect(breakdown.purr).toBe(120)
    expect(breakdown.mult).toBe(38)
    expect(breakdown.score).toBe(4560)
  })
})

/** Each Cat's Scoring events, as the Seat and source of each. */
const scoredBy = (breakdown: ReturnType<typeof previewPlay>) =>
  breakdown.scoringEvents.map(({ seat, source }) => `${seat} ${source}`)

describe("Skadi (Belly Up)", () => {
  it("gives the Cats in Seats 1 and 5 one Repeat each", () => {
    const breakdown = previewPlay(
      runWithCouch(["clingy", "aloof", null, "aloof", "clingy"], {
        shelf: ["skadi"]
      })
    )

    expect(scoredBy(breakdown)).toEqual([
      "0 seat",
      "0 skadi",
      "1 seat",
      "3 seat",
      "4 seat",
      "4 skadi"
    ])
    // Each Repeat is complete, Personality bonus and all: 15 + 15 + 10 + 10 + 15 + 15.
    expect(breakdown.purr).toBe(80)
  })

  it("does nothing for empty end Seats", () => {
    const breakdown = previewPlay(
      runWithCouch([null, "aloof", null], { shelf: ["skadi"] })
    )

    expect(scoredBy(breakdown)).toEqual(["1 seat"])
  })
})

describe("Repeats", () => {
  it("stack across sources: The Big Loaf and Belly Up give an end-Seat Sleepy Cat 3 Scoring events", () => {
    const breakdown = previewPlay(
      runWithCouch(["sleepy", null, "aloof"], { shelf: ["bigLoaf", "skadi"] })
    )

    expect(scoredBy(breakdown)).toEqual([
      "0 seat",
      "0 bigLoaf",
      "0 skadi",
      "2 seat"
    ])
  })

  it("never cause another Repeat", () => {
    // Were Repeats to chain, each Repeat would earn the Sleepy end-Seat Cat more.
    const breakdown = previewPlay(
      runWithCouch(["sleepy", "sleepy", null, null, "sleepy"], {
        shelf: ["skadi", "bigLoaf"]
      })
    )

    expect(scoredBy(breakdown)).toEqual([
      "0 seat",
      "0 skadi",
      "0 bigLoaf",
      "1 seat",
      "1 bigLoaf",
      "4 seat",
      "4 skadi",
      "4 bigLoaf"
    ])
  })
})

describe("Copycat", () => {
  it("is a second Big Loaf when The Big Loaf sits to its left: 3 Scoring events", () => {
    const breakdown = previewPlay(
      runWithCouch([null, "sleepy", null], { shelf: ["bigLoaf", "copycat"] })
    )

    expect(scoredBy(breakdown)).toEqual(["1 seat", "1 bigLoaf", "1 copycat"])
  })

  it("copies the House Cat to its left, and only that one", () => {
    const run = runWithCouch(["aloof", null, "aloof", "clingy"], {
      shelf: ["boxGoblin", "copycat", "doNotTouch"]
    })

    const breakdown = previewPlay(run)

    expect(copying(run.shelf)).toEqual([null, "boxGoblin", null])
    expect(breakdown.wholePlayEffects).toEqual([
      { houseCat: "doNotTouch", name: "Do Not Touch", mult: 4 }
    ])
    expect(breakdown.timesEffects).toEqual([
      { houseCat: "boxGoblin", name: "Box Goblin", times: 2 },
      { houseCat: "copycat", name: "Copycat", times: 2 }
    ])
    expect(breakdown.mult).toBe(20)
  })

  it("does nothing with no House Cat to its left", () => {
    const run = runWithCouch(["aloof", null, "aloof", "clingy"], {
      shelf: ["copycat", "boxGoblin"]
    })

    const breakdown = previewPlay(run)

    expect(copying(run.shelf)).toEqual([null, null])
    expect(breakdown.timesEffects).toEqual([
      { houseCat: "boxGoblin", name: "Box Goblin", times: 2 }
    ])
  })

  it("copies whatever is to its left after the Shelf is reordered", () => {
    let run = runWithCouch(["sleepy", null, "orange aloof"], {
      shelf: ["bigLoaf", "oneBraincell", "copycat"]
    })
    expect(copying(run.shelf)).toEqual([null, null, "oneBraincell"])

    run = accepted(run, {
      type: "reorderShelf",
      houseCat: "copycat",
      position: 1
    }).run

    expect(copying(run.shelf)).toEqual([null, "bigLoaf", null])
    expect(scoredBy(previewPlay(run))).toEqual([
      "0 seat",
      "0 bigLoaf",
      "0 copycat",
      "2 seat"
    ])
  })
})

describe("Freya (Slow to Warm Up)", () => {
  /** A Run whose whole Roster is in Hand, with Freya on the Shelf. */
  const withFreya = (
    config: Partial<typeof defaultConfig> = {},
    shelf: HouseCatId[] = ["freya"]
  ) =>
    withShelf(
      shelf,
      startRun(1, {
        ...defaultConfig,
        handSize: 30,
        firstTarget: Number.POSITIVE_INFINITY,
        ...config
      })
    )
  const freya = (run: Run) =>
    previewPlay(run).timesEffects.find((effect) => effect.houseCat === "freya")
      ?.times

  it("starts the Night at ×1", () => {
    expect(freya(seatFromHand(withFreya(), ["clingy", "clingy"]))).toBe(1)
  })

  it("counts the current Play when an Aloof Cat scores with no Neighbors", () => {
    const run = seatFromHand(withFreya(), ["aloof", null, "clingy"])

    expect(freya(run)).toBe(1.5)
    expect(accepted(run, { type: "play" }).run.night.score).toBe(
      previewPlay(run).score
    )
  })

  it("gains +×0.5 for each Play that Night in which an Aloof Cat scored alone", () => {
    let run = withFreya({ playsPerNight: 4 })
    run = accepted(seatFromHand(run, ["aloof"]), { type: "play" }).run
    run = accepted(seatFromHand(run, ["clingy", "aloof"]), {
      type: "play"
    }).run
    expect(freya(seatFromHand(run, ["clingy"]))).toBe(1.5)

    // Two Aloof Cats alone in one Play count once.
    run = accepted(seatFromHand(run, ["aloof", null, "aloof"]), {
      type: "play"
    }).run

    expect(freya(seatFromHand(run, ["clingy"]))).toBe(2)
    expect(freya(seatFromHand(run, ["aloof"]))).toBe(2.5)
  })

  it("resets each Night", () => {
    // Any Play clears the first two Nights.
    let run = withFreya({ firstTarget: 1 })
    run = accepted(seatFromHand(run, ["aloof"]), { type: "play" }).run
    run = accepted(run, { type: "leaveShop" }).run

    expect(freya(seatFromHand(run, ["clingy"]))).toBe(1)
    expect(freya(seatFromHand(run, ["aloof"]))).toBe(1.5)
  })

  it("rounds the Score down once, after every × effect", () => {
    // 25 Purr × (1 × 1.5 × 1.5) = 56.25, where rounding each step would give 57.
    const run = seatFromHand(withFreya({}, ["freya", "copycat"]), ["aloof"])

    const breakdown = previewPlay(run)

    expect(breakdown.timesEffects).toEqual([
      { houseCat: "freya", name: "Freya (Slow to Warm Up)", times: 1.5 },
      { houseCat: "copycat", name: "Copycat", times: 1.5 }
    ])
    expect(breakdown.mult).toBe(2.25)
    expect(breakdown.score).toBe(56)
  })
})

describe("The Void", () => {
  /** A Run whose whole Roster is in Hand, where any Play clears the Night. */
  const withVoid = (shelf: HouseCatId[] = ["theVoid"], voidGrowth = 2) =>
    withShelf(
      shelf,
      startRun(1, {
        ...defaultConfig,
        handSize: 30,
        firstTarget: 1,
        houseCats: { voidGrowth }
      })
    )
  const basePurr = (run: Run, cat: string) =>
    run.roster.find((c) => c.id === cat)!.basePurr

  it("grows every played Black Cat +2 base Purr after a Play with a Gathering, from the next Play on", () => {
    // A Cuddle Puddle of three Black Cats, and one more Black Cat outside it.
    const run = seatFromHand(withVoid(), [
      "black clingy",
      "black aloof",
      "black sleepy",
      "orange aloof",
      "black clingy"
    ])
    const [cuddled, , , orange, apart] = run.night.couch

    const { run: after, events } = accepted(run, { type: "play" })

    // This Play scores them as they were.
    expect(
      previewPlay(run).scoringEvents.map((event) => event.basePurr)
    ).toEqual([10, 10, 10, 10, 10])
    expect(events).toContainEqual(
      expect.objectContaining({ type: "catGrew", cat: cuddled, basePurr: 12 })
    )
    expect(basePurr(after, cuddled!)).toBe(12)
    expect(basePurr(after, apart!)).toBe(12)
    expect(basePurr(after, orange!)).toBe(10)
  })

  it("grows them by the configured amount", () => {
    const run = seatFromHand(withVoid(["theVoid"], 5), [
      "black aloof",
      null,
      "black aloof"
    ])
    const [black] = run.night.couch

    const { run: after, events } = accepted(run, { type: "play" })

    expect(events).toContainEqual(
      expect.objectContaining({ type: "catGrew", purr: 5, basePurr: 15 })
    )
    expect(basePurr(after, black!)).toBe(15)
  })

  it("grows nobody after a Play without a Gathering", () => {
    const run = seatFromHand(withVoid(), ["black clingy", "white clingy"])
    const [black] = run.night.couch

    const { run: after, events } = accepted(run, { type: "play" })

    expect(basePurr(after, black!)).toBe(10)
    expect(events.map((event) => event.type)).not.toContain("catGrew")
  })

  it("keeps each grown Cat's base Purr across Nights, and grows it again", () => {
    // Personal Space, with two Black Cats apart.
    let run = seatFromHand(withVoid(), ["black aloof", null, "black aloof"])
    const [black] = run.night.couch
    run = accepted(run, { type: "play" }).run
    run = accepted(run, { type: "leaveShop" }).run

    run = accepted(run, { type: "place", cat: black!, seat: 0 }).run
    run = accepted(run, {
      type: "place",
      cat: run.night.hand.find((id) => id !== black)!,
      seat: 2
    }).run
    expect(previewPlay(run).scoringEvents[0]).toMatchObject({
      basePurr: 12,
      purr: 27
    })
    run = accepted(run, { type: "play" }).run
    run = accepted(run, { type: "leaveShop" }).run

    expect(basePurr(run, black!)).toBe(14)
  })

  it("grows Black Cats twice with a Copycat copying it", () => {
    const run = seatFromHand(withVoid(["theVoid", "copycat"]), [
      "black aloof",
      null,
      "white aloof"
    ])
    const [black] = run.night.couch

    const after = accepted(run, { type: "play" }).run

    expect(basePurr(after, black!)).toBe(14)
  })
})

describe("Treat Dealer", () => {
  /** Night 1, where any Play clears it, with the given Shelf. */
  const easy = (shelf: HouseCatId[]) =>
    withShelf(shelf, startRun(1, { ...defaultConfig, firstTarget: 1 }))
  const playOne = (run: Run) =>
    accepted(
      accepted(run, { type: "place", cat: run.night.hand[0], seat: 0 }).run,
      { type: "play" }
    )

  it("pays +1 Treat per unused Redraw when a Night is cleared", () => {
    let run = easy(["treatDealer"])
    run = accepted(run, { type: "redraw", cats: [run.night.hand[0]] }).run

    const { run: after, events } = playOne(run)

    // 3 for Night 1, 2 for unused Plays, 1 for the unused Redraw.
    expect(events).toContainEqual({
      type: "treatsAwarded",
      forNight: 3,
      forUnusedPlays: 2,
      forHouseCats: [
        { houseCat: "treatDealer", name: "Treat Dealer", treats: 1 }
      ],
      treats: 6
    })
    expect(after.treats).toBe(6)
  })

  it("pays nothing with no Redraws left", () => {
    let run = easy(["treatDealer"])
    for (const _ of [1, 2])
      run = accepted(run, { type: "redraw", cats: [run.night.hand[0]] }).run

    const { run: after, events } = playOne(run)

    expect(events).toContainEqual(
      expect.objectContaining({ type: "treatsAwarded", forHouseCats: [] })
    )
    expect(after.treats).toBe(5)
  })

  it("pays twice with a Copycat copying it", () => {
    const { run: after } = playOne(easy(["treatDealer", "copycat"]))

    expect(after.treats).toBe(3 + 2 + 2 * 2)
  })
})

describe("a Play with the remaining House Cats", () => {
  it("scripts Repeats with their source, per-score Mult, Freya warming up, then Void growth", () => {
    const run = runWithCouch(["orange sleepy", null, "black aloof"], {
      shelf: ["bigLoaf", "oneBraincell", "freya", "theVoid"],
      config: { houseCats: { voidGrowth: 2 } }
    })
    const [orange, , black] = run.night.couch
    const braincell = {
      houseCat: "oneBraincell",
      name: "One Braincell",
      mult: 2
    }

    const { events } = accepted(run, { type: "play" })

    expect(events.slice(0, 8)).toEqual([
      expect.objectContaining({
        type: "gatheringActivated",
        gathering: "personalSpace"
      }),
      expect.objectContaining({
        type: "catScored",
        cat: orange,
        source: "seat",
        purr: 10,
        mult: 2,
        multFrom: [braincell],
        tally: { purr: 10, mult: 5 }
      }),
      expect.objectContaining({
        type: "repeat",
        cat: orange,
        source: "bigLoaf",
        purr: 10,
        mult: 2,
        multFrom: [braincell],
        tally: { purr: 20, mult: 7 }
      }),
      expect.objectContaining({
        type: "catScored",
        cat: black,
        purr: 25,
        mult: 0,
        tally: { purr: 45, mult: 7 }
      }),
      {
        type: "houseCatWarmedUp",
        houseCat: "freya",
        name: "Freya (Slow to Warm Up)",
        times: 1.5
      },
      expect.objectContaining({
        type: "timesEffect",
        houseCat: "freya",
        times: 1.5,
        tally: { purr: 45, mult: 10.5 }
      }),
      { type: "scoreTotal", purr: 45, mult: 10.5, score: 472, nightScore: 472 },
      {
        type: "catGrew",
        seat: 2,
        cat: black,
        houseCat: "theVoid",
        name: "The Void",
        purr: 2,
        basePurr: 12
      }
    ])
  })
})
