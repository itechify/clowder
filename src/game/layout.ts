/** The portrait layout's logical size; the canvas renders it at `RESOLUTION`×. */
export const WIDTH = 390
export const HEIGHT = 844
export const RESOLUTION = 2

/**
 * Where the living room's furniture stands, the same by night and by day, so
 * the Couch and the Shop show one room: the window above the Shelf and its
 * moon or sun; the treat jar's base, top right, its Treats beside it; the top
 * of the Shelf's plank; where the Couch's feet are and the top of each Seat's
 * pad; and the rug's centre.
 */
export const WINDOW = { x: 112, y: 100 }
export const MOON = { x: 155, y: 90 }
export const TREAT_JAR = { x: 362, y: 60 }
export const TREAT_COUNT = { x: TREAT_JAR.x - 28, y: TREAT_JAR.y - 24 }
export const SHELF_Y = 186
export const SHELF_CAT_SIZE = 48
export const COUCH_FLOOR_Y = 428
export const SEAT_PAD_Y = 344
export const RUG_Y = 636
/** Where a seated Cat's centre sits above its Seat, and how big it is shown. */
export const SEAT_Y = 352
export const SEATED_SIZE = 64
/** Each rug row's Cats: their centres' height, and how big they are shown. */
export const RUG_ROWS = {
  back: { y: 592, size: 66 },
  front: { y: 680, size: 76 }
} as const

/** Seat centres, spread evenly between the Couch's arms. */
export const seatX = (seats: number) =>
  Array.from({ length: seats }, (_, seat) => 20 + (350 / seats) * (seat + 0.5))

/** Position centres, spread evenly along the Shelf. */
export const shelfX = (positions: number) =>
  Array.from(
    { length: positions },
    (_, position) => 20 + ((WIDTH - 40) / positions) * (position + 0.5)
  )

/** Where the offers stand in the Shop's front door, spread evenly across it. */
export const doorwayX = (spots: number) =>
  Array.from(
    { length: spots },
    (_, spot) => 20 + ((WIDTH - 40) / spots) * (spot + 0.5)
  )

/**
 * Lays labels `width` wide side by side along a row from `left` to `right`,
 * each as near its `wanted` centre as it can be, in order of where they want
 * to be and never closer than `gap`; labels that want the same place share
 * the move evenly. Returns their centres, in the order given, and the `scale`
 * they are shown at, below 1 only if they cannot all fit at full size.
 */
export function layOutRow(
  labels: { wanted: number; width: number }[],
  { left, right, gap }: { left: number; right: number; gap: number }
): { centres: number[]; scale: number } {
  const free = right - left - gap * (labels.length - 1)
  const total = labels.reduce((sum, { width }) => sum + width, 0)
  const scale = Math.min(1, free / total)
  const order = labels
    .map((label, i) => ({ ...label, i, width: label.width * scale }))
    .sort((a, b) => a.wanted - b.wanted)

  /** Labels touching end to end, centred where they want to be on average. */
  type Cluster = { labels: typeof order; width: number; centre: number }
  const place = (cluster: Omit<Cluster, "centre">): Cluster => {
    let from = -cluster.width / 2
    const pulls = cluster.labels.map(({ wanted, width }) => {
      const offset = from + width / 2
      from += width + gap
      return wanted - offset
    })
    const centre = pulls.reduce((sum, pull) => sum + pull, 0) / pulls.length
    const half = cluster.width / 2
    return {
      ...cluster,
      centre: Math.min(Math.max(centre, left + half), right - half)
    }
  }
  const clusters: Cluster[] = []
  for (const label of order) {
    let cluster = place({ labels: [label], width: label.width })
    // Merge with the cluster before for as long as the two would overlap.
    while (clusters.length > 0) {
      const before = clusters.at(-1)!
      if (
        before.centre + before.width / 2 + gap <=
        cluster.centre - cluster.width / 2
      )
        break
      clusters.pop()
      cluster = place({
        labels: [...before.labels, ...cluster.labels],
        width: before.width + gap + cluster.width
      })
    }
    clusters.push(cluster)
  }

  const centres: number[] = []
  for (const cluster of clusters) {
    let from = cluster.centre - cluster.width / 2
    for (const { i, width } of cluster.labels) {
      centres[i] = from + width / 2
      from += width + gap
    }
  }
  return { centres, scale }
}

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

/**
 * Where an opened pile's `count` Cats fan out, a `step` apart and centred on
 * the pile at `centre`, shifted clear of the room's sides between `left` and
 * `right`; closer together, if they cannot all fit a step apart.
 */
export function fanX(
  count: number,
  centre: number,
  { left, right, step }: { left: number; right: number; step: number }
) {
  const spacing = Math.min(step, (right - left) / count)
  const half = (count * spacing) / 2
  const middle = Math.min(Math.max(centre, left + half), right - half)
  return Array.from(
    { length: count },
    (_, i) => middle - half + spacing * (i + 0.5)
  )
}
