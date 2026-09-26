import {
  type CatPose,
  catArt,
  type HouseCatPose,
  houseCatArt
} from "../art/manifest"
import {
  type Cat,
  type CatId,
  copying,
  type HouseCatId,
  houseCat,
  type Run,
  starCat
} from "../engine"

/**
 * The presentation model's staging: what the living room shows for a Run as
 * it stands, including a Couch still being arranged before a Play. Pure data
 * from Run state, so the scene only draws it and computes no layout, pose, or
 * facing itself.
 */

/** The rug's rows: the front row nearest the player, the back row behind it. */
export type RugRow = "front" | "back"

/** Where a Cat is: on a Seat of the Couch, or lounging at a position on the rug. */
export type Placement =
  | { on: "couch"; seat: number }
  | { on: "rug"; row: RugRow; position: number }

/** Which way a Cat turns; its art faces right, and is mirrored to face left. */
export type Facing = "left" | "right"

/** The eye colours a Cat may have, one each for good. */
export const eyeTints = ["gold", "green", "blue", "copper"] as const
export type EyeTint = (typeof eyeTints)[number]

export type StagedCat = {
  cat: CatId
  placement: Placement
  /** The art key of the pose it shows. */
  pose: string
  facing: Facing
  eyeTint: EyeTint
}

export type StagedHouseCat = {
  houseCat: HouseCatId
  /** The art key of the pose it shows. */
  pose: string
  /** What is written beneath it: its name, and whom a Copycat copies. */
  name: string
  /** What it has built up so far: Freya's ×, or The Void's growth. */
  state: string | null
  /** A Copycat with nothing to copy does nothing. */
  inert: boolean
}

export type Staging = {
  /** Every Cat in view: the seated Cats by Seat, then the rug's by position. */
  cats: StagedCat[]
  /** The Shelf's House Cats, in Shelf order. */
  houseCats: StagedHouseCat[]
}

/** How many Cats each rug row holds, so a full Hand fills both rows. */
export const rugPositions = (run: Run) => Math.ceil(run.config.handSize / 2)

/**
 * A Cat's eye tint, the same wherever it is and whatever happens to it: a
 * hash of its identity in this Run.
 */
export function eyeTint(run: Run, cat: CatId): EyeTint {
  let hash = 0x811c9dc5
  for (const char of `${run.seed}:${cat}`) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return eyeTints[(hash >>> 0) % eyeTints.length]
}

/**
 * The Couch's Cats in the order they were placed, earliest first, as the
 * Couch goes from `before` to `after`: Cats newly seated, or moved to another
 * Seat, count as placed last, left to right; Cats that left are forgotten.
 */
export function seatingOrder(
  order: readonly CatId[],
  before: readonly (CatId | null)[],
  after: readonly (CatId | null)[]
): CatId[] {
  const stayed = (cat: CatId) => before.indexOf(cat) === after.indexOf(cat)
  return [
    ...order.filter((cat) => after.includes(cat) && stayed(cat)),
    ...after.filter(
      (cat): cat is CatId =>
        cat !== null && !(order.includes(cat) && stayed(cat))
    )
  ]
}

/** A seated Cat's reaction to its Neighbors, and which way it turns. */
type Stance = { pose: CatPose; facing: Facing }

/** How a Cat looks: its pose, which way it faces, and its eyes. */
export type CatLook = Pick<StagedCat, "pose" | "facing" | "eyeTint">

/**
 * A Cat at rest, content and facing as drawn, as the rug and the Shop show
 * every Cat.
 */
export const atRest = (run: Run, cat: Cat): CatLook => ({
  pose: catArt(cat.coat, cat.personality, "content"),
  facing: "right",
  eyeTint: eyeTint(run, cat.id)
})

/**
 * A seated Cat's pose, from the same Neighbors its Personality bonus counts:
 * a Clingy Cat leans toward a Neighbor; an Aloof Cat is offended by one, and
 * turns away; a Sleepy Cat curls up facing a Sleepy Neighbor. With two to
 * choose from, it heeds the one placed most recently (the right-hand one, if
 * that is not known).
 */
