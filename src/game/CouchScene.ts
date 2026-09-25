import Phaser from "phaser"
import { art, gatheringArt, moonArt } from "../art/manifest"
import {
  type Action,
  type ActiveGathering,
  applyAction,
  type Cat,
  type CatId,
  type DisasterId,
  disasterById,
  type HouseCatId,
  houseCat,
  previewPlay,
  type Run,
  type RunEvent,
  type ScoreBreakdown
} from "../engine"
import { settings } from "../shell/settings"
import { addArt } from "./art"
import { drawCat } from "./characters"
import { presentation } from "./presentation"
import { session } from "./session"
import { drawShelf, shelfNotes, tapShelf } from "./shelfView"

/** The portrait layout's logical size; the canvas renders it at `RESOLUTION`×. */
export const WIDTH = 390
export const HEIGHT = 844
export const RESOLUTION = 2

/** The top of the Shelf's plank, a windowsill above the Couch. */
const SHELF_Y = 186
const SHELF_CAT_SIZE = 48
/** Centre of tonight's Disaster sign, between the Draw pile and the Redraws. */
const DISASTER_SIGN = { x: 208, y: 101 }
/** Where the window's centre, its moon, the Couch's feet, and the rug's centre are. */
const WINDOW_Y = 151
const MOON = { x: 245, y: 136 }
const COUCH_FLOOR_Y = 428
const RUG_Y = 627.5
const SEAT_Y = 352
/** Each Seat's tap and drop area, around its centre. */
const SEAT_AREA = { w: 68, h: 110, dy: -10 }
const HAND_COLUMNS = 4
const HAND_ROW_Y = 585
const HAND_ROW_HEIGHT = 105
const PREVIEW_Y = 446
const BREAKDOWN_Y = 486
const PLAY_BUTTON = { x: 135, y: 790, w: 230, h: 58 }
const REDRAW_BUTTON = { x: 316, y: 790, w: 108, h: 58 }
/** How far a press must move before it picks the Cat up rather than tapping. */
const DRAG_THRESHOLD = 8
/** How long the final Play's Score lingers before the lights go down. */
const LIGHTS_OUT_DELAY = 1200
/** The first Cat nods off this long after the lights go down... */
const FIRST_NOD = 400
/** ...and the last this long after the first, however many there are. */
const NODDING_SPREAD = 1200
const NOD_DURATION = 500
/** How long a "New Gathering!" banner holds the wall at 1×. */
const BANNER_MS = 2000
/** From the end of the Run's last scoring sequence until the Cats are all asleep. */
const SLEEP_MOMENT_MS =
  LIGHTS_OUT_DELAY + FIRST_NOD + NODDING_SPREAD + NOD_DURATION + 300

type Add = <T extends Phaser.GameObjects.GameObject>(object: T) => T
type Point = { x: number; y: number }
/** What a press began on: a Hand Cat, or a Seat (and whoever sits there). */
type PressTarget = { cat: CatId } | { seat: number }
/** How a scoring sequence ends: played out, skipped, or overtaken by a new one. */
type Ending = "played" | "skipped" | "overtaken"

/** Where the `i`th Cat of the Hand not on the Couch sits on the rug. */
const handSpot = (i: number) => ({
  x: 60 + (i % HAND_COLUMNS) * 90,
  y: HAND_ROW_Y + Math.floor(i / HAND_COLUMNS) * HAND_ROW_HEIGHT
})

/** Seat centres, spread evenly between the Couch's arms. */
const seatX = (seats: number) =>
  Array.from({ length: seats }, (_, seat) => 20 + (350 / seats) * (seat + 0.5))

/** Splits sorted Seats into stretches of consecutive Seats. */
const contiguous = (seats: number[]) =>
  seats.reduce<number[][]>((groups, seat) => {
    const last = groups.at(-1)
    if (last && last.at(-1) === seat - 1) last.push(seat)
    else groups.push([seat])
    return groups
  }, [])

/**
 * Where a Play's Mult comes from, as a sum and then any × effects; nothing
 * when it is the plain starting 1.
 */
function multBreakdown({
  gatherings,
  wholePlayEffects,
  scoringEvents,
  timesEffects,
  mult
}: ScoreBreakdown) {
  // Mult added as Cats score, totalled for each House Cat adding it.
  const perScore = new Map<string, number>()
  for (const { name, mult } of scoringEvents.flatMap((e) => e.multFrom))
    perScore.set(name, (perScore.get(name) ?? 0) + mult)
  const sources = [
    ...[...gatherings, ...wholePlayEffects].map(
      ({ name, mult }) => `${name} ${mult}`
    ),
    ...[...perScore].map(([name, mult]) => `${name} ${mult}`)
  ]
  if (sources.length + timesEffects.length === 0) return ""
  const added = ["1", ...sources].join(" + ")
  const times = timesEffects.map(
    ({ name, times }) => ` × ${name} ${times.toFixed(1)}`
  )
  return `${times.length ? `(${added})` : added}${times.join("")} = ${mult.toFixed(1)} Mult`
}

/** Purr × Mult, as the preview and the scoring sequence both show it. */
const purrTimesMult = (purr: number, mult: number) =>
  `${purr} Purr × ${mult.toFixed(1)}`

/** The red of a Disaster, wherever one is announced. */
export const DISASTER_RED = 0x8a3a2e

export const font = (size: number, colour = "#4a3426", weight = "600") => ({
  fontFamily: "system-ui, sans-serif",
  fontSize: `${size}px`,
  fontStyle: weight,
  color: colour,
  resolution: RESOLUTION
})

