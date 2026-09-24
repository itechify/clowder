import Phaser from "phaser"
import {
  applyAction,
  type Cat,
  type CatId,
  previewPlay,
  type RunEvent
} from "../engine"
import { drawCat } from "./catArt"
import { session } from "./session"

/** The portrait layout's logical size; the canvas renders it at `RESOLUTION`×. */
export const WIDTH = 390
export const HEIGHT = 844
export const RESOLUTION = 2

const SEAT_Y = 352
const HAND_COLUMNS = 4
const HAND_ROW_Y = 585
const HAND_ROW_HEIGHT = 105
const PREVIEW_Y = 452
const BUTTON = { x: WIDTH / 2, y: 790, w: 230, h: 58 }
/** How long the final Play's Score lingers before the lights go down. */
const LIGHTS_OUT_DELAY = 1200
/** The first Cat nods off this long after the lights go down... */
const FIRST_NOD = 400
/** ...and the last this long after the first, however many there are. */
const NODDING_SPREAD = 1200
const NOD_DURATION = 500
/** From the Run's last Play until the Cats are all asleep; then the results. */
export const SLEEP_MOMENT_MS =
  LIGHTS_OUT_DELAY + FIRST_NOD + NODDING_SPREAD + NOD_DURATION + 300

/** Where the `i`th Cat of the Hand not on the Couch sits on the rug. */
const handSpot = (i: number) => ({
  x: 60 + (i % HAND_COLUMNS) * 90,
  y: HAND_ROW_Y + Math.floor(i / HAND_COLUMNS) * HAND_ROW_HEIGHT
})

/** Seat centres, spread evenly between the Couch's arms. */
const seatX = (seats: number) =>
  Array.from({ length: seats }, (_, seat) => 20 + (350 / seats) * (seat + 0.5))

const font = (size: number, colour = "#4a3426", weight = "600") => ({
  fontFamily: "system-ui, sans-serif",
  fontSize: `${size}px`,
  fontStyle: weight,
  color: colour,
  resolution: RESOLUTION
})

/**
 * The living room: the Couch, the Hand, the live Purr preview, and Play. It
 * draws the Session's Run and sends taps to it as actions; it computes no rule.
 */
export class CouchScene extends Phaser.Scene {
  /** The Cat picked up from the Hand, waiting for a Seat. */
  private held: CatId | null = null
  /** The Cat just seated, which snaps into place on the next draw. */
  private landed: CatId | null = null
  /** The last Play's Couch, where its Cats doze off once the Run ends. */
  private lastCouch: (CatId | null)[] = []
  private layer!: Phaser.GameObjects.Container
  private seatX: number[] = []

  constructor() {
    super("couch")
  }

