import Phaser from "phaser"
import { preloadArt } from "./art"
import { loadFonts } from "./fonts"
import { session } from "./session"

/**
 * Loads the delivered art, if any, and the fonts, before the living room
 * opens: on the title screen, or on the Run a page asks for by its seed.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot")
  }

  preload() {
    preloadArt(this.load)
  }

  create() {
    loadFonts().then(() => this.scene.start(session.seeded ? "couch" : "title"))
  }
}