/**
 * The living room: the Couch, the Hand, the live Purr preview, and Play. It
 * draws the Session's Run and sends taps and drags to it as actions, and
 * animates the events a Play returns; it computes no rule.
 */
export class CouchScene extends Phaser.Scene {
  /** The Cat picked up from the Hand, waiting for a Seat. */
  private held: CatId | null = null
  /** The House Cat picked up from the Shelf, waiting for another position. */
  private heldHouseCat: HouseCatId | null = null
  /** The last Play's Couch, where its Cats doze off once the Run ends. */
  private lastCouch: (CatId | null)[] = []
  /** The Cats chosen to Redraw, or null when not choosing. */
  private redrawing: CatId[] | null = null
  /** A press on a Hand Cat or a Seat, until it becomes a tap or a drag. */
  private press: { target: PressTarget; at: Point } | null = null
  /** The Cat being dragged, following the pointer. */
  private dragging: CatId | null = null
  /** Every Cat drawn, so it can be dragged or moved from where it was. */
  private sprites = new Map<CatId, Phaser.GameObjects.Container>()
  /** Where each Cat was drawn before a rearrangement, to move it from there. */
  private movedFrom = new Map<CatId, Point>()
  /** The Run as last drawn: where a Play's scoring sequence starts from. */
  private lastDrawn!: Run
  /** The scoring sequence playing out, if any. */
  private scoring: { finish: (ending: Ending) => void } | null = null
  private bedtime: Phaser.Time.TimerEvent | null = null
  private skipArea!: Phaser.GameObjects.Zone
  private layer!: Phaser.GameObjects.Container
  /** The sign naming tonight's Disaster, when there is one. */
  private disasterSign: Phaser.GameObjects.Container | null = null
  private seatX: number[] = []

  constructor() {
    super("couch")
  }