  create() {
    this.cameras.main.setZoom(RESOLUTION).centerOn(WIDTH / 2, HEIGHT / 2)
    this.seatX = seatX(session.run.config.seats)
    this.drawRoom()
    this.layer = this.add.container()
    this.seatX.forEach((x, seat) => {
      this.add
        .zone(x, SEAT_Y - 10, 68, 110)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.tapSeat(seat))
    })
    this.add
      .zone(BUTTON.x, BUTTON.y, BUTTON.w, BUTTON.h)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.tapPlay())
    const off = session.on((events) => {
      if (events.length === 0) {
        this.held = null
        this.lastCouch = []
      }
      const scored = events.filter((event) => event.type === "catScored")
      if (scored.length > 0) {
        this.lastCouch = session.run.night.couch.map(() => null)
        for (const event of scored) this.lastCouch[event.seat] = event.cat
      }
      this.draw(events.some((event) => event.type === "runEnded"))
      this.celebrate(events)
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off)
    this.draw()
  }

  private tapSeat(seat: number) {
    const occupant = session.run.night.couch[seat]
    if (this.held) {
      const cat = this.held
      this.held = null
      if (session.apply({ type: "place", cat, seat }).ok) this.landed = cat
      else this.draw()
    } else if (occupant) {
      session.apply({ type: "unseat", cat: occupant })
    }
  }

  private tapHandCat(cat: CatId) {
    this.held = this.held === cat ? null : cat
    this.draw()
  }

  private tapPlay() {
    this.held = null
    session.apply({ type: "play" })
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

  /**
   * Redraws everything that follows the Run: HUD, seated Cats, preview, Hand;
   * or, once the Run is over, the household asleep (`fallingAsleep` animates it).
   */
  private draw(fallingAsleep = false) {
    this.layer.removeAll(true)
    const { run } = session
    const { night } = run
    const catById = new Map(run.roster.map((cat) => [cat.id, cat]))
    const add = <T extends Phaser.GameObjects.GameObject>(object: T) => {
      this.layer.add(object)
      return object
    }

    // HUD: Night, Plays, Treats, and progress toward the Target.
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
    const progress = Math.min(1, night.score / night.target)
    bar.fillStyle(0xe0c49d, 1).fillRoundedRect(20, 62, WIDTH - 40, 22, 11)
    if (progress > 0)
      bar
        .fillStyle(0xe8893a, 1)
        .fillRoundedRect(20, 62, Math.max(22, (WIDTH - 40) * progress), 22, 11)
    add(
      this.add
        .text(
          WIDTH / 2,
          73,
          `Score ${night.score} / Target ${night.target}`,
          font(14)
        )
        .setOrigin(0.5)
    )

    if (run.status !== "playing") {
      this.drawAsleep(add, catById, fallingAsleep)
      return
    }

    // Seated Cats with their live Personality bonus floating above.
    const preview = previewPlay(run)
    for (const event of preview.scoringEvents) {
      const cat = catById.get(event.cat)!
      const sprite = add(drawCat(this, cat, 64))
      sprite.setPosition(this.seatX[event.seat], SEAT_Y - 12)
      if (event.cat === this.landed) {
        sprite.setScale(1.25)
        this.tweens.add({
          targets: sprite,
          scale: 1,
          duration: 220,
          ease: "Back.easeOut"
        })
      }
      add(
        this.add
          .text(
            this.seatX[event.seat],
            SEAT_Y + 38,
            cat.name,
            font(11, "#f6f1e4")
          )
          .setOrigin(0.5)
      )
      add(
        this.add
          .text(
            this.seatX[event.seat],
            SEAT_Y - 72,
            `+${event.bonus}`,
            font(18, event.bonus > 0 ? "#c2410c" : "#b9a58f", "800")
          )
          .setOrigin(0.5)
      )
    }
    this.landed = null

    // Live preview: Purr × Mult = Score, and where it would leave the Night.
    add(
      this.add
        .text(
          WIDTH / 2,
          PREVIEW_Y,
          preview.scoringEvents.length
            ? `${preview.purr} Purr × ${preview.mult.toFixed(1)} = ${preview.score}`
            : "Tap a Cat, then a Seat",
          font(20, "#4a3426", "800")
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
        if (held) {
          const glow = add(this.add.graphics())
          glow
            .fillStyle(0xfff4c2, 0.9)
            .fillRoundedRect(x - 42, y - 62, 84, 104, 16)
        }
        const sprite = add(drawCat(this, cat, 72))
        sprite
          .setPosition(x, y - (held ? 10 : 0))
          .setSize(84, 100)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", () => this.tapHandCat(id))
        add(
          this.add
            .text(x, y + 30, cat.name, font(12, held ? "#4a3426" : "#fdf6ea"))
            .setOrigin(0.5)
        )
      })

    // Play: "Get Comfy". Dimmed until a Cat is on the Couch.
    const ready = applyAction(run, { type: "play" }).ok
    const button = add(this.add.graphics())
    button
      .fillStyle(ready ? 0x4a3426 : 0x9c8672, 1)
      .fillRoundedRect(
        BUTTON.x - BUTTON.w / 2,
        BUTTON.y - BUTTON.h / 2,
        BUTTON.w,
        BUTTON.h,
        29
      )
    add(
      this.add
        .text(
          BUTTON.x,
          BUTTON.y,
          "Get Comfy",
          font(22, ready ? "#fdf6ea" : "#e6d8c6", "800")
        )
        .setOrigin(0.5)
    )
  }

  /**
   * The Run is over: the lights go down and every Cat dozes off where it is,
   * the last Play's Cats on the Couch and the rest of the Hand on the rug.
   */
  private drawAsleep(
    add: <T extends Phaser.GameObjects.GameObject>(object: T) => T,
    catById: Map<CatId, Cat>,
    animate: boolean
  ) {
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

  /** Pops each Cat's Purr where it sat, then the Play's Score. */
  private celebrate(events: RunEvent[]) {
    const pop = (
      x: number,
      y: number,
      label: string,
      size: number,
      delay: number
    ) => {
      const text = this.add
        .text(x, y, label, font(size, "#c2410c", "900"))
        .setOrigin(0.5)
        .setStroke("#fff7e8", 5)
        .setAlpha(0)
      this.tweens.add({
        targets: text,
        alpha: { from: 1, to: 0 },
        y: y - 40,
        delay,
        duration: 1100,
        ease: "Cubic.easeOut",
        onComplete: () => text.destroy()
      })
    }
    let delay = 0
    for (const event of events) {
      if (event.type === "catScored") {
        pop(this.seatX[event.seat], SEAT_Y - 20, `+${event.purr}`, 22, delay)
        delay += 120
      } else if (event.type === "scoreTotal") {
        pop(WIDTH / 2, PREVIEW_Y - 30, `${event.score}!`, 34, delay)
        delay += 400
      } else if (event.type === "nightCleared") {
        pop(WIDTH / 2, 170, "Night cleared!", 34, delay)
        delay += 300
      } else if (event.type === "treatsAwarded") {
        pop(WIDTH / 2, 215, `+${event.treats} Treats`, 24, delay)
      }
    }
  }
}
