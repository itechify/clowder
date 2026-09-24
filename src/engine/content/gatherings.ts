import type { Cat } from "../types"

export type GatheringId =
  | "cuddlePuddle"
  | "napClub"
  | "personalSpace"
  | "varietyPack"
  | "fullSofa"

/** One entry per Seat, left to right; null is an empty Seat. */
type Couch = readonly (Cat | null)[]

export type Gathering = {
  id: GatheringId
  name: string
  mult: number
  /** The Seats forming this Gathering on the Couch; empty when it is absent. */
  seats: (couch: Couch) => number[]
}

/**
 * The Seats of every run of at least `length` consecutive occupied Seats whose
 * Cats all belong together.
 */
function runs(
  couch: Couch,
  length: number,
  together: (a: Cat, b: Cat) => boolean
): number[] {
  const seats: number[] = []
  let run: number[] = []
  const close = () => {
    if (run.length >= length) seats.push(...run)
    run = []
  }
  couch.forEach((cat, seat) => {
    const previous = couch[seat - 1]
    if (!cat || !previous || !together(previous, cat)) close()
    if (cat) run.push(seat)
  })
  close()
  return seats
}

const occupied = (couch: Couch) =>
  couch.flatMap((cat, seat) => (cat ? [seat] : []))

const sleepy = (cat: Cat) => cat.personality === "sleepy"

/** Every Gathering, each adding its Mult once to any Play that forms it. */
export const gatherings: readonly Gathering[] = [
  {
    id: "cuddlePuddle",
    name: "Cuddle Puddle",
    mult: 3,
    seats: (couch) => runs(couch, 3, (a, b) => a.coat === b.coat)
  },
  {
    id: "napClub",
    name: "Nap Club",
    mult: 3,
    seats: (couch) => runs(couch, 3, (a, b) => sleepy(a) && sleepy(b))
  },
  {
    id: "personalSpace",
    name: "Personal Space",
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
    mult: 3,
    seats: (couch) => {
      const coats = new Set(couch.map((cat) => cat?.coat).filter(Boolean))
      return coats.size >= 4 ? occupied(couch) : []
    }
  },
  {
    id: "fullSofa",
    name: "Full Sofa",
    mult: 1,
    seats: (couch) => {
      const seats = occupied(couch)
      return seats.length === couch.length ? seats : []
    }
  }
]
