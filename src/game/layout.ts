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
 * Slot centres along the rug's two rows, `slots` to a row and staggered: each
 * back-row slot falls between two front-row slots, so a full Hand fits across.
 */
export function rugX(slots: number) {
  const step = (WIDTH - 96) / (2 * slots - 1)
  const along = (k: number) => 48 + step * k
  return {
    front: Array.from({ length: slots }, (_, slot) => along(2 * slot)),
    back: Array.from({ length: slots }, (_, slot) => along(2 * slot + 1))
  }
}
