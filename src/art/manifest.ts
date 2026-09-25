import {
  type Coat,
  coats,
  defaultConfig,
  type GatheringId,
  type HouseCatId,
  houseCats,
  type Personality,
  personalities
} from "../engine"

/**
 * Every image the game shows, addressed by key (ADR-0005). A delivered image
 * for a key is a PNG at `art/raw/<key>.png`; until one arrives, the game draws
 * the key's code-drawn fallback instead. Scenes ask for art only through the
 * key helpers below, so the manifest always covers what they show.
 */

/** Cats and House Cats share one square, transparent canvas... */
export const CHARACTER_CANVAS = 512
/**
 * ...and one scale: a character the game shows `size` across spans this many
 * pixels of it, so every Cat and House Cat sits at the same scale.
 */
export const CHARACTER_SPAN = 384
/**
 * Where a character sits (its base) on its canvas: bottom centre, with 64
 * pixels beneath for a tail dangling over the Shelf's edge.
 */
export const CHARACTER_BASE = { x: 0.5, y: 448 / CHARACTER_CANVAS }

/** The room, its furniture, and the UI are authored at 3× the 390×844 design size. */
export const ROOM_SCALE = 3

/** One moon phase in the window for each Night of a Run. */
export const MOON_PHASES = defaultConfig.nights
/** Freya warms up in stages, from reserved to affectionate. */
export const FREYA_STAGES = 3

/**
 * A pose turned to one side, like a reacting Cat's, faces the viewer's right;
 * the game mirrors it to face left.
 */
export type CatPose = "content" | "reacting"
export type HouseCatPose =
  | "idle"
  | "triggered"
  /** Skadi's signature pose, rolling over when Belly Up triggers. */
  | "bellyUp"
  /** Freya's signature poses, one per stage of warming up. */
  | `warming${number}`

export type RoomPiece =
  | "wall"
  | "window"
  | "moon"
  | "couch"
  | "rug"
  | "shelf"
  | "treatJar"
export type UiPiece = "playButton" | "redrawButton" | "pip"

type Size = { width: number; height: number }
/** A point on the canvas, as fractions of its width and height. */
type Anchor = { x: number; y: number }

type Subject =
  | { kind: "cat"; coat: Coat; personality: Personality; pose: CatPose }
  | { kind: "houseCat"; houseCat: HouseCatId; pose: HouseCatPose }
  | { kind: "badge"; coat: Coat }
  /** `phase` counts from 1, for the moon. */
  | { kind: "room"; piece: RoomPiece; phase?: number }
  /** `ready` for a button that can be pressed, or a pip still to spend. */
  | { kind: "ui"; piece: UiPiece; ready: boolean }
  /** `span` counts the Seats from its first to its last, where that varies. */
  | { kind: "gathering"; gathering: GatheringId; span?: number }

export type ArtEntry = Subject & {
  key: string
  /** The delivered image's size in pixels. */
  canvas: Size
  /** The point placed where a scene puts the image. */
  anchor: Anchor
}

export const catArt = (
  coat: Coat,
  personality: Personality,
  pose: CatPose = "content"
) => `cat/${coat}/${personality}/${pose}`

export const houseCatArt = (
  houseCat: HouseCatId,
  pose: HouseCatPose = "idle"
) => `houseCat/${houseCat}/${pose}`

/** The moon on Night `night`, waxing across the Run. */
export const moonArt = (night: number) =>
  `room/moon/${Math.min(Math.max(night, 1), MOON_PHASES)}`

/** Gatherings whose look stretches with the Seats they span. */
const spanning: Partial<Record<GatheringId, number>> = {
  cuddlePuddle: 3,
  varietyPack: 4
}

/**
 * A Gathering's overlay: a blanket over a Cuddle Puddle, bunting across a
 * Variety Pack, both as wide as the `span` of Seats they cover; Zs between
 * two Nap Club Cats; a bubble round one Cat with Personal Space; a glow round
 * a Full Sofa.
 */
export const gatheringArt = (gathering: GatheringId, span = 1) =>
  gathering in spanning
    ? `gathering/${gathering}/${span}`
    : `gathering/${gathering}`

export const art = {
  badge: (coat: Coat) => `badge/${coat}`,
  skadiBellyUp: houseCatArt("skadi", "bellyUp"),
  freyaWarming: (stage: number) => houseCatArt("freya", `warming${stage}`),
  room: {
    wall: "room/wall",
    window: "room/window",
    couch: "room/couch",
    rug: "room/rug",
    shelf: "room/shelf",
    treatJar: "room/treatJar"
  },
  playButton: (ready: boolean) =>
    `ui/playButton/${ready ? "ready" : "disabled"}`,
  redrawButton: (ready: boolean) =>
    `ui/redrawButton/${ready ? "ready" : "disabled"}`,
  pip: (full: boolean) => `ui/pip/${full ? "full" : "spent"}`
} as const

