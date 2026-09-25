import type Phaser from "phaser"

/** A fish-shaped treat, `size` across, centred on the origin. */
export function drawTreat(scene: Phaser.Scene, size: number) {
  const g = scene.add.graphics()
  const tail = [
    size * 0.18,
    0,
    size * 0.5,
    -size * 0.3,
    size * 0.5,
    size * 0.3
  ] as const
  g.fillStyle(0xe3a44f, 1).lineStyle(Math.max(1.5, size / 10), 0x7a4a22, 1)
  g.fillTriangle(...tail).strokeTriangle(...tail)
  g.fillEllipse(-size * 0.12, 0, size * 0.72, size * 0.56)
  g.strokeEllipse(-size * 0.12, 0, size * 0.72, size * 0.56)
  g.fillStyle(0x7a4a22, 1).fillCircle(-size * 0.3, -size * 0.06, size * 0.06)
  return g
}
