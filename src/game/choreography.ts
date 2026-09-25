import type { Cue, CueName } from "../audio/cues"
import type { RunEvent } from "../engine"
import type { ScoringSpeed } from "../shell/settings"

/** One beat of a Play's scoring sequence: an engine event, and what sounds. */
export type Step = {
  /** When it begins, in ms from the start of the sequence. */
  at: number
  event: RunEvent
  cues: Cue[]
}

/** A Play's scoring sequence, as the scene plays it out. */
export type Script = {
  steps: Step[]
  /** How long the whole sequence lasts, in ms. */
  duration: number
}

/** The settings a scoring sequence follows. */
export type ChoreographySettings = { scoringSpeed: ScoringSpeed }

/** A moment's pause before the first step, and after the last. */
const LEAD_IN = 250
const TAIL = 300

/** How long each event holds the sequence at 1×; others take no beat. */
const beats: Partial<Record<RunEvent["type"], number>> = {
  gatheringActivated: 500,
  wholePlayEffect: 500,
  catScored: 380,
  repeat: 380,
  houseCatWarmedUp: 600,
  catGrew: 450,
  timesEffect: 500,
  scoreTotal: 1000,
  nightCleared: 500,
  treatsAwarded: 500,
  nightLost: 500
}

/**
 * Turns a Play's events into the scoring sequence the scene plays out: each
 * event in order, on its own beat at the scoring speed, with the sounds it
 * makes. It computes no rule.
 */
export function choreograph(
  events: RunEvent[],
  { scoringSpeed }: ChoreographySettings
): Script {
  // Each Scoring event, Repeats included, sounds a step higher than the last.
  let pitch = 0
  const cuesFor = (event: RunEvent): Cue[] => {
    switch (event.type) {
      case "gatheringActivated":
        return [{ name: "gatheringActivated" }]
      case "wholePlayEffect":
        return [{ name: "multAdded" }]
      case "catScored":
      case "repeat":
        return [
          { name: "catScored", pitch: pitch++ },
          ...(event.mult ? [{ name: "multAdded" } as const] : [])
        ]
      case "timesEffect":
        return [{ name: "timesApplied" }]
      case "scoreTotal":
        return [{ name: "scoreLanded" }]
      case "nightCleared":
        return [{ name: "nightCleared" }]
      case "nightLost":
        return [{ name: "nightLost" }]
      default:
        return []
    }
  }

  const steps: Step[] = []
  let time = LEAD_IN
  for (const event of events) {
    const beat = beats[event.type]
    if (beat === undefined) continue
    steps.push({ at: time / scoringSpeed, event, cues: cuesFor(event) })
    time += beat
  }
  return { steps, duration: (time + TAIL) / scoringSpeed }
}

/** The cues that tell how a Play ended: its Score, then its Night's end. */
const endings: CueName[] = ["scoreLanded", "nightCleared", "nightLost"]

/**
 * What a sequence skipped after `played` steps still sounds: how the Play
 * ended, as far as it had not sounded yet.
 */
export const skippedCues = (script: Script, played: number): Cue[] =>
  script.steps
    .slice(played)
    .flatMap((step) => step.cues)
    .filter((cue) => endings.includes(cue.name))
