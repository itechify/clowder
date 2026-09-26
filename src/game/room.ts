import type Phaser from "phaser"
import { art } from "../art/manifest"
import { addArt } from "./art"
import { COUCH_FLOOR_Y, RUG_Y, SEAT_PAD_Y, WIDTH, WINDOW } from "./layout"

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
