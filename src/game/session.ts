import {
  type Action,
  type ActionResult,
  applyAction,
  type Run,
  type RunEvent,
  startRun
} from "../engine"

type Listener = (events: RunEvent[]) => void

/** A seed for a new Run: the page's `?seed=` when given, otherwise random. */
export function chooseSeed(search = location.search): number {
  const given = Number(new URLSearchParams(search).get("seed"))
  return Number.isInteger(given) && given !== 0
    ? given
    : Math.floor(Math.random() * 2 ** 31) + 1
}

/**
 * The one Run in progress. The scene and the shell both read it and send
 * actions through it; neither computes any rule itself.
 */
class Session {
  run: Run = startRun(chooseSeed())
  /** Bumped on every change, for React's useSyncExternalStore. */
  revision = 0
  private listeners = new Set<Listener>()

  start(seed: number) {
    this.run = startRun(seed)
    this.emit([])
  }

  apply(action: Action): ActionResult {
    const result = applyAction(this.run, action)
    if (result.ok) {
      this.run = result.run
      this.emit(result.events)
    }
    return result
  }

  on = (listener: Listener) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(events: RunEvent[]) {
    this.revision++
    for (const listener of this.listeners) listener(events)
  }
}

export const session = new Session()
