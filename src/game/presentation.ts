/**
 * What the scene is in the middle of showing, for the shell and end-to-end
 * tests to wait on. The Run itself lives in the Session; this is presentation.
 */
class Presentation {
  /** The scene showing the Run, once one has started. */
  scene: "couch" | "shop" | null = null
  /** A Play's scoring sequence is playing out. */
  scoring = false
  /** The Run is over and the household has fallen asleep. */
  asleep = false
  /** Bumped on every change, for React's useSyncExternalStore. */
  revision = 0
  private listeners = new Set<() => void>()

  update(change: Partial<Pick<Presentation, "scene" | "scoring" | "asleep">>) {
    Object.assign(this, change)
    this.revision++
    for (const listener of this.listeners) listener()
  }

  on = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}

export const presentation = new Presentation()
