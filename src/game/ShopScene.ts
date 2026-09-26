import Phaser from "phaser"
import { art, moonArt } from "../art/manifest"
import { sound } from "../audio/sound"
import {
  type Action,
  applyAction,
  type CatId,
  type HouseCatId,
  houseCat,
  notEnoughTreats,
  rehomeRefund
} from "../engine"
import type { DisasterSign } from "../presentation/hud"
import {
  type DoorwaySpot,
  type Kind,
  type Offer,
  type Pile,
  type PileSpot,
  type ShopStaging,
  sameKind,
  stageShop
} from "../presentation/shop"
import { stage } from "../presentation/staging"
import { settings } from "../shell/settings"
import { addArt } from "./art"
import { CAT_BASE } from "./catArt"
import { drawCat, drawGrowthBadge, drawHouseCat } from "./characters"
import { display, font, numbers, OUTLINE } from "./fonts"
import {
  doorwayX,
  fanX,
  HEIGHT,
  MOON,
  RESOLUTION,
  RUG_ROWS,
  rugX,
  SEAT_Y,
  SEATED_SIZE,
  SHELF_CAT_SIZE,
  SHELF_Y,
  seatX,
  TREAT_COUNT,
  TREAT_JAR,
  WIDTH,
  WINDOW
} from "./layout"
import { type CloudMotion, presentation, type TimeOfDay } from "./presentation"
import { drawDisasterPlaque, drawFurniture } from "./room"
import { INK, NIGHT_SKY } from "./roomArt"
import { session } from "./session"
import { drawShelf, tapShelf } from "./shelfView"
import { drawTreat } from "./treatArt"

/** The Shop's piles sit on five Seats and in four positions to a rug row. */
const PILE_SEATS = 5
const PILE_RUG_POSITIONS = 4
/**
 * The piles on each rug row: their centres' height, and how big they are
 * shown, a little further back than the Hand lies, clear of the doorway.
 */
const PILE_RUG_ROWS = {
  back: { y: 624, size: 56 },
  front: { y: 702, size: 62 }
} as const
/** The windowsill's two spots, along the window's bottom frame. */
const SILL = { xs: [58, 104], base: 137, size: 38 }
/** A pile's count, on a badge at its Cat's feet. */
const COUNT_BADGE = { dx: 0.4, dy: 0.34 }
/** The sun's place in the window, where the moon is by night. */
const SUN = { x: 162, y: 88 }
/** How far below their places the sun and moon rise from and set to. */
const RISE = 26
/** The storm clouds in the window, and how far and slowly they drift. */
const CLOUDS = { x: WINDOW.x, y: 88, drift: 6, ms: 2600 }
/** How warm the lights are by day, over the room as it is by night. */
const WARM = { colour: 0xffc46b, alpha: 0.1 }
const DUSK = { colour: NIGHT_SKY, alpha: 0.3 }
/** The sunbeam from the front door, lying across the rug. */
const SUNBEAM = { x: WIDTH / 2, y: 598 }
/**
 * The front door, standing open between the Couch and the rug: the bottom
 * of its doorway; where each offer stands in it, its tag, and its button.
 */
const DOOR_Y = 526
const OFFER = { y: 470, catSize: 46, houseCatSize: 42, tagY: 490, buttonY: 566 }
/** How wide a tag's words may run, and how tall, inside its border. */
const TAG_TEXT = { width: 78, height: 40 }
/** The line saying what can be done, just above the Couch's back. */
const PROMPT_Y = 244
/** An opened pile's fan: its Cats' size, spacing, and panel. */
const FAN = {
  size: 44,
  step: 62,
  left: 16,
  right: WIDTH - 16,
  height: 112,
  minWidth: 190
}
/** The room dims behind an opened pile's fan. */
const SCRIM = { colour: 0x2e1f19, alpha: 0.35 }
/** How far above an opened pile its fan sits, or below one on the windowsill. */
const FAN_ABOVE = 96
const FAN_BELOW = 124
/**
 * The buttons along the bottom, scaled from the living room's: Reroll and
 * Rehome from Redraw's, Nightfall from Get Comfy's; each offer's from
 * Redraw's, smaller.
 */
