import Phaser from "phaser"
import type { Cue, ThemeName } from "../audio/cues"
import { sound } from "../audio/sound"
import {
  type Action,
  type ActionResult,
  type Config,
  defaultConfig,
  previewPlay,
  type Run,
  type ScoreBreakdown
} from "../engine"
import {
  type Results,
  type Staging,
  stage,
  stageAsleep
} from "../presentation/staging"
import { artTexture, delivered } from "./art"
import type { CouchScene } from "./CouchScene"
import { type PlayedEffect, presentation } from "./presentation"
import { session } from "./session"

export type DebugHook = {
  run: () => Run
  preview: () => ScoreBreakdown
  apply: (action: Action) => ActionResult
  /** Starts a Run from a seed, its config changed as given. */
  start: (seed: number, config?: Partial<Config>) => void
  /** Whether a Play's scoring sequence is playing out in the scene. */
  scoring: () => boolean
  /** The keys of the scenes showing now, such as "couch" or "shop". */
  scenes: () => string[]
  /** Shows an art key's image, reporting whether it is delivered or code-drawn. */
  art: (key: string) => "delivered" | "fallback"
  /** Every piece of text the showing scenes draw, in drawing order. */
  texts: () => string[]
  /**
   * What the living room shows for the Run as it stands (see staging): once
   * it is over, the household asleep.
   */
  staging: () => Staging
  /** The Results the sleeping living room shows, while it shows them. */
  results: () => Results | null
  /** Presses New Household, if the Results show it; returns whether it did. */
  newHousehold: () => boolean
  /** Every sound cue the game has asked for, in order. */
  cues: () => Cue[]
  /** The effects of every scoring step the scene has played, in order. */
  effects: () => PlayedEffect[]
  /** Whether audio has started, and the theme for what is showing. */
  audio: () => { unlocked: boolean; theme: ThemeName | null }
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
    start: (seed, config) =>
      session.start(seed, { ...defaultConfig, ...config }),
    scoring: () => presentation.scoring,
    scenes: () => game.scene.getScenes(true).map((scene) => scene.scene.key),
    art: (key) => {
      artTexture(game.scene.getScenes(true)[0], key)
      return delivered(game.textures, key) ? "delivered" : "fallback"
    },
    texts: () =>
      game.scene
        .getScenes(true)
        .flatMap((scene) => textsIn(scene.children.list)),
    staging: () => {
      const { run } = session
      if (run.status === "playing") return stage(run, presentation.seatingOrder)
      const bedded = presentation.results(run)?.bed?.cat.id
      return stageAsleep(run, presentation.lastCouch, bedded)
    },
    results: () => presentation.results(session.run),
    newHousehold: () =>
      game.scene.isActive("couch") &&
      (game.scene.getScene("couch") as CouchScene).pressNewHousehold(),
    cues: () => [...sound.log],
    effects: () => [...presentation.effects],
    audio: () => ({ unlocked: sound.unlocked, theme: sound.theme })
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
