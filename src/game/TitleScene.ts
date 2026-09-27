import Phaser from "phaser"
import { art, houseCatArt } from "../art/manifest"
import { sound } from "../audio/sound"
import { defaultConfig } from "../engine"
import { type TitleButton, title } from "../presentation/title"
import { settings } from "../shell/settings"
import { addArt } from "./art"
import { drawHouseCat } from "./characters"
import { display, font, OUTLINE } from "./fonts"
import {
  HEIGHT,
  RESOLUTION,
  SHELF_CAT_SIZE,
  seatX,
  shelfX,
  TITLE,
  titleButtonsY,
  WIDTH
} from "./layout"
import { presentation } from "./presentation"
import { drawFurniture } from "./room"
import { session } from "./session"
import { onShelf } from "./shelfView"

/** How long the room takes to fade out from the title screen, and in again. */
export const TITLE_FADE_MS = 400
/** The room's darkness the fade passes through, as the page behind the canvas. */
const FADE_TO = [46, 31, 25] as const
/** How far the logo and buttons drift up as they go, but for Reduced motion. */
const DRIFT = 24
/**
 * Where a button's label sits above its centre, on the raised face of a
 * button without pips, as New Household's does on the Results.
 */
const LABEL_ABOVE = 4
/** The space between the parts of the definition. */
const DEFINITION_GAP = 8

/**
 * The title screen, in the living room at night: the game's name on the wall
 * where the window hangs in a Run, defined beneath it, Skadi and Freya on the
 * Shelf above the empty Couch, and on the rug a button to Continue the saved
 * Run, if there is one, and one for a New Household. A new Run starting, by
 * either means, leaves for it, as Continue does.
 */
export class TitleScene extends Phaser.Scene {
  /** The logo, definition, and buttons, which drift away on leaving. */
  private front!: Phaser.GameObjects.Container
  /** On the way to the Run, answering no more taps. */
  private leaving = false

  constructor() {
    super("title")
  }

  create() {
    presentation.update({ scene: "title", confirmingNewHousehold: false })
    this.leaving = false
    this.cameras.main.setZoom(RESOLUTION).centerOn(WIDTH / 2, HEIGHT / 2)
    const { definition, buttons } = title({ resumable: session.resumable })

    drawFurniture(this, seatX(defaultConfig.seats), { window: false })
    addArt(this, art.room.shelf, WIDTH / 2, TITLE.shelfY)
    const xs = shelfX(defaultConfig.shelfSize)
    for (const [position, houseCat] of [
      [1, "skadi"],
      [2, "freya"]
    ] as const)
      drawHouseCat(this, houseCatArt(houseCat), SHELF_CAT_SIZE).setPosition(
        xs[position],
        onShelf(TITLE.shelfY, SHELF_CAT_SIZE)
      )

    this.front = this.add.container()
    this.front.add(addArt(this, art.room.logo, TITLE.logo.x, TITLE.logo.y))
    this.front.add(
      this.lineUp(
        [
          this.add
            .text(0, 0, definition.word, display(20, "#fdf6ea"))
            .setStroke(OUTLINE, 4),
          this.add.text(
            0,
            0,
            definition.pronunciation,
            font(14, undefined, "italic 600")
          ),
          this.add.text(
            0,
            0,
            definition.partOfSpeech,
            font(14, undefined, "italic 700")
          ),
          this.add.text(
            0,
            0,
            `— ${definition.meaning}`,
            font(14, undefined, "700")
          )
        ],
        TITLE.definitionY
      )
    )
    const ys = titleButtonsY(buttons.length)
    buttons.forEach((button, i) => {
      this.drawButton(button, ys[i])
    })

    const off = session.on(() => this.leave())
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off)
  }

  /** Words side by side along a line at `y`, centred together across the room. */
  private lineUp(words: Phaser.GameObjects.Text[], y: number) {
    const width =
      words.reduce((sum, word) => sum + word.width, 0) +
      DEFINITION_GAP * (words.length - 1)
    let x = (WIDTH - width) / 2
    for (const word of words) {
      word.setOrigin(0, 0.5).setPosition(x, y)
      x += word.width + DEFINITION_GAP
    }
    return words
  }

  /** A button on the rug, centred at `y`, answering a tap with its choice. */
  private drawButton(button: TitleButton, y: number) {
    const { x, w, h } = TITLE.buttons
    this.front.add([
      addArt(this, art.playButton(true), x, y),
      this.add
        .text(x, y - LABEL_ABOVE, button.label, display(24, "#fdf6ea"))
        .setOrigin(0.5)
        .setStroke(OUTLINE, 4)
    ])
    this.add
      .zone(x, y, w, h)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.choose(button))
  }

  /**
   * Continues the saved Run, or starts a New Household, asking first if it
   * would replace the saved Run; not while asking already, or leaving.
   */
  private choose({ choice, confirm }: TitleButton) {
    if (this.leaving || presentation.confirmingNewHousehold) return
    sound.cue({ name: "uiTap" })
    if (choice === "continue") this.leave()
    // The shell asks first, and starts the New Household if the player agrees.
    else if (confirm) presentation.update({ confirmingNewHousehold: true })
    else session.newHousehold()
  }

  /**
   * Fades the room out, the logo and buttons drifting up as they go (or only
   * fading, under Reduced motion), and opens the Run where it stands.
   */
  private leave() {
    if (this.leaving) return
    this.leaving = true
    this.input.enabled = false
    if (!settings.reducedMotion)
      this.tweens.add({
        targets: this.front,
        y: -DRIFT,
        duration: TITLE_FADE_MS,
        ease: "Sine.easeIn"
      })
    this.cameras.main.fadeOut(TITLE_FADE_MS, ...FADE_TO)
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        arriving = true
        this.scene.start("couch")
      }
    )
  }
}

/** The Run is opening from the title screen, until its first scene shows. */
let arriving = false

/**
 * Fades the scene showing the Run in, if it is the first since the title
 * screen. (Phaser keeps a scene's start data when it is started again without
 * any, so the title leaves word here rather than there.)
 */
export function arriveFromTitle(scene: Phaser.Scene) {
  if (!arriving) return
  arriving = false
  scene.cameras.main.fadeIn(TITLE_FADE_MS, ...FADE_TO)
}
