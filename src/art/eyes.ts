import { CHARACTER_BASE, CHARACTER_CANVAS } from "./manifest"

/**
 * An open eye on a character's canvas, for the game to tint and blink: the
 * ellipse inside its outline, in canvas pixels, and the colour of the fur
 * around it, which a blinking lid is drawn in.
 */
export type Eye = { x: number; y: number; rx: number; ry: number; lid: number }

/**
 * Where the open eyes are on each delivered Cat image, measured from the
 * images in `art/raw`; only content Clingy and Aloof Cats have their eyes
 * open. A redelivered image needs its eyes measured again. An image missing
 * here shows its own eyes, untinted, and never blinks.
 */
export const deliveredEyes: Readonly<Record<string, readonly Eye[]>> = {
  "cat/orange/clingy/content": [
    { x: 197, y: 189, rx: 32, ry: 34, lid: 0xe38635 },
    { x: 330, y: 191, rx: 33, ry: 36, lid: 0xfa8d31 }
  ],
  "cat/orange/aloof/content": [
    { x: 207, y: 183, rx: 34, ry: 17, lid: 0xce5c21 },
    { x: 322, y: 183, rx: 27, ry: 17, lid: 0xcc5b20 }
  ],
  "cat/black/clingy/content": [
    { x: 218, y: 206, rx: 30, ry: 31, lid: 0x2e272a },
    { x: 332, y: 215, rx: 28, ry: 30, lid: 0x2e2829 }
  ],
  "cat/black/aloof/content": [
    { x: 230, y: 213, rx: 34, ry: 21, lid: 0x2c2425 },
    { x: 340, y: 220, rx: 27, ry: 20, lid: 0x2b2425 }
  ],
  "cat/white/clingy/content": [
    { x: 208, y: 198, rx: 30, ry: 31, lid: 0xfbf5eb },
    { x: 322, y: 208, rx: 30, ry: 32, lid: 0xfaf5ea }
  ],
  "cat/white/aloof/content": [
    { x: 237, y: 190, rx: 35, ry: 20, lid: 0xfbf2e4 },
    { x: 348, y: 191, rx: 28, ry: 19, lid: 0xfaf2e3 }
  ],
  "cat/gray/clingy/content": [
    { x: 207, y: 184, rx: 30, ry: 32, lid: 0x8d8787 },
    { x: 327, y: 193, rx: 30, ry: 32, lid: 0x8d8786 }
  ],
  "cat/gray/aloof/content": [
    { x: 220, y: 210, rx: 35, ry: 22, lid: 0x5d5357 },
    { x: 327, y: 214, rx: 24, ry: 17, lid: 0x5d5457 }
  ],
  "cat/calico/clingy/content": [
    { x: 199, y: 216, rx: 31, ry: 31, lid: 0xf48b37 },
    { x: 313, y: 225, rx: 30, ry: 32, lid: 0x3f2c2b }
  ],
  "cat/calico/aloof/content": [
    { x: 206, y: 187, rx: 36, ry: 25, lid: 0xfb9136 },
    { x: 335, y: 193, rx: 33, ry: 23, lid: 0x3b2c2b }
  ]
}

/** An eye's centre relative to its character's base, in canvas pixels. */
export const fromBase = ({ x, y }: Eye) => ({
  x: x - CHARACTER_BASE.x * CHARACTER_CANVAS,
  y: y - CHARACTER_BASE.y * CHARACTER_CANVAS
})
