import { RESOLUTION } from "./layout"

/**
 * The game's two typefaces, bundled with it for offline play (see
 * src/main.tsx): Lilita One for numbers, titles, and buttons, and Nunito for
 * everything else.
 */
const DISPLAY = "Lilita One"
const BODY = "Nunito Variable"
const family = (name: string) => `"${name}", system-ui, sans-serif`

/** The dark brown that numbers and labels are outlined in, and the shadow numbers cast. */
export const OUTLINE = "#3b2a22"
const SHADOW = "rgba(46, 31, 25, 0.6)"

/**
 * Waits until both typefaces are ready. The canvas draws text once, in
 * whatever font is ready, so no scene may draw any before this settles.
 */
export const loadFonts = () =>
  Promise.all(
    [DISPLAY, BODY].map((name) => document.fonts.load(`16px "${name}"`))
  ).catch(() => [])

/** Body text, in Nunito. */
export const font = (size: number, colour = "#4a3426", weight = "600") => ({
  fontFamily: family(BODY),
  fontSize: `${size}px`,
  fontStyle: weight,
  color: colour,
  resolution: RESOLUTION
})

/** A title or a button's label, in Lilita One. */
export const display = (size: number, colour = "#4a3426") => ({
  fontFamily: family(DISPLAY),
  fontSize: `${size}px`,
  color: colour,
  resolution: RESOLUTION
})

/**
 * A number, in Lilita One with a thick outline and a drop shadow, so it reads
 * at a glance over any art.
 */
export const numbers = (
  size: number,
  colour = "#fdf6ea",
  outline = OUTLINE
) => {
  const drop = Math.max(2, Math.round(size / 9))
  return {
    ...display(size, colour),
    stroke: outline,
    strokeThickness: Math.max(3, Math.round(size / 4.5)),
    shadow: {
      offsetX: 0,
      offsetY: drop,
      color: SHADOW,
      stroke: true,
      fill: true
    },
    // Room beneath for the shadow, so it isn't cut off.
    padding: { bottom: drop }
  }
}
