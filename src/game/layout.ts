/** The portrait layout's logical size; the canvas renders it at `RESOLUTION`×. */
export const WIDTH = 390
export const HEIGHT = 844
export const RESOLUTION = 2

/** Seat centres, spread evenly between the Couch's arms. */
export const seatX = (seats: number) =>
  Array.from({ length: seats }, (_, seat) => 20 + (350 / seats) * (seat + 0.5))

/** Position centres, spread evenly along the Shelf. */
export const shelfX = (positions: number) =>
  Array.from(
    { length: positions },
    (_, position) => 20 + ((WIDTH - 40) / positions) * (position + 0.5)
  )

/**
 * Position centres along the rug's two rows, `positions` to a row and
 * staggered: each back-row position falls between two front-row positions,
 * so a full Hand fits across.
 */
export function rugX(positions: number) {
  const step = (WIDTH - 96) / (2 * positions - 1)
  /** The `i`th position from the left, counting across both rows. */
  const nth = (i: number) => 48 + step * i
  return {
    front: Array.from({ length: positions }, (_, position) =>
      nth(2 * position)
    ),
    back: Array.from({ length: positions }, (_, position) =>
      nth(2 * position + 1)
    )
  }
}
