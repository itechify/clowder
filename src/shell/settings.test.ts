import { describe, expect, it } from "vitest"
import { Settings } from "./settings"

/** An in-memory stand-in for the browser's localStorage. */
function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial))
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value)
    }
  }
}

describe("the scoring speed setting", () => {
  it("starts at 1×", () => {
    expect(new Settings(memoryStorage()).scoringSpeed).toBe(1)
  })

  it("persists a chosen speed for the next visit", () => {
    const storage = memoryStorage()
    new Settings(storage).setScoringSpeed(4)

    expect(new Settings(storage).scoringSpeed).toBe(4)
  })

  it("tells listeners when it changes", () => {
    const settings = new Settings(memoryStorage())
    let heard = 0
    settings.on(() => heard++)

    settings.setScoringSpeed(2)

    expect(heard).toBe(1)
    expect(settings.scoringSpeed).toBe(2)
  })

  it("falls back to 1× when the stored settings are unreadable", () => {
    for (const stored of ["not json", '{"scoringSpeed":3}', "null"]) {
      const storage = memoryStorage({ "clowder.settings": stored })

      expect(new Settings(storage).scoringSpeed).toBe(1)
    }
  })

  it("still works where storage is unavailable", () => {
    const broken = {
      getItem: () => {
        throw new Error("denied")
      },
      setItem: () => {
        throw new Error("denied")
      }
    }
    const settings = new Settings(broken)

    settings.setScoringSpeed(2)

    expect(settings.scoringSpeed).toBe(2)
  })
})
