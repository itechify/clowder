import { describe, expect, it } from "vitest"
import { coats } from "./content/coats"
import { personalities } from "./content/personalities"
import {
  applyAction,
  type Config,
  defaultConfig,
  type Run,
  startRun
} from "./index"
import { accepted } from "./testing"

/** Plays the first Hand Cat alone; in an easy Run that clears the Night. */
const playOne = (run: Run) => {
  const cat = run.night.hand[0]
  const seated = accepted(run, { type: "place", cat, seat: 0 }).run
  return accepted(seated, { type: "play" })
}

/** A Run in which every Play, however small, clears its Night. */
const easyRun = (seed = 1, config: Partial<Config> = {}) =>
  startRun(seed, { ...defaultConfig, basePurr: 1_000_000, ...config })

describe("the Shop", () => {
  it("opens once a Night is cleared, before the next Night starts", () => {
    const { run, events } = playOne(easyRun())

    expect(run.shop).not.toBeNull()
    expect(run.night.number).toBe(1)
    expect(run.night.status).toBe("cleared")
    expect(events).toContainEqual({ type: "shopOpened" })
  })

  it("is not open during a Night", () => {
    expect(startRun(1).shop).toBeNull()
  })

  it("opens after every Night but the last", () => {
    let run = easyRun()
    const visits: number[] = []
    while (run.status === "playing") {
      run = playOne(run).run
      if (run.shop) {
        visits.push(run.night.number)
        run = accepted(run, { type: "leaveShop" }).run
      }
    }

    expect(run.status).toBe("won")
    expect(run.shop).toBeNull()
    expect(visits).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
})

describe("leaving the Shop", () => {
  it("starts the next Night with a fresh Hand of 8 and three Plays", () => {
    const shopping = playOne(easyRun()).run

    const { run, events } = accepted(shopping, { type: "leaveShop" })

    expect(run.shop).toBeNull()
    expect(run.night.number).toBe(2)
    expect(run.night.status).toBe("playing")
    expect(run.night.score).toBe(0)
    expect(run.night.playsLeft).toBe(3)
    expect(run.night.hand).toHaveLength(8)
    expect(run.night.drawPile).toHaveLength(22)
    expect(events).toEqual([{ type: "nightStarted", night: 2 }])
  })

  it("is rejected during a Night", () => {
    expect(applyAction(startRun(1), { type: "leaveShop" }).ok).toBe(false)
  })
})

describe("while the Shop is open", () => {
  it("rejects seating Cats and Playing", () => {
    const run = playOne(easyRun()).run
    const cat = run.night.hand[0]

    expect(applyAction(run, { type: "place", cat, seat: 0 }).ok).toBe(false)
    expect(applyAction(run, { type: "redraw", cats: [cat] }).ok).toBe(false)
    expect(applyAction(run, { type: "play" }).ok).toBe(false)
  })
})

describe("Cats offered for Adoption", () => {
  it("are two new, named Cats with standard stats", () => {
    const run = playOne(easyRun(1, { basePurr: 10, firstTarget: 10 })).run
    const offers = run.shop!.catOffers

    expect(offers).toHaveLength(2)
    for (const cat of offers) {
      expect(coats).toContain(cat.coat)
      expect(personalities).toContain(cat.personality)
      expect(cat.basePurr).toBe(10)
      expect(cat.name.length).toBeGreaterThan(0)
    }
    const names = [...run.roster, ...offers].map((cat) => cat.name)
    const ids = [...run.roster, ...offers].map((cat) => cat.id)
    expect(new Set(names).size).toBe(32)
    expect(new Set(ids).size).toBe(32)
  })

  it("are the same for the same seed and vary between seeds", () => {
    const offers = (seed: number) => playOne(easyRun(seed)).run.shop!.catOffers

    expect(offers(3)).toEqual(offers(3))
    const kinds = new Set(
      [1, 2, 3, 4, 5, 6].flatMap((seed) =>
        offers(seed).map((cat) => `${cat.coat} ${cat.personality}`)
      )
    )
    expect(kinds.size).toBeGreaterThan(3)
  })

  it("take their number from config", () => {
    const run = playOne(
      easyRun(1, { shop: { ...defaultConfig.shop, catOffers: 3 } })
    ).run

    expect(run.shop!.catOffers).toHaveLength(3)
  })
})

describe("Adopt", () => {
  it("adds an offered Cat to the Roster for 3 Treats", () => {
    const run = playOne(easyRun()).run
    expect(run.treats).toBe(5)
    const [offer, other] = run.shop!.catOffers

    const { run: after, events } = accepted(run, {
      type: "adopt",
      cat: offer.id
    })

    expect(after.roster).toHaveLength(31)
    expect(after.roster).toContainEqual(offer)
    expect(after.treats).toBe(2)
    expect(after.shop!.catOffers).toEqual([other])
    expect(events).toEqual([{ type: "catAdopted", cat: offer, price: 3 }])
  })

  it("is rejected when Treats are insufficient", () => {
    const run = playOne(easyRun()).run
    const [first, second] = run.shop!.catOffers
    const adopted = accepted(run, { type: "adopt", cat: first.id }).run

    const result = applyAction(adopted, { type: "adopt", cat: second.id })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(adopted)
  })

  it("is rejected for a Cat not on offer", () => {
    const run = playOne(easyRun()).run

    expect(applyAction(run, { type: "adopt", cat: run.roster[0].id }).ok).toBe(
      false
    )
    expect(applyAction(startRun(1), { type: "adopt", cat: "cat-31" }).ok).toBe(
      false
    )
  })

  it("puts the Cat in the next Night's Draw pile", () => {
    const run = playOne(easyRun()).run
    const offer = run.shop!.catOffers[0]
    const adopted = accepted(run, { type: "adopt", cat: offer.id }).run

    const next = accepted(adopted, { type: "leaveShop" }).run

    expect([...next.night.hand, ...next.night.drawPile].sort()).toEqual(
      next.roster.map((cat) => cat.id).sort()
    )
    expect(next.night.drawPile).toHaveLength(23)
  })

  it("takes its price from config", () => {
    const run = playOne(
      easyRun(1, { shop: { ...defaultConfig.shop, adoptPrice: 5 } })
    ).run

    const after = accepted(run, {
      type: "adopt",
      cat: run.shop!.catOffers[0].id
    }).run

    expect(after.treats).toBe(0)
  })
})

describe("Rehome", () => {
  it("removes a Cat from the Roster for 1 Treat", () => {
    const run = playOne(easyRun()).run
    const cat = run.roster[4]

    const { run: after, events } = accepted(run, {
      type: "rehome",
      cat: cat.id
    })

    expect(after.roster).toHaveLength(29)
    expect(after.roster).not.toContainEqual(cat)
    expect(after.treats).toBe(4)
    expect(events).toEqual([{ type: "catRehomed", cat, price: 1 }])
  })

  it("is allowed once per visit", () => {
    const run = playOne(easyRun()).run
    const rehomed = accepted(run, { type: "rehome", cat: run.roster[0].id }).run

    const again = applyAction(rehomed, {
      type: "rehome",
      cat: rehomed.roster[0].id
    })

    expect(again.ok).toBe(false)
    expect(again.run).toBe(rehomed)
  })

  it("is allowed again on the next visit", () => {
    let run = playOne(easyRun()).run
    run = accepted(run, { type: "rehome", cat: run.roster[0].id }).run
    run = playOne(accepted(run, { type: "leaveShop" }).run).run

    const after = accepted(run, { type: "rehome", cat: run.roster[0].id }).run

    expect(after.roster).toHaveLength(28)
  })

  it("keeps the Cat out of the next Night", () => {
    const run = playOne(easyRun()).run
    const cat = run.roster[0]
    const rehomed = accepted(run, { type: "rehome", cat: cat.id }).run

    const next = accepted(rehomed, { type: "leaveShop" }).run

    expect([...next.night.hand, ...next.night.drawPile]).not.toContain(cat.id)
    expect(next.night.drawPile).toHaveLength(21)
  })

  it("is rejected for a Cat not in the Roster", () => {
    const run = playOne(easyRun()).run

    expect(
      applyAction(run, { type: "rehome", cat: run.shop!.catOffers[0].id }).ok
    ).toBe(false)
  })

  it("is rejected when Treats are insufficient", () => {
    const run = playOne(
      easyRun(1, { shop: { ...defaultConfig.shop, rehomeCatPrice: 6 } })
    ).run

    expect(applyAction(run, { type: "rehome", cat: run.roster[0].id }).ok).toBe(
      false
    )
  })
})

describe("Reroll", () => {
  it("replaces the offers with new Cats", () => {
    const run = playOne(easyRun()).run
    const before = run.shop!.catOffers

    const { run: after, events } = accepted(run, { type: "reroll" })

    const offers = after.shop!.catOffers
    expect(offers).toHaveLength(2)
    for (const offer of offers)
      expect(before.map((cat) => cat.id)).not.toContain(offer.id)
    expect(events).toEqual([{ type: "offersRerolled", offers, price: 1 }])
  })

  it("refills an offer already Adopted", () => {
    let run = playOne(easyRun()).run
    run = accepted(run, { type: "adopt", cat: run.shop!.catOffers[0].id }).run

    expect(accepted(run, { type: "reroll" }).run.shop!.catOffers).toHaveLength(
      2
    )
  })

  it("costs 1 Treat, then 1 more for each Reroll this visit", () => {
    let run = playOne(easyRun()).run
    expect(run.shop!.rerollPrice).toBe(1)
    expect(run.treats).toBe(5)

    run = accepted(run, { type: "reroll" }).run
    expect(run.treats).toBe(4)
    expect(run.shop!.rerollPrice).toBe(2)

    run = accepted(run, { type: "reroll" }).run
    expect(run.treats).toBe(2)
    expect(run.shop!.rerollPrice).toBe(3)
  })

  it("is rejected when Treats are insufficient", () => {
    let run = playOne(easyRun()).run
    run = accepted(run, { type: "reroll" }).run
    run = accepted(run, { type: "reroll" }).run

    const result = applyAction(run, { type: "reroll" })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(run)
  })

  it("costs 1 again on the next visit", () => {
    let run = playOne(easyRun()).run
    run = accepted(run, { type: "reroll" }).run
    run = playOne(accepted(run, { type: "leaveShop" }).run).run

    expect(run.shop!.rerollPrice).toBe(1)
  })

  it("takes its prices from config", () => {
    let run = playOne(
      easyRun(1, {
        shop: { ...defaultConfig.shop, rerollPrice: 2, rerollPriceStep: 3 }
      })
    ).run
    run = accepted(run, { type: "reroll" }).run

    expect(run.treats).toBe(3)
    expect(run.shop!.rerollPrice).toBe(5)
  })

  it("gives the same offers for the same seed", () => {
    const reroll = () =>
      accepted(playOne(easyRun(9)).run, { type: "reroll" }).run.shop!.catOffers

    expect(reroll()).toEqual(reroll())
  })
})
