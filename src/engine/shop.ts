import type { ActionResult } from "./actions"
import type { Config } from "./config"
import { catNames } from "./content/catNames"
import { coats } from "./content/coats"
import { type HouseCatId, houseCats } from "./content/houseCats"
import { personalities } from "./content/personalities"
import { pick, shuffle } from "./rng"
import { startNight } from "./run"
import type { Cat, CatId, Run, Shop } from "./types"

export type ShopAction =
  | { type: "adopt"; cat: CatId }
  | { type: "recruit"; houseCat: HouseCatId }
  | { type: "rehome"; cat: CatId }
  | { type: "rehome"; houseCat: HouseCatId }
  | { type: "reroll" }
  | { type: "leaveShop" }

const shopActions = new Set<string>([
  "adopt",
  "recruit",
  "rehome",
  "reroll",
  "leaveShop"
] satisfies ShopAction["type"][])

export const isShopAction = (action: { type: string }): action is ShopAction =>
  shopActions.has(action.type)

/** What Rehoming a House Cat refunds: half its Recruit price, rounded down. */
export const rehomeRefund = (config: Config, houseCat: HouseCatId) =>
  Math.floor(config.shop.recruitPrices[houseCat] / 2)

/** Opens the Shop after a cleared Night, with fresh offers and prices. */
export function openShop(run: Run): Run {
  const [{ catOffers, houseCatOffers }, next] = newOffers(run)
  const shop: Shop = {
    catOffers,
    catRehomesLeft: run.config.shop.catRehomesPerVisit,
    houseCatOffers,
    rerollPrice: run.config.shop.rerollPrice
  }
  return { ...next, shop }
}

/** House Cats to offer for Recruitment, chosen from those not on the Shelf. */
function newHouseCatOffers(run: Run): [HouseCatId[], Run] {
  const unowned = houseCats
    .map((houseCat) => houseCat.id)
    .filter((id) => !run.shelf.includes(id))
  const [shuffled, rng] = shuffle(run.rng, unowned)
  return [shuffled.slice(0, run.config.shop.houseCatOffers), { ...run, rng }]
}

/** A full set of new offers: Cats to Adopt and House Cats to Recruit. */
function newOffers(
  run: Run
): [Pick<Shop, "catOffers" | "houseCatOffers">, Run] {
  const [catOffers, withCats] = newCatOffers(run)
  const [houseCatOffers, next] = newHouseCatOffers(withCats)
  return [{ catOffers, houseCatOffers }, next]
}

/** A full set of new Cats to offer for Adoption. */
function newCatOffers(run: Run): [Cat[], Run] {
  let next = run
  const offers: Cat[] = []
  for (let i = 0; i < run.config.shop.catOffers; i++) {
    const [cat, created] = newCat(next, offers)
    offers.push(cat)
    next = created
  }
  return [offers, next]
}

/**
 * A new Cat with standard stats and a random Coat and Personality, named
 * unlike any Cat in the Roster or already offered while names last.
 */
function newCat(run: Run, offered: Cat[]): [Cat, Run] {
  const [coat, afterCoat] = pick(run.rng, coats)
  const [personality, afterPersonality] = pick(afterCoat, personalities)
  const taken = new Set([...run.roster, ...offered].map((cat) => cat.name))
  const unused = catNames.filter((name) => !taken.has(name))
  const [name, rng] = pick(
    afterPersonality,
    unused.length > 0 ? unused : catNames
  )
  const catsCreated = run.catsCreated + 1
  return [
    {
      id: `cat-${catsCreated}`,
      name,
      coat,
      personality,
      basePurr: run.config.basePurr
    },
    { ...run, rng, catsCreated }
  ]
}

/** Applies an action in the open Shop; illegal ones leave the Run unchanged. */
export function applyShopAction(
  run: Run,
  shop: Shop,
  action: ShopAction
): ActionResult {
  const reject = (reason: string): ActionResult => ({ ok: false, run, reason })
  const { shop: prices } = run.config
  switch (action.type) {
    case "adopt": {
      const cat = shop.catOffers.find((offer) => offer.id === action.cat)
      if (!cat) return reject("That Cat is not on offer")
      if (run.treats < prices.adoptPrice) return reject("Not enough Treats")
      return {
        ok: true,
        run: {
          ...run,
          treats: run.treats - prices.adoptPrice,
          roster: [...run.roster, cat],
          shop: {
            ...shop,
            catOffers: shop.catOffers.filter((offer) => offer !== cat)
          }
        },
        events: [{ type: "catAdopted", cat, price: prices.adoptPrice }]
      }
    }
    case "recruit": {
      const { houseCat } = action
      if (!shop.houseCatOffers.includes(houseCat))
        return reject("That House Cat is not on offer")
      if (run.shelf.length >= run.config.shelfSize)
        return reject("The Shelf is full; Rehome a House Cat first")
      const price = prices.recruitPrices[houseCat]
      if (run.treats < price) return reject("Not enough Treats")
      return {
        ok: true,
        run: {
          ...run,
          treats: run.treats - price,
          shelf: [...run.shelf, houseCat],
          shop: {
            ...shop,
            houseCatOffers: shop.houseCatOffers.filter((id) => id !== houseCat)
          }
        },
        events: [{ type: "houseCatRecruited", houseCat, price }]
      }
    }
    case "rehome": {
      if ("houseCat" in action) {
        const { houseCat } = action
        if (!run.shelf.includes(houseCat))
          return reject("That House Cat is not on the Shelf")
        const refund = rehomeRefund(run.config, houseCat)
        return {
          ok: true,
          run: {
            ...run,
            treats: run.treats + refund,
            shelf: run.shelf.filter((id) => id !== houseCat)
          },
          events: [{ type: "houseCatRehomed", houseCat, refund }]
        }
      }
      const cat = run.roster.find((c) => c.id === action.cat)
      if (!cat) return reject("That Cat is not in the Roster")
      if (shop.catRehomesLeft === 0)
        return reject("A Cat has already been Rehomed this visit")
      if (run.treats < prices.rehomeCatPrice) return reject("Not enough Treats")
      return {
        ok: true,
        run: {
          ...run,
          treats: run.treats - prices.rehomeCatPrice,
          roster: run.roster.filter((c) => c !== cat),
          shop: { ...shop, catRehomesLeft: shop.catRehomesLeft - 1 }
        },
        events: [{ type: "catRehomed", cat, price: prices.rehomeCatPrice }]
      }
    }
    case "reroll": {
      const price = shop.rerollPrice
      if (run.treats < price) return reject("Not enough Treats")
      const [{ catOffers, houseCatOffers }, next] = newOffers(run)
      return {
        ok: true,
        run: {
          ...next,
          treats: run.treats - price,
          shop: {
            ...shop,
            catOffers,
            houseCatOffers,
            rerollPrice: price + prices.rerollPriceStep
          }
        },
        events: [{ type: "offersRerolled", catOffers, houseCatOffers, price }]
      }
    }
    case "leaveShop": {
      const next = startNight({ ...run, shop: null }, run.night.number + 1)
      return {
        ok: true,
        run: next,
        events: [{ type: "nightStarted", night: next.night.number }]
      }
    }
  }
}
