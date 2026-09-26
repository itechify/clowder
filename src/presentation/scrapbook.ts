import {
  type Action,
  type ActiveGathering,
  type GatheringBonus,
  type GatheringId,
  gatheringBonus,
  gatheringById,
  gatherings,
  type Run
} from "../engine"

/**
 * The presentation model's Scrapbook: the pages offered after a cleared
 * Night, the Scrapbook itself, and how Gatherings are labelled at their
 * Gathering levels. Pure data
 * from Run state, like staging, so the scene only draws it.
 */

/** A Scrapbook page on offer, and exactly what choosing it changes. */
export type ScrapbookPage = {
  gathering: GatheringId
  name: string
  /** What the Couch needs to form the Gathering. */
  requirement: string
  level: { from: number; to: number }
  /** The Purr and Mult the next level adds whenever the Gathering is active. */
  change: GatheringBonus
  /**
   * The page's words for the level change, such as "Lv 2 → 3", and what it
   * adds, such as "+2 Mult +10 Purr".
   */
  label: { levels: string; adds: string }
  /** Choosing the page. */
  action: Action
}

/** The Scrapbook open in the living room, its pages side by side. */
export type ScrapbookChoice = { title: string; pages: ScrapbookPage[] }

/**
 * A Gathering in the Scrapbook: once discovered, its level and all it adds at
 * that level, such as "Lv 3" and "+7 Mult +20 Purr"; until then, hidden.
 */
export type ScrapbookEntry =
  | {
      discovered: true
      gathering: GatheringId
      name: string
      requirement: string
      level: number
      label: { level: string; adds: string }
    }
  | { discovered: false; name: "???"; requirement: "???" }

/** The Scrapbook opened from the living room: every Gathering, in order. */
export type ScrapbookView = { title: string; entries: ScrapbookEntry[] }

/** Purr and Mult as added, Mult first; Purr only when there is some. */
const added = ({ purr, mult }: GatheringBonus) =>
  [`+${mult} Mult`, ...(purr ? [`+${purr} Purr`] : [])].join(" ")

/**
 * A Gathering on the Couch and in the preview: its name, its level, and all
 * it adds to the Play, such as "Nap Club Lv 3 · +7 Mult +20 Purr".
 */
export const gatheringLabel = ({ name, level, purr, mult }: ActiveGathering) =>
  `${name} Lv ${level} · ${added({ purr, mult })}`

/** The Scrapbook pages offered, while the Scrapbook is open. */
export function scrapbookChoice(run: Run): ScrapbookChoice | null {
  if (!run.scrapbookPages) return null
  return {
    title: "Choose a Scrapbook page",
    pages: run.scrapbookPages.map((gathering) => {
      const from = run.gatheringLevels[gathering]
      // Every level adds the same.
      const change = run.config.gatheringLevelBonus[gathering]
      const { name, requirement } = gatheringById(gathering)
      return {
        gathering,
        name,
        requirement,
        level: { from, to: from + 1 },
        change,
        label: { levels: `Lv ${from} → ${from + 1}`, adds: added(change) },
        action: { type: "choosePage", gathering }
      }
    })
  }
}

/**
 * The Scrapbook as the player opens it: every Gathering's level and
 * requirement, with those not yet discovered this Run shown as "???".
 */
export function scrapbookView(run: Run): ScrapbookView {
  return {
    title: "Scrapbook",
    entries: gatherings.map(({ id, name, requirement }): ScrapbookEntry => {
      if (!run.discoveredGatherings.includes(id))
        return { discovered: false, name: "???", requirement: "???" }
      const level = run.gatheringLevels[id]
      return {
        discovered: true,
        gathering: id,
        name,
        requirement,
        level,
        label: {
          level: `Lv ${level}`,
          adds: added(gatheringBonus(run.config, id, level))
        }
      }
    })
  }
}
