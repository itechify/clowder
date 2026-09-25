import { houseCatArt } from "../art/manifest"
import type { Cue, CueName } from "../audio/cues"
import type { HouseCatId, RunEvent } from "../engine"
import type { ScoringSpeed } from "../shell/settings"
import {
  type EffectConfig,
  effectConfig,
  type Impact,
  noImpact
} from "./effectConfig"

/** Mult slamming into the Mult total: added, or multiplied by a × effect. */
export type Slam = "mult" | "times"

/**
 * One beat of a Play's scoring sequence: an engine event, what sounds, and
 * how hard it hits.
 */
export type Step = {
  /** When it begins, in ms from the start of the sequence. */
  at: number
  event: RunEvent
  /**
   * A step leading into its event's own: the Score counting up before it
   * lands, or Treats raining into the jar before they are paid.
   */
  prelude?: true
  cues: Cue[]
  slam?: Slam
  /** The purr meter catches fire as this Score lands. */
  fire?: true
  countUp?: CountUp
  rain?: Rain
} & Impact

/** The Score counting up from 0 `to` itself over `duration` ms (see `countedUp`). */
export type CountUp = { to: number; duration: number; power: number }

/** Treats raining into the jar: how many drops, over `duration` ms. */
export type Rain = { drops: number; duration: number }

/** A House Cat shown in a pose (an art key) from `from` ms until `to`. */
export type PoseWindow = {
  houseCat: HouseCatId
  pose: string
  from: number
  to: number
}

/** A Play's scoring sequence, as the scene plays it out. */
export type Script = {
  steps: Step[]
  /** When House Cats switch to their triggered pose, as their effects fire. */
  poses: PoseWindow[]
  /** How long the whole sequence lasts, in ms. */
  duration: number
}

/** A Play to choreograph: the events it returned, and its Night's Target. */
export type Play = { events: RunEvent[]; target: number }

/** The settings a scoring sequence follows. */
export type ChoreographySettings = {
  scoringSpeed: ScoringSpeed
  reducedMotion: boolean
  haptics: boolean
}

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
  /** Once the Score has counted up, it holds for this long. */
  scoreTotal: 700,
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
  { events, target }: Play,
  { scoringSpeed, reducedMotion, haptics }: ChoreographySettings,
  config: EffectConfig = effectConfig
): Script {
  // Reduced motion keeps every number and cue, and particles only softened.
  const softened = (count: number) =>
    reducedMotion ? Math.ceil(count * config.reducedParticles) : count
  const asSettingsAllow = ({
    shake,
    flash,
    particles,
    haptic
  }: Impact): Impact => ({
    shake: reducedMotion ? 0 : shake,
    flash: reducedMotion ? 0 : flash,
    particles: softened(particles),
    haptic: haptics ? haptic : null
  })

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
  const poses: PoseWindow[] = []
  /** Holds a House Cat's triggered pose, running on from one still held. */
  const holdPose = (houseCat: HouseCatId, from: number, to: number) => {
    const held = poses.findLast((window) => window.houseCat === houseCat)
    if (held && held.to >= from) held.to = Math.max(held.to, to)
    else poses.push({ houseCat, pose: triggeredPose(houseCat), from, to })
  }
  let time = LEAD_IN
  /** A step leading into `event`'s own, holding the sequence for `ms` at 1×. */
  const prelude = (
    event: RunEvent,
    ms: number,
    shows: Pick<Step, "countUp" | "rain">
  ) => {
    steps.push({
      at: time / scoringSpeed,
      event,
      prelude: true,
      cues: [],
      ...shows,
      ...noImpact
    })
    time += ms
  }
  // Effects escalate with how big the Play has grown so far, as a share of
  // the Target: its running Purr × Mult, then the Score the engine gives.
  let size = 0
  for (const event of events) {
    const beat = beats[event.type]
    if (beat === undefined) continue
    if ("tally" in event) size = event.tally.purr * event.tally.mult
    if (event.type === "scoreTotal") size = event.score
    const tier = tierOf(size / target, config)
    const { intensity } = tier
    // The Score counts up before it lands...
    if (event.type === "scoreTotal")
      prelude(event, tier.countUp, {
        countUp: {
          to: event.score,
          duration: tier.countUp / scoringSpeed,
          power: config.countUpPower
        }
      })
    // ...and Treats rain into the jar before they are paid.
    if (event.type === "treatsAwarded")
      prelude(event, config.rain.ms, {
        rain: {
          drops: softened(Math.min(event.treats, config.rain.maxDrops)),
          duration: config.rain.ms / scoringSpeed
        }
      })
    const slam = slamOf(event)
    const fire =
      event.type === "scoreTotal" && event.score >= config.fireAt * target
    steps.push({
      at: time / scoringSpeed,
      event,
      cues: cuesFor(event),
      ...(slam ? { slam } : {}),
      ...(fire && !reducedMotion ? { fire } : {}),
      ...asSettingsAllow(
        escalate(
          slam ? config[slam] : fire ? config.fire : impactOf(event, config),
          intensity
        )
      )
    })
    for (const houseCat of firing(event))
      holdPose(houseCat, time / scoringSpeed, (time + beat) / scoringSpeed)
    time += beat
  }
  return { steps, poses, duration: (time + TAIL) / scoringSpeed }
}