function seatedPose(
  couch: readonly (Cat | null)[],
  seat: number,
  order: readonly CatId[]
): Stance {
  const cat = couch[seat]!
  const beside = (side: Facing) => couch[seat + (side === "left" ? -1 : 1)]
  const heeds = (neighbor: Cat | null | undefined) =>
    !!neighbor &&
    (cat.personality !== "sleepy" || neighbor.personality === "sleepy")
  const sides = (["left", "right"] as const).filter((side) =>
    heeds(beside(side))
  )
  if (sides.length === 0) return { pose: "content", facing: "right" }
  const placedAt = (side: Facing) => order.indexOf(beside(side)!.id)
  const toward =
    sides.length === 2 && placedAt("left") > placedAt("right")
      ? "left"
      : sides.at(-1)!
  const away: Facing = toward === "left" ? "right" : "left"
  return {
    pose: "reacting",
    facing: cat.personality === "aloof" ? away : toward
  }
}

/**
 * Stages the Run as it stands, given the order its seated Cats were placed in
 * (see `seatingOrder`).
 */
export function stage(run: Run, order: readonly CatId[] = []): Staging {
  const byId = new Map(run.roster.map((cat) => [cat.id, cat]))
  const couch = run.night.couch.map((id) => (id ? byId.get(id)! : null))
  const seated = (cat: Cat, seat: number): CatLook => {
    const { pose, facing } = seatedPose(couch, seat, order)
    return {
      pose: catArt(cat.coat, cat.personality, pose),
      facing,
      eyeTint: eyeTint(run, cat.id)
    }
  }
  return {
    cats: placed(run, run.night.couch).map(({ cat, placement }) => ({
      cat,
      placement,
      ...(placement.on === "couch"
        ? seated(byId.get(cat)!, placement.seat)
        : atRest(run, byId.get(cat)!))
    })),
    houseCats: stageShelf(run)
  }
}

/** A Cat curled up asleep, in its Coat's sleeping pose. */
const sleeping = (run: Run, cat: Cat): CatLook => ({
  pose: catArt(cat.coat, "sleepy", "content"),
  facing: "right",
  eyeTint: eyeTint(run, cat.id)
})

/**
 * Stages the Run once it is over, the household asleep: the last Play's
 * `couch` back on their Seats, the rest of the Hand on the rug, every Cat
 * curled up in its Coat's sleeping pose; all but the Cat `bedded`, once the
 * Results have carried it off to the cat bed.
 */
export function stageAsleep(
  run: Run,
  couch: readonly (CatId | null)[],
  bedded?: CatId
): Staging {
  const byId = new Map(run.roster.map((cat) => [cat.id, cat]))
  return {
    cats: placed(run, couch)
      .filter(({ cat }) => cat !== bedded)
      .map(({ cat, placement }) => ({
        cat,
        placement,
        ...sleeping(run, byId.get(cat)!)
      })),
    houseCats: stageShelf(run)
  }
}

/** A Cat in the Best Play's photo, content, as it was when it scored. */
export type PhotoSeat = CatLook & { cat: Cat }

/** How the household did, as the sleeping living room shows it. */
export type Results = {
  /** Written on the title sign, over how the Run ended. */
  title: string
  ending: string
  /** The Nights cleared, and the moon in the window showing them. */
  nights: { cleared: number; of: number; moon: number; label: string }
  /** The Best Play's photo on the wall, its Score and Night on the frame. */
  photo: {
    /** One per Seat; an empty Seat is empty in the photo too. */
    seats: (PhotoSeat | null)[]
    score: number
    night: number
    scoreLabel: string
    nightLabel: string
  } | null
  /** The Star Cat asleep in the cat bed, wearing its rosette, and its label. */
  bed: (CatLook & { cat: Cat; purr: number; label: string }) | null
  /** The House Cats asleep on the Shelf, by name, in Shelf order. */
  houseCats: string[]
}

