import Phaser from "phaser"
import {
  type Action,
  type ActiveGathering,
  applyAction,
  type Cat,
  type CatId,
  previewPlay,
  type Run,
  type RunEvent
} from "../engine"
import { settings } from "../shell/settings"
import { drawCat } from "./catArt"
import { presentation } from "./presentation"
import { session } from "./session"

/** The portrait layout's logical size; the canvas renders it at `RESOLUTION`×. */
export const WIDTH = 390
export const HEIGHT = 844
export const RESOLUTION = 2

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

/** Purr × Mult, as the preview and the scoring sequence both show it. */
const purrTimesMult = (purr: number, mult: number) =>
  `${purr} Purr × ${mult.toFixed(1)}`

const font = (size: number, colour = "#4a3426", weight = "600") => ({
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
  private seatX: number[] = []

  constructor() {
    super("couch")
  }

  create() {
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
      const before = this.lastDrawn
      this.lastDrawn = session.run
      if (events.length === 0) {
        this.held = null
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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off)
    this.draw()
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
    if (!action || !session.apply(action).ok) this.draw()
    this.movedFrom.clear()
  }

  private tapSeat(seat: number) {
    const occupant = session.run.night.couch[seat]
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
    if (this.redrawing) return this.chooseForRedraw(cat)
    this.held = this.held === cat ? null : cat
    this.draw()
  }

  /** Plays, or while choosing Cats to Redraw, stops choosing. */
  private tapPlay() {
    this.held = null
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
    const g = this.add.graphics()
    g.fillStyle(0xf3dfc1, 1).fillRect(0, 0, WIDTH, HEIGHT)
    g.fillStyle(0xe9cfa9, 1)
    for (let x = 12; x < WIDTH; x += 36) g.fillRect(x, 0, 12, 470)
    g.fillStyle(0xb98b62, 1).fillRect(0, 470, WIDTH, HEIGHT - 470)
    g.fillStyle(0xa47650, 1).fillRect(0, 470, WIDTH, 8)
    g.fillStyle(0xd46a4f, 1).fillRoundedRect(20, 505, WIDTH - 40, 245, 28)
    g.lineStyle(3, 0xf0b28c, 1).strokeRoundedRect(32, 517, WIDTH - 64, 221, 22)
    // Window with a moon, since every Night is spent indoors.
    g.fillStyle(0x2d3561, 1).fillRoundedRect(250, 130, 110, 100, 8)
    g.fillStyle(0xf6ecc9, 1).fillCircle(320, 165, 16)
    g.fillStyle(0x2d3561, 1).fillCircle(328, 159, 14)
    g.lineStyle(6, 0xfaf3e6, 1).strokeRoundedRect(250, 130, 110, 100, 8)
    g.lineBetween(305, 130, 305, 230).lineBetween(250, 180, 360, 180)
    // Couch: back, five cushions, arms.
    g.fillStyle(0x6f8f72, 1).fillRoundedRect(8, 262, WIDTH - 16, 112, 22)
    g.fillStyle(0x5c7a5f, 1).fillRoundedRect(8, 372, WIDTH - 16, 40, 12)
    for (const x of this.seatX)
      g.fillStyle(0x86a888, 1).fillRoundedRect(x - 33, 300, 66, 80, 14)
    g.fillStyle(0x587558, 1)
    g.fillRoundedRect(0, 300, 22, 110, 10)
    g.fillRoundedRect(WIDTH - 22, 300, 22, 110, 10)
    g.fillStyle(0x4a3426, 1)
    g.fillRect(24, 410, 10, 18).fillRect(WIDTH - 34, 410, 10, 18)
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
    return showScore
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
      this.drawAsleep(add, catById, fallingAsleep)
      return
    }

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
    const preview = previewPlay(run)
    this.drawGatherings(add, preview.gatherings, "behind")
    for (const event of preview.scoringEvents) {
      const cat = catById.get(event.cat)!
      const x = this.seatX[event.seat]
      if (chosen.has(event.cat)) markChosen(x, SEAT_Y - 4)
      this.drawCatAt(add, cat, 64, { x, y: SEAT_Y - 12 }, true)
      if (event.cat === this.dragging) continue
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
      add(
        this.add
          .text(
            x,
            SEAT_Y - 72,
            `+${event.bonus}`,
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
    if (preview.gatherings.length)
      add(
        this.add
          .text(
            WIDTH / 2,
            BREAKDOWN_Y,
            [
              "1",
              ...preview.gatherings.map(({ name, mult }) => `${name} ${mult}`)
            ].join(" + ") + ` = ${preview.mult.toFixed(1)} Mult`,
            font(13, "#fdf6ea", "700")
          )
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
    add(this.add.graphics())
      .fillStyle(ready ? 0x4a3426 : 0x9c8672, 1)
      .fillRoundedRect(
        area.x - area.w / 2,
        area.y - area.h / 2,
        area.w,
        area.h,
        29
      )
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
    const g = add(this.add.graphics())
    for (const { gathering, seats } of active) {
      const groups = contiguous(seats)
      if (layer === "behind") {
        if (gathering === "fullSofa")
          g.lineStyle(5, 0xf6c453, 0.9).strokeRoundedRect(
            4,
            258,
            WIDTH - 8,
            158,
            24
          )
        if (gathering === "personalSpace")
          for (const seat of seats)
            g.fillStyle(0xdff1f7, 0.35)
              .fillCircle(this.seatX[seat], SEAT_Y - 14, 32)
              .lineStyle(2, 0xa7d3e3, 0.9)
              .strokeCircle(this.seatX[seat], SEAT_Y - 14, 32)
        if (gathering === "varietyPack") {
          const from = this.seatX[seats[0]] - 30
          const to = this.seatX[seats.at(-1)!] + 30
          const flags = [0xe8893a, 0x2e2a30, 0xf4efe6, 0x8d9099, 0xd46a4f]
          g.lineStyle(2, 0x7a5a3c, 1).lineBetween(from, 250, to, 250)
          for (let x = from + 8, i = 0; x < to - 8; x += 18, i++)
            g.fillStyle(flags[i % flags.length], 1).fillTriangle(
              x - 6,
              250,
              x + 6,
              250,
              x,
              262
            )
        }
      } else {
        if (gathering === "cuddlePuddle")
          for (const group of groups) {
            const from = this.seatX[group[0]] - 34
            const width = this.seatX[group.at(-1)!] + 34 - from
            g.fillStyle(0xf2c6c2, 0.95).fillRoundedRect(
              from,
              SEAT_Y + 12,
              width,
              18,
              8
            )
            g.lineStyle(2, 0xd98f8a, 1)
            for (let x = from + 12; x < from + width - 6; x += 16)
              g.lineBetween(x, SEAT_Y + 15, x, SEAT_Y + 27)
          }
        if (gathering === "napClub")
          for (const group of groups)
            for (const seat of group.slice(1)) {
              const x = (this.seatX[seat - 1] + this.seatX[seat]) / 2
              const z = add(
                this.add
                  .text(x, SEAT_Y - 52, "z Z", font(15, "#6b7fd7", "900"))
                  .setOrigin(0.5)
              )
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
      const y = 228 - (stack + i) * 26
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
    const pop = (x: number, y: number, label: string, size: number) => {
      const text = add(
        this.add
          .text(x, y, label, font(size, "#c2410c", "900"))
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
        case "catScored":
          next(380, () => {
            const x = this.seatX[event.seat]
            const sprite = seated.get(event.seat)
            if (sprite)
              this.tweens.add({
                targets: sprite,
                y: sprite.y - 14,
                scaleX: 0.92,
                scaleY: 1.1,
                duration: beat(120),
                yoyo: true,
                ease: "Quad.easeOut"
              })
            pop(x, SEAT_Y - 72, `+${event.purr}`, 24)
            if (event.mult) pop(x, SEAT_Y - 100, `+${event.mult} Mult`, 16)
            showTally(purrTimesMult(event.tally.purr, event.tally.mult))
          })
          break
        case "timesEffect":
          next(500, () => {
            pop(WIDTH / 2, 228, `${event.name} ×${event.times}`, 24)
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
          next(500, () => pop(WIDTH / 2, 215, `+${event.treats} Treats`, 24))
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
