import Phaser from "phaser"
import { fromBase } from "../art/eyes"
import { art, CHARACTER_SPAN } from "../art/manifest"
import type { Cat } from "../engine"
import type { CatLook, EyeTint } from "../presentation/staging"
import { addCharacter, catEyes } from "./art"
import { BADGE, CAT_BASE } from "./catArt"
import { numbers } from "./fonts"
import { HOUSE_CAT_BASE } from "./houseCatArt"

/**
 * Each eye tint, as the colour a Cat's pale irises are multiplied by: the
 * dark pupils and outlines stay dark.
 */
const EYE_TINT: Record<EyeTint, number> = {
  gold: 0xffd84a,
  green: 0xa8e07a,
  blue: 0x9cc8ff,
  copper: 0xe8784a
}

/** The ink a blinking eye's closed line is drawn in. */
const LID_LINE = 0x2a1410

/**
 * How Cats and House Cats move at rest, all code-driven. Durations are ranges
 * in ms, each character picking its own so no two move in step.
 */
const IDLE = {
  /** A breath: how far a character stretches up (slimming as it does). */
  breath: { stretch: 0.025, ms: [1500, 2100] },
  /** Asleep, breaths come slower and deeper. */
  asleepBreath: { stretch: 0.04, ms: [2400, 2900] },
  /** How long a blink takes to close, holds shut, and waits for the next. */
  blink: { ms: 70, hold: 50, every: [2200, 5200] },
  /** A little bob now and then: how high, how long, and the wait between. */
  bob: { height: 3, ms: 160, every: [2600, 6000] }
} as const

const between = ([min, max]: readonly [number, number]) =>
  Phaser.Math.Between(min, max)

/**
 * Sets a character's rig breathing, and a Cat's blinking and bobbing now and
 * then; asleep, it only breathes. The motion stops when the rig is destroyed.
 */
function idle(
  scene: Phaser.Scene,
  rig: Phaser.GameObjects.Container,
  {
    lids = [],
    asleep = false,
    bobs = false
  }: {
    lids?: Phaser.GameObjects.Graphics[]
    asleep?: boolean
    bobs?: boolean
  }
) {
  const breath = asleep ? IDLE.asleepBreath : IDLE.breath
  const tweens = [
    scene.tweens.add({
      targets: rig,
      scaleX: 1 - breath.stretch / 2,
      scaleY: 1 + breath.stretch,
      duration: between(breath.ms),
      delay: between([0, breath.ms[1]]),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    })
  ]
  if (!asleep && lids.length)
    tweens.push(
      scene.tweens.add({
        targets: lids,
        scaleY: { from: 0, to: 1 },
        duration: IDLE.blink.ms,
        hold: IDLE.blink.hold,
        delay: between(IDLE.blink.every),
        repeatDelay: between(IDLE.blink.every),
        yoyo: true,
        repeat: -1
      })
    )
  if (!asleep && bobs)
    tweens.push(
      scene.tweens.add({
        targets: rig,
        y: rig.y - IDLE.bob.height,
        duration: IDLE.bob.ms,
        delay: between(IDLE.bob.every),
        repeatDelay: between(IDLE.bob.every),
        yoyo: true,
        repeat: -1,
        ease: "Quad.easeOut"
      })
    )
  rig.once(Phaser.GameObjects.Events.DESTROY, () => {
    for (const tween of tweens) tween.remove()
  })
}

/**
 * A Cat centred on (0, 0), about `size` pixels across: its pose, mirrored to
 * face left if it does, eyes tinted, with its Coat badge on its flank. It
 * breathes, blinks, and bobs; `asleep`, it only breathes, slowly; `still`, as
 * in a photo, it doesn't move at all.
 */
export function drawCat(
  scene: Phaser.Scene,
  cat: Cat,
  look: CatLook,
  size: number,
  { asleep = false, still = false } = {}
): Phaser.GameObjects.Container {
  const scale = size / CHARACTER_SPAN
  const side = look.facing === "left" ? -1 : 1
  const body = addCharacter(scene, look.pose, size).setFlipX(side < 0)
  // Drawn out from the Cat's base, where the rig stretches from.
  const eyes = catEyes(scene.textures, look.pose).map((eye) => {
    const { x, y } = fromBase(eye)
    return {
      x: side * x * scale,
      y: y * scale,
      rx: eye.rx * scale,
      ry: eye.ry * scale,
      lid: eye.lid
    }
  })
  const tint = scene.add
    .graphics()
    .setBlendMode(Phaser.BlendModes.MULTIPLY)
    .fillStyle(EYE_TINT[look.eyeTint], 1)
  for (const { x, y, rx, ry } of eyes) tint.fillEllipse(x, y, rx * 2, ry * 2)
  // Each lid closes over its eye from the middle, over its outline too.
  const lids = eyes.map(({ x, y, rx, ry, lid }) => {
    const over = 9 * scale
    const sag = ry * 0.3
    const centre = -(rx * rx - sag * sag) / (2 * sag)
    const from = Math.atan2(-centre, rx)
    return scene.add
      .graphics({ x, y })
      .fillStyle(lid, 1)
      .fillEllipse(0, 0, (rx + over) * 2, (ry + over) * 2)
      .lineStyle(Math.max(1, 7 * scale), LID_LINE, 1)
      .beginPath()
      .arc(0, centre, sag - centre, from, Math.PI - from)
      .strokePath()
      .setScale(1, 0)
  })
  const badge = addCharacter(
    scene,
    art.badge(cat.coat),
    size,
    side * size * BADGE.x,
    size * (BADGE.y - CAT_BASE)
  )
  const rig = scene.add.container(0, size * CAT_BASE, [
    body,
    tint,
    ...lids,
    badge
  ])
  if (!still) idle(scene, rig, { lids, asleep, bobs: true })
  return scene.add.container(0, 0, [rig])
}

/**
 * A House Cat in a pose, centred on (0, 0) and about `size` pixels across,
 * sitting with its base about `size` × 0.45 below the centre; it breathes.
 */
export function drawHouseCat(
  scene: Phaser.Scene,
  pose: string,
  size: number
): Phaser.GameObjects.Container {
  const rig = scene.add.container(0, size * HOUSE_CAT_BASE, [
    addCharacter(scene, pose, size)
  ])
  idle(scene, rig, {})
  return scene.add.container(0, 0, [rig])
}

/**
 * A Cat grown past the base Purr it started with wears its base Purr in a
 * starry badge centred on (x, y), so The Void's work shows wherever the Cat
 * goes: on the Couch, on the rug, and fanned out in the Shop.
 */
export function drawGrowthBadge(
  scene: Phaser.Scene,
  add: <T extends Phaser.GameObjects.GameObject>(object: T) => T,
  basePurr: number,
  x: number,
  y: number
) {
  const label = scene.add
    .text(x, y, `${basePurr}`, numbers(12, "#f6d743"))
    .setOrigin(0.5)
  add(scene.add.graphics())
    .fillStyle(0x141018, 0.92)
    .fillRoundedRect(x - label.width / 2 - 6, y - 9, label.width + 12, 18, 9)
  add(label)
}
