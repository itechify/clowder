import { describe, expect, it } from "vitest"
import { coats } from "./content/coats"
import { personalities } from "./content/personalities"
import {
  applyAction,
  type Config,
  defaultConfig,
  type HouseCatId,
  houseCats,
  type Run,
  startRun
} from "./index"
import { accepted } from "./testing"

/** Every House Cat's Recruit price set to `price`. */
const pricedAt = (price: number) =>
  Object.fromEntries(houseCats.map(({ id }) => [id, price])) as Record<
    HouseCatId,
    number
  >

/** House Cat Recruit prices, all `price`, in an otherwise default Shop. */
const shopPricedAt = (price: number) => ({
  ...defaultConfig.shop,
  recruitPrices: pricedAt(price)
})

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
    expect(events).toEqual([
      {
        type: "offersRerolled",
        catOffers: offers,
        houseCatOffers: after.shop!.houseCatOffers,
        price: 1
      }
    ])
  })

  it("offers every unowned House Cat again, but none on the Shelf", () => {
    const shop = {
      ...shopPricedAt(1),
      houseCatOffers: houseCats.length,
      rerollPrice: 0
    }
    let run = playOne(easyRun(1, { shop })).run
    const [kept, rehomed] = run.shop!.houseCatOffers
    run = accepted(run, { type: "recruit", houseCat: kept }).run
    run = accepted(run, { type: "recruit", houseCat: rehomed }).run
    run = accepted(run, { type: "rehome", houseCat: rehomed }).run
    expect(run.shop!.houseCatOffers).toHaveLength(houseCats.length - 2)

    const after = accepted(run, { type: "reroll" }).run

    expect([...after.shop!.houseCatOffers].sort()).toEqual(
      houseCats
        .map(({ id }) => id)
        .filter((id) => id !== kept)
        .sort()
    )
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

describe("House Cats offered to Recruit", () => {
  it("are two different House Cats", () => {
    const offers = playOne(easyRun()).run.shop!.houseCatOffers

    expect(offers).toHaveLength(2)
    expect(new Set(offers).size).toBe(2)
  })

  it("may be any of the nine House Cats", () => {
    const offered = new Set<HouseCatId>()
    for (let seed = 1; seed <= 50; seed++)
      for (const id of playOne(easyRun(seed)).run.shop!.houseCatOffers)
        offered.add(id)

    expect(offered.size).toBe(9)
  })
})

describe("Recruit", () => {
  it("places an offered House Cat on the Shelf for its price", () => {
    const run = playOne(easyRun(1, { shop: shopPricedAt(5) })).run
    expect(run.treats).toBe(5)
    const [recruited, other] = run.shop!.houseCatOffers

    const { run: after, events } = accepted(run, {
      type: "recruit",
      houseCat: recruited
    })

    expect(after.shelf).toEqual([recruited])
    expect(after.treats).toBe(0)
    expect(after.shop!.houseCatOffers).toEqual([other])
    expect(events).toEqual([
      { type: "houseCatRecruited", houseCat: recruited, price: 5 }
    ])
  })
  it("is rejected with a full Shelf", () => {
    const run = playOne(easyRun(1, { shelfSize: 1, shop: shopPricedAt(1) })).run
    const [first, second] = run.shop!.houseCatOffers
    const full = accepted(run, { type: "recruit", houseCat: first }).run

    const result = applyAction(full, { type: "recruit", houseCat: second })

    expect(result.ok).toBe(false)
    expect(result.run).toBe(full)
  })

  it("is rejected when Treats are insufficient", () => {
    const run = playOne(easyRun(1, { shop: shopPricedAt(6) })).run
    const [offer] = run.shop!.houseCatOffers

    expect(applyAction(run, { type: "recruit", houseCat: offer }).ok).toBe(
      false
    )
  })

  it("is rejected for a House Cat not on offer", () => {
    const run = playOne(easyRun(1, { shop: shopPricedAt(1) })).run
    const [offer] = run.shop!.houseCatOffers
    const recruited = accepted(run, { type: "recruit", houseCat: offer }).run

    expect(
      applyAction(recruited, { type: "recruit", houseCat: offer }).ok
    ).toBe(false)
    expect(
      applyAction(startRun(1), { type: "recruit", houseCat: offer }).ok
    ).toBe(false)
  })

  it("takes each House Cat's price from config", () => {
    const [first, second] = playOne(easyRun()).run.shop!.houseCatOffers
    const shop = {
      ...defaultConfig.shop,
      recruitPrices: { ...pricedAt(4), [first]: 2 }
    }
    const run = playOne(easyRun(1, { shop })).run

    expect(accepted(run, { type: "recruit", houseCat: first }).run.treats).toBe(
      3
    )
    expect(
      accepted(run, { type: "recruit", houseCat: second }).run.treats
    ).toBe(1)
  })

  it("keeps the House Cat on the Shelf, and out of the Shop, for the Run", () => {
    let run = playOne(easyRun(1, { shop: shopPricedAt(1) })).run
    const [recruited] = run.shop!.houseCatOffers
    run = accepted(run, { type: "recruit", houseCat: recruited }).run
    run = accepted(run, { type: "leaveShop" }).run
    expect(run.shelf).toEqual([recruited])

    for (let visit = 0; visit < 3; visit++) {
      run = playOne(run).run
      expect(run.shop!.houseCatOffers).not.toContain(recruited)
      run = accepted(run, { type: "reroll" }).run
      expect(run.shop!.houseCatOffers).not.toContain(recruited)
      run = accepted(run, { type: "leaveShop" }).run
    }
    expect(run.shelf).toEqual([recruited])
  })
})

describe("Rehoming a House Cat", () => {
  /** An odd price, to show the refund rounds down. */
  const oddPrices = shopPricedAt(3)

  it("removes it from the Shelf and refunds half its price, rounded down", () => {
    let run = playOne(easyRun(1, { shop: oddPrices })).run
    const [houseCat] = run.shop!.houseCatOffers
    run = accepted(run, { type: "recruit", houseCat }).run
    expect(run.treats).toBe(2)

    const { run: after, events } = accepted(run, { type: "rehome", houseCat })

    expect(after.shelf).toEqual([])
    expect(after.treats).toBe(3)
    expect(events).toEqual([{ type: "houseCatRehomed", houseCat, refund: 1 }])
  })

  it("is not limited like Rehoming a Cat", () => {
    let run = playOne(easyRun(1, { shop: oddPrices })).run
    const [houseCat] = run.shop!.houseCatOffers
    run = accepted(run, { type: "rehome", cat: run.roster[0].id }).run
    run = accepted(run, { type: "recruit", houseCat }).run

    const after = accepted(run, { type: "rehome", houseCat }).run

    expect(after.shelf).toEqual([])
    expect(after.treats).toBe(2)
  })

  it("is rejected for a House Cat not on the Shelf", () => {
    const run = playOne(easyRun()).run

    expect(
      applyAction(run, { type: "rehome", houseCat: "doNotTouch" }).ok
    ).toBe(false)
  })

  it("is rejected during a Night", () => {
    const run = { ...startRun(1), shelf: ["doNotTouch" as const] }

    expect(
      applyAction(run, { type: "rehome", houseCat: "doNotTouch" }).ok
    ).toBe(false)
  })
})
