import type { CatId } from "../engine"
import type { Step } from "./choreography"

/** How many recent effects the log keeps, for end-to-end tests. */
const LOG_LENGTH = 1000

/** The effects of a scoring step, as the scene played them. */
export type PlayedEffect = Pick<
  Step,
  "shake" | "flash" | "particles" | "haptic"
> & { event: Step["event"]["type"]; fire: boolean }

/** The scenes that show a Run, by their Phaser keys. */
export type SceneKey = "couch" | "shop"

/**
 * What the scene is in the middle of showing, for the shell and end-to-end
 * tests to wait on. The Run itself lives in the Session; this is presentation.
 */
class Presentation {
  /** The scene showing the Run, once one has started. */
  scene: SceneKey | null = null
  /** A Play's scoring sequence is playing out. */
  scoring = false
  /** The Run is over and the household has fallen asleep. */
  asleep = false
  /**
   * The Couch's Cats in the order they were placed, earliest first, which way
   * they face depends on (see staging's `seatingOrder`). Not a change the
   * shell follows.
   */
  seatingOrder: CatId[] = []
  /**
   * The effects of the scoring steps played lately, in order; not a change
   * the shell follows.
   */
  readonly effects: PlayedEffect[] = []
  /** Bumped on every change, for React's useSyncExternalStore. */
  revision = 0
  private listeners = new Set<() => void>()

  update(change: Partial<Pick<Presentation, "scene" | "scoring" | "asleep">>) {
    Object.assign(this, change)
    this.revision++
    for (const listener of this.listeners) listener()
  }

  /** Notes a scoring step's effects as the scene plays it. */
  played({ event, shake, flash, particles, haptic, fire }: Step) {
    this.effects.push({
      event: event.type,
      shake,
      flash,
      particles,
      haptic,
      fire: !!fire
    })
    if (this.effects.length > LOG_LENGTH) this.effects.shift()
  }

  on = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

export const presentation = new Presentation()
