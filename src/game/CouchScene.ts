import Phaser from "phaser"
import {
  type ActiveGathering,
  applyAction,
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
const BUTTON = { x: WIDTH / 2, y: 790, w: 230, h: 58 }

/** Seat centres, spread evenly between the Couch's arms. */
const seatX = (seats: number) =>
  Array.from({ length: seats }, (_, seat) => 20 + (350 / seats) * (seat + 0.5))

/** Splits sorted Seats into runs of consecutive Seats. */
const contiguous = (seats: number[]) =>
  seats.reduce<number[][]>((groups, seat) => {
    const last = groups.at(-1)
    if (last && last.at(-1) === seat - 1) last.push(seat)
    else groups.push([seat])
    return groups
  }, [])

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
      if (events.length === 0) this.held = null
      this.draw()
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

  /** Redraws everything that follows the Run: HUD, seated Cats, preview, Hand. */
  private draw() {
    this.tweens.killTweensOf(this.layer.list)
    this.layer.removeAll(true)
    const { run } = session
    const { night } = run
    const catById = new Map(run.roster.map((cat) => [cat.id, cat]))
    const add = <T extends Phaser.GameObjects.GameObject>(object: T) => {
      this.layer.add(object)
      return object
    }

    // HUD: Night, Plays, and progress toward the Target.
    add(
      this.add.text(20, 22, `Night ${night.number}`, font(24, "#4a3426", "800"))
    )
    add(
      this.add
        .text(WIDTH - 20, 26, `Plays ${night.playsLeft}`, font(18))
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

    // Seated Cats with their live Personality bonus floating above, inside
    // whichever Gatherings they form.
    const preview = previewPlay(run)
    this.drawGatherings(add, preview.gatherings, "behind")
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
    this.drawGatherings(add, preview.gatherings, "over")

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
    if (preview.gatherings.length)
      add(
        this.add
          .text(
            WIDTH / 2,
            BREAKDOWN_Y,
            ["1", ...preview.gatherings.map((g) => `${g.name} ${g.mult}`)].join(
              " + "
            ) + ` = ${preview.mult.toFixed(1)} Mult`,
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
        const x = 60 + (i % HAND_COLUMNS) * 90
        const y = HAND_ROW_Y + Math.floor(i / HAND_COLUMNS) * HAND_ROW_HEIGHT
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
