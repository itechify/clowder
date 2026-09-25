import {
  type Action,
  type ActionResult,
  applyAction,
  type Run,
  type RunEvent,
  restoreRun,
  serialiseRun,
  startRun
} from "../engine"

type Listener = (events: RunEvent[]) => void

type RunStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">

/** Where the one saved Run on this device is kept. */
const KEY = "clowder.run"

/** The seed a page's `?seed=` asks for, if it asks for one. */
function seedFrom(search: string): number | undefined {
  const param = new URLSearchParams(search).get("seed")
  const given = Number(param)
  return param !== null && param !== "" && Number.isInteger(given)
    ? given
    : undefined
}

const randomSeed = () => Math.floor(Math.random() * 2 ** 31)

/**
 * The one Run in progress. The scene and the shell both read it and send
 * actions through it; neither computes any rule itself. It is saved on this
 * device after every change, and resumed on the next visit unless the page
 * asks for a seeded Run instead.
 */
export class Session {
  run: Run
  /** Bumped on every change, for React's useSyncExternalStore. */
  revision = 0
  private listeners = new Set<Listener>()

  constructor(
    private storage?: RunStorage,
    search = ""
  ) {
    const seed = seedFrom(search)
    this.run =
      seed === undefined
        ? (this.load() ?? startRun(randomSeed()))
        : startRun(seed)
    this.save()
  }

  start(seed: number) {
    this.run = startRun(seed)
    this.save()
    this.emit([])
  }

  /** A fresh Run from a new random seed. */
  newHousehold() {
    let seed = randomSeed()
    while (seed === this.run.seed) seed = randomSeed()
    this.start(seed)
  }

  apply(action: Action): ActionResult {
    const result = applyAction(this.run, action)
    if (result.ok) {
      this.run = result.run
      this.save()
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

  // Private browsing and full disks can refuse storage; the Run then lasts
  // only as long as the page.
  private load() {
    try {
      const saved = this.storage?.getItem(KEY)
      return saved ? restoreRun(saved) : undefined
    } catch {
      return undefined
    }
  }

  /** Keeps the Run for the next visit; a finished Run is not resumed. */
  private save() {
    try {
      if (this.run.status === "playing")
        this.storage?.setItem(KEY, serialiseRun(this.run))
      else this.storage?.removeItem(KEY)
    } catch {}
  }
}

function pageSession() {
  if (typeof window === "undefined") return new Session()
  const session = new Session(window.localStorage, location.search)
  // A seeded Run is saved like any other, so reloading resumes it rather
  // than starting it over.
  const url = new URL(location.href)
  if (url.searchParams.has("seed")) {
    url.searchParams.delete("seed")
    history.replaceState(history.state, "", url)
  }
  return session
}

export const session = pageSession()
