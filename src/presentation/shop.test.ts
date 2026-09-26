import { describe, expect, it } from "vitest"
import {
  type Config,
  defaultConfig,
  disasterById,
  type Run,
  startRun
} from "../engine"
import { accepted } from "../engine/testing"
import { type DoorwaySpot, stageShop } from "./shop"

/**
 * A Run just into its first Shop, with Treats to spare: in a Run where any
 * Play clears its Night, the first Hand Cat is played alone.
 */
function inShop(seed = 1, config: Partial<Config> = {}): Run {
  const run = startRun(seed, {
    ...defaultConfig,
    basePurr: 1_000_000,
    ...config
  })
  const cat = run.night.hand[0]
  const seated = accepted(run, { type: "place", cat, seat: 0 }).run
  return { ...accepted(seated, { type: "play" }).run, treats: 50 }
}

describe("the doorway", () => {
  /** What waits in each doorway spot: a tagged name, or nothing. */
  const waiting = (spots: DoorwaySpot[]) =>
    spots.map(({ offer }) => offer?.tag.name ?? null)

  it("has the offered Cats then House Cats waiting, each tagged and priced", () => {
    const run = inShop()
    const { doorway } = stageShop(run)

    expect(doorway.map(({ offer }) => offer)).toMatchObject([
      {
        cat: { id: "cat-31" },
        tag: { name: "Inky", title: null, about: "Black Clingy" },
        action: { type: "adopt", cat: "cat-31" },
        price: 3
      },
      {
        cat: { id: "cat-32" },
        tag: { name: "Tofu", title: null, about: "White Clingy" },
        action: { type: "adopt", cat: "cat-32" },
        price: 3
      },
      {
        houseCat: "theVoid",
        pose: "houseCat/theVoid/idle",
        tag: {
          name: "The Void",
          title: null,
          about:
            "After a Play with a Gathering, its Black Cats gain +2 base Purr"
        },
        action: { type: "recruit", houseCat: "theVoid" },
        price: 6
      },
      {
        houseCat: "freya",
        tag: { name: "Freya", title: "Slow to Warm Up" },
        action: { type: "recruit", houseCat: "freya" },
        price: 7
      }
    ])
  })

  it("leaves an empty spot where a Cat was Adopted, the rest keeping theirs", () => {
    const run = inShop()
    const before = stageShop(run).doorway
    const adopted = accepted(run, { type: "adopt", cat: "cat-31" }).run

    expect(waiting(stageShop(adopted, { doorway: before }).doorway)).toEqual([
      null,
      "Tofu",
      "The Void",
      "Freya"
    ])
  })

  it("leaves an empty spot where a House Cat was Recruited", () => {
    const run = inShop()
    const before = stageShop(run).doorway
    const recruited = accepted(run, {
      type: "recruit",
      houseCat: "theVoid"
    }).run

    expect(waiting(stageShop(recruited, { doorway: before }).doorway)).toEqual([
      "Inky",
      "Tofu",
      null,
      "Freya"
    ])
  })

  it("keeps empty spots empty as more offers are taken", () => {
    const run = inShop()
    const first = stageShop(run).doorway
    const adopted = accepted(run, { type: "adopt", cat: "cat-32" }).run
    const second = stageShop(adopted, { doorway: first }).doorway
    const both = accepted(adopted, { type: "adopt", cat: "cat-31" }).run

    expect(waiting(stageShop(both, { doorway: second }).doorway)).toEqual([
      null,
      null,
      "The Void",
      "Freya"
    ])
  })

  it("replaces every offer on a Reroll, filling the spots taken ones left", () => {
    const run = inShop()
    const first = stageShop(run).doorway
    const adopted = accepted(run, { type: "adopt", cat: "cat-31" }).run
    const second = stageShop(adopted, { doorway: first }).doorway
    const rerolled = accepted(adopted, { type: "reroll" }).run
    const { doorway } = stageShop(rerolled, { doorway: second })

    const { shop } = rerolled
    expect(doorway.map(({ holds }) => holds)).toEqual([
      ...shop!.catOffers.map((cat) => ({ cat: cat.id })),
      ...shop!.houseCatOffers.map((houseCat) => ({ houseCat }))
    ])
    for (const { offer } of doorway) expect(offer).not.toBeNull()
  })
})

describe("an opened pile", () => {
  it("fans out exactly its Kind's Cats, by name", () => {
    const run = inShop()
    const grayAloof = run.roster.filter(
      (cat) => cat.coat === "gray" && cat.personality === "aloof"
    )
    const { fan } = stageShop(run, {
      opened: { coat: "gray", personality: "aloof" }
    })

    expect(fan?.kind).toEqual({ coat: "gray", personality: "aloof" })
    expect(fan?.cats.map(({ cat, name }) => ({ cat, name }))).toEqual(
      grayAloof.map((cat) => ({ cat: cat.id, name: cat.name }))
    )
  })

  it("is closed until a pile is opened", () => {
    expect(stageShop(inShop()).fan).toBeNull()
  })

  it("closes once its Kind has no Cats left", () => {
    let run = inShop(1, {
      shop: { ...defaultConfig.shop, catRehomesPerVisit: 2 }
    })
    const opened = { coat: "white", personality: "sleepy" } as const
    for (const { cat } of stageShop(run, { opened }).fan!.cats)
      run = accepted(run, { type: "rehome", cat }).run

    expect(stageShop(run, { opened }).fan).toBeNull()
  })

  it("wears the base Purr of a Cat The Void has grown, and nothing on the rest", () => {
    const run = inShop()
    const [grown, plain] = run.roster.filter(
      (cat) => cat.coat === "black" && cat.personality === "clingy"
    )
    const withGrowth: Run = {
      ...run,
      roster: run.roster.map((cat) =>
        cat === grown ? { ...cat, basePurr: cat.basePurr + 4 } : cat
      )
    }
    const { fan } = stageShop(withGrowth, {
      opened: { coat: "black", personality: "clingy" }
    })

    expect(fan?.cats.find(({ cat }) => cat === grown.id)?.grownTo).toBe(
      1_000_004
    )
    expect(fan?.cats.find(({ cat }) => cat === plain.id)?.grownTo).toBeNull()
  })
})

