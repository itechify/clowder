/** The service worker's own limit on any one precached file. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024
/** The whole game, installed: art, fonts, and code. */
export const MAX_TOTAL_BYTES = 15_000_000

export type ShippedFile = { file: string; size: number }

/**
 * Why the build can't play offline or installs too large, if it can't: a
 * shipped file the service worker doesn't precache, one too large to, or a
 * total over budget. Empty when all is well.
 */
export function precacheProblems(
  shipped: ShippedFile[],
  precached: Set<string>
): string[] {
  const problems: string[] = []
  const files = new Set(shipped.map(({ file }) => file))
  for (const required of ["index.html", "manifest.webmanifest"])
    if (!files.has(required)) problems.push(`Not built: ${required}`)
  for (const { file, size } of shipped) {
    if (size > MAX_FILE_BYTES) problems.push(`Too large to precache: ${file}`)
    if (!precached.has(file)) problems.push(`Missing from precache: ${file}`)
  }
  const total = shipped.reduce((sum, { size }) => sum + size, 0)
  if (total > MAX_TOTAL_BYTES)
    problems.push(
      `Precache totals ${total} bytes, over the ${MAX_TOTAL_BYTES}-byte budget.`
    )
  return problems
}
