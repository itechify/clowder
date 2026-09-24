import {
  type Action,
  type ActionResult,
  previewPlay,
  type Run,
  type ScoreBreakdown
} from "../engine"
import { presentation } from "./presentation"
import { session } from "./session"

export type DebugHook = {
  run: () => Run
  preview: () => ScoreBreakdown
  apply: (action: Action) => ActionResult
  start: (seed: number) => void
  /** Whether a Play's scoring sequence is playing out in the scene. */
  scoring: () => boolean
}

declare global {
  interface Window {
    /** Present in development builds only. */
    __clowder?: DebugHook
  }
}

/**
 * Lets end-to-end tests drive the engine in the running game despite the
 * canvas. Installed in development builds only (see src/main.tsx).
 */
export function installDebugHook() {
  window.__clowder = {
    run: () => session.run,
    preview: () => previewPlay(session.run),
    apply: (action) => session.apply(action),
    start: (seed) => session.start(seed),
    scoring: () => presentation.scoring
  }
}
