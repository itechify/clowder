import { disasterById, type Run } from "../engine"

/**
 * The presentation model's HUD: every number the living room shows about the
 * Night, each exact, for the scene to draw into the room as it is. Pure data
 * from Run state, like staging.
 */

/** A budget shown as pips: `left` still to spend, out of the Night's `of`. */
export type Pips = { left: number; of: number }

/** How full the purr meter along the Couch's back is, and its number. */
export type PurrMeter = { filled: number; label: string }

export type Hud = {
  /** The moon phase in the window, and the Night written beside it. */
  night: { moon: number; label: string }
  /** The Treats in the treat jar. */
  treats: number
  meter: PurrMeter
  plays: Pips
  redraws: Pips
  drawPile: number
  /** Tonight's Disaster, while it is a Disaster Night. */
  disaster: { name: string; rule: string } | null
}

/** The purr meter at a Night score, full once it reaches the Target. */
export const purrMeter = (score: number, target: number): PurrMeter => ({
  filled: Math.min(1, score / target),
  label: `${score} / ${target}`
})

export function hud(run: Run): Hud {
  const { night, config } = run
  const disaster = night.disaster ? disasterById(night.disaster) : null
  // The Night began with the Plays and Redraws its rules allow.
  const plays = disaster?.changes.plays ?? config.playsPerNight
  const redraws = disaster?.changes.redraws ?? config.redrawsPerNight
  return {
    night: {
      moon: night.number,
      label: `Night ${night.number}/${config.nights}`
    },
    treats: run.treats,
    meter: purrMeter(night.score, night.target),
    plays: { left: night.playsLeft, of: plays },
    redraws: { left: night.redrawsLeft, of: redraws },
    drawPile: night.drawPile.length,
    disaster: disaster && { name: disaster.name, rule: disaster.rule }
  }
}
