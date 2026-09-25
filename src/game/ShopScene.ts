import Phaser from "phaser"
import {
  type Action,
  applyAction,
  type Cat,
  type CatId,
  coats,
  disasterById,
  personalities
} from "../engine"
import { DISASTER_RED, font, HEIGHT, RESOLUTION, WIDTH } from "./CouchScene"
import { drawCat } from "./catArt"
import { session } from "./session"

const OFFER_Y = 200
const REROLL_BUTTON = { x: WIDTH / 2, y: 345, w: 170, h: 44 }
const ROSTER_LABEL_Y = 392
const ROSTER_TOP = 440
const ROSTER_COLUMNS = 8
/** Room for the Roster between its label and the buttons, however big it grows. */
const ROSTER_HEIGHT = 300
const REHOME_BUTTON = { x: 105, y: 790, w: 170, h: 58 }
const LEAVE_BUTTON = { x: 285, y: 790, w: 170, h: 58 }

type Area = { x: number; y: number; w: number; h: number }

/** Offer card centres, spread across the Shop. */
const offerX = (count: number) => {
  const spacing = Math.min(180, (WIDTH - 20) / count)
  return Array.from(
    { length: count },
    (_, i) => WIDTH / 2 + (i - (count - 1) / 2) * spacing
  )
}

const capitalise = (word: string) => word[0].toUpperCase() + word.slice(1)

/** A Cat's Coat and Personality, as the Shop labels them. */
const coatAndPersonality = (cat: Cat) =>
  `${capitalise(cat.coat)} ${capitalise(cat.personality)}`

/** The Roster grouped as the player thinks of it: by Coat, then Personality. */
const byKind = (roster: Cat[]) =>
  [...roster].sort(
    (a, b) =>
      coats.indexOf(a.coat) - coats.indexOf(b.coat) ||
      personalities.indexOf(a.personality) -
        personalities.indexOf(b.personality)
  )

/**
 * The Shop between Nights: Adopt an offered Cat, Rehome one from the Roster,
 * Reroll the offers, or leave for the next Night. Like the living room, it
 * draws the Session's Run and sends taps to it as actions; the engine decides
 * every price and whether each action is allowed.
 */
export class ShopScene extends Phaser.Scene {
  /** The Roster Cat picked out to Rehome, awaiting confirmation. */
  private rehoming: CatId | null = null
  /** The offers as first laid out, so an Adopted Cat leaves its card empty. */
  private offerCards: CatId[] = []
  private layer!: Phaser.GameObjects.Container

  constructor() {
    super("shop")
  }

