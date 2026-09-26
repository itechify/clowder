import type { Cat, Couch } from "../types"

export type GatheringId =
  | "cuddlePuddle"
  | "napClub"
  | "personalSpace"
  | "varietyPack"
  | "fullSofa"

/** Purr and Mult a Gathering adds to a Play, or a Gathering level adds to it. */
export type GatheringBonus = { purr: number; mult: number }

export type Gathering = {
  id: GatheringId
  name: string
  /** What the Couch needs to form it, as the Scrapbook describes it. */
  requirement: string
  /** The Mult it adds at level 1. */
  mult: number
  /** The Seats forming this Gathering on the Couch; empty when it is absent. */
  seats: (couch: Couch) => number[]
}

/**
 * The Seats of every stretch of at least `length` consecutive occupied Seats
 * whose Cats all belong together.
 */
function stretches(
  couch: Couch,
  length: number,
  together: (a: Cat, b: Cat) => boolean
): number[] {
  const seats: number[] = []
  let stretch: number[] = []
  const close = () => {
    if (stretch.length >= length) seats.push(...stretch)
    stretch = []
  }
  couch.forEach((cat, seat) => {
    const previous = couch[seat - 1]
    if (!cat || !previous || !together(previous, cat)) close()
    if (cat) stretch.push(seat)
  })
  close()
  return seats
}

const occupied = (couch: Couch) =>
  couch.flatMap((cat, seat) => (cat ? [seat] : []))

const sleepy = (cat: Cat) => cat.personality === "sleepy"

/**
 * Every Gathering, each adding its Mult, and more with each Gathering level,
 * once to any Play that forms it.
 */
export const gatherings: readonly Gathering[] = [
  {
    id: "cuddlePuddle",
    name: "Cuddle Puddle",
    requirement: "Three Cats of one Coat side by side",
    mult: 3,
    seats: (couch) => stretches(couch, 3, (a, b) => a.coat === b.coat)
  },
  {
    id: "napClub",
    name: "Nap Club",
    requirement: "Three Sleepy Cats side by side",
    mult: 3,
    seats: (couch) => stretches(couch, 3, (a, b) => sleepy(a) && sleepy(b))
  },
  {
    id: "personalSpace",
    name: "Personal Space",
    requirement: "Two or more Cats, none with a Neighbor",
    mult: 2,
    seats: (couch) => {
      const seats = occupied(couch)
      const apart = seats.every((seat) => !seats.includes(seat + 1))
      return seats.length >= 2 && apart ? seats : []
    }
  },
  {
    id: "varietyPack",
    name: "Variety Pack",
    requirement: "Cats of four different Coats",
    mult: 3,
    seats: (couch) => {
      const coats = new Set(couch.map((cat) => cat?.coat).filter(Boolean))
      return coats.size >= 4 ? occupied(couch) : []
    }
  },
  {
    id: "fullSofa",
    name: "Full Sofa",
    requirement: "A Cat on every Seat",
    mult: 1,
    seats: (couch) => {
      const seats = occupied(couch)
      return seats.length === couch.length ? seats : []
    }
  }
]

export const gatheringById = (id: GatheringId): Gathering =>
  gatherings.find((gathering) => gathering.id === id)!
