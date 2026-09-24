import type Phaser from "phaser"
import {
  type Action,
  type ActionResult,
  previewPlay,
  type Run,
  type ScoreBreakdown
} from "../engine"
import { session } from "./session"

export type DebugHook = {
  run: () => Run
  preview: () => ScoreBreakdown
  apply: (action: Action) => ActionResult
  start: (seed: number) => void
  /** The keys of the scenes showing now, such as "couch" or "shop". */
  scenes: () => string[]
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
export function installDebugHook(game: Phaser.Game) {
  window.__clowder = {
    run: () => session.run,
    preview: () => previewPlay(session.run),
    apply: (action) => session.apply(action),
    start: (seed) => session.start(seed),
    scenes: () => game.scene.getScenes(true).map((scene) => scene.scene.key)
  }
}
