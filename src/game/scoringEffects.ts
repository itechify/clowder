import Phaser from "phaser"
import { HEIGHT, WIDTH } from "./layout"
import { drawTreat } from "./treatArt"

/**
 * The scoring sequence's physical effects, as the scene draws them: sparks,
 * a flash, the purr meter's fire, and treats raining into the jar. How many
 * and how strong come from the choreography's script; these only draw them.
 */

type Add = <T extends Phaser.GameObjects.GameObject>(object: T) => T
type Point = { x: number; y: number }

/** A soft white dot, tinted as each effect needs. */
const SPARK = "fx/spark"
const SPARK_RADIUS = 8

/** Each burst's colours: Purr's warm gold, Mult's red, and a landing's mix. */
export const SPARKS = {
  purr: [0xffd36b, 0xffa94d, 0xfff1b0],
  mult: [0xff5a4a, 0xff8a6b, 0xffd0c4],
  landed: [0xffd36b, 0xff5a4a, 0xfff1b0, 0xa9c8ee],
  fire: [0xffe066, 0xff9a1f, 0xff4b1f]
} as const

function sparkTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(SPARK)) return
  const g = scene.make.graphics(undefined, false)
  for (let ring = SPARK_RADIUS; ring > 0; ring -= 2)
    g.fillStyle(0xffffff, 1 - ring / (SPARK_RADIUS + 2)).fillCircle(
      SPARK_RADIUS,
      SPARK_RADIUS,
      ring
    )
  g.generateTexture(SPARK, SPARK_RADIUS * 2, SPARK_RADIUS * 2)
  g.destroy()
}

/**
 * An emitter of sparks in some colours, to burst wherever an effect lands;
 * one per colour for a whole sequence, so its sparks are pooled.
 */
export function sparks(
  scene: Phaser.Scene,
  add: Add,
  colours: readonly number[]
) {
  sparkTexture(scene)
  const emitter = add(
    scene.add.particles(0, 0, SPARK, {
      emitting: false,
      speed: { min: 70, max: 230 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.55, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 380, max: 720 },
      gravityY: 260,
      tint: [...colours],
      blendMode: Phaser.BlendModes.ADD
    })
  )
  return (count: number, { x, y }: Point) => {
    if (count > 0) emitter.explode(count, x, y)
  }
}

/** The whole room flashing, `alpha` bright, then fading. */
export function flash(
  scene: Phaser.Scene,
  add: Add,
  alpha: number,
  duration: number
) {
  if (alpha <= 0) return
  const light = add(
    scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0xfff6e0).setOrigin(0)
  ).setAlpha(alpha)
  scene.tweens.add({
    targets: light,
    alpha: 0,
    duration,
    ease: "Quad.easeOut",
    onComplete: () => light.destroy()
  })
}

/** The purr meter catching fire along its `width`, until the scene is redrawn. */
export function fire(scene: Phaser.Scene, add: Add, at: Point, width: number) {
  sparkTexture(scene)
  add(
    scene.add.particles(at.x, at.y, SPARK, {
      x: { min: -width / 2, max: width / 2 },
      y: { min: -4, max: 6 },
      speedY: { min: -140, max: -60 },
      speedX: { min: -18, max: 18 },
      scale: { start: 0.9, end: 0.1 },
      alpha: { start: 0.95, end: 0 },
      lifespan: { min: 380, max: 700 },
      tint: [...SPARKS.fire],
      blendMode: Phaser.BlendModes.ADD,
      frequency: 16,
      quantity: 2
    })
  )
}

/**
 * Treats raining into the jar whose mouth is at `into`: `drops` of them,
 * spread over `duration` ms, the jar bobbing as each lands.
 */
export function rain(
  scene: Phaser.Scene,
  add: Add,
  {
    drops,
    duration,
    into,
    jar
  }: {
    drops: number
    duration: number
    into: Point
    jar: Phaser.GameObjects.Image
  }
) {
  const fall = duration * 0.45
  const { scaleY } = jar
  for (let drop = 0; drop < drops; drop++) {
    const treat = add(drawTreat(scene, 14))
      .setPosition(into.x + Phaser.Math.Between(-60, 20), -20)
      .setAngle(Phaser.Math.Between(-40, 40))
    scene.tweens.add({
      targets: treat,
      x: into.x + Phaser.Math.Between(-6, 6),
      y: into.y,
      angle: Phaser.Math.Between(-120, 120),
      delay: drops > 1 ? ((duration - fall) * drop) / (drops - 1) : 0,
      duration: fall,
      ease: "Quad.easeIn",
      onComplete: () => {
        treat.destroy()
        scene.tweens.add({
          targets: jar,
          scaleY: { from: scaleY * 0.92, to: scaleY },
          duration: 120,
          ease: "Quad.easeOut"
        })
      }
    })
  }
}

/** A haptic pulse, where the device can give one. */
export function pulse(pattern: readonly number[]) {
  navigator.vibrate?.([...pattern])
}
