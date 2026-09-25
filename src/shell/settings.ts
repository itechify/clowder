/** How fast a scoring sequence plays, as a multiple of its natural pace. */
export const scoringSpeeds = [1, 2, 4] as const

export type ScoringSpeed = (typeof scoringSpeeds)[number]

type SettingsStorage = Pick<Storage, "getItem" | "setItem">

/** What this device offers the settings beyond storage. */
export interface Device {
  /** Whether the Vibration API is supported; iOS Safari has none. */
  canVibrate?: boolean
  /** The OS's `prefers-reduced-motion` media query. */
  motionQuery?: MotionQuery
}

interface MotionQuery {
  readonly matches: boolean
  addEventListener(type: "change", listener: () => void): void
}

const KEY = "clowder.settings"

/** The player's preferences, kept on this device across visits. */
export class Settings {
  scoringSpeed: ScoringSpeed = 1
  /** From silent (0) to full (1). */
  musicVolume = 0.6
  /** From silent (0) to full (1). */
  sfxVolume = 0.8
  /** Silences music and sound effects without forgetting their volumes. */
  muted = false
  readonly hapticsAvailable: boolean
  /** The player's haptics choice, kept for devices that can vibrate. */
  private chosenHaptics = true
  /** The player's own Reduced motion choice, once they have made one. */
  private chosenReducedMotion?: boolean
  private motionQuery?: MotionQuery
  /** Bumped on every change, for React's useSyncExternalStore. */
  revision = 0
  private listeners = new Set<() => void>()

  constructor(
    private storage?: SettingsStorage,
    device: Device = {}
  ) {
    this.hapticsAvailable = device.canVibrate ?? false
    this.motionQuery = device.motionQuery
    this.motionQuery?.addEventListener("change", () => {
      if (this.chosenReducedMotion === undefined) this.emit()
    })
    const stored = this.read()
    if (scoringSpeeds.includes(stored?.scoringSpeed))
      this.scoringSpeed = stored.scoringSpeed
    if (isVolume(stored?.musicVolume)) this.musicVolume = stored.musicVolume
    if (isVolume(stored?.sfxVolume)) this.sfxVolume = stored.sfxVolume
    if (typeof stored?.muted === "boolean") this.muted = stored.muted
    if (typeof stored?.haptics === "boolean")
      this.chosenHaptics = stored.haptics
    if (typeof stored?.reducedMotion === "boolean")
      this.chosenReducedMotion = stored.reducedMotion
  }

  /** Pulses on big moments; always off where haptics are unavailable. */
  get haptics() {
    return this.hapticsAvailable && this.chosenHaptics
  }

  /** Calms effects; follows the OS preference until the player chooses. */
  get reducedMotion() {
    return this.chosenReducedMotion ?? this.motionQuery?.matches ?? false
  }

  setScoringSpeed(speed: ScoringSpeed) {
    this.scoringSpeed = speed
    this.changed()
  }

  setMusicVolume(volume: number) {
    this.musicVolume = clampVolume(volume)
    this.changed()
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = clampVolume(volume)
    this.changed()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.changed()
  }

  setHaptics(haptics: boolean) {
    this.chosenHaptics = haptics
    this.changed()
  }

  setReducedMotion(reducedMotion: boolean) {
    this.chosenReducedMotion = reducedMotion
    this.changed()
  }

  on = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // Private browsing and full disks can refuse storage; settings then last
  // only as long as the page.
  private read() {
    try {
      return JSON.parse(this.storage?.getItem(KEY) ?? "null")
    } catch {
      return null
    }
  }

  private changed() {
    this.write()
    this.emit()
  }

  private write() {
    try {
      this.storage?.setItem(
        KEY,
        JSON.stringify({
          scoringSpeed: this.scoringSpeed,
          musicVolume: this.musicVolume,
          sfxVolume: this.sfxVolume,
          muted: this.muted,
          haptics: this.chosenHaptics,
          reducedMotion: this.chosenReducedMotion
        })
      )
    } catch {}
  }

  private emit() {
    this.revision++
    for (const listener of this.listeners) listener()
  }
}

function isVolume(value: unknown): value is number {
  return typeof value === "number" && value >= 0 && value <= 1
}

function clampVolume(volume: number) {
  return Math.min(1, Math.max(0, volume))
}

export const settings =
  typeof window === "undefined"
    ? new Settings()
    : new Settings(window.localStorage, {
        canVibrate: typeof navigator.vibrate === "function",
        motionQuery: window.matchMedia("(prefers-reduced-motion: reduce)")
      })