/** The House Cats whose effects an event fires, in Shelf order. */
function firing(event: RunEvent): HouseCatId[] {
  switch (event.type) {
    case "wholePlayEffect":
    case "houseCatWarmedUp":
    case "timesEffect":
    case "catGrew":
      return [event.houseCat]
    case "catScored":
    case "repeat":
      return [
        ...(event.source === "seat" ? [] : [event.source]),
        ...event.multFrom.map((from) => from.houseCat)
      ]
    case "treatsAwarded":
      return event.forHouseCats.map((paid) => paid.houseCat)
    default:
      return []
  }
}

/** A House Cat's pose while its effect fires; Skadi rolls belly-up. */
const triggeredPose = (houseCat: HouseCatId) =>
  houseCatArt(houseCat, houseCat === "skadi" ? "bellyUp" : "triggered")

/** The slam an event makes, if it adds Mult or multiplies it. */
function slamOf(event: RunEvent): Slam | undefined {
  switch (event.type) {
    case "gatheringActivated":
    case "wholePlayEffect":
      return "mult"
    case "catScored":
    case "repeat":
      return event.mult ? "mult" : undefined
    case "timesEffect":
      return "times"
  }
}

/** How hard an event that slams nothing hits. */
function impactOf(event: RunEvent, config: EffectConfig): Impact {
  switch (event.type) {
    case "catScored":
    case "repeat":
      return config.scored
    case "scoreTotal":
      return config.landed
    case "nightCleared":
      return config.cleared
    default:
      return noImpact
  }
}

/** The highest escalation tier a share of the Target reaches. */
const tierOf = (share: number, { tiers }: EffectConfig) =>
  tiers.findLast((tier) => share >= tier.from) ?? tiers[0]

/** An impact at an escalation tier's intensity. */
const escalate = (
  { shake, flash, particles, haptic }: Impact,
  intensity: number
): Impact => ({
  shake: shake * intensity,
  flash: Math.min(1, flash * intensity),
  particles: Math.round(particles * intensity),
  haptic: haptic?.map((ms) => Math.round(ms * intensity)) ?? null
})

/**
 * The number a count-up shows `elapsed` ms in: slow at first, then faster and
 * faster, landing exactly on the Score.
 */
export function countedUp({ to, duration, power }: CountUp, elapsed: number) {
  const progress = duration > 0 ? Math.min(1, elapsed / duration) : 1
  return Math.round(to * progress ** power)
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