describe("the Shop's Kind piles", () => {
  it("piles each Kind in its own cell of the household's grid: Coats across, Personalities down", () => {
    const { piles } = stageShop(inShop())

    expect(
      piles.map(({ kind, spot, count }) => ({
        kind: `${kind.coat} ${kind.personality}`,
        spot,
        count
      }))
    ).toEqual([
      { kind: "orange clingy", spot: { column: 0, row: 0 }, count: 2 },
      { kind: "orange aloof", spot: { column: 0, row: 1 }, count: 2 },
      { kind: "orange sleepy", spot: { column: 0, row: 2 }, count: 2 },
      { kind: "black clingy", spot: { column: 1, row: 0 }, count: 2 },
      { kind: "black aloof", spot: { column: 1, row: 1 }, count: 2 },
      { kind: "black sleepy", spot: { column: 1, row: 2 }, count: 2 },
      { kind: "white clingy", spot: { column: 2, row: 0 }, count: 2 },
      { kind: "white aloof", spot: { column: 2, row: 1 }, count: 2 },
      { kind: "white sleepy", spot: { column: 2, row: 2 }, count: 2 },
      { kind: "gray clingy", spot: { column: 3, row: 0 }, count: 2 },
      { kind: "gray aloof", spot: { column: 3, row: 1 }, count: 2 },
      { kind: "gray sleepy", spot: { column: 3, row: 2 }, count: 2 },
      { kind: "calico clingy", spot: { column: 4, row: 0 }, count: 2 },
      { kind: "calico aloof", spot: { column: 4, row: 1 }, count: 2 },
      { kind: "calico sleepy", spot: { column: 4, row: 2 }, count: 2 }
    ])
  })

  it("leaves a Kind's spot empty once its last Cat is Rehomed, the others keeping theirs", () => {
    let run = inShop(1, {
      shop: { ...defaultConfig.shop, catRehomesPerVisit: 2 }
    })
    for (const cat of run.roster.filter(
      (cat) => cat.coat === "orange" && cat.personality === "sleepy"
    ))
      run = accepted(run, { type: "rehome", cat: cat.id }).run

    const { piles } = stageShop(run)
    expect(piles).toHaveLength(14)
    expect(piles.map((pile) => pile.spot)).not.toContainEqual({
      column: 0,
      row: 2
    })
    expect(piles[2]).toMatchObject({
      kind: { coat: "black", personality: "clingy" },
      spot: { column: 1, row: 0 }
    })
  })

  it("counts an Adopted Cat in its Kind's pile", () => {
    const run = inShop()
    const [offer] = run.shop!.catOffers
    const adopted = accepted(run, { type: "adopt", cat: offer.id }).run
    const pileOf = (run: Run) =>
      stageShop(run).piles.find(
        ({ kind }) =>
          kind.coat === offer.coat && kind.personality === offer.personality
      )!

    expect(pileOf(run).count).toBe(2)
    expect(pileOf(adopted).count).toBe(3)
  })

  it("shows each pile in its Kind's content pose", () => {
    for (const { kind, look } of stageShop(inShop()).piles)
      expect(look.pose).toBe(`cat/${kind.coat}/${kind.personality}/content`)
  })
})

/** Leaves the Shop and clears the next Night, into the Shop after it. */
function nextShop(run: Run): Run {
  const night = accepted(run, { type: "leaveShop" }).run
  const cat = night.night.hand[0]
  const seated = accepted(night, { type: "place", cat, seat: 0 }).run
  return accepted(seated, { type: "play" }).run
}

describe("the coming Night", () => {
  it("warns of a Disaster exactly when the next Night is one", () => {
    let run = inShop()
    const disasterNights = new Set(run.config.disasterNights)
    while (run.shop) {
      const { disaster } = stageShop(run)
      const next = run.night.number + 1
      if (disasterNights.has(next)) {
        const { name, rule } = disasterById(
          run.disasters[run.config.disasterNights.indexOf(next)]
        )
        expect(disaster, `Night ${next}`).toEqual({ name, rule })
      } else expect(disaster, `Night ${next}`).toBeNull()
      run = nextShop(run)
    }
  })

  it("names the Night that falls when the player leaves", () => {
    expect(stageShop(inShop()).nightfall).toBe("Night 2/9")
    expect(stageShop(nextShop(inShop())).nightfall).toBe("Night 3/9")
  })
})
