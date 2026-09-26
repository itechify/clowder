import { houseCatArt } from "../art/manifest"
import {
  type Action,
  abilityOf,
  type Cat,
  type CatId,
  type Coat,
  coats,
  disasterById,
  type HouseCatId,
  houseCat,
  type Personality,
  personalities,
  type Run
} from "../engine"
import type { DisasterSign } from "./hud"
import { atRest, type CatLook } from "./staging"

/**
 * The presentation model's staging of the Shop: what the living room shows by
 * day, from Run state and what the player has open. Pure data, like the
 * living room's staging, so the Shop scene only draws it.
 */

/** A Coat and a Personality, such as Orange Clingy. */
export type Kind = { coat: Coat; personality: Personality }

/** Every Kind, by Coat then Personality. */
export const kinds: readonly Kind[] = coats.flatMap((coat) =>
  personalities.map((personality) => ({ coat, personality }))
)

/**
 * Where a Kind's pile sits in the household, set apart from the offers: its
 * cell in a grid with a column per Coat and a row per Personality, the same
 * at every Shop.
 */
export type PileSpot = { column: number; row: number }

/** A Kind's Cats in the Roster, lounging together. */
export type Pile = {
  kind: Kind
  spot: PileSpot
  count: number
  /** The Cat on top, whose eyes the pile shows. */
  cat: Cat
  /** Its Kind's content pose, facing as drawn. */
  look: CatLook
}

/** A Cat fanned out from its pile, to be picked out to Rehome. */
export type FannedCat = {
  cat: CatId
  name: string
  look: CatLook
  /** The base Purr The Void has grown it to, if it has; the same badge as on the rug. */
  grownTo: number | null
}

/** An opened pile's Cats, fanned out: they have names, so none is "one of the pile". */
export type Fan = { kind: Kind; cats: FannedCat[] }

/** Which Cat or House Cat a doorway spot holds. */
export type OfferId = { cat: CatId } | { houseCat: HouseCatId }

/**
 * What an offer's tag says: a Cat's name and Kind, or a House Cat's name,
 * any title it has, and its ability.
 */
export type OfferTag = { name: string; title: string | null; about: string }

/** An offer's tag, and what Adopting or Recruiting it takes: the action, and its Treat price. */
type Terms = { tag: OfferTag; action: Action; price: number }

/** An offer waiting in the doorway, to Adopt or Recruit. */
export type Offer =
  | ({ cat: Cat; look: CatLook } & Terms)
  | ({ houseCat: HouseCatId; pose: string } & Terms)

/**
 * A spot in the doorway, and whom it holds: the offer waiting there, or
 * nobody once that offer is taken.
 */
export type DoorwaySpot = { holds: OfferId; offer: Offer | null }

export type ShopStaging = {
  /** One pile per Kind in the Roster, in Kind order. */
  piles: Pile[]
  /** The opened pile, fanned out, while its Kind has Cats. */
  fan: Fan | null
  /** The offers waiting in the doorway, Cats then House Cats. */
  doorway: DoorwaySpot[]
  /** The Disaster the next Night brings, as the note on the wall names it. */
  disaster: DisasterSign | null
  /** The Night that falls on leaving, written beneath "Nightfall". */
  nightfall: string
}

/** Whether two Kinds, or a Cat's and a Kind, are the same. */
export const sameKind = (a: Kind, b: Kind) =>
  a.coat === b.coat && a.personality === b.personality

/** What the player has open in the Shop. */
export type ShopView = {
  /** The Kind whose pile is fanned out, if any. */
  opened?: Kind | null
  /** The doorway as last shown, so each offer keeps its spot. */
  doorway?: readonly DoorwaySpot[]
}

const capitalised = (word: string) => word[0].toUpperCase() + word.slice(1)

const sameOffer = (a: OfferId, b: OfferId) =>
  "cat" in a
    ? "cat" in b && a.cat === b.cat
    : "houseCat" in b && a.houseCat === b.houseCat

/**
 * Whom each doorway spot holds: the Shop's offers, Cats then House Cats,
 * each keeping its spot from `before` while it waits, so a taken one leaves
 * its spot empty; any new offer, as after a Reroll, lays them all out afresh.
 */
function doorwayHolds(run: Run, before: readonly DoorwaySpot[]): OfferId[] {
  const shop = run.shop
  if (!shop) return []
  const offered: OfferId[] = [
    ...shop.catOffers.map((cat) => ({ cat: cat.id })),
    ...shop.houseCatOffers.map((houseCat) => ({ houseCat }))
  ]
  const held = before.map((spot) => spot.holds)
  return offered.every((id) => held.some((was) => sameOffer(id, was)))
    ? held
    : offered
}

/** The offer a doorway spot holds, while it is still on offer. */
function offerFor(run: Run, id: OfferId): Offer | null {
  const shop = run.shop
  if (!shop) return null
  const prices = run.config.shop
  if ("cat" in id) {
    const cat = shop.catOffers.find((offer) => offer.id === id.cat)
    if (!cat) return null
    return {
      cat,
      look: atRest(run, cat),
      tag: {
        name: cat.name,
        title: null,
        about: `${capitalised(cat.coat)} ${capitalised(cat.personality)}`
      },
      action: { type: "adopt", cat: cat.id },
      price: prices.adoptPrice
    }
  }
  if (!shop.houseCatOffers.includes(id.houseCat)) return null
  const { name } = houseCat(id.houseCat)
  // A name with a title, like "Skadi (Belly Up)", gives the title its own line.
  const [called, title = null] = name.split(/ \((.*)\)$/)
  return {
    houseCat: id.houseCat,
    pose: houseCatArt(id.houseCat),
    tag: { name: called, title, about: abilityOf(id.houseCat, run.config) },
    action: { type: "recruit", houseCat: id.houseCat },
    price: prices.recruitPrices[id.houseCat]
  }
}

/**
 * Stages the open Shop: each Kind's pile in its cell of the household, the pile `opened`, if
 * any, fanned out, the offers in the doorway as last shown in `doorway`, and
 * the coming Night.
 */
export function stageShop(
  run: Run,
  { opened = null, doorway = [] }: ShopView = {}
): ShopStaging {
  const piles = kinds.flatMap((kind): Pile[] => {
    const cats = run.roster.filter((cat) => sameKind(cat, kind))
    if (cats.length === 0) return []
    const [cat] = cats
    return [
      {
        kind,
        spot: {
          column: coats.indexOf(kind.coat),
          row: personalities.indexOf(kind.personality)
        },
        count: cats.length,
        cat,
        look: atRest(run, cat)
      }
    ]
  })
  const nextDisaster = run.shop?.nextDisaster
  const next = nextDisaster ? disasterById(nextDisaster) : null
  const fanned = opened ? run.roster.filter((cat) => sameKind(cat, opened)) : []
  return {
    piles,
    fan:
      opened && fanned.length > 0
        ? {
            kind: opened,
            cats: fanned.map((cat) => ({
              cat: cat.id,
              name: cat.name,
              look: atRest(run, cat),
              grownTo:
                cat.basePurr === run.config.basePurr ? null : cat.basePurr
            }))
          }
        : null,
    doorway: doorwayHolds(run, doorway).map((holds) => ({
      holds,
      offer: offerFor(run, holds)
    })),
    disaster: next ? { name: next.name, rule: next.rule } : null,
    nightfall: `Night ${run.night.number + 1}/${run.config.nights}`
  }
}
