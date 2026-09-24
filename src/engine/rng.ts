/**
 * Seeded randomness (mulberry32). The state is a plain number carried in Run
 * state, so a Run replays exactly from its seed and actions (ADR-0002).
 */
export type RngState = number

function next(state: RngState): [number, RngState] {
  const advanced = (state + 0x6d2b79f5) | 0
  let t = advanced
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, advanced]
}

/** Fisher–Yates shuffle; returns the shuffled copy and the advanced state. */
export function shuffle<T>(
  state: RngState,
  items: readonly T[]
): [T[], RngState] {
  const result = [...items]
  let rng = state
  for (let i = result.length - 1; i > 0; i--) {
    const [roll, advanced] = next(rng)
    rng = advanced
    const j = Math.floor(roll * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return [result, rng]
}

/** One item chosen evenly at random, and the advanced state. */
export function pick<T>(state: RngState, items: readonly T[]): [T, RngState] {
  const [roll, advanced] = next(state)
  return [items[Math.floor(roll * items.length)], advanced]
}
