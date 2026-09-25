import Phaser from "phaser"
import { preloadArt } from "./art"

/** Loads the delivered art, if any, before the living room opens. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot")
  }

  preload() {
    preloadArt(this.load)
  }

  create() {
    this.scene.start("couch")
  }
}
