import Phaser from "phaser"
import { preloadArt } from "./art"
import { loadFonts } from "./fonts"

/** Loads the delivered art, if any, and the fonts, before the living room opens. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot")
  }

  preload() {
    preloadArt(this.load)
  }

  create() {
    loadFonts().then(() => this.scene.start("couch"))
  }
}
