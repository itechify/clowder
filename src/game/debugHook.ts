import Phaser from "phaser"
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
  /** Every piece of text the showing scenes draw, in drawing order. */
  texts: () => string[]
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
    },
    texts: () =>
      game.scene
        .getScenes(true)
        .flatMap((scene) => textsIn(scene.children.list))
  }
}

/** The visible text among some game objects, looking inside containers. */
function textsIn(objects: Phaser.GameObjects.GameObject[]): string[] {
  return objects.flatMap((object) => {
    if (object instanceof Phaser.GameObjects.Container)
      return object.visible ? textsIn(object.list) : []
    return object instanceof Phaser.GameObjects.Text && object.visible
      ? [object.text]
      : []
  })
}
