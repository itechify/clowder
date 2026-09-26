import { describe, expect, it } from "vitest"
import {
  coats,
  defaultConfig,
  type GatheringId,
  houseCats,
  personalities
} from "../engine"
import {
  art,
  artEntry,
  artManifest,
  CHARACTER_CANVAS,
  catArt,
  gatheringArt,
  houseCatArt,
  moonArt,
  ROOM_SCALE
} from "./manifest"

const gatheringIds: GatheringId[] = [
  "cuddlePuddle",
  "napClub",
  "personalSpace",
  "varietyPack",
  "fullSofa"
]

/** Every key a scene can ask for, through every way it has of asking. */
function requestable(): string[] {
  const keys: string[] = []
  for (const coat of coats) {
    keys.push(art.badge(coat))
    for (const personality of personalities)
      for (const pose of ["content", "reacting"] as const)
        keys.push(catArt(coat, personality, pose))
  }
  for (const { id } of houseCats)
    for (const pose of ["idle", "triggered"] as const)
      keys.push(houseCatArt(id, pose))
  keys.push(art.skadiBellyUp)
  for (const stage of [1, 2, 3]) keys.push(art.freyaWarming(stage))
  for (let night = 1; night <= defaultConfig.nights; night++)
    keys.push(moonArt(night))
  keys.push(...Object.values(art.room))
  for (const ready of [true, false])
    keys.push(art.playButton(ready), art.redrawButton(ready))
  for (const full of [true, false])
    keys.push(art.pip(full), art.purrMeter(full))
  // A Gathering spans between its first and last Seats; each forms only
  // across so many Seats (see src/engine/content/gatherings.ts).
  const fewest: Record<GatheringId, number> = {
    cuddlePuddle: 3,
    napClub: 2,
    personalSpace: 1,
    varietyPack: 4,
    fullSofa: defaultConfig.seats
  }
  for (const gathering of gatheringIds)
    for (let span = fewest[gathering]; span <= defaultConfig.seats; span++)
      keys.push(gatheringArt(gathering, span))
  return keys
}

describe("the art manifest", () => {
  it("lists every key the scenes can request", () => {
    const listed = new Set(artManifest.map((entry) => entry.key))
    const missing = requestable().filter((key) => !listed.has(key))
    expect(missing).toEqual([])
  })

  it("lists each key once", () => {
    const keys = artManifest.map((entry) => entry.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("names the milestone's images", () => {
    const count = (kind: string) =>
      artManifest.filter((entry) => entry.kind === kind).length
    // 15 Coat/Personality combinations, each content and reacting.
    expect(count("cat")).toBe(30)
    // 9 House Cats idle and triggered, Skadi belly-up, Freya's 3 stages.
    expect(count("houseCat")).toBe(18 + 1 + 3)
    expect(count("badge")).toBe(5)
    expect(
      artManifest
        .filter((entry) => entry.kind === "room")
        .map((entry) => entry.key)
    ).toEqual(
      expect.arrayContaining([
        "room/wall",
        "room/window",
        "room/couch",
        "room/seatPad",
        "room/rug",
        "room/shelf",
        "room/treatJar",
        "room/disasterSign",
        "room/titleSign",
        "room/photoFrame",
        "room/catBed",
        "room/rosette",
        "room/moon/1",
        "room/moon/9"
      ])
    )
  })

  it("draws Cats and House Cats on one shared transparent canvas, standing at its bottom centre", () => {
    for (const entry of artManifest)
      if (entry.kind === "cat" || entry.kind === "houseCat") {
        expect(entry.canvas).toEqual({
          width: CHARACTER_CANVAS,
          height: CHARACTER_CANVAS
        })
        // Room beneath the base for a tail dangling over the Shelf's edge.
        expect(entry.anchor).toEqual({ x: 0.5, y: 448 / CHARACTER_CANVAS })
      }
  })

  it("authors the room and its furniture at three times the design size", () => {
    expect(artEntry("room/wall").canvas).toEqual({
      width: 390 * ROOM_SCALE,
      height: 844 * ROOM_SCALE
    })
    for (const entry of artManifest)
      if (["room", "ui", "gathering"].includes(entry.kind)) {
        expect(entry.canvas.width % ROOM_SCALE).toBe(0)
        expect(entry.canvas.height % ROOM_SCALE).toBe(0)
      }
  })

  it("anchors every image within its canvas", () => {
    for (const { anchor } of artManifest) {
      expect(anchor.x).toBeGreaterThanOrEqual(0)
      expect(anchor.x).toBeLessThanOrEqual(1)
      expect(anchor.y).toBeGreaterThanOrEqual(0)
      expect(anchor.y).toBeLessThanOrEqual(1)
    }
  })

  it("refuses a key it does not list", () => {
    expect(() => artEntry("cat/tabby/clingy/content")).toThrow(/tabby/)
  })
})
