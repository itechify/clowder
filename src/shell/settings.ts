/** How fast a scoring sequence plays, as a multiple of its natural pace. */
export const scoringSpeeds = [1, 2, 4] as const

export type ScoringSpeed = (typeof scoringSpeeds)[number]

type SettingsStorage = Pick<Storage, "getItem" | "setItem">

const KEY = "clowder.settings"

/** The player's preferences, kept on this device across visits. */
export class Settings {
  scoringSpeed: ScoringSpeed = 1
  /** Bumped on every change, for React's useSyncExternalStore. */
  revision = 0
  private listeners = new Set<() => void>()

  constructor(private storage?: SettingsStorage) {
    const stored = this.read()
    if (scoringSpeeds.includes(stored?.scoringSpeed))
      this.scoringSpeed = stored.scoringSpeed
  }

  setScoringSpeed(speed: ScoringSpeed) {
    this.scoringSpeed = speed
    this.write()
    this.emit()
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

  private write() {
    try {
      this.storage?.setItem(
        KEY,
        JSON.stringify({ scoringSpeed: this.scoringSpeed })
      )
    } catch {}
  }

  private emit() {
    this.revision++
    for (const listener of this.listeners) listener()
  }
}

export const settings = new Settings(
  typeof window === "undefined" ? undefined : window.localStorage
)