const BUTTON_Y = 800
const BUTTON_SCALE = 46 / 58
const REROLL_X = 50
const REHOME_X = 142
const NIGHTFALL_X = 291
const OFFER_BUTTON_SCALE = 84 / 108
/** How long each transition between night and day takes. */
const TRANSITION_MS = 1200

type Add = <T extends Phaser.GameObjects.GameObject>(object: T) => T
type Point = { x: number; y: number }
/**
 * Whether a button may be tapped; one the engine refuses for want of Treats
 * looks different from one refused for any other reason.
 */
type ButtonState = "ready" | "unaffordable" | "unavailable"
/** What is picked out to Rehome: a Roster Cat, or a House Cat on the Shelf. */
type Picked = { cat: CatId } | { houseCat: HouseCatId } | null
/** Something a transition moves: from where, to where, when, and how fast. */
type Move = {
  targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]
  from?: Record<string, number>
  to: Record<string, number>
  at: number
  ms: number
  ease?: string
}

/** A change to the player's Treats with a true minus sign: "−3" or "+2". */
const signedTreats = (change: number) =>
  change < 0 ? `−${-change}` : `+${change}`

/** The colour of a price on a button, by its state; a gain reads differently. */
const priceColour = (state: ButtonState, treats: number) =>
  state === "unaffordable"
    ? "#ff8a7a"
    : state === "unavailable"
      ? "#f3e9da"
      : treats < 0
        ? "#ffd7a8"
        : "#bfe8a0"

/**
 * The Shop between Nights, in the living room by day: the Roster lounging as
 * one pile per Kind, offers waiting in the open front door, the Shelf above
 * the Couch, and the next Disaster brewing in the window. Adopt or Recruit an
 * offer, Rehome a Cat from its pile or a House Cat from the Shelf, rearrange
 * the Shelf, Reroll the offers, or leave as night falls. It draws what the
 * Shop's staging shows and sends taps to the Session as actions; the engine
 * decides every price and whether each action is allowed.
 */
export class ShopScene extends Phaser.Scene {
  /** What is picked out to Rehome, awaiting confirmation. */
  private picked: Picked = null
  /** The pile fanned out, if any. */
  private opened: Kind | null = null
  /** The Shop as last drawn, whose doorway keeps each offer's spot. */
  private staged: ShopStaging | null = null
  /** The room by day, over the room by night, and what shows only by day. */
  private day!: {
    window: Phaser.GameObjects.Image
    sun: Phaser.GameObjects.Image
    warmth: Phaser.GameObjects.Rectangle
    fixtures: Phaser.GameObjects.GameObject[]
  }
  /** The Shelf, and the Shop's piles, offers, and buttons. */
  private shelf!: Phaser.GameObjects.Container
  private layer!: Phaser.GameObjects.Container
  private treatCount!: Phaser.GameObjects.Text
  /** The offers' Cats and House Cats standing in the doorway, by spot. */
  private visitors: (Phaser.GameObjects.Container | null)[] = []
  /** A transition playing out, until it ends or is skipped. */
  private transition: { skip: () => void } | null = null
  /** Night is falling, and the Shop has closed. */
  private closing = false

  constructor() {
    super("shop")
  }

  create(data: { dawn?: boolean } = {}) {
    // Actions taken in the same frame may have left the Shop already.
    if (!session.run.shop) {
      this.scene.start("couch")
      return
    }
    presentation.update({ scene: "shop" })
    this.cameras.main.setZoom(RESOLUTION).centerOn(WIDTH / 2, HEIGHT / 2)
    this.picked = null
    this.opened = null
    this.staged = null
    this.transition = null
    this.closing = false
    presentation.shop = {}

    // Taps on nothing in particular close the fan and put back any pick.
    this.add
      .zone(0, 0, WIDTH, HEIGHT)
      .setOrigin(0)
      .setInteractive()
      .on("pointerdown", () => this.tapElsewhere())
    drawFurniture(this, seatX(PILE_SEATS))
    this.day = this.drawDay()
    addArt(this, art.room.treatJar, TREAT_JAR.x, TREAT_JAR.y)
    this.treatCount = this.add
      .text(TREAT_COUNT.x, TREAT_COUNT.y, "", numbers(30, "#f6c453"))
      .setOrigin(1, 0.5)
    this.shelf = this.add.container()
    this.layer = this.add.container()

    const off = session.on((events) => {
      if (this.closing) return
      // Whatever happens, a dawn still breaking has broken.
      this.transition?.skip()
      if (!session.run.shop) {
        this.nightfall()
        return
      }
      const cat = this.pickedCat()
      const houseCat = this.pickedHouseCat()
      if (
        (cat && !session.run.roster.some((c) => c.id === cat)) ||
        (houseCat && !session.run.shelf.includes(houseCat))
      )
        this.picked = null
      const before = this.staged
      this.draw()
      if (events.some((event) => event.type === "offersRerolled"))
        this.rerolled(before)
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      off()
      presentation.transition = null
      presentation.clouds = null
    })
    this.draw()
    if (data.dawn) this.dawn()
  }

