import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { deliveredEyes } from "./eyes"
import { artEntry, CHARACTER_CANVAS } from "./manifest"

describe("delivered Cats' eyes", () => {
  it("belong to delivered Cat images, inside their canvas", () => {
    for (const [key, eyes] of Object.entries(deliveredEyes)) {
      expect(artEntry(key).kind).toBe("cat")
      expect(existsSync(`art/raw/${key}.png`), key).toBe(true)
      for (const { x, y, rx, ry } of eyes) {
        expect(x - rx).toBeGreaterThanOrEqual(0)
        expect(y - ry).toBeGreaterThanOrEqual(0)
        expect(x + rx).toBeLessThanOrEqual(CHARACTER_CANVAS)
        expect(y + ry).toBeLessThanOrEqual(CHARACTER_CANVAS)
      }
    }
  })
})
