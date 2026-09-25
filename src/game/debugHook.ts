import type Phaser from "phaser"
import {
  type Action,
  type ActionResult,
  previewPlay,
  type Run,
  type ScoreBreakdown
} from "../engine"
import { artTexture, delivered } from "./art"
import { presentation } from "./presentation"
import { session } from "./session"

export type DebugHook = {
  run: () => Run
  preview: () => ScoreBreakdown
  apply: (action: Action) => ActionResult
  start: (seed: number) => void
  /** Whether a Play's scoring sequence is playing out in the scene. */
  scoring: () => boolean
  /** The keys of the scenes showing now, such as "couch" or "shop". */
  scenes: () => string[]
  /** Shows an art key's image, reporting whether it is delivered or code-drawn. */
  art: (key: string) => "delivered" | "fallback"
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
    scoring: () => presentation.scoring,
    scenes: () => game.scene.getScenes(true).map((scene) => scene.scene.key),
    art: (key) => {
      artTexture(game.scene.getScenes(true)[0], key)
      return delivered(game.textures, key) ? "delivered" : "fallback"
    }
  }
}
