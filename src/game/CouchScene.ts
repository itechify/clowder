import Phaser from "phaser"
import {
  type ActiveGathering,
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
const PREVIEW_Y = 446
const BREAKDOWN_Y = 486
const PLAY_BUTTON = { x: 135, y: 790, w: 230, h: 58 }
const REDRAW_BUTTON = { x: 316, y: 790, w: 108, h: 58 }
/** How long the final Play's Score lingers before the lights go down. */
const LIGHTS_OUT_DELAY = 1200
/** The first Cat nods off this long after the lights go down... */
const FIRST_NOD = 400
/** ...and the last this long after the first, however many there are. */
const NODDING_SPREAD = 1200
const NOD_DURATION = 500
/** How long a cleared Night's celebration plays before the Shop opens. */
const SHOP_OPENS_AFTER = 2400
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

/** Splits sorted Seats into stretches of consecutive Seats. */
const contiguous = (seats: number[]) =>
  seats.reduce<number[][]>((groups, seat) => {
    const last = groups.at(-1)
    if (last && last.at(-1) === seat - 1) last.push(seat)
    else groups.push([seat])
    return groups
  }, [])

export const font = (size: number, colour = "#4a3426", weight = "600") => ({
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
  /** The Cats chosen to Redraw, or null when not choosing. */
  private redrawing: CatId[] | null = null
  private layer!: Phaser.GameObjects.Container
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
    this.held = null
    this.landed = null
    this.lastCouch = []
    this.redrawing = null
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
      .zone(PLAY_BUTTON.x, PLAY_BUTTON.y, PLAY_BUTTON.w, PLAY_BUTTON.h)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.tapPlay())
    this.add
      .zone(REDRAW_BUTTON.x, REDRAW_BUTTON.y, REDRAW_BUTTON.w, REDRAW_BUTTON.h)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.tapRedraw())
    const off = session.on((events) => {
      const shopOpened = events.some((event) => event.type === "shopOpened")
      if (session.run.shop && !shopOpened) {
        this.scene.start("shop")
        return
      }
      if (events.length === 0) {
        this.held = null
        this.lastCouch = []
      }
      this.redrawing = null
      const scored = events.filter((event) => event.type === "catScored")
      if (scored.length > 0) {
        this.lastCouch = session.run.night.couch.map(() => null)
        for (const event of scored) this.lastCouch[event.seat] = event.cat
      }
      this.draw(events.some((event) => event.type === "runEnded"))
      this.celebrate(events)
      // The Night is cleared: celebrate on the Couch, then off to the Shop.
      if (shopOpened)
        this.time.delayedCall(SHOP_OPENS_AFTER, () => {
          if (session.run.shop) this.scene.start("shop")
        })
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off)
    this.draw()
  }

  private tapSeat(seat: number) {
    const occupant = session.run.night.couch[seat]
    if (this.redrawing) {
      if (occupant) this.chooseForRedraw(occupant)
    } else if (this.held) {
      const cat = this.held
      this.held = null
      if (session.apply({ type: "place", cat, seat }).ok) this.landed = cat
      else this.draw()
    } else if (occupant) {
      session.apply({ type: "unseat", cat: occupant })
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

  /**
   * Redraws everything that follows the Run: HUD, seated Cats, preview, Hand;
   * or, once the Run is over, the household asleep (`fallingAsleep` animates it).
   */
  private draw(fallingAsleep = false) {
    this.tweens.killTweensOf(this.layer.list)
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
    add(this.add.text(20, 94, `Draw pile ${night.drawPile.length}`, font(15)))
    add(
      this.add
        .text(WIDTH - 20, 94, `Redraws ${night.redrawsLeft}`, font(15))
        .setOrigin(1, 0)
    )

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
    // whichever Gatherings they form.
    const preview = previewPlay(run)
    this.drawGatherings(add, preview.gatherings, "behind")
    for (const event of preview.scoringEvents) {
      const cat = catById.get(event.cat)!
      if (chosen.has(event.cat)) markChosen(this.seatX[event.seat], SEAT_Y - 4)
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
            font(11, chosen.has(event.cat) ? "#4a3426" : "#f6f1e4")
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
              ? `${preview.purr} Purr × ${preview.mult.toFixed(1)} = ${preview.score}`
              : "Tap a Cat, then a Seat",
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
        const sprite = add(drawCat(this, cat, 72))
        sprite
          .setPosition(x, y - (held ? 10 : 0))
          .setSize(84, 100)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", () => this.tapHandCat(id))
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
  }

  private drawButton(
    area: typeof PLAY_BUTTON,
    label: string,
    ready: boolean,
    add: <T extends Phaser.GameObjects.GameObject>(object: T) => T
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

  /**
   * Shows each active Gathering on the Couch itself, named: a blanket over a
   * Cuddle Puddle, Zs over a Nap Club, a bubble around each Cat with Personal
   * Space, bunting for a Variety Pack, and a glow round a Full Sofa. Drawn in
   * two layers, since blankets go over the Cats and the rest behind.
   */
  private drawGatherings(
    add: <T extends Phaser.GameObjects.GameObject>(object: T) => T,
    active: ActiveGathering[],
    layer: "behind" | "over"
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
      const y = 228 - i * 26
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
    let gatherings = 0
    let discoveries = 0
    for (const event of events) {
      if (event.type === "gatheringActivated") {
        const seats = event.seats.map((seat) => this.seatX[seat])
        const x = (Math.min(...seats) + Math.max(...seats)) / 2
        pop(
          x,
          SEAT_Y - 60 - gatherings * 28,
          `${event.name} +${event.mult}`,
          20,
          delay
        )
        if (event.firstTime) this.discover(event.name, discoveries++ * 1800)
        gatherings++
        delay += 200
      } else if (event.type === "catScored") {
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

  /** The "New Gathering!" moment, the first time a Run activates one. */
  private discover(name: string, delay: number) {
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
    this.tweens.chain({
      targets: banner,
      tweens: [
        {
          alpha: 1,
          scale: 1,
          delay,
          duration: 280,
          ease: "Back.easeOut"
        },
        { alpha: 0, y: 100, delay: 1300, duration: 400 }
      ],
      onComplete: () => banner.destroy()
    })
  }
}
