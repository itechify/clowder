import type { ThemeName } from "../audio/cues"
import type { Run } from "../engine"
import type { SceneKey } from "./presentation"

/** What is showing: the scene on screen, if any, and whether the household sleeps. */
export type Showing = {
  scene: SceneKey | null
  run: Run
  asleep: boolean
}

/**
 * The theme for what is showing: the Night's, or its Disaster variation, on
 * the Couch; the Shop's in the Shop; and a lullaby once the Run is over and
 * the household asleep.
 */
export function themeFor({ scene, run, asleep }: Showing): ThemeName | null {
  if (asleep) return "results"
  if (scene === "shop") return "shop"
  if (scene === "couch") return run.night.disaster ? "disaster" : "night"
  return null
}