/** A count as the Results write it, with thousands separators. */
const counted = (count: number) => count.toLocaleString("en-US")

/** The Results of a Run once it is over; none while it is still playing. */
export function stageResults(run: Run): Results | null {
  if (run.status === "playing") return null
  const won = run.status === "won"
  const { nightsCleared, bestPlay } = run.stats
  const { nights } = run.config
  const star = starCat(run)
  return {
    title: won ? "Sweet dreams!" : "Lights out",
    ending: won
      ? `Your household made it through all ${nights} Nights.`
      : `Your household fell asleep on Night ${run.night.number}.`,
    nights: {
      cleared: nightsCleared,
      of: nights,
      moon: Math.max(1, nightsCleared),
      label: `Nights cleared ${nightsCleared}/${nights}`
    },
    photo: bestPlay && {
      seats: bestPlay.couch.map((cat) => cat && { cat, ...atRest(run, cat) }),
      score: bestPlay.score,
      night: bestPlay.night,
      scoreLabel: counted(bestPlay.score),
      nightLabel: `Night ${bestPlay.night}`
    },
    bed: star
      ? {
          cat: star.cat,
          purr: star.purr,
          ...sleeping(run, star.cat),
          label: `Star Cat: ${star.cat.name}, ${counted(star.purr)} Purr`
        }
      : null,
    houseCats: run.shelf.map((id) => houseCat(id).name)
  }
}

/** Where each Cat in view is, with `couch`'s Cats on their Seats. */
function placed(run: Run, couch: readonly (CatId | null)[]) {
  const perRow = rugPositions(run)
  const seated = couch.flatMap((cat, seat) =>
    cat ? [{ cat, placement: { on: "couch", seat } as Placement }] : []
  )
  // The rest of the Hand lounges on the rug in Hand order, the front row
  // filling first and closing up behind any Cat that leaves it.
  const lounging = run.night.hand
    .filter((cat) => !couch.includes(cat))
    .map((cat, i) => ({
      cat,
      placement: {
        on: "rug",
        row: i < perRow ? "front" : "back",
        position: i % perRow
      } as Placement
    }))
  return [...seated, ...lounging]
}

/**
 * The × at which Freya reaches each stage of warming up, one per signature
 * pose; below the first she is reserved, as she starts each Night.
 */
export const FREYA_WARMS_AT = [1.5, 2, 2.5] as const

/** Freya as far as her × has warmed her up: reserved, or a warming stage. */
export function freyaPose(times: number): HouseCatPose {
  const stage = FREYA_WARMS_AT.filter((at) => times >= at).length
  return stage === 0 ? "idle" : `warming${stage}`
}

/**
 * The Shelf's House Cats at rest, each with what it has built up: Freya how
 * far she has warmed up tonight, shown in her pose too, and The Void how much
 * base Purr it has grown the Roster's Cats. A Copycat builds up whatever it
 * copies, but keeps its own pose.
 */
export function stageShelf(run: Run): StagedHouseCat[] {
  const copied = copying(run.shelf)
  const grown = run.roster.reduce(
    (sum, cat) => sum + Math.max(0, cat.basePurr - run.config.basePurr),
    0
  )
  return run.shelf.map((id, position) => {
    const acts = id === "copycat" ? copied[position] : id
    const { warmsUp, times, grows } = acts ? houseCat(acts) : {}
    // Warmed up by past Plays alone, since an empty Couch warms no one.
    const warmth = warmsUp && times?.([], run.night)
    return {
      houseCat: id,
      pose: houseCatArt(
        id,
        id === "freya" && warmth ? freyaPose(warmth) : "idle"
      ),
      name:
        id === "copycat" && acts
          ? `Copycat as ${houseCat(acts).name}`
          : houseCat(id).name,
      state: warmth ? `×${warmth.toFixed(1)}` : grows ? `+${grown} Purr` : null,
      inert: acts === null
    }
  })
}
