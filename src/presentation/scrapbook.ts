import {
  type Action,
  type ActiveClowder,
  type ClowderBonus,
  type ClowderId,
  clowderBonus,
  clowderById,
  clowders,
  type Run
} from "../engine"

/**
 * The presentation model's Scrapbook: the pages offered after a cleared
 * Night, the Scrapbook itself, and how Clowders are labelled at their
 * Clowder levels. Pure data
 * from Run state, like staging, so the scene only draws it.
 */

/** A Scrapbook page on offer, and exactly what choosing it changes. */
export type ScrapbookPage = {
  clowder: ClowderId
  name: string
  /** What the Couch needs to form the Clowder. */
  requirement: string
  level: { from: number; to: number }
  /** The Purr and Mult the next level adds whenever the Clowder is active. */
  change: ClowderBonus
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
 * A Clowder in the Scrapbook: once discovered, its level and all it adds at
 * that level, such as "Lv 3" and "+7 Mult +20 Purr"; until then, hidden.
 */
export type ScrapbookEntry =
  | {
      discovered: true
      clowder: ClowderId
      name: string
      requirement: string
      level: number
      label: { level: string; adds: string }
    }
  | { discovered: false; name: "???"; requirement: "???" }

/** The Scrapbook opened from the living room: every Clowder, in order. */
export type ScrapbookView = { title: string; entries: ScrapbookEntry[] }

/** Purr and Mult as added, such as "+7 Mult" and "+20 Purr"; no Purr if none. */
export const addedParts = ({ purr, mult }: ClowderBonus) => ({
  mult: `+${mult} Mult`,
  purr: purr ? `+${purr} Purr` : null
})

/** Purr and Mult as added, Mult first; Purr only when there is some. */
const added = (bonus: ClowderBonus) => {
  const { mult, purr } = addedParts(bonus)
  return purr ? `${mult} ${purr}` : mult
}

/** A Clowder level, as the Scrapbook and the Couch write it: "Lv 3". */
export const levelLabel = (level: number) => `Lv ${level}`

/**
 * A Clowder on the Couch and in the preview: its name and its level, such
 * as "Nap Club Lv 3". What it adds is in the Scrapbook.
 */
export const clowderLabel = ({ name, level }: ActiveClowder) =>
  `${name} ${levelLabel(level)}`

/** The Scrapbook pages offered, while the Scrapbook is open. */
export function scrapbookChoice(run: Run): ScrapbookChoice | null {
  if (!run.scrapbookPages) return null
  return {
    title: "Choose a Scrapbook page",
    pages: run.scrapbookPages.map((clowder) => {
      const from = run.clowderLevels[clowder]
      // Every level adds the same.
      const change = run.config.clowderLevelBonus[clowder]
      const { name, requirement } = clowderById(clowder)
      return {
        clowder,
        name,
        requirement,
        level: { from, to: from + 1 },
        change,
        label: { levels: `Lv ${from} → ${from + 1}`, adds: added(change) },
        action: { type: "choosePage", clowder }
      }
    })
  }
}

/**
 * The Scrapbook as the player opens it: every Clowder's level and
 * requirement, with those not yet discovered this Run shown as "???".
 */
export function scrapbookView(run: Run): ScrapbookView {
  return {
    title: "Scrapbook",
    entries: clowders.map(({ id, name, requirement }): ScrapbookEntry => {
      if (!run.discoveredClowders.includes(id))
        return { discovered: false, name: "???", requirement: "???" }
      const level = run.clowderLevels[id]
      return {
        discovered: true,
        clowder: id,
        name,
        requirement,
        level,
        label: {
          level: levelLabel(level),
          adds: added(clowderBonus(run.config, id, level))
        }
      }
    })
  }
}