  /**
   * What the room shows by day, over the room by night: the window's daytime
   * sky and its sun, the lights' warmth, and the day's fixtures: the sunbeam,
   * the open front door, and, before a Disaster Night, storm clouds in the
   * window and a note on the wall.
   */
  private drawDay() {
    const window = addArt(this, art.room.dayWindow, WINDOW.x, WINDOW.y)
    const sun = addArt(this, art.room.sun, SUN.x, SUN.y)
    const warmth = this.add
      .rectangle(0, 0, WIDTH, HEIGHT, WARM.colour, WARM.alpha)
      .setOrigin(0)
    const fixtures: Phaser.GameObjects.GameObject[] = [
      addArt(this, art.room.sunbeam, SUNBEAM.x, SUNBEAM.y),
      addArt(this, art.room.frontDoor, WIDTH / 2, DOOR_Y)
    ]
    const { disaster } = stageShop(session.run)
    presentation.clouds = null
    if (disaster) {
      const clouds = addArt(this, art.room.stormClouds, CLOUDS.x, CLOUDS.y)
      this.drift(clouds)
      // Still again as soon as motion is reduced, and drifting once it isn't.
      const off = settings.on(() => this.drift(clouds))
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, off)
      fixtures.push(clouds, this.drawDisasterNote(disaster))
    }
    return { window, sun, warmth, fixtures }
  }

  /** Sets storm clouds drifting to and fro, or still under Reduced motion. */
  private drift(clouds: Phaser.GameObjects.Image) {
    const motion: CloudMotion = settings.reducedMotion ? "still" : "drifting"
    if (presentation.clouds === motion) return
    presentation.clouds = motion
    this.tweens.killTweensOf(clouds)
    clouds.setX(CLOUDS.x)
    if (motion === "drifting")
      this.tweens.add({
        targets: clouds,
        x: CLOUDS.x + CLOUDS.drift,
        duration: CLOUDS.ms,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      })
  }

  /** A red note pinned beside the window, naming the next Disaster and its rule. */
  private drawDisasterNote(disaster: DisasterSign) {
    return drawDisasterPlaque(this, art.room.disasterNote, disaster, {
      nameY: 26,
      ruleY: 44
    })
  }

  /** Where a pile's Cat is shown: its centre, and how big it is. */
  private pileAt(spot: PileSpot): Point & { size: number } {
    if (spot.on === "couch")
      return {
        x: seatX(PILE_SEATS)[spot.seat],
        y: SEAT_Y - 12,
        size: SEATED_SIZE
      }
    if (spot.on === "rug") {
      const { y, size } = PILE_RUG_ROWS[spot.row]
      return { x: rugX(PILE_RUG_POSITIONS)[spot.row][spot.position], y, size }
    }
    return {
      x: SILL.xs[spot.position],
      y: SILL.base - SILL.size * CAT_BASE,
      size: SILL.size
    }
  }

  private draw() {
    const { run } = session
    if (!run.shop) return
    const staged = stageShop(run, {
      opened: this.opened,
      doorway: this.staged?.doorway
    })
    this.staged = staged
    // An opened pile whose last Cat has gone closes.
    if (!staged.fan) this.opened = null
    presentation.shop = { opened: this.opened, doorway: staged.doorway }

    this.treatCount.setText(`${run.treats}`)
    this.tweens.killTweensOf([...this.shelf.list, ...this.layer.list])
    this.shelf.removeAll(true)
    this.layer.removeAll(true)
    const add: Add = (object) => {
      this.layer.add(object)
      return object
    }

    // The Shelf, where a House Cat may be moved or picked out to Rehome.
    drawShelf(
      this,
      (object) => {
        this.shelf.add(object)
        return object
      },
      {
        run,
        y: SHELF_Y,
        size: SHELF_CAT_SIZE,
        held: this.pickedHouseCat(),
        onTap: (position) => this.tapShelfPosition(position)
      }
    )
    add(
      this.add
        .text(WIDTH / 2, PROMPT_Y, this.prompt(), {
          ...font(13, "#4a3426", "800"),
          align: "center",
          wordWrap: { width: WIDTH - 30 }
        })
        .setOrigin(0.5)
    )

    for (const pile of staged.piles) this.drawPile(add, pile)
    const xs = doorwayX(staged.doorway.length)
    this.visitors = staged.doorway.map((spot, i) =>
      this.drawOffer(add, spot, xs[i])
    )
    if (staged.fan) this.drawFan(add, staged)
    this.drawButtons(add, staged)
  }

  /** What the player may do, just above the Couch, unless a pile is open. */
  private prompt() {
    const { run } = session
    const picked = this.pickedHouseCat()
    if (picked)
      return `Rehome ${houseCat(picked).name} for ${rehomeRefund(run.config, picked)} Treats back, or tap elsewhere on the Shelf to move it.`
    const cats =
      run.shop!.catRehomesLeft > 0
        ? "Tap a pile to Rehome a Cat"
        : "No more Rehoming Cats this visit"
    return run.shelf.length > 0
      ? `${cats}, or a House Cat to move or Rehome it.`
      : `${cats}.`
  }

  /** A Kind's pile: its Cat at rest, with how many there are on a badge. */
  private drawPile(add: Add, pile: Pile) {
    const { x, y, size } = this.pileAt(pile.spot)
    add(drawCat(this, pile.cat, pile.look, size)).setPosition(x, y)
    const badge = {
      x: x + size * COUNT_BADGE.dx,
      y: y + size * COUNT_BADGE.dy
    }
    add(addArt(this, art.room.countBadge, badge.x, badge.y))
    add(
      this.add
        .text(badge.x, badge.y, `×${pile.count}`, display(13, "#4a3426"))
        .setOrigin(0.5)
    )
    add(this.add.zone(x, y, size, size + 8))
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.tapPile(pile.kind))
  }

  /**
   * An offer waiting in the doorway: the Cat or House Cat, its tag, and the
   * button that Adopts or Recruits it. A taken offer leaves its spot empty.
   * Returns the Cat or House Cat, if any.
   */
  private drawOffer(add: Add, { holds, offer }: DoorwaySpot, x: number) {
    if (!offer) {
      add(
        this.add
          .text(
            x,
            OFFER.tagY + 20,
            "cat" in holds ? "Adopted!" : "Recruited!",
            font(12, "#9c8672", "800")
          )
          .setOrigin(0.5)
      )
      return null
    }
    const visitor = add(this.drawVisitor(offer)).setPosition(x, OFFER.y)
    add(addArt(this, art.room.offerTag, x, OFFER.tagY))
    const { name, title, about } = offer.tag
    const lines = [
      this.add.text(0, 0, name, font(11, "#4a3426", "900")),
      ...(title
        ? [this.add.text(0, 0, title, font(8, "#7a5a3c", "italic 800"))]
        : []),
      this.add.text(0, 0, about, {
        ...font(8.5, "#4a3426", "700"),
        align: "center",
        wordWrap: { width: TAG_TEXT.width }
      })
    ]
    for (const line of lines) line.setOrigin(0.5, 0).setLineSpacing(-3)
    const height = lines.reduce((sum, line) => sum + line.height, 0)
    // Words too many for the tag shrink to fit inside its border.
    const scale = Math.min(1, TAG_TEXT.height / height)
    let below = OFFER.tagY + 9 + (TAG_TEXT.height - height * scale) / 2
    for (const line of lines) {
      add(line.setPosition(x, below).setScale(scale))
      below += line.height * scale
    }
    this.button(
      add,
      { x, y: OFFER.buttonY, scale: OFFER_BUTTON_SCALE },
      { text: "cat" in offer ? "Adopt" : "Recruit", treats: -offer.price },
      this.stateOf(offer.action),
      () => session.apply(offer.action)
    )
    return visitor
  }

  /** An offered Cat or House Cat, standing in the doorway. */
  private drawVisitor(offer: Offer) {
    return "cat" in offer
      ? drawCat(this, offer.cat, offer.look, OFFER.catSize)
      : drawHouseCat(this, offer.pose, OFFER.houseCatSize)
  }

  /**
   * The opened pile's Cats, fanned out on a panel above it (below one on the
   * windowsill), each named, with its growth badge if The Void has grown it;
   * the one picked out to Rehome glows.
   */
  private drawFan(add: Add, { fan, piles }: ShopStaging) {
    if (!fan) return
    const { run } = session
    const pile = piles.find(({ kind }) => sameKind(fan.kind, kind))!
    const at = this.pileAt(pile.spot)
    const y = pile.spot.on === "sill" ? at.y + FAN_BELOW : at.y - FAN_ABOVE
    const xs = fanX(fan.cats.length, at.x, FAN)
    // The panel is wide enough for its words, however few its Cats.
    const width = Math.max(FAN.minWidth, xs.at(-1)! - xs[0] + FAN.step)
    const middle = Math.min(
      Math.max((xs[0] + xs.at(-1)!) / 2, FAN.left + width / 2),
      FAN.right - width / 2
    )
    const [left, right] = [middle - width / 2, middle + width / 2]
    // The rest of the room dims, and a tap on it closes the fan.
    add(
      this.add
        .rectangle(0, 0, WIDTH, HEIGHT, SCRIM.colour, SCRIM.alpha)
        .setOrigin(0)
        .setInteractive()
        .on("pointerdown", () => this.tapElsewhere())
    )
    const panel = add(this.add.graphics())
    panel
      .fillStyle(0xfdf6ea, 0.97)
      .fillRoundedRect(left, y - FAN.height / 2, right - left, FAN.height, 16)
      .lineStyle(3, INK, 1)
      .strokeRoundedRect(left, y - FAN.height / 2, right - left, FAN.height, 16)
    // The panel catches taps between its Cats, so they don't close it.
    add(
      this.add
        .zone((left + right) / 2, y, right - left, FAN.height)
        .setInteractive()
    )
    const picked = this.pickedCat()
    const header = picked
      ? `Rehome ${fan.cats.find(({ cat }) => cat === picked)!.name}?`
      : run.shop!.catRehomesLeft > 0
        ? "Tap a Cat to Rehome it"
        : "No more Rehoming this visit"
    add(
      this.add
        .text((left + right) / 2, y - FAN.height / 2 + 14, header, {
          ...font(12, "#4a3426", "900")
        })
        .setOrigin(0.5)
    )
    const cats = new Map(run.roster.map((cat) => [cat.id, cat]))
    fan.cats.forEach(({ cat: id, name, look, grownTo }, i) => {
      const x = xs[i]
      const catY = y + 2
      if (id === picked)
        add(this.add.graphics())
          .fillStyle(0xfff1b0, 1)
          .fillEllipse(x, catY, FAN.size * 1.3, FAN.size * 1.3)
      add(drawCat(this, cats.get(id)!, look, FAN.size)).setPosition(x, catY)
      add(
        this.add
          .text(x, y + FAN.height / 2 - 16, name, font(11, "#4a3426", "800"))
          .setOrigin(0.5)
      )
      if (grownTo !== null)
        drawGrowthBadge(this, add, grownTo, x - 16, catY - 24)
      add(this.add.zone(x, catY + 8, FAN.step - 4, FAN.size + 30))
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.tapFannedCat(id))
    })
  }

  /** Reroll and Rehome, each with its signed price, and Nightfall. */
  private drawButtons(add: Add, staged: ShopStaging) {
    const { run } = session
    const shop = run.shop!
    this.button(
      add,
      { x: REROLL_X, y: BUTTON_Y, scale: BUTTON_SCALE },
      { text: "Reroll", treats: -shop.rerollPrice },
      this.stateOf({ type: "reroll" }),
      () => session.apply({ type: "reroll" })
    )
    // Rehoming a Cat costs Treats; Rehoming a House Cat refunds some.
    const houseCat = this.pickedHouseCat()
    const cat = this.pickedCat()
    const rehome: Action | null = houseCat
      ? { type: "rehome", houseCat }
      : cat
        ? { type: "rehome", cat }
        : null
    this.button(
      add,
      { x: REHOME_X, y: BUTTON_Y, scale: BUTTON_SCALE },
      {
        text: "Rehome",
        treats: houseCat
          ? rehomeRefund(run.config, houseCat)
          : -run.config.shop.rehomeCatPrice
      },
      this.stateOf(rehome),
      () => {
        if (rehome) session.apply(rehome)
      }
    )
    this.button(
      add,
      { x: NIGHTFALL_X, y: BUTTON_Y, scale: BUTTON_SCALE, primary: true },
      { text: "Nightfall", below: staged.nightfall },
      this.stateOf({ type: "leaveShop" }),
      () => session.apply({ type: "leaveShop" })
    )
  }

  /** Whether the engine allows an action, or refuses it for want of Treats. */
  private stateOf(action: Action | null): ButtonState {
    if (!action) return "unavailable"
    const result = applyAction(session.run, action)
    return result.ok
      ? "ready"
      : result.reason === notEnoughTreats
        ? "unaffordable"
        : "unavailable"
  }

  /**
   * A button in the living room's art, `scale` times the size of Redraw's (or
   * Get Comfy's, if `primary`), its words above and, beneath them, any change
   * to the player's Treats as a treat and a signed amount, or another line.
   * Tapped, one that spends Treats sounds like Treats being spent.
   */
  private button(
    add: Add,
    {
      x,
      y,
      scale,
      primary = false
    }: Point & { scale: number; primary?: boolean },
    { text, treats, below }: { text: string; treats?: number; below?: string },
    state: ButtonState,
    onTap: () => void
  ) {
    const ready = state === "ready"
    const key = primary ? art.playButton(ready) : art.redrawButton(ready)
    const face = add(addArt(this, key, x, y))
    face.setDisplaySize(face.displayWidth * scale, face.displayHeight * scale)
    const labelY = y - 8 * scale
    const lineY = y + 11 * scale
    add(
      this.add
        .text(
          x,
          below || treats !== undefined ? labelY : y - 3 * scale,
          text,
          display(
            Math.round((primary ? 24 : 19) * scale),
            ready ? "#fdf6ea" : "#f3e9da"
          )
        )
        .setOrigin(0.5)
        .setStroke(OUTLINE, 4)
    )
    if (below)
      add(
        this.add
          .text(x, lineY, below, font(Math.round(13 * scale), "#fdf6ea", "900"))
          .setOrigin(0.5)
          .setStroke(OUTLINE, 3)
      )
    if (treats !== undefined) {
      const size = Math.round(15 * scale)
      const amount = this.add
        .text(
          0,
          lineY,
          signedTreats(treats),
          numbers(size, priceColour(state, treats))
        )
        .setOrigin(0, 0.5)
      const treat = drawTreat(this, size)
      const width = size + 3 + amount.width
      treat.setPosition(x - width / 2 + size / 2, lineY)
      amount.setX(x - width / 2 + size + 3)
      add(treat)
      add(amount)
    }
    if (ready)
      add(this.add.zone(x, y, face.displayWidth, face.displayHeight))
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          sound.cue({ name: treats && treats < 0 ? "treatsSpent" : "uiTap" })
          onTap()
        })
  }

  private pickedCat(): CatId | null {
    return this.picked && "cat" in this.picked ? this.picked.cat : null
  }

  private pickedHouseCat(): HouseCatId | null {
    return this.picked && "houseCat" in this.picked
      ? this.picked.houseCat
      : null
  }

  /** Fans a pile's Cats out, or closes it; either puts back any pick. */
  private tapPile(kind: Kind) {
    this.opened = this.opened && sameKind(this.opened, kind) ? null : kind
    this.picked = null
    this.draw()
  }

  /** Picks a fanned-out Cat out to Rehome, or puts it back. */
  private tapFannedCat(cat: CatId) {
    this.picked = this.pickedCat() === cat ? null : { cat }
    this.draw()
  }

  /** Closes the fan and puts back any pick. */
  private tapElsewhere() {
    if (!this.opened && !this.picked) return
    this.opened = null
    this.picked = null
    this.draw()
  }

  /** Picks a House Cat out to move or Rehome, or moves the one picked out. */
  private tapShelfPosition(position: number) {
    const { held, action } = tapShelf(
      session.run,
      this.pickedHouseCat(),
      position
    )
    this.opened = null
    this.picked = held ? { houseCat: held } : null
    if (!action || !session.apply(action).ok) this.draw()
  }

  /**
   * The offers as they were walk away from the door, and the new ones
   * arrive; under Reduced motion they only fade.
   */
  private rerolled(before: ShopStaging | null) {
    if (!before) return
    const calm = settings.reducedMotion
    const xs = doorwayX(before.doorway.length)
    before.doorway.forEach(({ offer }, i) => {
      if (!offer) return
      const away = this.drawVisitor(offer).setPosition(xs[i], OFFER.y)
      const side = xs[i] < WIDTH / 2 ? -1 : 1
      this.tweens.add({
        targets: away,
        x: calm ? xs[i] : xs[i] + side * 120,
        alpha: 0,
        duration: 500,
        ease: "Sine.easeIn",
        onComplete: () => away.destroy()
      })
    })
    // The new offers step in from the daylight behind them.
    for (const visitor of this.visitors)
      if (visitor)
        this.tweens.add({
          targets: visitor,
          alpha: { from: 0, to: 1 },
          scale: calm ? 1 : { from: 0.7, to: 1 },
          delay: 250,
          duration: 400,
          ease: "Back.easeOut"
        })
  }

  /**
   * Dawn, after a cleared Night: the moon sets, the sun rises in the
   * window, the lights warm, and the Hand's Cats wander off before the Shop
   * shows. A tap skips it; under Reduced motion it is a plain crossfade.
   */
  private dawn() {
    const { run } = session
    const moon = addArt(this, moonArt(run.night.number), MOON.x, MOON.y)
    // Dawn breaks behind the Shelf and the Shop, over the room by night.
    const night: Phaser.GameObjects.GameObject[] = [moon]
    const rugXs = rugX(Math.ceil(run.config.handSize / 2))
    const byId = new Map(run.roster.map((cat) => [cat.id, cat]))
    const wanderers = stage(run).cats.flatMap(({ cat, placement, ...look }) => {
      if (placement.on !== "rug") return []
      const { y, size } = RUG_ROWS[placement.row]
      const x = rugXs[placement.row][placement.position]
      return [drawCat(this, byId.get(cat)!, look, size).setPosition(x, y)]
    })
    night.push(...wanderers)
    const { window, sun, warmth, fixtures } = this.day
    this.children.bringToTop(this.shelf)
    this.children.bringToTop(this.layer)

    const moves: Move[] = settings.reducedMotion
      ? [
          {
            targets: night,
            from: { alpha: 1 },
            to: { alpha: 0 },
            at: 0,
            ms: TRANSITION_MS
          },
          {
            targets: [window, sun, ...fixtures, this.layer],
            from: { alpha: 0 },
            to: { alpha: 1 },
            at: 0,
            ms: TRANSITION_MS
          },
          {
            targets: warmth,
            from: { alpha: 0 },
            to: { alpha: WARM.alpha },
            at: 0,
            ms: TRANSITION_MS
          }
        ]
      : [
          {
            targets: moon,
            to: { y: MOON.y + RISE, alpha: 0 },
            at: 0,
            ms: 500,
            ease: "Sine.easeIn"
          },
          {
            targets: window,
            from: { alpha: 0 },
            to: { alpha: 1 },
            at: 150,
            ms: 600
          },
          {
            targets: sun,
            from: { y: SUN.y + RISE, alpha: 0 },
            to: { y: SUN.y, alpha: 1 },
            at: 350,
            ms: 850,
            ease: "Cubic.easeOut"
          },
          {
            targets: warmth,
            from: { alpha: 0 },
            to: { alpha: WARM.alpha },
            at: 200,
            ms: 800
          },
          ...wanderers.map(
            (cat, i): Move => ({
              targets: cat,
              to: { x: cat.x < WIDTH / 2 ? -60 : WIDTH + 60, alpha: 0 },
              at: 60 * i,
              ms: 700,
              ease: "Sine.easeIn"
            })
          ),
          {
            targets: fixtures,
            from: { alpha: 0 },
            to: { alpha: 1 },
            at: 500,
            ms: 700
          },
          {
            targets: this.layer,
            from: { alpha: 0 },
            to: { alpha: 1 },
            at: 700,
            ms: 500
          }
        ]
    this.transit("day", moves, () => {
      for (const object of night) object.destroy()
    })
  }

  /**
   * Dusk, on leaving: the Shop fades, the sun sets, the room dims, and the
   * next Night's moon rises in the window before the Night begins. A tap
   * skips it; under Reduced motion it is a plain crossfade.
   */
  private nightfall() {
    this.closing = true
    const { run } = session
    const moon = addArt(this, moonArt(run.night.number), MOON.x, MOON.y)
    const dusk = this.add
      .rectangle(0, 0, WIDTH, HEIGHT, DUSK.colour, 0)
      .setOrigin(0)
    const { window, sun, warmth, fixtures } = this.day
    this.children.bringToTop(this.shelf)
    const leaving = [window, sun, ...fixtures, this.layer]
    const moves: Move[] = settings.reducedMotion
      ? [
          { targets: leaving, to: { alpha: 0 }, at: 0, ms: TRANSITION_MS },
          { targets: warmth, to: { alpha: 0 }, at: 0, ms: TRANSITION_MS },
          {
            targets: moon,
            from: { alpha: 0 },
            to: { alpha: 1 },
            at: 0,
            ms: TRANSITION_MS
          }
        ]
      : [
          {
            targets: [...fixtures, this.layer],
            to: { alpha: 0 },
            at: 0,
            ms: 450
          },
          {
            targets: sun,
            to: { y: SUN.y + RISE, alpha: 0 },
            at: 0,
            ms: 600,
            ease: "Sine.easeIn"
          },
          { targets: window, to: { alpha: 0 }, at: 200, ms: 600 },
          { targets: warmth, to: { alpha: 0 }, at: 0, ms: 700 },
          { targets: dusk, to: { alpha: DUSK.alpha }, at: 0, ms: 600 },
          // Then the lamps come on for the Night.
          { targets: dusk, to: { alpha: 0 }, at: 850, ms: 350 },
          {
            targets: moon,
            from: { y: MOON.y + RISE, alpha: 0 },
            to: { y: MOON.y, alpha: 1 },
            at: 450,
            ms: 750,
            ease: "Cubic.easeOut"
          }
        ]
    this.transit("night", moves, () => this.scene.start("couch"))
  }

  /**
   * Plays a transition's moves, with a tap anywhere skipping to their end,
   * then `done`.
   */
  private transit(to: TimeOfDay, moves: Move[], done: () => void) {
    presentation.transition = { to, crossfade: settings.reducedMotion }
    const blocker = this.add
      .zone(0, 0, WIDTH, HEIGHT)
      .setOrigin(0)
      .setInteractive()
    for (const { targets, from } of moves)
      if (from)
        for (const target of [targets].flat()) Object.assign(target, from)
    const tweens = moves.map(
      ({ targets, to, at, ms, ease = "Sine.easeInOut" }) =>
        this.tweens.add({ targets, ...to, delay: at, duration: ms, ease })
    )
    const finish = () => {
      if (this.transition !== transition) return
      this.transition = null
      clock.remove()
      for (const tween of tweens) tween.remove()
      for (const { targets, to } of moves)
        for (const target of [targets].flat()) Object.assign(target, to)
      blocker.destroy()
      presentation.transition = null
      done()
    }
    const transition = { skip: finish }
    this.transition = transition
    // Timed like its tweens, which keep time even when frames are slow.
    const clock = this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: TRANSITION_MS,
      onComplete: finish
    })
    blocker.on("pointerdown", finish)
  }
}