  create() {
    // The Shop may already be open, as when the Run is resumed there.
    if (session.run.shop) {
      this.scene.start("shop")
      return
    }
    // Back from the Shop, the scene starts afresh.
    this.held = null
    this.heldHouseCat = null
    this.lastCouch = []
    this.redrawing = null
    this.press = null
    this.dragging = null
    this.sprites.clear()
    this.movedFrom.clear()
    this.scoring = null
    this.bedtime = null
    this.cameras.main.setZoom(RESOLUTION).centerOn(WIDTH / 2, HEIGHT / 2)
    this.seatX = seatX(session.run.config.seats)
    this.lastDrawn = session.run
    this.drawRoom()
    this.layer = this.add.container()
    this.seatX.forEach((x, seat) => {
      this.add
        .zone(x, SEAT_Y + SEAT_AREA.dy, SEAT_AREA.w, SEAT_AREA.h)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", (pointer: Phaser.Input.Pointer) =>
          this.startPress(pointer, { seat })
        )
    })
    this.add
      .zone(PLAY_BUTTON.x, PLAY_BUTTON.y, PLAY_BUTTON.w, PLAY_BUTTON.h)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.tapPlay())
    this.add
      .zone(REDRAW_BUTTON.x, REDRAW_BUTTON.y, REDRAW_BUTTON.w, REDRAW_BUTTON.h)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.tapRedraw())
    // Over everything, but listening only while a scoring sequence plays.
    this.skipArea = this.add
      .zone(0, 0, WIDTH, HEIGHT)
      .setOrigin(0)
      .setInteractive()
      .on("pointerdown", () => this.scoring?.finish("skipped"))
    this.skipArea.disableInteractive()
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) =>
      this.movePress(pointer)
    )
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) =>
      this.endPress(pointer)
    )
    // Let go off the canvas, even over the shell's settings button.
    this.input.on("pointerupoutside", () => this.cancelPress())
    const off = session.on((events) => {
      // A sequence still playing is overtaken: it ends at its final state.
      this.scoring?.finish("overtaken")
      this.bedtime?.remove()
      // A cleared Night's sequence opens the Shop when it finishes; opened
      // any other way, the Shop takes over at once.
      const shopOpened = events.some((event) => event.type === "shopOpened")
      if (session.run.shop && !shopOpened) {
        this.scene.start("shop")
        return
      }
      const before = this.lastDrawn
      this.lastDrawn = session.run
      if (events.length === 0) {
        this.held = null
        this.heldHouseCat = null
        this.lastCouch = []
        presentation.update({ asleep: false })
      }
      this.redrawing = null
      this.press = null
      this.dragging = null
      if (events.some((event) => event.type === "scoreTotal"))
        this.playScoring(before, events)
      else this.draw()
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      off()
      // Leaving for the Shop, a sequence still playing goes with the scene.
      if (this.scoring) {
        this.scoring = null
        presentation.update({ scoring: false })
      }
    })
    this.draw()
    // Arriving once the Run is over, the household is already asleep.
    if (session.run.status !== "playing") presentation.update({ asleep: true })
  }

  private worldPoint(pointer: Phaser.Input.Pointer): Point {
    const { x, y } = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    return { x, y }
  }

  /** The Seat whose area holds a point, if any. */
  private seatAt({ x, y }: Point) {
    const top = SEAT_Y + SEAT_AREA.dy - SEAT_AREA.h / 2
    if (y < top || y > top + SEAT_AREA.h) return null
    const seat = this.seatX.findIndex(
      (centre) => Math.abs(x - centre) <= SEAT_AREA.w / 2
    )
    return seat === -1 ? null : seat
  }

  private startPress(pointer: Phaser.Input.Pointer, target: PressTarget) {
    this.press = { target, at: this.worldPoint(pointer) }
  }

  /** Picks a pressed Cat up once the press moves far enough, then carries it. */
  private movePress(pointer: Phaser.Input.Pointer) {
    const at = this.worldPoint(pointer)
    if (this.dragging) {
      this.sprites.get(this.dragging)?.setPosition(at.x, at.y)
      return
    }
    const { press } = this
    if (!press || !pointer.isDown || this.redrawing) return
    const { target } = press
    const cat =
      "cat" in target ? target.cat : session.run.night.couch[target.seat]
    if (
      !cat ||
      Phaser.Math.Distance.BetweenPoints(press.at, at) < DRAG_THRESHOLD
    )
      return
    this.press = null
    this.held = null
    this.dragging = cat
    this.draw()
    this.sprites.get(cat)?.setPosition(at.x, at.y).setScale(1.1)
  }

  /** A press let go: a dragged Cat drops, otherwise it was a tap. */
  private endPress(pointer: Phaser.Input.Pointer) {
    const { press, dragging } = this
    this.press = null
    if (dragging) {
      this.dragging = null
      this.drop(dragging, this.worldPoint(pointer))
    } else if (press) {
      if ("cat" in press.target) this.tapHandCat(press.target.cat)
      else this.tapSeat(press.target.seat)
    }
  }

  /** A press let go off the canvas: no tap, and a dragged Cat goes back. */
  private cancelPress() {
    this.press = null
    if (!this.dragging) return
    this.dragging = null
    this.rearrange(null)
  }

  /**
   * A dragged Cat dropped on a Seat takes it, trading places with a seated
   * Cat as a tap would; dropped off the Couch it goes back to the Hand.
   */
  private drop(cat: CatId, at: Point) {
    const seat = this.seatAt(at)
    const from = session.run.night.couch.indexOf(cat)
    this.rearrange(
      seat !== null && seat !== from
        ? { type: "place", cat, seat }
        : seat === null && from !== -1
          ? { type: "unseat", cat }
          : null,
      { cat, at }
    )
  }

  /**
   * Applies a Couch action with every Cat moving from where it was drawn, a
   * dropped Cat from where it was let go; with no action, or a rejected one,
   * the Cats move back.
   */
  private rearrange(
    action: Action | null,
    dropped?: { cat: CatId; at: Point }
  ) {
    for (const [cat, sprite] of this.sprites)
      this.movedFrom.set(cat, { x: sprite.x, y: sprite.y })
    if (dropped) this.movedFrom.set(dropped.cat, dropped.at)
    if (!action || !session.apply(action).ok) {
      this.draw()
      // A Seat refused while tonight's Couch holds fewer Cats than it has
      // Seats points at the Disaster limiting it.
      const { night } = session.run
      if (action?.type === "place" && night.catsPerPlay < night.couch.length)
        this.nudgeDisasterSign()
    }
    this.movedFrom.clear()
  }

  private tapSeat(seat: number) {
    const occupant = session.run.night.couch[seat]
    this.heldHouseCat = null
    if (this.redrawing) {
      if (occupant) this.chooseForRedraw(occupant)
    } else if (this.held) {
      const cat = this.held
      this.held = null
      this.rearrange({ type: "place", cat, seat })
    } else if (occupant) {
      this.rearrange({ type: "unseat", cat: occupant })
    }
  }

  private tapHandCat(cat: CatId) {
    this.heldHouseCat = null
    if (this.redrawing) return this.chooseForRedraw(cat)
    this.held = this.held === cat ? null : cat
    this.draw()
  }

  /** Picks a House Cat up from the Shelf, or puts one down in another position. */
  private tapShelfPosition(position: number) {
    if (this.redrawing) return
    this.held = null
    const { held, action } = tapShelf(session.run, this.heldHouseCat, position)
    this.heldHouseCat = held
    if (!action || !session.apply(action).ok) this.draw()
  }

  /** Plays, or while choosing Cats to Redraw, stops choosing. */
  private tapPlay() {
    this.held = null
    this.heldHouseCat = null
    if (this.redrawing) {
      this.redrawing = null
      this.draw()
    } else {
      session.apply({ type: "play" })
    }
  }

  /** Starts choosing Cats to Redraw, then swaps the chosen Cats. */
  private tapRedraw() {
    this.held = null
    this.heldHouseCat = null
    if (!this.redrawing) {
      if (!this.canRedraw()) return
      this.redrawing = []
      this.draw()
    } else {
      session.apply({ type: "redraw", cats: this.redrawing })
    }
  }

  /** Toggles a Cat in or out of the Redraw, as far as the engine allows. */
  private chooseForRedraw(cat: CatId) {
    const chosen = this.redrawing ?? []
    const next = chosen.includes(cat)
      ? chosen.filter((c) => c !== cat)
      : [...chosen, cat]
    if (
      next.length < chosen.length ||
      applyAction(session.run, { type: "redraw", cats: next }).ok
    ) {
      this.redrawing = next
      this.draw()
    }
  }

  /** Whether any Redraw is possible now; the engine decides. */
  private canRedraw() {
    const { hand } = session.run.night
    return (
      hand.length > 0 &&
      applyAction(session.run, { type: "redraw", cats: [hand[0]] }).ok
    )
  }

  /** The static living room: wall, window, rug, and the Couch itself. */
  private drawRoom() {
    addArt(this, art.room.wall)
    addArt(this, art.room.rug, WIDTH / 2, RUG_Y)
    // Window with a moon, since every Night is spent indoors; the Shelf is
    // its sill. The moon keeps to the first Night's crescent for now.
    addArt(this, art.room.window, WIDTH / 2, WINDOW_Y)
    addArt(this, moonArt(1), MOON.x, MOON.y)
    addArt(this, art.room.couch, WIDTH / 2, COUCH_FLOOR_Y)
  }

  /** Empties the layer the Run is drawn on, returning how to add to it. */
  private clearLayer(): Add {
    this.tweens.killTweensOf(this.layer.list)
    this.layer.removeAll(true)
    this.sprites.clear()
    return (object) => {
      this.layer.add(object)
      return object
    }
  }

  /**
   * Draws a Cat at its spot, moving from wherever it was before the last
   * rearrangement; a Cat arriving on a Seat snaps into it with a bounce.
   */
  private drawCatAt(
    add: Add,
    cat: Cat,
    size: number,
    to: Point,
    seated: boolean
  ) {
    const sprite = add(drawCat(this, cat, size)).setPosition(to.x, to.y)
    this.sprites.set(cat.id, sprite)
    const from = this.movedFrom.get(cat.id)
    if (!from || (from.x === to.x && from.y === to.y)) return sprite
    sprite.setPosition(from.x, from.y)
    this.tweens.add({
      targets: sprite,
      x: to.x,
      y: to.y,
      duration: seated ? 170 : 220,
      ease: seated ? "Quad.easeIn" : "Quad.easeOut"
    })
    if (seated)
      this.tweens.add({
        targets: sprite,
        scaleX: { from: 1.22, to: 1 },
        scaleY: { from: 0.8, to: 1 },
        delay: 170,
        duration: 420,
        ease: "Bounce.easeOut"
      })
    return sprite
  }

  /**
   * A Cat grown past the base Purr it started with wears its base Purr in a
   * starry badge, so The Void's work shows wherever the Cat goes.
   */
  private drawGrowth(add: Add, cat: Cat, x: number, y: number) {
    if (cat.basePurr === session.run.config.basePurr) return
    const label = this.add
      .text(x, y, `${cat.basePurr}`, font(11, "#f6d743", "900"))
      .setOrigin(0.5)
    add(this.add.graphics())
      .fillStyle(0x141018, 0.92)
      .fillRoundedRect(x - label.width / 2 - 6, y - 9, label.width + 12, 18, 9)
    add(label)
  }

  /**
   * The HUD: Night, Plays, Treats, and progress toward the Target. Returns
   * how to show a different Night score, for counting up during scoring.
   */
  private drawHud(run: Run, add: Add) {
    const { night } = run
    add(
      this.add.text(
        20,
        22,
        `Night ${night.number}/${run.config.nights}`,
        font(24, "#4a3426", "800")
      )
    )
    const treats = add(
      this.add
        .text(WIDTH - 20, 26, `Treats ${run.treats}`, font(18))
        .setOrigin(1, 0)
    )
    add(
      this.add
        .text(
          treats.x - treats.width - 18,
          26,
          `Plays ${night.playsLeft}`,
          font(18)
        )
        .setOrigin(1, 0)
    )
    const bar = add(this.add.graphics())
    const progress = add(this.add.text(WIDTH / 2, 73, "", font(14)))
    progress.setOrigin(0.5)
    const showScore = (score: number) => {
      const filled = Math.min(1, score / night.target)
      bar.clear()
      bar.fillStyle(0xe0c49d, 1).fillRoundedRect(20, 62, WIDTH - 40, 22, 11)
      if (filled > 0)
        bar
          .fillStyle(0xe8893a, 1)
          .fillRoundedRect(20, 62, Math.max(22, (WIDTH - 40) * filled), 22, 11)
      progress.setText(`Score ${score} / Target ${night.target}`)
    }
    showScore(night.score)
    add(this.add.text(20, 94, `Draw pile ${night.drawPile.length}`, font(15)))
    add(
      this.add
        .text(WIDTH - 20, 94, `Redraws ${night.redrawsLeft}`, font(15))
        .setOrigin(1, 0)
    )
    this.disasterSign = night.disaster
      ? add(this.drawDisasterSign(night.disaster))
      : null
    return showScore
  }

  /**
   * A sign naming tonight's Disaster and the rule it changes, hung between
   * the Draw pile and the Redraws, clear of the Shelf below.
   */
  private drawDisasterSign(id: DisasterId) {
    const { name, rule } = disasterById(id)
    const texts = [
      this.add.text(0, -7, name, font(12, "#fdf6ea", "800")).setOrigin(0.5),
      this.add.text(0, 7, rule, font(11, "#fdf6ea")).setOrigin(0.5)
    ]
    const w = Math.max(...texts.map((text) => text.width)) + 16
    const board = this.add.graphics()
    board.fillStyle(DISASTER_RED, 1).fillRoundedRect(-w / 2, -15, w, 30, 10)
    board.lineStyle(2, 0xf0b28c, 1).strokeRoundedRect(-w / 2, -15, w, 30, 10)
    return this.add.container(DISASTER_SIGN.x, DISASTER_SIGN.y, [
      board,
      ...texts
    ])
  }

  /** Gives the Disaster sign a shake. */
  private nudgeDisasterSign() {
    const sign = this.disasterSign
    if (!sign) return
    this.tweens.add({
      targets: sign,
      x: { from: sign.x - 6, to: sign.x },
      duration: 320,
      ease: "Elastic.easeOut"
    })
  }

  /**
   * Redraws everything that follows the Run: HUD, seated Cats, preview, Hand;
   * or, once the Run is over, the household asleep (`fallingAsleep` animates it).
   */
  private draw(fallingAsleep = false) {
    const add = this.clearLayer()
    const { run } = session
    const { night } = run
    const catById = new Map(run.roster.map((cat) => [cat.id, cat]))
    this.drawHud(run, add)

    if (run.status !== "playing") {
      drawShelf(this, add, { run, y: SHELF_Y, size: SHELF_CAT_SIZE })
      this.drawAsleep(add, catById, fallingAsleep)
      return
    }

    // The Shelf, each House Cat noting what it adds to the Play as it stands.
    const preview = previewPlay(run)
    drawShelf(this, add, {
      run,
      y: SHELF_Y,
      size: SHELF_CAT_SIZE,
      held: this.heldHouseCat,
      notes: shelfNotes(run, preview),
      onTap: (position) => this.tapShelfPosition(position)
    })

    // A Cat chosen to Redraw glows cool, like one about to leave.
    const chosen = new Set(this.redrawing)
    const markChosen = (x: number, y: number) => {
      const mark = add(this.add.graphics())
      mark
        .fillStyle(0xc9dcf2, 0.95)
        .fillRoundedRect(x - 40, y - 52, 80, 100, 16)
      mark
        .lineStyle(3, 0x4f79a8, 1)
        .strokeRoundedRect(x - 40, y - 52, 80, 100, 16)
    }

    // Seated Cats with their live Personality bonus floating above, inside
    // whichever Gatherings they form. A Cat being dragged leaves its labels.
    this.drawGatherings(add, preview.gatherings, "behind")
    for (const event of preview.scoringEvents) {
      // A Cat's Repeats score where it sits; it is drawn once.
      if (event.source !== "seat") continue
      const cat = catById.get(event.cat)!
      const x = this.seatX[event.seat]
      if (chosen.has(event.cat)) markChosen(x, SEAT_Y - 4)
      this.drawCatAt(add, cat, 64, { x, y: SEAT_Y - 12 }, true)
      if (event.cat === this.dragging) continue
      this.drawGrowth(add, cat, x - 22, SEAT_Y - 44)
      add(
        this.add
          .text(
            x,
            SEAT_Y + 38,
            cat.name,
            font(11, chosen.has(event.cat) ? "#4a3426" : "#f6f1e4")
          )
          .setOrigin(0.5)
      )
      // With Repeats, how many times the Cat will score.
      const scores = preview.scoringEvents.filter(
        (e) => e.cat === event.cat
      ).length
      add(
        this.add
          .text(
            x,
            SEAT_Y - 72,
            `+${event.bonus}${scores > 1 ? ` ×${scores}` : ""}`,
            font(18, event.bonus > 0 ? "#c2410c" : "#b9a58f", "800")
          )
          .setOrigin(0.5)
      )
    }
    this.drawGatherings(add, preview.gatherings, "over")

    // Live preview: Purr × Mult = Score, and where it would leave the Night.
    add(
      this.add
        .text(
          WIDTH / 2,
          PREVIEW_Y,
          this.redrawing
            ? `Choose up to ${run.config.catsPerRedraw} Cats to Redraw`
            : preview.scoringEvents.length
              ? `${purrTimesMult(preview.purr, preview.mult)} = ${preview.score}`
              : "Tap or drag a Cat to a Seat",
          font(20, "#4a3426", "800")
        )
        .setOrigin(0.5)
    )
    // Beneath it, where the Mult comes from; or what a House Cat picked up
    // from the Shelf does.
    const picked = this.heldHouseCat && houseCat(this.heldHouseCat)
    const breakdown = picked
      ? `${picked.name}: ${picked.ability}. Tap elsewhere on the Shelf to move it.`
      : multBreakdown(preview)
    if (breakdown)
      add(
        this.add
          .text(WIDTH / 2, BREAKDOWN_Y, breakdown, {
            ...font(13, "#fdf6ea", "700"),
            align: "center",
            wordWrap: { width: WIDTH - 30 }
          })
          .setOrigin(0.5)
      )

    // The Hand's Cats not yet on the Couch.
    const seated = new Set(night.couch)
    night.hand
      .filter((id) => !seated.has(id))
      .forEach((id, i) => {
        const cat = catById.get(id)!
        const { x, y } = handSpot(i)
        const held = id === this.held
        if (chosen.has(id)) markChosen(x, y - 10)
        if (held) {
          const glow = add(this.add.graphics())
          glow
            .fillStyle(0xfff4c2, 0.9)
            .fillRoundedRect(x - 42, y - 62, 84, 104, 16)
        }
        this.drawCatAt(add, cat, 72, { x, y: y - (held ? 10 : 0) }, false)
          .setSize(84, 100)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", (pointer: Phaser.Input.Pointer) =>
            this.startPress(pointer, { cat: id })
          )
        if (id === this.dragging) return
        this.drawGrowth(add, cat, x - 26, y - 40)
        add(
          this.add
            .text(
              x,
              y + 30,
              cat.name,
              font(12, held || chosen.has(id) ? "#4a3426" : "#fdf6ea")
            )
            .setOrigin(0.5)
        )
      })

    // Play: "Get Comfy", dimmed until a Cat is on the Couch; while choosing
    // Cats to Redraw it backs out instead. Beside it, Redraw, then the swap.
    const choosing = this.redrawing
    this.drawButton(
      PLAY_BUTTON,
      choosing ? "Cancel" : "Get Comfy",
      choosing !== null || applyAction(run, { type: "play" }).ok,
      add
    )
    this.drawButton(
      REDRAW_BUTTON,
      choosing ? `Swap ${choosing.length}` : "Redraw",
      choosing
        ? applyAction(run, { type: "redraw", cats: choosing }).ok
        : this.canRedraw(),
      add
    )
    // A Cat being dragged is carried over everything else.
    const carried = this.dragging && this.sprites.get(this.dragging)
    if (carried) this.layer.bringToTop(carried)
  }

  private drawButton(
    area: typeof PLAY_BUTTON,
    label: string,
    ready: boolean,
    add: Add
  ) {
    const button =
      area === PLAY_BUTTON ? art.playButton(ready) : art.redrawButton(ready)
    add(addArt(this, button, area.x, area.y))
    add(
      this.add
        .text(
          area.x,
          area.y,
          label,
          font(22, ready ? "#fdf6ea" : "#e6d8c6", "800")
        )
        .setOrigin(0.5)
    )
  }

  /**
   * The Run is over: the lights go down and every Cat dozes off where it is,
   * the last Play's Cats on the Couch and the rest of the Hand on the rug.
   */
  private drawAsleep(add: Add, catById: Map<CatId, Cat>, animate: boolean) {
    const { night } = session.run
    const sleepers: { cat: Cat; x: number; y: number; size: number }[] = []
    this.lastCouch.forEach((id, seat) => {
      if (id)
        sleepers.push({
          cat: catById.get(id)!,
          x: this.seatX[seat],
          y: SEAT_Y - 12,
          size: 64
        })
    })
    const onCouch = new Set(this.lastCouch)
    night.hand
      .filter((id) => !onCouch.has(id))
      .forEach((id, i) => {
        sleepers.push({ cat: catById.get(id)!, ...handSpot(i), size: 72 })
      })

    const dusk = add(
      this.add.rectangle(0, 0, WIDTH, HEIGHT, 0x1b1633).setOrigin(0)
    ).setAlpha(animate ? 0 : 0.55)
    if (animate)
      this.tweens.add({
        targets: dusk,
        alpha: 0.55,
        delay: LIGHTS_OUT_DELAY,
        duration: 1400
      })
    sleepers.forEach(({ cat, x, y, size }, i) => {
      // Each Cat nods off a moment after the one before it.
      const nodOff =
        LIGHTS_OUT_DELAY +
        FIRST_NOD +
        (NODDING_SPREAD * i) / Math.max(1, sleepers.length - 1)
      const asleep = add(drawCat(this, cat, size, { asleep: true }))
      asleep.setPosition(x, y)
      if (animate) {
        const awake = add(drawCat(this, cat, size)).setPosition(x, y)
        asleep.setAlpha(0)
        this.tweens.add({
          targets: awake,
          alpha: 0,
          delay: nodOff,
          duration: NOD_DURATION
        })
        this.tweens.add({
          targets: asleep,
          alpha: 1,
          delay: nodOff,
          duration: NOD_DURATION
        })
      }
      const z = add(
        this.add
          .text(
            x + size * 0.3,
            y - size * 0.45,
            "z",
            font(16, "#dfe3ff", "800")
          )
          .setAlpha(0)
      )
      this.tweens.add({
        targets: z,
        alpha: { from: 1, to: 0 },
        y: z.y - 28,
        x: z.x + 10,
        delay: (animate ? nodOff : 0) + (i % 3) * 400,
        duration: 1600,
        repeat: -1
      })
    })
  }

  /**
   * Shows each active Gathering on the Couch itself, named: a blanket over a
   * Cuddle Puddle, Zs over a Nap Club, a bubble around each Cat with Personal
   * Space, bunting for a Variety Pack, and a glow round a Full Sofa. Drawn in
   * two layers, since blankets go over the Cats and the rest behind. Names
   * stack upward, the first `stack` places above the lowest.
   */
  private drawGatherings(
    add: Add,
    active: ActiveGathering[],
    layer: "behind" | "over",
    stack = 0
  ) {
    const overlay = (key: string, x: number, y: number) =>
      add(addArt(this, key, x, y))
    /** Midway along a stretch of Seats. */
    const across = (seats: number[]) =>
      (this.seatX[seats[0]] + this.seatX[seats.at(-1)!]) / 2
    for (const { gathering, seats } of active) {
      const groups = contiguous(seats)
      const span = seats.at(-1)! - seats[0] + 1
      if (layer === "behind") {
        if (gathering === "fullSofa")
          overlay(gatheringArt(gathering), WIDTH / 2, 337)
        if (gathering === "personalSpace")
          for (const seat of seats)
            overlay(gatheringArt(gathering), this.seatX[seat], SEAT_Y - 14)
        if (gathering === "varietyPack")
          overlay(gatheringArt(gathering, span), across(seats), 249)
      } else {
        if (gathering === "cuddlePuddle")
          for (const group of groups)
            overlay(
              gatheringArt(gathering, group.length),
              across(group),
              SEAT_Y + 21
            )
        if (gathering === "napClub")
          for (const group of groups)
            for (const seat of group.slice(1)) {
              const x = (this.seatX[seat - 1] + this.seatX[seat]) / 2
              const z = overlay(gatheringArt(gathering), x, SEAT_Y - 52)
              this.tweens.add({
                targets: z,
                y: SEAT_Y - 58,
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut"
              })
            }
      }
    }
    if (layer === "behind") return

    // Each Gathering's name, stacked above the Seats that form it.
    active.forEach(({ name, mult, seats }, i) => {
      const x =
        (Math.max(55, this.seatX[seats[0]]) +
          Math.min(WIDTH - 55, this.seatX[seats.at(-1)!])) /
        2
      const y = 240 - (stack + i) * 24
      const label = add(
        this.add
          .text(x, y, `${name} +${mult}`, font(13, "#4a3426", "800"))
          .setOrigin(0.5)
      )
      add(this.add.graphics())
        .fillStyle(0xfff4dc, 0.95)
        .fillRoundedRect(
          x - label.width / 2 - 8,
          y - 11,
          label.width + 16,
          22,
          11
        )
      this.layer.bringToTop(label)
    })
  }

  /**
   * Plays out a Play's events over the Couch as it was committed: Gatherings
   * appear, each Cat scores left to right, × effects fire, and the Score
   * counts up toward the Target; then the Night as it now stands. Paced by
   * the scoring speed setting; a tap skips to the end.
   */
  private playScoring(before: Run, events: RunEvent[]) {
    const beat = (ms: number) => ms / settings.scoringSpeed
    const add = this.clearLayer()
    const showScore = this.drawHud(before, add)
    const catById = new Map(before.roster.map((cat) => [cat.id, cat]))
    this.lastCouch = before.night.couch

    // The committed Couch, and the rest of the Hand waiting on the rug.
    const seated = new Map<number, Phaser.GameObjects.Container>()
    before.night.couch.forEach((id, seat) => {
      if (!id) return
      const cat = catById.get(id)!
      const x = this.seatX[seat]
      seated.set(seat, add(drawCat(this, cat, 64)).setPosition(x, SEAT_Y - 12))
      add(
        this.add
          .text(x, SEAT_Y + 38, cat.name, font(11, "#f6f1e4"))
          .setOrigin(0.5)
      )
    })
    const onCouch = new Set(before.night.couch)
    before.night.hand
      .filter((id) => !onCouch.has(id))
      .forEach((id, i) => {
        const cat = catById.get(id)!
        const { x, y } = handSpot(i)
        add(drawCat(this, cat, 72)).setPosition(x, y)
        add(
          this.add.text(x, y + 30, cat.name, font(12, "#fdf6ea")).setOrigin(0.5)
        )
      })
    this.drawButton(PLAY_BUTTON, "Get Comfy", false, add)
    this.drawButton(REDRAW_BUTTON, "Redraw", false, add)
    const shelved = drawShelf(this, add, {
      run: before,
      y: SHELF_Y,
      size: SHELF_CAT_SIZE
    })

    // Purr × Mult so far, where the preview was.
    const tally = add(
      this.add
        .text(
          WIDTH / 2,
          PREVIEW_Y,
          purrTimesMult(0, 1),
          font(20, "#4a3426", "800")
        )
        .setOrigin(0.5)
    )
    const showTally = (text: string) => {
      tally.setText(text)
      this.tweens.add({
        targets: tally,
        scale: { from: 1.18, to: 1 },
        duration: beat(180),
        ease: "Quad.easeOut"
      })
    }
    const pop = (
      x: number,
      y: number,
      label: string,
      size: number,
      colour = "#c2410c"
    ) => {
      const text = add(
        this.add
          .text(x, y, label, font(size, colour, "900"))
          .setOrigin(0.5)
          .setStroke("#fff7e8", 5)
      )
      this.tweens.add({
        targets: text,
        scale: { from: 0.4, to: 1 },
        duration: beat(220),
        ease: "Back.easeOut"
      })
      this.tweens.add({
        targets: text,
        alpha: { from: 1, to: 0 },
        y: y - 40,
        delay: beat(250),
        duration: beat(900),
        ease: "Cubic.easeIn",
        onComplete: () => text.destroy()
      })
    }

    /**
     * A House Cat on the Shelf hops as its effect fires, from where it sits
     * however quickly its effects follow one another.
     */
    const home = new Map([...shelved].map(([id, sprite]) => [id, sprite.y]))
    const hop = (id: HouseCatId, label: string, colour?: string) => {
      const sprite = shelved.get(id)
      if (!sprite) return
      this.tweens.killTweensOf(sprite)
      sprite.setY(home.get(id)!).setScale(1)
      this.tweens.add({
        targets: sprite,
        y: sprite.y - 12,
        scaleX: 0.92,
        scaleY: 1.1,
        duration: beat(140),
        yoyo: true,
        ease: "Quad.easeOut"
      })
      pop(sprite.x, sprite.y - SHELF_CAT_SIZE * 0.6, label, 20, colour)
    }

    // Each event gets a beat of its own, in order.
    const timers: Phaser.Time.TimerEvent[] = []
    const counters: Phaser.Tweens.Tween[] = []
    let time = beat(250)
    const next = (duration: number, show: () => void) => {
      timers.push(this.time.delayedCall(time, show))
      time += beat(duration)
    }
    let gatherings = 0
    // "New Gathering!" banners, each waiting for the one before to leave.
    const banners: (() => void)[] = []
    let bannersFreeAt = 0
    for (const event of events) {
      switch (event.type) {
        case "gatheringActivated": {
          const stack = gatherings++
          const wait = Math.max(0, bannersFreeAt - time)
          if (event.firstTime) bannersFreeAt = time + wait + beat(BANNER_MS)
          next(500, () => {
            if (event.firstTime)
              banners.push(this.discover(event.name, wait, beat))
            this.revealGathering(add, event, stack, beat)
            showTally(purrTimesMult(event.tally.purr, event.tally.mult))
          })
          break
        }
        case "wholePlayEffect":
          next(500, () => {
            hop(event.houseCat, `+${event.mult} Mult`)
            showTally(purrTimesMult(event.tally.purr, event.tally.mult))
          })
          break
        case "catScored":
        case "repeat":
          next(380, () => {
            const x = this.seatX[event.seat]
            const sprite = seated.get(event.seat)
            if (sprite) {
              this.tweens.killTweensOf(sprite)
              sprite.setPosition(x, SEAT_Y - 12).setScale(1)
              this.tweens.add({
                targets: sprite,
                y: sprite.y - 14,
                scaleX: 0.92,
                scaleY: 1.1,
                duration: beat(120),
                yoyo: true,
                ease: "Quad.easeOut"
              })
            }
            // A Repeat is the same Cat scoring again, sent by a House Cat.
            if (event.source !== "seat") {
              hop(event.source, "Repeat!")
              pop(x, SEAT_Y - 128, "Repeat!", 15, "#6b4fb3")
            }
            pop(x, SEAT_Y - 72, `+${event.purr}`, 24)
            if (event.mult) pop(x, SEAT_Y - 100, `+${event.mult} Mult`, 16)
            for (const from of event.multFrom)
              hop(from.houseCat, `+${from.mult} Mult`)
            showTally(purrTimesMult(event.tally.purr, event.tally.mult))
          })
          break
        case "houseCatWarmedUp":
          // Freya warms up a little more, a heart at a time.
          next(600, () =>
            hop(event.houseCat, `♥ ×${event.times.toFixed(1)}`, "#d6456a")
          )
          break
        case "catGrew":
          // Grown for good: The Void's gift shows once the Score is in.
          next(450, () => {
            const x = this.seatX[event.seat]
            hop(event.houseCat, `+${event.purr} Purr`, "#6b4fb3")
            pop(x, SEAT_Y - 72, `${event.basePurr} base Purr`, 14, "#6b4fb3")
            const sprite = seated.get(event.seat)
            if (sprite)
              this.tweens.add({
                targets: sprite,
                scale: { from: 1.15, to: 1 },
                duration: beat(300),
                ease: "Back.easeOut"
              })
          })
          break
        case "timesEffect":
          next(500, () => {
            hop(event.houseCat, `×${event.times.toFixed(1)}`)
            showTally(purrTimesMult(event.tally.purr, event.tally.mult))
          })
          break
        case "scoreTotal":
          next(1000, () => {
            showTally(
              `${purrTimesMult(event.purr, event.mult)} = ${event.score}`
            )
            pop(WIDTH / 2, PREVIEW_Y - 36, `${event.score}!`, 34)
            counters.push(
              this.tweens.addCounter({
                from: before.night.score,
                to: event.nightScore,
                duration: beat(700),
                ease: "Cubic.easeOut",
                onUpdate: (tween) => showScore(Math.round(tween.getValue()!))
              })
            )
          })
          break
        case "nightCleared":
          next(500, () => pop(WIDTH / 2, 170, "Night cleared!", 34))
          break
        case "treatsAwarded":
          next(500, () => {
            pop(WIDTH / 2, 215, `+${event.treats} Treats`, 24)
            for (const paid of event.forHouseCats)
              hop(paid.houseCat, `+${paid.treats} Treats`)
          })
          break
        case "nightLost":
          next(500, () => pop(WIDTH / 2, 170, "Night lost", 30))
          break
      }
    }

    const ended = events.some((event) => event.type === "runEnded")
    const finish = (ending: Ending) => {
      if (this.scoring !== sequence) return
      this.scoring = null
      for (const timer of timers) timer.remove()
      for (const counter of counters) counter.stop()
      // Played out, a banner may take its bow; cut short, it goes at once.
      if (ending !== "played") for (const dismiss of banners) dismiss()
      this.skipArea.disableInteractive()
      presentation.update({ scoring: false })
      // Overtaken, the next sequence or draw shows what comes after.
      if (ending === "overtaken") return
      // The Night is cleared: its celebration is over, so off to the Shop.
      if (session.run.shop) {
        this.scene.start("shop")
        return
      }
      this.draw(ended)
      if (ended)
        this.bedtime = this.time.delayedCall(SLEEP_MOMENT_MS, () =>
          presentation.update({ asleep: true })
        )
    }
    const sequence = { finish }
    this.scoring = sequence
    timers.push(this.time.delayedCall(time + beat(300), () => finish("played")))
    this.skipArea.setInteractive()
    presentation.update({ scoring: true })
  }

  /** Brings one Gathering onto the Couch mid-sequence, its name `stack` high. */
  private revealGathering(
    add: Add,
    active: ActiveGathering,
    stack: number,
    beat: (ms: number) => number
  ) {
    const shown: Phaser.GameObjects.GameObject[] = []
    const collect: Add = (object) => {
      shown.push(add(object))
      return object
    }
    this.drawGatherings(collect, [active], "behind")
    // Blankets aside, a Gathering sits behind the Cats already seated.
    for (const object of shown) this.layer.sendToBack(object)
    this.drawGatherings(collect, [active], "over", stack)
    this.tweens.add({
      targets: shown,
      alpha: { from: 0, to: 1 },
      duration: beat(220)
    })
  }

  /**
   * The "New Gathering!" moment, the first time a Run activates one. Returns
   * how to dismiss it early.
   */
  private discover(name: string, delay: number, beat: (ms: number) => number) {
    const banner = this.add
      .container(WIDTH / 2, 130)
      .setAlpha(0)
      .setScale(0.6)
    const title = this.add
      .text(0, -14, "New Gathering!", font(26, "#c2410c", "900"))
      .setOrigin(0.5)
      .setStroke("#fff7e8", 6)
    const subtitle = this.add
      .text(0, 18, name, font(18, "#4a3426", "800"))
      .setOrigin(0.5)
      .setStroke("#fff7e8", 5)
    banner.add([title, subtitle])
    const chain = this.tweens.chain({
      targets: banner,
      tweens: [
        {
          alpha: 1,
          scale: 1,
          delay,
          duration: beat(280),
          ease: "Back.easeOut"
        },
        { alpha: 0, y: 100, delay: beat(1300), duration: beat(400) }
      ],
      onComplete: () => banner.destroy()
    })
    return () => {
      chain.stop()
      banner.destroy()
    }
  }
}
