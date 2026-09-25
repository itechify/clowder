/**
 * How hard a Play's scoring hits: every effect intensity and escalation
 * threshold the choreography reads. Tuning the feel belongs here, not in code.
 */
export type EffectConfig = {
  /**
   * Escalation tiers, by Score as a share of the Night's Target, lowest first:
   * from its `from` share, a step's intensities are multiplied by `intensity`,
   * and a Score reaching the tier counts up for `countUp` ms at 1×.
   */
  tiers: readonly { from: number; intensity: number; countUp: number }[]
  /** The purr meter catches fire when a single Play's Score is at least this share of the Target. */
  fireAt: number
  /** How fast the Score counts up: its progress is time's progress to this power. */
  countUpPower: number
  /** A Cat scoring: its Purr pops in a little burst. */
  scored: Impact
  /** Mult added: it slams into the Mult total in red. */
  mult: Impact
  /** A × effect: it slams harder, with a flash. */
  times: Impact
  /** The Score landing, when it falls short of the fire... */
  landed: Impact
  /** ...and when the purr meter catches fire. */
  fire: Impact
  /** A Night cleared. */
  cleared: Impact
  /** Treats raining into the jar before the payout: the most drops, and how long they fall at 1×. */
  rain: { maxDrops: number; ms: number }
  /** How long a shake and a flash last at 1×, in ms. */
  shakeMs: number
  flashMs: number
  /** Reduced motion keeps this share of particles, softened but never gone. */
  reducedParticles: number
}

/**
 * One step's physical effects at the lowest tier: how hard the camera shakes
 * (a share of the screen), how bright the room flashes (0 to 1), how many
 * particles burst, and any haptic pulse pattern in ms.
 */
export type Impact = {
  shake: number
  flash: number
  particles: number
  haptic: readonly number[] | null
}

const none: Impact = { shake: 0, flash: 0, particles: 0, haptic: null }

export const effectConfig: EffectConfig = {
  tiers: [
    { from: 0, intensity: 1, countUp: 600 },
    { from: 0.25, intensity: 1.35, countUp: 800 },
    { from: 0.5, intensity: 1.75, countUp: 1000 },
    { from: 1, intensity: 2.25, countUp: 1300 }
  ],
  fireAt: 1,
  countUpPower: 3,
  scored: { ...none, particles: 4 },
  mult: { ...none, shake: 0.003, particles: 6 },
  times: { shake: 0.006, flash: 0.2, particles: 10, haptic: [20] },
  landed: { shake: 0.004, flash: 0, particles: 16, haptic: [20] },
  // Fire always lands at the top tier, so these are multiplied most.
  fire: { shake: 0.01, flash: 0.3, particles: 36, haptic: [40, 30, 60] },
  cleared: { ...none, haptic: [30, 40, 30] },
  rain: { maxDrops: 16, ms: 900 },
  shakeMs: 220,
  flashMs: 260,
  reducedParticles: 0.3
}
