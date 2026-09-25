import type Phaser from "phaser"
import { art, catArt, houseCatArt } from "../art/manifest"
import type { Cat, HouseCatId } from "../engine"
import { addCharacter } from "./art"
import { BADGE, CAT_BASE } from "./catArt"
import { HOUSE_CAT_BASE } from "./houseCatArt"

/**
 * A Cat centred on (0, 0), about `size` pixels across: its Coat and
 * Personality's pose with its Coat badge on its flank. Every Cat curls up
 * like a Sleepy one once it is `asleep`.
 */
export function drawCat(
  scene: Phaser.Scene,
  cat: Cat,
  size: number,
  { asleep = false } = {}
): Phaser.GameObjects.Container {
  const pose = catArt(cat.coat, asleep ? "sleepy" : cat.personality)
  return scene.add.container(0, 0, [
    addCharacter(scene, pose, size, 0, size * CAT_BASE),
    addCharacter(
      scene,
      art.badge(cat.coat),
      size,
      size * BADGE.x,
      size * BADGE.y
    )
  ])
}

/**
 * A House Cat centred on (0, 0), about `size` pixels across, sitting with its
 * base about `size` × 0.45 below the centre.
 */
export function drawHouseCat(
  scene: Phaser.Scene,
  houseCat: HouseCatId,
  size: number
): Phaser.GameObjects.Container {
  return scene.add.container(0, 0, [
    addCharacter(scene, houseCatArt(houseCat), size, 0, size * HOUSE_CAT_BASE)
  ])
}