/** Seats on the Couch, 70 design pixels apart. */
const SEAT_SPACING = 70

/** A room piece `width` × `height` design pixels across. */
const room = (width: number, height: number, anchor: Anchor = centre) => ({
  canvas: { width: width * ROOM_SCALE, height: height * ROOM_SCALE },
  anchor
})
const centre = { x: 0.5, y: 0.5 }
const bottomCentre = { x: 0.5, y: 1 }
const topCentre = { x: 0.5, y: 0 }
const character = {
  canvas: { width: CHARACTER_CANVAS, height: CHARACTER_CANVAS },
  anchor: CHARACTER_BASE
}

function* entries(): Generator<ArtEntry> {
  for (const coat of coats)
    for (const personality of personalities)
      for (const pose of ["content", "reacting"] as const)
        yield {
          kind: "cat",
          coat,
          personality,
          pose,
          key: catArt(coat, personality, pose),
          ...character
        }
  for (const { id } of houseCats)
    for (const pose of ["idle", "triggered"] as const)
      yield {
        kind: "houseCat",
        houseCat: id,
        pose,
        key: houseCatArt(id, pose),
        ...character
      }
  yield {
    kind: "houseCat",
    houseCat: "skadi",
    pose: "bellyUp",
    key: art.skadiBellyUp,
    ...character
  }
  for (let stage = 1; stage <= FREYA_STAGES; stage++)
    yield {
      kind: "houseCat",
      houseCat: "freya",
      pose: `warming${stage}`,
      key: art.freyaWarming(stage),
      ...character
    }
  // A badge shares its Cat's scale, sitting on the Cat's flank.
  for (const coat of coats)
    yield {
      kind: "badge",
      coat,
      key: art.badge(coat),
      canvas: { width: 128, height: 128 },
      anchor: centre
    }

  yield {
    kind: "room",
    piece: "wall",
    key: art.room.wall,
    ...room(390, 844, { x: 0, y: 0 })
  }
  yield {
    kind: "room",
    piece: "window",
    key: art.room.window,
    ...room(172, 80)
  }
  for (let phase = 1; phase <= MOON_PHASES; phase++)
    yield {
      kind: "room",
      piece: "moon",
      phase,
      key: moonArt(phase),
      ...room(32, 32)
    }
  yield {
    kind: "room",
    piece: "couch",
    key: art.room.couch,
    ...room(390, 166, bottomCentre)
  }
  yield { kind: "room", piece: "rug", key: art.room.rug, ...room(350, 245) }
  yield {
    kind: "room",
    piece: "shelf",
    key: art.room.shelf,
    ...room(366, 24, topCentre)
  }
  yield {
    kind: "room",
    piece: "treatJar",
    key: art.room.treatJar,
    ...room(44, 52, bottomCentre)
  }

  for (const ready of [true, false]) {
    yield {
      kind: "ui",
      piece: "playButton",
      ready,
      key: art.playButton(ready),
      ...room(230, 58)
    }
    yield {
      kind: "ui",
      piece: "redrawButton",
      ready,
      key: art.redrawButton(ready),
      ...room(108, 58)
    }
    yield {
      kind: "ui",
      piece: "pip",
      ready,
      key: art.pip(ready),
      ...room(14, 14)
    }
  }

  const { seats } = defaultConfig
  for (let span = spanning.cuddlePuddle!; span <= seats; span++)
    yield {
      kind: "gathering",
      gathering: "cuddlePuddle",
      span,
      key: gatheringArt("cuddlePuddle", span),
      ...room(SEAT_SPACING * (span - 1) + 68, 18)
    }
  for (let span = spanning.varietyPack!; span <= seats; span++)
    yield {
      kind: "gathering",
      gathering: "varietyPack",
      span,
      key: gatheringArt("varietyPack", span),
      ...room(SEAT_SPACING * (span - 1) + 60, 14, topCentre)
    }
  yield {
    kind: "gathering",
    gathering: "napClub",
    key: gatheringArt("napClub"),
    ...room(42, 24)
  }
  yield {
    kind: "gathering",
    gathering: "personalSpace",
    key: gatheringArt("personalSpace"),
    ...room(68, 68)
  }
  yield {
    kind: "gathering",
    gathering: "fullSofa",
    key: gatheringArt("fullSofa"),
    ...room(390, 166)
  }
}

export const artManifest: readonly ArtEntry[] = [...entries()]

const byKey = new Map(artManifest.map((entry) => [entry.key, entry]))

export function artEntry(key: string): ArtEntry {
  const entry = byKey.get(key)
  if (!entry) throw new Error(`No art named ${key} in the manifest.`)
  return entry
}

/**
 * Cats, House Cats, and the Coat badges on Cats share the characters' scale,
 * sized by the scene; everything else is at the room's scale.
 */
export const sharesCharacterScale = (entry: ArtEntry) =>
  entry.kind === "cat" || entry.kind === "houseCat" || entry.kind === "badge"
