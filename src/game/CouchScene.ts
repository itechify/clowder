import Phaser from "phaser"
import { art, gatheringArt, moonArt } from "../art/manifest"
import { sound } from "../audio/sound"
import {
  type Action,
  type ActiveGathering,
  applyAction,
  type Cat,
  type CatId,
  type HouseCatId,
  houseCat,
  previewPlay,
  type Run,
  type RunEvent,
  type ScoreBreakdown
} from "../engine"
import {
  type DisasterSign,
  hud,
  type Pips,
  type PurrMeter,
  purrMeter
} from "../presentation/hud"
import {
  gatheringLabel,
  type ScrapbookChoice,
  scrapbookChoice
} from "../presentation/scrapbook"
import {
  atRest,
  type CatLook,
  type Placement,
  type Results,
  type RugRow,
  rugPositions,
  type StagedCat,
  seatingOrder,
  stage,
  stageAsleep
} from "../presentation/staging"
import { settings } from "../shell/settings"
import { addArt } from "./art"
import { drawCat, drawGrowthBadge, drawHouseCat } from "./characters"
import { choreograph, countedUp, type Step, skippedCues } from "./choreography"
import { effectConfig } from "./effectConfig"
import { display, font, numbers, OUTLINE } from "./fonts"
import {
  HEIGHT,
  layOutRow,
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
import { presentation } from "./presentation"
import { drawDisasterPlaque, drawFurniture } from "./room"
import { INK, PHOTO } from "./roomArt"
import { fire, flash, pulse, rain, SPARKS, sparks } from "./scoringEffects"
import { session } from "./session"
import { drawShelf, shelfNotes, tapShelf } from "./shelfView"

/**
 * Where the HUD sits in the room: the Night on the wall beside the window with
 * its moon, the Draw pile beneath; and the purr meter's centre, along the top
 * of the Couch's back.
 */
const NIGHT_LABEL = { x: 22, y: 26 }
const DRAW_PILE_LABEL = { x: 22, y: 52 }
/** How far above the jar's base its mouth is, where treats rain in. */
const JAR_MOUTH = 44
/** How long the jar bobs as each treat lands in it, at 1×. */
const JAR_BOB_MS = 120
const PURR_METER = { x: WIDTH / 2, y: 276 }
/**
 * A Full Sofa's glow is centred on the Couch; Variety Pack bunting hangs from
 * the top of its back, beneath the purr meter.
 */
const FULL_SOFA_Y = 337
const BUNTING_Y = 286
/** Where a seated Cat's Purr shows above it, just below the purr meter. */
const PURR_Y = 298
/** Each Seat's tap and drop area, around its centre. */
const SEAT_AREA = { w: 68, h: 110, dy: -10 }
/**
 * Each rug position's tap and drag area, around its Cat's centre: `w` wide,
 * and `margin` taller than the Cat.
 */
const RUG_AREA = { w: 80, margin: 28, dy: -4 }
/** How far a Cat picked up from the rug lifts off it. */
const LIFT = 14
/** How high a Cat hops between the rug and the Couch. */
const HOP_HEIGHT = 46
/** Where Gathering names sit, side by side just above the purr meter. */
const GATHERING_NAME_Y = 248
/**
 * Each Gathering name's pill: its padding either side, its height, the gap
 * between pills, and how far in from the room's sides they keep.
 */
const GATHERING_PILL = { padding: 9, height: 24, gap: 6, margin: 8 }
/**
 * The colours numbers pop up in as a Play scores: Purr, Mult, then a House
 * Cat's Repeats, The Void's growth, and Freya's hearts.
 */
const POP = {
  purr: "#ffa94d",
  mult: "#ff5a4a",
  repeat: "#c4b0ff",
  growth: "#c4b0ff",
  heart: "#ff9cbb"
}
/** A picked-up Cat glows warm; one chosen to Redraw glows cool, ringed. */
const GLOW = { held: 0xfff1b0, chosen: 0xa9c8ee, chosenRing: 0x4f79a8 }
const PREVIEW_Y = 446
/** How far either side of the tally's "×" its Purr and Mult totals sit. */
const TALLY_GAP = 12
/** Where a Play's Score counts up and lands, just above the tally. */
const SCORE_Y = PREVIEW_Y - 40
const BREAKDOWN_Y = 486
const PLAY_BUTTON = { x: 135, y: 790, w: 230, h: 58 }
const REDRAW_BUTTON = { x: 316, y: 790, w: 108, h: 58 }
/**
 * Where a button's label and pips sit on its face, above and below its
 * centre, and how far apart its pips are.
 */
const BUTTON_FACE = { labelAbove: 8, pipsBelow: 12, pipSpacing: 17 }
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
/**
 * Where the Results sit in the sleeping room: the Nights cleared beneath the
 * moon in the window; the Best Play's photo on the wall beside it, its Cats
 * shown this big; the title sign propped before the Couch, its words that far
 * above and below its centre and no wider than its border; and, along the
 * front of the room, the Star Cat asleep in its bed, labelled beneath it, and
 * New Household.
 */
const NIGHTS_CLEARED = { x: WINDOW.x, y: 124 }
const PHOTO_FRAME = { x: 292, y: 88, width: 172, height: 100 }
/**
 * The Cats in the photo: how big, and how far above their pads' tops their
 * centres are; and how far either side of the plate's middle its Score and
 * Night are written.
 */
const PHOTO_CATS = { size: 26, abovePad: 2 }
const PLATE_GAP = 4
const TITLE_SIGN = { x: WIDTH / 2, y: 482, title: -16, ending: 12, width: 260 }
/** The cat bed, its Cat, and its label, no wider than `labelWidth`. */
const CAT_BED = {
  x: 80,
  y: 818,
  catY: 780,
  catSize: 56,
  labelY: 831,
  labelWidth: 152
}
/** The rosette on the Star Cat's flank, from the Cat's centre. */
const ROSETTE = { dx: 16, dy: 8 }
const NEW_HOUSEHOLD = { x: 268, y: 790, w: 230, h: 58 }
/**
 * The Scrapbook, open in the room once a Night is cleared: its cover, where
 * the preview was and over the rug, its title across the top, and its pages
 * side by side beneath, each `step` apart.
 */
const SCRAPBOOK = { y: 574, titleY: 472, cover: { w: 376, h: 250 } }
const PAGE = { y: 590, w: 112, h: 186, step: 121 }
/** The Scrapbook's page centres, side by side. */
const pageX = (count: number) =>
  Array.from(
    { length: count },
    (_, page) => WIDTH / 2 + (page - (count - 1) / 2) * PAGE.step
  )
/** How long the Results take to appear once the household is asleep. */
const RESULTS_FADE_MS = 700
/** From the end of the Run's last scoring sequence until the Cats are all asleep. */
const SLEEP_MOMENT_MS =
  LIGHTS_OUT_DELAY + FIRST_NOD + NODDING_SPREAD + NOD_DURATION + 300

type Add = <T extends Phaser.GameObjects.GameObject>(object: T) => T
type Point = { x: number; y: number }
/** Where a Cat is shown: its centre, and how big it is. */
type Spot = Point & { size: number }
/**
 * A Cat as drawn: its sprite, whether on the Couch or the rug, its size, and
 * how it looks.
 */
type ShownCat = {
  sprite: Phaser.GameObjects.Container
  on: Placement["on"]
  size: number
  look: CatLook
}
/** Where a Cat was, as shown, when the layer was last cleared. */
type LastSeen = Point & Omit<ShownCat, "sprite">
/** What a press began on: a Hand Cat, or a Seat (and whoever sits there). */
type PressTarget = { cat: CatId } | { seat: number }
/** How a scoring sequence ends: played out, skipped, or overtaken by a new one. */
type Ending = "played" | "skipped" | "overtaken"

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

/** Purr × Mult, as the preview shows it. */
const purrTimesMult = (purr: number, mult: number) =>
  `${purr} Purr × ${mult.toFixed(1)}`

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
  /** How each Cat in view looked as the last Play was played. */
  private lastLooks = new Map<CatId, CatLook>()
  /** The Cats chosen to Redraw, or null when not choosing. */
  private redrawing: CatId[] | null = null
  /** A press on a Hand Cat or a Seat, until it becomes a tap or a drag. */
  private press: { target: PressTarget; at: Point } | null = null
  /** The Cat being dragged, following the pointer. */
  private dragging: CatId | null = null
  /** Every Cat drawn, so it can be dragged or moved on from where it was. */
  private shown = new Map<CatId, ShownCat>()
  /** Where each Cat was when the layer was last cleared, to move on from there. */
  private movedFrom = new Map<CatId, LastSeen>()
  /** The Run as last drawn: where a Play's scoring sequence starts from. */
  private lastDrawn!: Run
  /** The scoring sequence playing out, if any. */
  private scoring: { finish: (ending: Ending) => void } | null = null
  private bedtime: Phaser.Time.TimerEvent | null = null
  private skipArea!: Phaser.GameObjects.Zone
  /** New Household's tap area, listening only while the Results show. */
  private newHouseholdArea!: Phaser.GameObjects.Zone
  /** Each Scrapbook page's tap area, listening only while the Scrapbook is open. */
  private pageAreas: Phaser.GameObjects.Zone[] = []
  private layer!: Phaser.GameObjects.Container
  /** The sign naming tonight's Disaster, when there is one. */
  private disasterSign: Phaser.GameObjects.Container | null = null
  private seatX: number[] = []
  private rugX!: Record<RugRow, number[]>

  constructor() {
    super("couch")
  }

  create() {
    // The Shop may already be open, as when the Run is resumed there.
    if (session.run.shop) {
      this.scene.start("shop")
      return
    }
    presentation.update({ scene: "couch" })
    // Back from the Shop, the scene starts afresh.
    this.held = null
    this.heldHouseCat = null
    presentation.lastCouch = []
    this.lastLooks.clear()
    this.redrawing = null
    this.press = null
    this.dragging = null
    this.shown.clear()
    this.movedFrom.clear()
    this.scoring = null
    this.bedtime = null
    this.cameras.main.setZoom(RESOLUTION).centerOn(WIDTH / 2, HEIGHT / 2)
    this.seatX = seatX(session.run.config.seats)
    this.rugX = rugX(rugPositions(session.run))
    this.lastDrawn = session.run
    const { couch } = session.run.night
    presentation.seatingOrder = seatingOrder(
      presentation.seatingOrder,
      couch,
      couch
    )
    // Every Night is spent indoors, so the window shows the night sky; its
    // moon is the HUD's.
    drawFurniture(this, this.seatX)
    this.layer = this.add.container()
    this.seatX.forEach((x, seat) => {
      this.add
        .zone(x, SEAT_Y + SEAT_AREA.dy, SEAT_AREA.w, SEAT_AREA.h)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", (pointer: Phaser.Input.Pointer) =>
          this.startPress(pointer, { seat })
        )
    })
    // Each rug position answers for whichever Cat lounges there, however it is
    // moving; the front row over the back.
    for (const row of ["back", "front"] as const)
      this.rugX[row].forEach((_, position) => {
        const { x, y, size } = this.spot({ on: "rug", row, position })
        this.add
          .zone(x, y + RUG_AREA.dy, RUG_AREA.w, size + RUG_AREA.margin)
          .setInteractive({ useHandCursor: true })
          .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
            const cat = this.loungingAt(row, position)
            if (cat) this.startPress(pointer, { cat })
          })
      })
    this.add
      .zone(PLAY_BUTTON.x, PLAY_BUTTON.y, PLAY_BUTTON.w, PLAY_BUTTON.h)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.tapPlay())
    this.add
      .zone(REDRAW_BUTTON.x, REDRAW_BUTTON.y, REDRAW_BUTTON.w, REDRAW_BUTTON.h)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.tapRedraw())
    this.newHouseholdArea = this.add
      .zone(NEW_HOUSEHOLD.x, NEW_HOUSEHOLD.y, NEW_HOUSEHOLD.w, NEW_HOUSEHOLD.h)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.tapNewHousehold())
    this.newHouseholdArea.disableInteractive()
    // Over the rug, whose Cats wait while a page is chosen.
    this.pageAreas = pageX(session.run.config.scrapbookPages).map((x, page) =>
      this.add
        .zone(x, PAGE.y, PAGE.w, PAGE.h)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => this.tapPage(page))
        .disableInteractive()
    )
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
      // A chosen Scrapbook page opens the Shop as the day dawns; opened any
      // other way, the Shop takes over at once.
      if (session.run.shop) {
        const shopOpened = events.some((event) => event.type === "shopOpened")
        this.scene.start("shop", shopOpened ? { dawn: true } : undefined)
        return
      }
      const before = this.lastDrawn
      const placedBefore = presentation.seatingOrder
      this.lastDrawn = session.run
      const { couch } = session.run.night
      presentation.seatingOrder = seatingOrder(
        placedBefore,
        before.night.couch,
        couch
      )
      if (events.length === 0) {
        this.held = null
        this.heldHouseCat = null
        presentation.lastCouch = []
        this.lastLooks.clear()
        // A different Run: its Cats were placed in no known order.
        presentation.seatingOrder = seatingOrder([], [], couch)
        presentation.update({ asleep: false })
      }
      this.redrawing = null
      this.press = null
      this.dragging = null
      if (events.some((event) => event.type === "scoreTotal"))
        this.playScoring(before, placedBefore, events)
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
    // Arriving once the Run is over, the household is already asleep.
    if (session.run.status !== "playing") presentation.update({ asleep: true })
    this.draw()
  }

  /** Where a Cat is shown for a placement. */
  private spot(placement: Placement): Spot {
    if (placement.on === "couch")
      return {
        x: this.seatX[placement.seat],
        y: SEAT_Y - 12,
        size: SEATED_SIZE
      }
    const { y, size } = RUG_ROWS[placement.row]
    return { x: this.rugX[placement.row][placement.position], y, size }
  }

  /** The Cat lounging at a rug position now, if any. */
  private loungingAt(row: RugRow, position: number) {
    return stage(session.run, presentation.seatingOrder).cats.find(
      ({ placement: p }) =>
        p.on === "rug" && p.row === row && p.position === position
    )?.cat
  }

  /** Staged Cats in drawing order, back to front: the Couch, then the rug. */
  private byDepth(cats: StagedCat[]) {
    return cats
      .map((staged) => ({ ...staged, spot: this.spot(staged.placement) }))
      .sort((a, b) => a.spot.y - b.spot.y)
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
    if (session.run.status !== "playing" || session.run.scrapbookPages) return
    this.press = { target, at: this.worldPoint(pointer) }
  }

  /** Picks a pressed Cat up once the press moves far enough, then carries it. */
  private movePress(pointer: Phaser.Input.Pointer) {
    const at = this.worldPoint(pointer)
    if (this.dragging) {
      this.shown.get(this.dragging)?.sprite.setPosition(at.x, at.y)
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
    this.shown.get(cat)?.sprite.setPosition(at.x, at.y).setScale(1.1)
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
          : null
    )
  }

  /**
   * Applies a Couch action, every Cat moving on from where it is, a dropped
   * Cat from where it was let go; with no action, or a rejected one, the Cats
   * move back.
   */
  private rearrange(action: Action | null) {
    if (!action || !session.apply(action).ok) {
      this.draw()
      // A Seat refused while tonight's Couch holds fewer Cats than it has
      // Seats points at the Disaster limiting it.
      const { night } = session.run
      if (action?.type === "place" && night.catsPerPlay < night.couch.length)
        this.nudgeDisasterSign()
    } else if (action.type === "place") sound.cue({ name: "catSeated" })
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
    if (session.run.status !== "playing") return
    sound.cue({ name: "uiTap" })
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
    if (session.run.status !== "playing") return
    sound.cue({ name: "uiTap" })
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

  /** Chooses the Scrapbook page tapped, and the Shop opens. */
  private tapPage(page: number) {
    const chosen = scrapbookChoice(session.run)?.pages[page]
    if (!chosen) return
    sound.cue({ name: "uiTap" })
    session.apply(chosen.action)
  }

  /** Starts a fresh Run, from the Results. */
  private tapNewHousehold() {
    sound.cue({ name: "uiTap" })
    session.newHousehold()
  }

  /**
   * Presses New Household as a tap would, if the Results show it; for
   * end-to-end tests. Returns whether it was pressed.
   */
  pressNewHousehold() {
    if (!this.newHouseholdArea.input?.enabled) return false
    this.newHouseholdArea.emit("pointerdown")
    return true
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

  /**
   * Empties the layer the Run is drawn on, noting where each Cat was so it
   * can move on from there; returns how to add to the layer.
   */
  private clearLayer(): Add {
    this.movedFrom = new Map(
      [...this.shown].map(([cat, { sprite, ...shown }]) => [
        cat,
        { x: sprite.x, y: sprite.y, ...shown }
      ])
    )
    this.tweens.killTweensOf(this.layer.list)
    this.layer.removeAll(true)
    this.shown.clear()
    return (object) => {
      this.layer.add(object)
      return object
    }
  }

  /**
   * Draws a staged Cat at its placement, `lift` above it, moving on from
   * wherever it was before the layer was cleared. A Cat new to the room drops
   * in; one staying put that changes its pose pops into the new one.
   */
  private drawCatAt(add: Add, cat: Cat, staged: StagedCat, lift = 0) {
    const { placement, pose, facing } = staged
    const look: CatLook = staged
    const { x, y, size } = this.spot(placement)
    const to = { x, y: y - lift }
    const sprite = add(drawCat(this, cat, look, size)).setPosition(to.x, to.y)
    this.shown.set(cat.id, { sprite, on: placement.on, size, look })
    // A dragged Cat follows the pointer instead.
    if (cat.id === this.dragging) return sprite
    const from = this.movedFrom.get(cat.id)
    // Drawn for the first time, the room is as it is; after that, new Cats arrive.
    if (!from) {
      if (this.movedFrom.size > 0) this.arrive(sprite)
    } else if (from.x !== to.x || from.y !== to.y)
      this.hop(sprite, from, to, placement.on, size)
    else if (from.look.pose !== pose || from.look.facing !== facing)
      this.tweens.add({
        targets: sprite,
        scaleX: { from: 1.14, to: 1 },
        scaleY: { from: 0.9, to: 1 },
        duration: 320,
        ease: "Back.easeOut"
      })
    return sprite
  }

  /**
   * A Cat hops from where it was, in an arc highest between the rug and the
   * Couch, growing or shrinking to its new size; landing on a Seat, or back
   * on the rug from the Couch, it squashes into place.
   */
  private hop(
    sprite: Phaser.GameObjects.Container,
    from: LastSeen,
    to: Point,
    on: Placement["on"],
    size: number
  ) {
    const distance = Phaser.Math.Distance.BetweenPoints(from, to)
    const height =
      from.on !== on ? HOP_HEIGHT : Math.min(HOP_HEIGHT, distance * 0.25)
    const duration = from.on !== on ? 280 : 200
    const lands = on === "couch" || from.on !== on
    sprite.setPosition(from.x, from.y).setScale(from.size / size)
    // Hopping between the rug and the Couch, a Cat passes over the others.
    if (from.on !== on) this.layer.bringToTop(sprite)
    this.tweens.add({
      targets: sprite,
      x: to.x,
      scale: 1,
      duration,
      onUpdate: (tween) => {
        const t = tween.progress
        sprite.y = from.y + (to.y - from.y) * t - height * Math.sin(Math.PI * t)
      },
      onComplete: () => {
        sprite.setY(to.y)
        if (lands)
          this.tweens.add({
            targets: sprite,
            scaleX: { from: 1.22, to: 1 },
            scaleY: { from: 0.8, to: 1 },
            duration: 420,
            ease: "Bounce.easeOut"
          })
      }
    })
  }

  /** A Cat new to the room, drawn or sent back to the Hand, drops in. */
  private arrive(sprite: Phaser.GameObjects.Container) {
    this.tweens.add({
      targets: sprite,
      y: { from: sprite.y - 30, to: sprite.y },
      alpha: { from: 0, to: 1 },
      duration: 360,
      ease: "Bounce.easeOut"
    })
  }

  /** A Cat's shadow on the rug, where it rests. */
  private drawShadow(add: Add, { x, y, size }: Spot) {
    add(
      this.add.ellipse(x, y + size * 0.3, size * 0.9, size * 0.2, 0x5a2a1e)
    ).setAlpha(0.28)
  }

  /**
   * A soft glow behind a Cat: warm for the one picked up, cool, and ringed,
   * for one chosen to Redraw, like one about to leave.
   */
  private drawGlow(add: Add, { x, y, size }: Spot, why: "held" | "chosen") {
    const glow = add(this.add.graphics())
    for (const [spread, alpha] of [
      [1.35, 0.25],
      [1.2, 0.35],
      [1.05, 0.5]
    ])
      glow
        .fillStyle(GLOW[why], alpha)
        .fillEllipse(x, y, size * spread, size * spread)
    if (why === "chosen")
      glow
        .lineStyle(3, GLOW.chosenRing, 1)
        .strokeEllipse(x, y, size * 1.15, size * 1.15)
  }

  /** A Cat's name beneath it, on its pad on the Couch or on the rug. */
  private drawName(add: Add, cat: Cat, placement: Placement, spot: Spot) {
    const { x, y, size } = spot
    add(
      placement.on === "couch"
        ? this.add
            .text(x, SEAT_Y + 38, cat.name, font(11, "#f6f1e4"))
            .setOrigin(0.5)
        : this.add
            .text(
              x,
              y + size * 0.42,
              cat.name,
              font(placement.row === "front" ? 12 : 11, "#fdf6ea")
            )
            .setOrigin(0.5)
            .setStroke("#7a3526", 3)
    )
  }

  /**
   * A Cat grown past the base Purr it started with wears its base Purr in a
   * starry badge, so The Void's work shows wherever the Cat goes.
   */
  private drawGrowth(add: Add, cat: Cat, x: number, y: number) {
    if (cat.basePurr !== session.run.config.basePurr)
      drawGrowthBadge(this, add, cat.basePurr, x, y)
  }

  /**
   * The HUD, drawn into the room: the moon in the window beside the Night, the
   * treat jar and its Treats, the purr meter along the Couch's back filling
   * toward the Target, and tonight's Disaster on a sign; the Plays and
   * Redraws left are pips on their buttons. Returns how to show a different
   * Night score and Treats, and the jar, for scoring to animate.
   */
  private drawHud(run: Run, add: Add) {
    const { night, treats, meter, drawPile, disaster } = hud(run)
    add(addArt(this, moonArt(night.moon), MOON.x, MOON.y))
    add(
      this.add
        .text(NIGHT_LABEL.x, NIGHT_LABEL.y, night.label, numbers(28))
        .setOrigin(0, 0.5)
    )
    add(
      this.add
        .text(
          DRAW_PILE_LABEL.x,
          DRAW_PILE_LABEL.y,
          `Draw pile ${drawPile}`,
          font(13, "#7a5a3c", "800")
        )
        .setOrigin(0, 0.5)
    )
    const jar = add(addArt(this, art.room.treatJar, TREAT_JAR.x, TREAT_JAR.y))
    const treatCount = add(
      this.add
        .text(TREAT_COUNT.x, TREAT_COUNT.y, `${treats}`, numbers(30, "#f6c453"))
        .setOrigin(1, 0.5)
    )

    // The meter's glow shows as much of its full self as the Night has filled.
    add(addArt(this, art.purrMeter(false), PURR_METER.x, PURR_METER.y))
    const glow = add(
      addArt(this, art.purrMeter(true), PURR_METER.x, PURR_METER.y)
    )
    const score = add(
      this.add.text(PURR_METER.x, PURR_METER.y, "", numbers(16)).setOrigin(0.5)
    )
    const showMeter = ({ filled, label }: PurrMeter) => {
      const { realWidth, realHeight } = glow.frame
      glow.setVisible(filled > 0).setCrop(0, 0, realWidth * filled, realHeight)
      score.setText(label)
    }
    showMeter(meter)

    this.disasterSign = disaster ? add(this.drawDisasterSign(disaster)) : null
    return {
      showScore: (nightScore: number) =>
        showMeter(purrMeter(nightScore, run.night.target)),
      showTreats: (treats: number) => treatCount.setText(`${treats}`),
      treatCount,
      jar,
      meterWidth: glow.displayWidth
    }
  }

  /**
   * A sign hung on the wall below the treat jar, naming tonight's Disaster
   * and the rule it changes, clear of the Shelf below.
   */
  private drawDisasterSign(disaster: DisasterSign) {
    return drawDisasterPlaque(this, art.room.disasterSign, disaster, {
      nameY: 30,
      ruleY: 47
    })
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
   * or, once the Run is over, the household asleep, then its Results. The
   * `moment` the household nods off, or the Results appear, is animated.
   */
  private draw(moment: "nodOff" | "resultsAppear" | null = null) {
    const add = this.clearLayer()
    const { run } = session
    const catById = new Map(run.roster.map((cat) => [cat.id, cat]))
    const results = presentation.results(run)
    if (results) this.newHouseholdArea.setInteractive()
    else this.newHouseholdArea.disableInteractive()
    // The Results show the Nights cleared by the moon instead of the HUD.
    if (results) add(addArt(this, moonArt(results.nights.moon), MOON.x, MOON.y))
    else this.drawHud(run, add)

    if (run.status !== "playing") {
      drawShelf(this, add, { run, y: SHELF_Y, size: SHELF_CAT_SIZE })
      this.drawAsleep(add, catById, {
        animate: moment === "nodOff",
        bedded: results?.bed?.cat.id,
        toBed: moment === "resultsAppear"
      })
      if (results) this.drawResults(add, results, moment === "resultsAppear")
      return
    }

    // The Shelf, each House Cat noting what it adds to the Play as it stands;
    // it waits while a Scrapbook page is chosen.
    const preview = previewPlay(run)
    const choice = scrapbookChoice(run)
    this.pageAreas.forEach((area, page) => {
      if (choice?.pages[page]) area.setInteractive()
      else area.disableInteractive()
    })
    drawShelf(this, add, {
      run,
      y: SHELF_Y,
      size: SHELF_CAT_SIZE,
      held: this.heldHouseCat,
      notes: shelfNotes(run, preview),
      onTap: choice ? undefined : (position) => this.tapShelfPosition(position)
    })

    const chosen = new Set(this.redrawing)
    const staged = this.byDepth(stage(run, presentation.seatingOrder).cats)

    // Seated Cats with their live Personality bonus floating above, inside
    // whichever Gatherings they form. A Cat being dragged leaves its labels.
    this.drawGatherings(add, preview.gatherings, "behind")
    for (const seated of staged) {
      const { cat: id, placement, spot } = seated
      if (placement.on !== "couch") continue
      const cat = catById.get(id)!
      const { x } = spot
      if (chosen.has(id)) this.drawGlow(add, spot, "chosen")
      this.drawCatAt(add, cat, seated)
      if (id === this.dragging) continue
      this.drawGrowth(add, cat, x - 22, SEAT_Y - 44)
      this.drawName(add, cat, placement, spot)
      // With Repeats, how many times the Cat will score.
      const scores = preview.scoringEvents.filter((e) => e.cat === id)
      const { bonus } = scores[0]
      add(
        this.add
          .text(
            x,
            PURR_Y,
            `+${bonus}${scores.length > 1 ? ` ×${scores.length}` : ""}`,
            numbers(18, bonus > 0 ? POP.purr : "#e6d8c6")
          )
          .setOrigin(0.5)
      )
    }
    this.drawGatherings(add, preview.gatherings, "over")

    // Live preview: Purr × Mult = Score, and where it would leave the Night.
    if (!choice)
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
            numbers(22)
          )
          .setOrigin(0.5)
      )
    // Beneath it, where the Mult comes from; or what a House Cat picked up
    // from the Shelf does.
    const picked = this.heldHouseCat && houseCat(this.heldHouseCat)
    const breakdown = picked
      ? `${picked.name}: ${picked.ability(run.config.houseCats)}. Tap elsewhere on the Shelf to move it.`
      : multBreakdown(preview)
    if (breakdown && !choice)
      add(
        this.add
          .text(WIDTH / 2, BREAKDOWN_Y, breakdown, {
            ...font(13, "#fdf6ea", "700"),
            align: "center",
            wordWrap: { width: WIDTH - 30 }
          })
          .setOrigin(0.5)
      )

    // The Hand's Cats not yet on the Couch, lounging on the rug; the one
    // picked up lifts and glows.
    for (const lounging of staged) {
      const { cat: id, placement, spot } = lounging
      if (placement.on !== "rug") continue
      const cat = catById.get(id)!
      const { x, y, size } = spot
      const held = id === this.held
      this.drawShadow(add, spot)
      if (chosen.has(id)) this.drawGlow(add, spot, "chosen")
      if (held) this.drawGlow(add, { ...spot, y: y - LIFT }, "held")
      this.drawCatAt(add, cat, lounging, held ? LIFT : 0)
      if (id === this.dragging) continue
      this.drawGrowth(add, cat, x - size * 0.36, y - size * 0.55)
      this.drawName(add, cat, placement, spot)
    }

    // Play: "Get Comfy", dimmed until a Cat is on the Couch; while choosing
    // Cats to Redraw it backs out instead. Beside it, Redraw, then the swap.
    // Each shows the Plays or Redraws left as pips.
    const choosing = this.redrawing
    const { plays, redraws } = hud(run)
    this.drawButton(
      PLAY_BUTTON,
      choosing ? "Cancel" : "Get Comfy",
      choosing !== null || applyAction(run, { type: "play" }).ok,
      plays,
      add
    )
    this.drawButton(
      REDRAW_BUTTON,
      choosing ? `Swap ${choosing.length}` : "Redraw",
      choosing
        ? applyAction(run, { type: "redraw", cats: choosing }).ok
        : this.canRedraw(),
      redraws,
      add
    )
    // A Cat being dragged is carried over everything else.
    const carried = this.dragging && this.shown.get(this.dragging)
    if (carried) this.layer.bringToTop(carried.sprite)
    if (choice) this.drawScrapbook(add, choice)
  }

  /**
   * The Scrapbook open over the rug after a cleared Night, its pages side by
   * side, each naming its Gathering, what forms it, and exactly what its next
   * level adds; tapping one chooses it.
   */
  private drawScrapbook(add: Add, { title, pages }: ScrapbookChoice) {
    const { w, h } = SCRAPBOOK.cover
    const cover = [WIDTH / 2 - w / 2, SCRAPBOOK.y - h / 2, w, h, 14] as const
    add(this.add.graphics())
      .fillStyle(0x8a5a3c, 1)
      .fillRoundedRect(...cover)
      .lineStyle(3, INK, 1)
      .strokeRoundedRect(...cover)
    add(
      this.add
        .text(WIDTH / 2, SCRAPBOOK.titleY, title, display(22, "#fdf6ea"))
        .setOrigin(0.5)
        .setStroke(OUTLINE, 5)
    )
    const xs = pageX(pages.length)
    const wrapped = { wordWrap: { width: PAGE.w - 14 }, align: "center" }
    pages.forEach(({ name, requirement, label }, page) => {
      const x = xs[page]
      const { y } = PAGE
      const sheet = [x - PAGE.w / 2, y - PAGE.h / 2, PAGE.w, PAGE.h, 6] as const
      add(this.add.graphics())
        .fillStyle(0xfdf6ea, 1)
        .fillRoundedRect(...sheet)
        .lineStyle(2, INK, 1)
        .strokeRoundedRect(...sheet)
      add(
        this.add
          .text(x, y - 64, name, { ...display(17), ...wrapped })
          .setOrigin(0.5)
      )
      add(
        this.add
          .text(x, y - 14, requirement, {
            ...font(11, "#7a5a3c", "700"),
            ...wrapped
          })
          .setOrigin(0.5)
      )
      add(
        this.add
          .text(x, y + 40, label.levels, font(16, "#4a3426", "800"))
          .setOrigin(0.5)
      )
      add(
        this.add
          .text(x, y + 66, label.adds, {
            ...font(12, "#b4561f", "800"),
            ...wrapped
          })
          .setOrigin(0.5)
      )
    })
  }

  /**
   * A button, "Get Comfy" the largest, with a pip beneath its label for each
   * Play or Redraw the Night began with, full while still to spend.
   */
  private drawButton(
    area: typeof PLAY_BUTTON,
    label: string,
    ready: boolean,
    pips: Pips,
    add: Add
  ) {
    const primary = area === PLAY_BUTTON
    const button = primary ? art.playButton(ready) : art.redrawButton(ready)
    add(addArt(this, button, area.x, area.y))
    add(
      this.add
        .text(
          area.x,
          area.y - BUTTON_FACE.labelAbove,
          label,
          display(primary ? 26 : 20, ready ? "#fdf6ea" : "#f3e9da")
        )
        .setOrigin(0.5)
        .setStroke(OUTLINE, 4)
    )
    const count = Math.max(pips.of, pips.left)
    for (let pip = 0; pip < count; pip++)
      add(
        addArt(
          this,
          art.pip(pip < pips.left),
          area.x + (pip - (count - 1) / 2) * BUTTON_FACE.pipSpacing,
          area.y + BUTTON_FACE.pipsBelow
        )
      )
  }

  /**
   * The Run is over: the lights go down and every Cat dozes off where it is,
   * the last Play's Cats on the Couch and the rest of the Hand on the rug;
   * all but the Star Cat once it is `bedded` down in the Results, which fades
   * from where it slept as it goes `toBed`.
   */
  private drawAsleep(
    add: Add,
    catById: Map<CatId, Cat>,
    {
      animate,
      bedded,
      toBed = false
    }: { animate: boolean; bedded?: CatId; toBed?: boolean }
  ) {
    const { run } = session
    const sleepers = this.byDepth(
      stageAsleep(run, presentation.lastCouch, bedded).cats
    ).map((look) => ({ cat: catById.get(look.cat)!, look, ...look.spot }))
    const leaving =
      toBed &&
      stageAsleep(run, presentation.lastCouch).cats.find(
        (staged) => staged.cat === bedded
      )
    if (leaving) {
      const { x, y, size } = this.spot(leaving.placement)
      const star = catById.get(leaving.cat)!
      const sprite = add(drawCat(this, star, leaving, size, { asleep: true }))
      this.tweens.add({
        targets: sprite.setPosition(x, y),
        alpha: 0,
        duration: RESULTS_FADE_MS,
        onComplete: () => sprite.destroy()
      })
    }

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
    sleepers.forEach(({ cat, look, x, y, size }, i) => {
      // Each Cat nods off a moment after the one before it.
      const nodOff =
        LIGHTS_OUT_DELAY +
        FIRST_NOD +
        (NODDING_SPREAD * i) / Math.max(1, sleepers.length - 1)
      const asleep = add(drawCat(this, cat, look, size, { asleep: true }))
      asleep.setPosition(x, y)
      if (animate) {
        const played = this.lastLooks.get(cat.id) ?? atRest(run, cat)
        const awake = add(drawCat(this, cat, played, size))
        awake.setPosition(x, y)
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
      this.snore(add, { x, y, size }, (animate ? nodOff : 0) + (i % 3) * 400)
    })
  }

  /** A "z" drifting up from a sleeping Cat, over and over, from `delay`. */
  private snore(add: Add, { x, y, size }: Spot, delay: number) {
    const z = add(
      this.add
        .text(x + size * 0.3, y - size * 0.45, "z", display(16, "#dfe3ff"))
        .setAlpha(0)
    )
    this.tweens.add({
      targets: z,
      alpha: { from: 1, to: 0 },
      y: z.y - 28,
      x: z.x + 10,
      delay,
      duration: 1600,
      repeat: -1
    })
  }

  /**
   * How the household did, drawn into the sleeping room over the dusk: the
   * Nights cleared beneath the moon, the Best Play's photo on the wall, the
   * title sign before the Couch, the Star Cat asleep in its bed wearing its
   * rosette, and New Household. `reveal`ed, they fade in.
   */
  private drawResults(add: Add, results: Results, reveal: boolean) {
    const shown: Phaser.GameObjects.GameObject[] = []
    const show: Add = (object) => {
      shown.push(add(object))
      return object
    }
    const { nights, photo, bed, title, ending } = results

    show(
      this.add
        .text(NIGHTS_CLEARED.x, NIGHTS_CLEARED.y, nights.label, numbers(14))
        .setOrigin(0.5)
    )

    if (photo) {
      const { x, y, width, height } = PHOTO_FRAME
      const left = x - width / 2
      const top = y - height / 2
      show(addArt(this, art.room.photoFrame, x, y))
      photo.seats.forEach((seat, i) => {
        if (!seat) return
        show(
          drawCat(this, seat.cat, seat, PHOTO_CATS.size, { still: true })
        ).setPosition(
          left + PHOTO.seatsX[i],
          top + PHOTO.padTop - PHOTO_CATS.abovePad
        )
      })
      const plate = { x: left + PHOTO.plate.x, y: top + PHOTO.plate.y }
      show(
        this.add
          .text(
            plate.x - PLATE_GAP,
            plate.y,
            photo.scoreLabel,
            display(13, POP.purr)
          )
          .setOrigin(1, 0.5)
          .setStroke(OUTLINE, 3)
      )
      show(
        this.add
          .text(
            plate.x + PLATE_GAP,
            plate.y,
            photo.nightLabel,
            font(11, "#4a3426", "800")
          )
          .setOrigin(0, 0.5)
      )
    }

    const sign = { x: TITLE_SIGN.x, y: TITLE_SIGN.y }
    show(addArt(this, art.room.titleSign, sign.x, sign.y))
    for (const line of [
      this.add
        .text(sign.x, sign.y + TITLE_SIGN.title, title, display(28, "#fdf6ea"))
        .setStroke(OUTLINE, 5),
      this.add.text(
        sign.x,
        sign.y + TITLE_SIGN.ending,
        ending,
        font(13, "#fdf6ea", "800")
      )
    ])
      show(
        line.setOrigin(0.5).setScale(Math.min(1, TITLE_SIGN.width / line.width))
      )

    if (bed) {
      const { x, y, catY, catSize, labelY, labelWidth } = CAT_BED
      show(addArt(this, art.room.catBed, x, y))
      show(drawCat(this, bed.cat, bed, catSize, { asleep: true })).setPosition(
        x,
        catY
      )
      show(addArt(this, art.room.rosette, x + ROSETTE.dx, catY + ROSETTE.dy))
      const label = show(
        this.add
          .text(x, labelY, bed.label, font(11, "#fdf6ea", "800"))
          .setOrigin(0.5)
          .setStroke(OUTLINE, 3)
      )
      // Wholly within the front of the room, clear of New Household.
      label.setScale(Math.min(1, labelWidth / label.width))
      this.snore(
        add,
        { x, y: catY, size: catSize },
        reveal ? RESULTS_FADE_MS : 0
      )
    }

    show(addArt(this, art.playButton(true), NEW_HOUSEHOLD.x, NEW_HOUSEHOLD.y))
    show(
      this.add
        .text(
          NEW_HOUSEHOLD.x,
          NEW_HOUSEHOLD.y - BUTTON_FACE.labelAbove / 2,
          "New Household",
          display(24, "#fdf6ea")
        )
        .setOrigin(0.5)
        .setStroke(OUTLINE, 4)
    )

    if (!reveal) return
    this.tweens.add({
      targets: shown,
      alpha: { from: 0, to: 1 },
      duration: RESULTS_FADE_MS
    })
  }

  /**
   * Shows each active Gathering on the Couch itself, named: a blanket over a
   * Cuddle Puddle, Zs over a Nap Club, a bubble around each Cat with Personal
   * Space, bunting for a Variety Pack, and a glow round a Full Sofa. Drawn in
   * two layers, since blankets go over the Cats and the rest behind. Names
   * share one row above the purr meter, clear of the Shelf, with every
   * Gathering in `row`, each as near the Seats that form it as it can be.
   */
  private drawGatherings(
    add: Add,
    active: ActiveGathering[],
    layer: "behind" | "over",
    row = active
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
          overlay(gatheringArt(gathering), WIDTH / 2, FULL_SOFA_Y)
        if (gathering === "personalSpace")
          for (const seat of seats)
            overlay(gatheringArt(gathering), this.seatX[seat], SEAT_Y - 14)
        if (gathering === "varietyPack")
          overlay(gatheringArt(gathering, span), across(seats), BUNTING_Y)
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

    // Each Gathering's name, above the Seats that form it.
    const labels = row.map((active) =>
      this.add.text(0, GATHERING_NAME_Y, gatheringLabel(active), numbers(14))
    )
    const pillWidth = (label: Phaser.GameObjects.Text) =>
      label.width + 2 * GATHERING_PILL.padding
    const { centres, scale } = layOutRow(
      row.map(({ seats }, i) => ({
        wanted: (this.seatX[seats[0]] + this.seatX[seats.at(-1)!]) / 2,
        width: pillWidth(labels[i])
      })),
      {
        left: GATHERING_PILL.margin,
        right: WIDTH - GATHERING_PILL.margin,
        gap: GATHERING_PILL.gap
      }
    )
    // Only the names of the Gatherings being drawn show; the rest of the row
    // was measured to keep their places.
    const shown = new Set(active.map(({ gathering }) => gathering))
    row.forEach(({ gathering }, i) => {
      const label = labels[i]
      if (!shown.has(gathering)) {
        label.destroy()
        return
      }
      const x = centres[i]
      label.setOrigin(0.5).setPosition(x, GATHERING_NAME_Y).setScale(scale)
      const width = pillWidth(label) * scale
      const height = GATHERING_PILL.height * scale
      const pill = [
        x - width / 2,
        GATHERING_NAME_Y - height / 2,
        width,
        height,
        height / 2
      ] as const
      add(this.add.graphics())
        .fillStyle(0xe8893a, 1)
        .fillRoundedRect(...pill)
        .lineStyle(2, INK, 1)
        .strokeRoundedRect(...pill)
      add(label)
    })
  }

  /**
   * Plays out a Play's events over the Couch as it was committed, as the
   * choreography scripts them: Gatherings appear, each Cat scores left to
   * right, its Purr flying into the total, Mult slamming in, × effects firing
   * with their House Cats triggered; then the Score counts up and lands, and
   * treats rain into the jar if the Night is cleared; then the Night as it now
   * stands. Its Cats keep the poses they were placed in, in `order`. Paced by
   * the scoring speed setting, and as calm as Reduced motion asks; a tap skips
   * to the end.
   */
  private playScoring(before: Run, order: CatId[], events: RunEvent[]) {
    const beat = (ms: number) => ms / settings.scoringSpeed
    const add = this.clearLayer()
    const room = this.drawHud(before, add)
    const catById = new Map(before.roster.map((cat) => [cat.id, cat]))
    presentation.lastCouch = before.night.couch

    // The committed Couch, and the rest of the Hand waiting on the rug,
    // where it settles from once the sequence is over.
    const seated = new Map<number, Phaser.GameObjects.Container>()
    this.lastLooks.clear()
    for (const look of this.byDepth(stage(before, order).cats)) {
      const { cat: id, placement, spot } = look
      const cat = catById.get(id)!
      const { x, y, size } = spot
      this.lastLooks.set(id, look)
      if (placement.on === "rug") this.drawShadow(add, spot)
      const sprite = add(drawCat(this, cat, look, size)).setPosition(x, y)
      this.shown.set(id, { sprite, on: placement.on, size, look })
      if (placement.on === "couch") seated.set(placement.seat, sprite)
      this.drawName(add, cat, placement, spot)
    }
    const { plays, redraws } = hud(before)
    this.drawButton(PLAY_BUTTON, "Get Comfy", false, plays, add)
    this.drawButton(REDRAW_BUTTON, "Redraw", false, redraws, add)
    const shelved = drawShelf(this, add, {
      run: before,
      y: SHELF_Y,
      size: SHELF_CAT_SIZE
    })

    // Purr × Mult so far, where the preview was: each Cat's Purr flies into
    // the Purr total, and Mult slams into its own. The Score counts up above.
    const purrTotal = add(
      this.add
        .text(WIDTH / 2 - TALLY_GAP, PREVIEW_Y, "0 Purr", numbers(22))
        .setOrigin(1, 0.5)
    )
    add(this.add.text(WIDTH / 2, PREVIEW_Y, "×", numbers(22)).setOrigin(0.5))
    const multTotal = add(
      this.add
        .text(WIDTH / 2 + TALLY_GAP, PREVIEW_Y, "1.0", numbers(22))
        .setOrigin(0, 0.5)
    )
    const scoreTotal = add(
      this.add
        .text(WIDTH / 2, SCORE_Y, "", numbers(34, POP.purr))
        .setOrigin(0.5)
    )
    const burst = {
      purr: sparks(this, add, SPARKS.purr),
      mult: sparks(this, add, SPARKS.mult),
      landed: sparks(this, add, SPARKS.landed)
    }
    /** A number growing from `from` times its size back to its own. */
    const bump = (
      text: Phaser.GameObjects.Text,
      from: number,
      ms: number,
      ease = "Quad.easeOut"
    ) => {
      this.tweens.killTweensOf(text)
      return this.tweens.add({
        targets: text,
        scale: { from, to: 1 },
        duration: beat(ms),
        ease
      })
    }
    const showPurr = (purr: number) => {
      purrTotal.setText(`${purr} Purr`)
      bump(purrTotal, 1.18, 180)
    }
    /** A step landing: its sparks burst, the room shakes and flashes, and it pulses. */
    const impact = (
      step: Step,
      at: Point,
      spray: (count: number, at: Point) => void
    ) => {
      spray(step.particles, at)
      if (step.shake > 0)
        this.cameras.main.shake(beat(effectConfig.shakeMs), step.shake)
      flash(this, add, step.flash, beat(effectConfig.flashMs))
      if (step.haptic) pulse(step.haptic)
    }
    /** Mult slams into its total in red, a × harder, and lands with its step's impact. */
    const slamMult = (mult: number, step: Step) => {
      const { scale, ms } = effectConfig.slams[step.slam ?? "mult"]
      multTotal.setText(mult.toFixed(1)).setColor(POP.mult)
      impact(
        step,
        { x: multTotal.x + multTotal.width / 2, y: PREVIEW_Y },
        burst.mult
      )
      bump(multTotal, scale, ms, "Cubic.easeIn").on("complete", () =>
        multTotal.setColor("#fdf6ea")
      )
    }
    const pop = (
      x: number,
      y: number,
      label: string,
      size: number,
      colour = POP.purr
    ) => {
      const text = add(
        this.add.text(x, y, label, numbers(size, colour)).setOrigin(0.5)
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
    /** A Cat's Purr pops above it, then flies into the Purr total. */
    const flyPurr = (x: number, purr: number, arrive: () => void) => {
      const text = add(
        this.add
          .text(x, PURR_Y, `+${purr}`, numbers(24, POP.purr))
          .setOrigin(0.5)
      )
      // Arriving within its Cat's beat, before the next Cat scores.
      this.tweens.add({
        targets: text,
        scale: { from: 0.4, to: 1 },
        duration: beat(140),
        ease: "Back.easeOut"
      })
      this.tweens.add({
        targets: text,
        x: purrTotal.x - purrTotal.width / 2,
        y: PREVIEW_Y,
        scale: 0.6,
        alpha: 0.5,
        delay: beat(140),
        duration: beat(200),
        ease: "Cubic.easeIn",
        onComplete: () => {
          text.destroy()
          arrive()
        }
      })
    }

    /**
     * The House Cats on the Shelf, each shown at rest or, while its effect
     * fires, in its triggered pose; each hops as its effect fires, from where
     * it sits however quickly its effects follow one another.
     */
    const showing = new Map(shelved)
    const home = new Map([...shelved].map(([id, sprite]) => [id, sprite.y]))
    const pose = (id: HouseCatId, key: string | null) => {
      const resting = shelved.get(id)
      const current = showing.get(id)
      if (!resting || !current) return
      if (current !== resting) current.destroy()
      resting.setVisible(key === null)
      showing.set(
        id,
        key === null
          ? resting
          : add(drawHouseCat(this, key, SHELF_CAT_SIZE))
              .setPosition(resting.x, home.get(id)!)
              .setAlpha(resting.alpha)
      )
    }
    const hop = (id: HouseCatId, label: string, colour?: string) => {
      const sprite = showing.get(id)
      if (!sprite) return
      this.tweens.killTweensOf(sprite)
      sprite.setY(home.get(id)!).setScale(1).setAngle(0)
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
    /** A × House Cat rattles as the room shakes (Box Goblin's box)... */
    const rattle = (id: HouseCatId) => {
      const sprite = showing.get(id)
      if (!sprite) return
      const { degrees, ms, repeats } = effectConfig.rattle
      this.tweens.add({
        targets: sprite,
        angle: { from: -degrees, to: degrees },
        duration: beat(ms),
        yoyo: true,
        repeat: repeats,
        onComplete: () => sprite.setAngle(0)
      })
    }
    /** ...and glows as it flashes (Freya warming). */
    const glow = (id: HouseCatId, alpha: number) => {
      const sprite = showing.get(id)
      if (!sprite) return
      const light = add(
        this.add.ellipse(
          sprite.x,
          sprite.y,
          SHELF_CAT_SIZE * 1.5,
          SHELF_CAT_SIZE * 1.5,
          GLOW.held
        )
      ).setAlpha(Math.min(1, alpha * effectConfig.glow.perFlash))
      this.layer.moveBelow<Phaser.GameObjects.GameObject>(light, sprite)
      this.tweens.add({
        targets: light,
        alpha: 0,
        duration: beat(effectConfig.glow.ms),
        onComplete: () => light.destroy()
      })
    }

    // Each event gets a beat of its own, in order, with its sounds.
    const script = choreograph(
      { events, target: before.night.target },
      settings
    )
    const timers: Phaser.Time.TimerEvent[] = []
    const counters: Phaser.Tweens.Tween[] = []
    // The Play's Gatherings, their names sharing a row as each appears.
    const gatherings = events.filter(
      (event) => event.type === "gatheringActivated"
    )
    // "New Gathering!" banners, each waiting for the one before to leave.
    const banners: (() => void)[] = []
    let bannersFreeAt = 0
    /** How a step shows, worked out as the sequence is laid out. */
    const animate = (step: Step): (() => void) => {
      const { at, event } = step
      switch (event.type) {
        case "gatheringActivated": {
          const wait = Math.max(0, bannersFreeAt - at)
          if (event.firstTime) bannersFreeAt = at + wait + beat(BANNER_MS)
          return () => {
            if (event.firstTime)
              banners.push(this.discover(event.name, wait, beat))
            this.revealGathering(add, event, gatherings, beat)
            slamMult(event.tally.mult, step)
          }
        }
        case "wholePlayEffect":
          return () => {
            hop(event.houseCat, `+${event.mult} Mult`, POP.mult)
            slamMult(event.tally.mult, step)
          }
        case "catScored":
        case "repeat":
          return () => {
            const x = this.seatX[event.seat]
            const sprite = seated.get(event.seat)
            if (sprite) this.scoreHop(sprite, { x, y: SEAT_Y - 12 }, beat)
            // A Repeat is the same Cat scoring again, sent by a House Cat.
            if (event.source !== "seat") {
              hop(event.source, "Repeat!")
              pop(x, SEAT_Y - 128, "Repeat!", 15, POP.repeat)
            }
            flyPurr(x, event.purr, () => {
              showPurr(event.tally.purr)
              if (!step.slam)
                impact(
                  step,
                  { x: purrTotal.x - purrTotal.width / 2, y: PREVIEW_Y },
                  burst.purr
                )
            })
            if (event.mult) {
              pop(x, SEAT_Y - 100, `+${event.mult} Mult`, 16, POP.mult)
              slamMult(event.tally.mult, step)
            }
            for (const from of event.multFrom)
              hop(from.houseCat, `+${from.mult} Mult`, POP.mult)
          }
        case "houseCatWarmedUp":
          // Freya warms up a little more, a heart at a time.
          return () =>
            hop(event.houseCat, `♥ ×${event.times.toFixed(1)}`, POP.heart)
        case "catGrew":
          // Grown for good: The Void's gift shows once the Score is in.
          return () => {
            const x = this.seatX[event.seat]
            hop(event.houseCat, `+${event.purr} Purr`, POP.growth)
            pop(x, PURR_Y, `${event.basePurr} base Purr`, 14, POP.growth)
            const sprite = seated.get(event.seat)
            if (sprite)
              this.tweens.add({
                targets: sprite,
                scale: { from: 1.15, to: 1 },
                duration: beat(300),
                ease: "Back.easeOut"
              })
          }
        case "timesEffect":
          return () => {
            hop(event.houseCat, `×${event.times.toFixed(1)}`, POP.mult)
            if (step.shake > 0) rattle(event.houseCat)
            if (step.flash > 0) glow(event.houseCat, step.flash)
            slamMult(event.tally.mult, step)
          }
        case "scoreTotal": {
          // The Score counts up, faster and faster...
          const { countUp } = step
          if (countUp)
            return () => {
              scoreTotal.setText("0")
              counters.push(
                this.tweens.addCounter({
                  from: 0,
                  to: countUp.duration,
                  duration: countUp.duration,
                  onUpdate: (tween) =>
                    scoreTotal.setText(
                      `${countedUp(countUp, tween.getValue()!)}`
                    )
                })
              )
            }
          // ...then lands with a thump, and the purr meter fills, perhaps
          // catching fire.
          return () => {
            scoreTotal.setText(`${event.score}`)
            const { thump } = effectConfig
            bump(scoreTotal, thump.scale, thump.ms, "Back.easeOut")
            impact(step, { x: WIDTH / 2, y: SCORE_Y }, burst.landed)
            if (step.fire) fire(this, add, PURR_METER, room.meterWidth)
            counters.push(
              this.tweens.addCounter({
                from: before.night.score,
                to: event.nightScore,
                duration: beat(700),
                ease: "Cubic.easeOut",
                onUpdate: (tween) =>
                  room.showScore(Math.round(tween.getValue()!))
              })
            )
          }
        }
        case "nightCleared":
          return () => {
            pop(WIDTH / 2, 170, "Night cleared!", 34)
            impact(step, { x: WIDTH / 2, y: 170 }, burst.landed)
          }
        case "treatsAwarded": {
          // Treats rain into the jar, then are paid.
          const { rain: drops } = step
          if (drops)
            return () =>
              rain(this, add, {
                ...drops,
                into: { x: TREAT_JAR.x, y: TREAT_JAR.y - JAR_MOUTH },
                jar: room.jar,
                bob: beat(JAR_BOB_MS)
              })
          return () => {
            pop(WIDTH / 2, 215, `+${event.treats} Treats`, 24)
            room.showTreats(before.treats + event.treats)
            bump(room.treatCount, 1.4, 260, "Back.easeOut")
            for (const paid of event.forHouseCats)
              hop(paid.houseCat, `+${paid.treats} Treats`)
          }
        }
        case "nightLost":
          return () => pop(WIDTH / 2, 170, "Night lost", 30)
        default:
          return () => {}
      }
    }
    // House Cats switch to their triggered poses as their effects fire.
    for (const window of script.poses)
      timers.push(
        this.time.delayedCall(window.from, () =>
          pose(window.houseCat, window.pose)
        ),
        this.time.delayedCall(window.to, () => pose(window.houseCat, null))
      )
    /** How many steps have played out, sounds and all. */
    let stepsPlayed = 0
    script.steps.forEach((step, i) => {
      const show = animate(step)
      timers.push(
        this.time.delayedCall(step.at, () => {
          stepsPlayed = i + 1
          for (const cue of step.cues) sound.cue(cue)
          presentation.played(step)
          show()
        })
      )
    })

    const ended = events.some((event) => event.type === "runEnded")
    const finish = (ending: Ending) => {
      if (this.scoring !== sequence) return
      this.scoring = null
      for (const timer of timers) timer.remove()
      for (const counter of counters) counter.stop()
      this.cameras.main.resetFX()
      // Played out, a banner may take its bow; cut short, it goes at once,
      // and so does any pulse.
      if (ending !== "played") {
        for (const dismiss of banners) dismiss()
        if (settings.haptics) pulse([0])
      }
      // Skipped, the sequence still sounds how it ends, if it hadn't yet.
      if (ending === "skipped")
        for (const cue of skippedCues(script, stepsPlayed)) sound.cue(cue)
      this.skipArea.disableInteractive()
      presentation.update({ scoring: false })
      // Overtaken, the next sequence or draw shows what comes after.
      if (ending === "overtaken") return
      // A cleared Night's celebration over, the Scrapbook shows open.
      this.draw(ended ? "nodOff" : null)
      if (ended)
        this.bedtime = this.time.delayedCall(SLEEP_MOMENT_MS, () => {
          presentation.update({ asleep: true })
          this.draw("resultsAppear")
        })
    }
    const sequence = { finish }
    this.scoring = sequence
    timers.push(this.time.delayedCall(script.duration, () => finish("played")))
    this.skipArea.setInteractive()
    presentation.update({ scoring: true })
  }

  /** A Cat scoring hops up from its Seat at `rest`, and squashes as it lands. */
  private scoreHop(
    sprite: Phaser.GameObjects.Container,
    rest: Point,
    beat: (ms: number) => number
  ) {
    this.tweens.killTweensOf(sprite)
    sprite.setPosition(rest.x, rest.y).setScale(1)
    this.tweens.add({
      targets: sprite,
      y: rest.y - 14,
      scaleX: 0.92,
      scaleY: 1.1,
      duration: beat(120),
      yoyo: true,
      ease: "Quad.easeOut",
      onComplete: () =>
        this.tweens.add({
          targets: sprite,
          scaleX: { from: 1.16, to: 1 },
          scaleY: { from: 0.86, to: 1 },
          duration: beat(200),
          ease: "Back.easeOut"
        })
    })
  }

  /**
   * Brings one Gathering onto the Couch mid-sequence, its name where it sits
   * among the `row` of the Play's Gatherings.
   */
  private revealGathering(
    add: Add,
    active: ActiveGathering,
    row: ActiveGathering[],
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
    this.drawGatherings(collect, [active], "over", row)
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
      .text(0, -14, "New Gathering!", numbers(28, POP.purr))
      .setOrigin(0.5)
    const subtitle = this.add
      .text(0, 18, name, display(20, "#fdf6ea"))
      .setOrigin(0.5)
      .setStroke(OUTLINE, 4)
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
