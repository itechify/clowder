import type Phaser from "phaser"
import { art } from "../art/manifest"
import type { DisasterSign } from "../presentation/hud"
import { addArt } from "./art"
import { display, font, OUTLINE } from "./fonts"
import {
  COUCH_FLOOR_Y,
  DISASTER_PLAQUE,
  RUG_Y,
  SEAT_PAD_Y,
  WIDTH,
  WINDOW
} from "./layout"

/**
 * The living room's furniture, the same by night and by day: the wall, the
 * rug, the window as it looks by night, and the Couch, a pad on each of the
 * Seats at `seatXs`.
 */
export function drawFurniture(scene: Phaser.Scene, seatXs: number[]) {
  addArt(scene, art.room.wall)
  addArt(scene, art.room.rug, WIDTH / 2, RUG_Y)
  addArt(scene, art.room.window, WINDOW.x, WINDOW.y)
  addArt(scene, art.room.couch, WIDTH / 2, COUCH_FLOOR_Y)
  for (const x of seatXs) addArt(scene, art.room.seatPad, x, SEAT_PAD_Y)
}

/**
 * A Disaster and the rule it changes, written on the art at `key` hung on
 * the wall below the treat jar: tonight's sign on the Couch, or the next
 * Night's note in the Shop, their words at `nameY` and `ruleY` below its top.
 */
export function drawDisasterPlaque(
  scene: Phaser.Scene,
  key: string,
  { name, rule }: DisasterSign,
  { nameY, ruleY }: { nameY: number; ruleY: number }
) {
  const words = [
    scene.add
      .text(0, nameY, name, display(15, "#fdf6ea"))
      .setStroke(OUTLINE, 3),
    scene.add.text(0, ruleY, rule, font(11, "#fdf6ea", "800"))
  ]
  // Any line too long for the plaque shrinks to fit inside its border.
  for (const line of words)
    line
      .setOrigin(0.5)
      .setScale(Math.min(1, DISASTER_PLAQUE.textWidth / line.width))
  return scene.add.container(DISASTER_PLAQUE.x, DISASTER_PLAQUE.y, [
    addArt(scene, key),
    ...words
  ])
}
