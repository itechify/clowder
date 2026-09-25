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
 * Lays labels `width` wide side by side along a row from `left` to `right`,
 * each as near its `wanted` centre as it can be, in order of where they want
 * to be and never closer than `gap`; labels that want the same place share
 * the move evenly. Returns their centres, in the order given, and the `scale`
 * they are shown at, below 1 only if they cannot all fit at full size.
 */
export function inRow(
  labels: { wanted: number; width: number }[],
  { left, right, gap }: { left: number; right: number; gap: number }
): { x: number[]; scale: number } {
  const room = right - left - gap * (labels.length - 1)
  const total = labels.reduce((sum, { width }) => sum + width, 0)
  const scale = Math.min(1, room / total)
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

  const x: number[] = []
  for (const cluster of clusters) {
    let from = cluster.centre - cluster.width / 2
    for (const { i, width } of cluster.labels) {
      x[i] = from + width / 2
      from += width + gap
    }
  }
  return { x, scale }
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
