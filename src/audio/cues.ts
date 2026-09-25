/**
 * The named sounds the game asks for (ADR-0004). Each has a synthesized voice
 * behind it in `voices.ts`, which can change without the game noticing.
 */
export const cueNames = [
  "catSeated",
  /** Climbs one pitch step per Scoring event within a Play. */
  "catScored",
  "gatheringActivated",
  "multAdded",
  "timesApplied",
  "scoreLanded",
  "nightCleared",
  "nightLost",
  /** Treats spent in the Shop. */
  "treatsSpent",
  "uiTap"
] as const

export type CueName = (typeof cueNames)[number]

/** A cue to sound, `pitch` steps up its scale (0 is its root). */
export type Cue = { name: CueName; pitch?: number }

/** The music for each part of a Run. */
export const themeNames = ["night", "disaster", "shop", "results"] as const

export type ThemeName = (typeof themeNames)[number]
