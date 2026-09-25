import Phaser from "phaser"
import {
  type Action,
  applyAction,
  type Cat,
  type CatId,
  coats,
  disasterById,
  type HouseCatId,
  houseCat,
  personalities,
  rehomeRefund
} from "../engine"
import { DISASTER_RED, font } from "./CouchScene"
import { drawCat, drawHouseCat } from "./characters"
import { HEIGHT, RESOLUTION, WIDTH } from "./layout"
import { session } from "./session"
import { drawShelf, tapShelf } from "./shelfView"

/** Below the next Disaster, when one is announced. */
const SECTION_Y = 110
const CARD_TOP = 122
const CARD_HEIGHT = 190
const REROLL_BUTTON = { x: WIDTH / 2, y: 338, w: 150, h: 40 }
const SHELF_LABEL_Y = 376
/** The top of the Shelf's plank. */
const SHELF_Y = 442
const SHELF_CAT_SIZE = 44
const FLOOR_Y = 470
const ROSTER_LABEL_Y = 490
const ROSTER_TOP = 540
const ROSTER_COLUMNS = 8
/** Room for the Roster between its label and the buttons, however big it grows. */
const ROSTER_HEIGHT = 200
const REHOME_BUTTON = { x: 105, y: 790, w: 170, h: 58 }
const LEAVE_BUTTON = { x: 285, y: 790, w: 170, h: 58 }

type Area = { x: number; y: number; w: number; h: number }
/** What is picked out to Rehome: a Roster Cat, or a House Cat on the Shelf. */
type Picked = { cat: CatId } | { houseCat: HouseCatId } | null

