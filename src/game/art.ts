import atlas from "virtual:art-atlas"
import type Phaser from "phaser"
import {
  type ArtEntry,
  artEntry,
  CHARACTER_SPAN,
  ROOM_SCALE,
  sharesCharacterScale
} from "../art/manifest"
import { BADGE, CAT_BASE, paintCat, paintCoatBadge } from "./catArt"
import { HOUSE_CAT_BASE, paintHouseCat } from "./houseCatArt"
import { RESOLUTION } from "./layout"
import { paintRoomArt } from "./roomArt"

/** The texture holding every delivered image, a frame per art key. */
const ATLAS = "art"

/**
 * Fallback textures are drawn as sharp as the canvas shows them: the room at
 * the canvas's 2× resolution, and characters at the size the Hand shows Cats.
 */
const ROOM_DENSITY = RESOLUTION / ROOM_SCALE
const CHARACTER_DENSITY = 0.375

/**
 * The size a fallback character is drawn at, which sets its outlines' weight:
 * Cats (and their badges) as the Couch shows them, House Cats as the Shelf does.
 */
const CAT_SIZE = 64
const HOUSE_CAT_SIZE = 48

/** Queues the delivered art, if any, for a scene's preload. */
export function preloadArt(load: Phaser.Loader.LoaderPlugin) {
  if (atlas) load.multiatlas(ATLAS, atlas.url, atlas.path)
}

/** Whether a key shows a delivered image rather than its fallback. */
export const delivered = (
  textures: Phaser.Textures.TextureManager,
  key: string
) => textures.exists(ATLAS) && textures.get(ATLAS).has(key)

/**
 * Draws a key's code-drawn art into a texture under the key, the same size
 * and anchor as a delivered image, so the two are interchangeable.
 */
function drawFallback(scene: Phaser.Scene, entry: ArtEntry) {
  const character = sharesCharacterScale(entry)
  const density = character ? CHARACTER_DENSITY : ROOM_DENSITY
  const width = Math.ceil(entry.canvas.width * density)
  const height = Math.ceil(entry.canvas.height * density)
  const texture = scene.textures.createCanvas(entry.key, width, height)!
  const g = scene.make.graphics(undefined, false)
  const ctx = texture.getContext()
  // Characters are drawn out from their anchor; the rest from the top left.
  const size = entry.kind === "houseCat" ? HOUSE_CAT_SIZE : CAT_SIZE
  const scale = character
    ? (CHARACTER_SPAN * density) / size
    : ROOM_SCALE * density
  const x = character ? entry.anchor.x * width : 0
  const y = character ? entry.anchor.y * height : 0
  ctx.setTransform(scale, 0, 0, scale, x, y)
  g.translateCanvas(x, y).scaleCanvas(scale, scale)
  switch (entry.kind) {
    case "cat":
      // Until reacting poses are drawn, a Cat reacts as it rests.
      g.translateCanvas(0, -size * CAT_BASE)
      paintCat(g, entry.coat, entry.personality, size)
      break
    case "badge":
      paintCoatBadge(g, entry.coat, size * BADGE.r)
      break
    case "houseCat":
      // Until their other poses are drawn, House Cats hold their idle one.
      g.translateCanvas(0, -size * HOUSE_CAT_BASE)
      paintHouseCat(g, entry.houseCat, size)
      break
    default:
      paintRoomArt(entry)(g, ctx)
  }
  g.generateTexture(texture.getCanvas())
  texture.refresh()
  g.destroy()
}

/** The texture and frame showing a key, drawing its fallback on first use. */
export function artTexture(
  scene: Phaser.Scene,
  key: string
): [string, string | undefined] {
  if (delivered(scene.textures, key)) return [ATLAS, key]
  if (!scene.textures.exists(key)) drawFallback(scene, artEntry(key))
  return [key, undefined]
}

function image(scene: Phaser.Scene, key: string, x: number, y: number) {
  const { anchor } = artEntry(key)
  return scene.add
    .image(x, y, ...artTexture(scene, key))
    .setOrigin(anchor.x, anchor.y)
}

/** A room, UI, or Gathering image with its anchor at (x, y). */
export function addArt(scene: Phaser.Scene, key: string, x = 0, y = 0) {
  const { canvas } = artEntry(key)
  return image(scene, key, x, y).setDisplaySize(
    canvas.width / ROOM_SCALE,
    canvas.height / ROOM_SCALE
  )
}

/**
 * A Cat, House Cat, or Coat badge image with its anchor at (x, y), for a
 * character shown `size` across.
 */
export function addCharacter(
  scene: Phaser.Scene,
  key: string,
  size: number,
  x = 0,
  y = 0
) {
  const { canvas } = artEntry(key)
  const scale = size / CHARACTER_SPAN
  return image(scene, key, x, y).setDisplaySize(
    canvas.width * scale,
    canvas.height * scale
  )
}