  create() {
    this.cameras.main.setZoom(RESOLUTION).centerOn(WIDTH / 2, HEIGHT / 2)
    this.rehoming = null
    this.offerCards = []
    this.drawRoom()
    this.layer = this.add.container()
    const off = session.on(() => {
      if (!session.run.shop) {
        this.scene.start("couch")
        return
      }
      if (!session.run.roster.some((cat) => cat.id === this.rehoming))
        this.rehoming = null
      this.draw()
    })
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off)
    this.draw()
  }

  /** The Shop's backdrop: a sunny wall of cubbies and a counter. */
  private drawRoom() {
    const g = this.add.graphics()
    g.fillStyle(0xe4ecd6, 1).fillRect(0, 0, WIDTH, HEIGHT)
    g.fillStyle(0xd6e1c4, 1)
    for (let y = 0; y < 420; y += 36) g.fillRect(0, y, WIDTH, 12)
    g.fillStyle(0xb98b62, 1).fillRect(0, 372, WIDTH, HEIGHT - 372)
    g.fillStyle(0xa47650, 1).fillRect(0, 372, WIDTH, 8)
    g.fillStyle(0xd9b48a, 1).fillRoundedRect(12, 420, WIDTH - 24, 330, 20)
  }

  private draw() {
    this.layer.removeAll(true)
    const { run } = session
    const { shop } = run
    if (!shop) return
    const add = <T extends Phaser.GameObjects.GameObject>(object: T) => {
      this.layer.add(object)
      return object
    }
    const can = (action: Action) => applyAction(run, action).ok

    add(this.add.text(20, 22, "Shop", font(24, "#4a3426", "800")))
    add(
      this.add
        .text(WIDTH - 20, 26, `Treats ${run.treats}`, font(18))
        .setOrigin(1, 0)
    )
    const next = run.night.number + 1
    const disaster = shop.nextDisaster && disasterById(shop.nextDisaster)
    add(
      this.add.text(
        20,
        disaster ? 50 : 60,
        `Night ${run.night.number} cleared. Night ${next} is ${disaster ? "a Disaster!" : "next."}`,
        font(15)
      )
    )
    // The Disaster ahead, revealed now so the household can prepare for it.
    if (disaster) {
      add(this.add.graphics())
        .fillStyle(DISASTER_RED, 1)
        .fillRoundedRect(14, 72, WIDTH - 28, 24, 12)
      add(
        this.add
          .text(
            WIDTH / 2,
            84,
            `${disaster.name}: ${disaster.rule}`,
            font(14, "#fdf6ea", "800")
          )
          .setOrigin(0.5)
      )
    }

    // Cats on offer, each with its Adopt price, in the cards they arrived in.
    if (shop.catOffers.some((cat) => !this.offerCards.includes(cat.id)))
      this.offerCards = shop.catOffers.map((cat) => cat.id)
    const adoptPrice = run.config.shop.adoptPrice
    const xs = offerX(this.offerCards.length)
    const cardWidth = Math.min(156, (WIDTH - 20) / xs.length - 16)
    this.offerCards.forEach((id, i) => {
      const x = xs[i]
      const card = add(this.add.graphics())
      card
        .fillStyle(0xfdf6ea, 1)
        .fillRoundedRect(x - cardWidth / 2, OFFER_Y - 100, cardWidth, 210, 18)
      const cat = shop.catOffers.find((offer) => offer.id === id)
      if (!cat) {
        add(
          this.add
            .text(x, OFFER_Y, "Adopted!", font(18, "#9c8672", "800"))
            .setOrigin(0.5)
        )
        return
      }
      add(drawCat(this, cat, 92)).setPosition(x, OFFER_Y - 30)
      add(
        this.add
          .text(x, OFFER_Y + 30, cat.name, font(17, "#4a3426", "800"))
          .setOrigin(0.5)
      )
      add(
        this.add
          .text(x, OFFER_Y + 52, coatAndPersonality(cat), font(13))
          .setOrigin(0.5)
      )
      this.button(
        { x, y: OFFER_Y + 84, w: cardWidth - 28, h: 40 },
        `Adopt ${adoptPrice}`,
        can({ type: "adopt", cat: cat.id }),
        () => session.apply({ type: "adopt", cat: cat.id }),
        add,
        18
      )
    })
    this.button(
      REROLL_BUTTON,
      `Reroll ${shop.rerollPrice}`,
      can({ type: "reroll" }),
      () => session.apply({ type: "reroll" }),
      add,
      18
    )

    // The Roster, where a Cat may be picked out to Rehome.
    const rehomePrice = run.config.shop.rehomeCatPrice
    const picked = run.roster.find((cat) => cat.id === this.rehoming)
    add(
      this.add
        .text(
          WIDTH / 2,
          ROSTER_LABEL_Y,
          picked
            ? `Rehome ${picked.name}, ${coatAndPersonality(picked)}?`
            : shop.catRehomesLeft > 0
              ? `Roster ${run.roster.length}. Tap a Cat to Rehome it.`
              : `Roster ${run.roster.length}. No more Rehoming this visit.`,
          font(15, "#fdf6ea", "700")
        )
        .setOrigin(0.5)
    )
    const roster = byKind(run.roster)
    const rows = Math.ceil(roster.length / ROSTER_COLUMNS)
    const rowHeight = Math.min(46, ROSTER_HEIGHT / Math.max(1, rows))
    const columnWidth = (WIDTH - 40) / ROSTER_COLUMNS
    roster.forEach((cat, i) => {
      const x = 20 + columnWidth * ((i % ROSTER_COLUMNS) + 0.5)
      const y = ROSTER_TOP + rowHeight * Math.floor(i / ROSTER_COLUMNS)
      if (cat.id === this.rehoming)
        add(this.add.graphics())
          .fillStyle(0xfff4c2, 0.95)
          .fillRoundedRect(x - 21, y - 20, 42, 40, 10)
      add(drawCat(this, cat, 38))
        .setPosition(x, y)
        .setSize(columnWidth, rowHeight)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.tapRosterCat(cat.id))
    })

    this.button(
      REHOME_BUTTON,
      `Rehome ${rehomePrice}`,
      picked !== undefined && can({ type: "rehome", cat: picked.id }),
      () => {
        if (this.rehoming) session.apply({ type: "rehome", cat: this.rehoming })
      },
      add
    )
    this.button(
      LEAVE_BUTTON,
      "Leave Shop",
      can({ type: "leaveShop" }),
      () => session.apply({ type: "leaveShop" }),
      add
    )
  }

  /** Picks a Cat out to Rehome, or puts it back; the engine decides if it may go. */
  private tapRosterCat(cat: CatId) {
    if (this.rehoming === cat) this.rehoming = null
    else if (applyAction(session.run, { type: "rehome", cat }).ok)
      this.rehoming = cat
    this.draw()
  }

  private button(
    area: Area,
    label: string,
    ready: boolean,
    onTap: () => void,
    add: <T extends Phaser.GameObjects.GameObject>(object: T) => T,
    size = 22
  ) {
    const g = this.add.graphics()
    g.fillStyle(ready ? 0x4a3426 : 0x9c8672, 1).fillRoundedRect(
      -area.w / 2,
      -area.h / 2,
      area.w,
      area.h,
      area.h / 2
    )
    const text = this.add
      .text(0, 0, label, font(size, ready ? "#fdf6ea" : "#e6d8c6", "800"))
      .setOrigin(0.5)
    const button = add(this.add.container(area.x, area.y, [g, text]))
    if (ready)
      button
        .setSize(area.w, area.h)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", onTap)
  }
}