/** Offer card centres, spread across the Shop in one row. */
const offerX = (count: number) => {
  const spacing = (WIDTH - 20) / count
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
 * The Shop between Nights: Adopt an offered Cat, Recruit an offered House
 * Cat, Rehome either, rearrange the Shelf, Reroll the offers, or leave for the
 * next Night. Like the living room, it draws the Session's Run and sends taps
 * to it as actions; the engine decides every price and whether each action is
 * allowed.
 */
export class ShopScene extends Phaser.Scene {
  /** What is picked out to Rehome, awaiting confirmation. */
  private picked: Picked = null
  /** The offers as first laid out, so an Adopted Cat leaves its card empty... */
  private offerCards: CatId[] = []
  /** ...and a Recruited House Cat leaves its card empty. */
  private houseCatCards: HouseCatId[] = []
  private layer!: Phaser.GameObjects.Container

  constructor() {
    super("shop")
  }

  create() {
    // Actions taken in the same frame may have left the Shop already.
    if (!session.run.shop) {
      this.scene.start("couch")
      return
    }
    this.cameras.main.setZoom(RESOLUTION).centerOn(WIDTH / 2, HEIGHT / 2)
    this.picked = null
    this.offerCards = []
    this.houseCatCards = []
    this.drawRoom()
    this.layer = this.add.container()
    const off = session.on(() => {
      if (!session.run.shop) {
        this.scene.start("couch")
        return
      }
      const cat = this.pickedCat()
      const houseCat = this.pickedHouseCat()
      if (
        (cat && !session.run.roster.some((c) => c.id === cat)) ||
        (houseCat && !session.run.shelf.includes(houseCat))
      )
        this.picked = null
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
    for (let y = 0; y < FLOOR_Y; y += 36) g.fillRect(0, y, WIDTH, 12)
    g.fillStyle(0xb98b62, 1).fillRect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y)
    g.fillStyle(0xa47650, 1).fillRect(0, FLOOR_Y, WIDTH, 8)
    g.fillStyle(0xd9b48a, 1).fillRoundedRect(
      12,
      ROSTER_TOP - 30,
      WIDTH - 24,
      ROSTER_HEIGHT + 60,
      20
    )
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

    // Cats on offer, each with its Adopt price, then House Cats with their
    // Recruit prices, in the cards they arrived in.
    if (shop.catOffers.some((cat) => !this.offerCards.includes(cat.id)))
      this.offerCards = shop.catOffers.map((cat) => cat.id)
    if (shop.houseCatOffers.some((id) => !this.houseCatCards.includes(id)))
      this.houseCatCards = [...shop.houseCatOffers]
    const xs = offerX(this.offerCards.length + this.houseCatCards.length)
    const cardWidth = Math.min(86, (WIDTH - 20) / xs.length - 6)
    const card = (x: number) =>
      add(this.add.graphics())
        .fillStyle(0xfdf6ea, 1)
        .fillRoundedRect(
          x - cardWidth / 2,
          CARD_TOP,
          cardWidth,
          CARD_HEIGHT,
          14
        )
    /** An empty card, where an offer was taken. */
    const gone = (x: number, label: string) => {
      add(
        this.add
          .text(
            x,
            CARD_TOP + CARD_HEIGHT / 2,
            label,
            font(15, "#9c8672", "800")
          )
          .setOrigin(0.5)
      )
    }
    const buttonArea = (x: number) => ({
      x,
      y: CARD_TOP + CARD_HEIGHT - 26,
      w: cardWidth - 10,
      h: 36
    })
    const section = (label: string, from: number, count: number) => {
      if (count > 0)
        add(
          this.add
            .text(
              (xs[from] + xs[from + count - 1]) / 2,
              SECTION_Y,
              label,
              font(13, "#4a3426", "800")
            )
            .setOrigin(0.5)
        )
    }
    section("Adopt", 0, this.offerCards.length)
    section("Recruit", this.offerCards.length, this.houseCatCards.length)

    const adoptPrice = run.config.shop.adoptPrice
    this.offerCards.forEach((id, i) => {
      const x = xs[i]
      card(x)
      const cat = shop.catOffers.find((offer) => offer.id === id)
      if (!cat) {
        gone(x, "Adopted!")
        return
      }
      add(drawCat(this, cat, 64)).setPosition(x, CARD_TOP + 44)
      add(
        this.add
          .text(x, CARD_TOP + 90, cat.name, font(13, "#4a3426", "800"))
          .setOrigin(0.5)
      )
      add(
        this.add
          .text(x, CARD_TOP + 108, coatAndPersonality(cat), font(11))
          .setOrigin(0.5)
      )
      this.button(
        buttonArea(x),
        `Adopt ${adoptPrice}`,
        can({ type: "adopt", cat: cat.id }),
        () => session.apply({ type: "adopt", cat: cat.id }),
        add,
        15
      )
    })
    this.houseCatCards.forEach((id, i) => {
      const x = xs[this.offerCards.length + i]
      card(x)
      if (!shop.houseCatOffers.includes(id)) {
        gone(x, "Recruited!")
        return
      }
      const { name, ability } = houseCat(id)
      add(drawHouseCat(this, id, 50)).setPosition(x, CARD_TOP + 40)
      // A name with a title, like "Skadi (Belly Up)", gives the title a line.
      const [called, title] = name.split(/ \((.*)\)$/)
      let below = CARD_TOP + 72
      for (const [text, style] of [
        [called, font(12, "#4a3426", "800")],
        [title, font(9, "#7a5a3c", "italic 700")],
        [ability, font(10)]
      ] as const) {
        if (!text) continue
        below += add(
          this.add
            .text(x, below, text, {
              ...style,
              align: "center",
              wordWrap: { width: cardWidth - 8 }
            })
            .setOrigin(0.5, 0)
            .setLineSpacing(-2)
        ).height
      }
      this.button(
        buttonArea(x),
        `Recruit ${run.config.shop.recruitPrices[id]}`,
        can({ type: "recruit", houseCat: id }),
        () => session.apply({ type: "recruit", houseCat: id }),
        add,
        14
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

    // The Shelf, where a House Cat may be moved or picked out to Rehome.
    const pickedHouseCat = this.pickedHouseCat()
    const { shelfSize } = run.config
    add(
      this.add
        .text(
          WIDTH / 2,
          SHELF_LABEL_Y,
          pickedHouseCat
            ? `Rehome ${houseCat(pickedHouseCat).name} for ${rehomeRefund(run.config, pickedHouseCat)} Treats back, or tap elsewhere on the Shelf to move it.`
            : run.shelf.length > 0
              ? `Shelf ${run.shelf.length}/${shelfSize}. Tap a House Cat to move or Rehome it.`
              : `Shelf 0/${shelfSize}. Recruit a House Cat to join it.`,
          {
            ...font(13, "#4a3426", "700"),
            align: "center",
            wordWrap: { width: WIDTH - 30 }
          }
        )
        .setOrigin(0.5)
    )
    drawShelf(this, add, {
      run,
      y: SHELF_Y,
      size: SHELF_CAT_SIZE,
      held: pickedHouseCat,
      onTap: (position) => this.tapShelfPosition(position)
    })

    // The Roster, where a Cat may be picked out to Rehome.
    const rehomePrice = run.config.shop.rehomeCatPrice
    const pickedCat = run.roster.find((cat) => cat.id === this.pickedCat())
    add(
      this.add
        .text(
          WIDTH / 2,
          ROSTER_LABEL_Y,
          pickedCat
            ? `Rehome ${pickedCat.name}, ${coatAndPersonality(pickedCat)}?`
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
      if (cat.id === pickedCat?.id)
        add(this.add.graphics())
          .fillStyle(0xfff4c2, 0.95)
          .fillRoundedRect(x - 21, y - 20, 42, 40, 10)
      add(drawCat(this, cat, 38))
        .setPosition(x, y)
        .setSize(columnWidth, rowHeight)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.tapRosterCat(cat.id))
    })

    // Rehoming a Cat costs Treats; Rehoming a House Cat refunds some.
    const rehome: Action | null = pickedHouseCat
      ? { type: "rehome", houseCat: pickedHouseCat }
      : pickedCat
        ? { type: "rehome", cat: pickedCat.id }
        : null
    this.button(
      REHOME_BUTTON,
      pickedHouseCat
        ? `Rehome +${rehomeRefund(run.config, pickedHouseCat)}`
        : `Rehome ${rehomePrice}`,
      rehome !== null && can(rehome),
      () => {
        if (rehome) session.apply(rehome)
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

  private pickedCat(): CatId | null {
    return this.picked && "cat" in this.picked ? this.picked.cat : null
  }

  private pickedHouseCat(): HouseCatId | null {
    return this.picked && "houseCat" in this.picked
      ? this.picked.houseCat
      : null
  }

  /** Picks a Cat out to Rehome, or puts it back; the engine decides if it may go. */
  private tapRosterCat(cat: CatId) {
    if (this.pickedCat() === cat) this.picked = null
    else if (applyAction(session.run, { type: "rehome", cat }).ok)
      this.picked = { cat }
    this.draw()
  }

  /** Picks a House Cat out to move or Rehome, or moves the one picked out. */
  private tapShelfPosition(position: number) {
    const { held, action } = tapShelf(
      session.run,
      this.pickedHouseCat(),
      position
    )
    this.picked = held ? { houseCat: held } : null
    if (!action || !session.apply(action).ok) this.draw()
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
