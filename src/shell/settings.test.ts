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

/** A stand-in for the OS's prefers-reduced-motion media query. */
function osMotionPreference(reduce: boolean) {
  const listeners = new Set<() => void>()
  return {
    matches: reduce,
    addEventListener: (_type: "change", listener: () => void) => {
      listeners.add(listener)
    },
    change(reduce: boolean) {
      this.matches = reduce
      for (const listener of listeners) listener()
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

describe("the volume settings", () => {
  it("start with music softer than sound effects", () => {
    const settings = new Settings(memoryStorage())

    expect(settings.musicVolume).toBe(0.6)
    expect(settings.sfxVolume).toBe(0.8)
  })

  it("persist chosen volumes for the next visit", () => {
    const storage = memoryStorage()
    const settings = new Settings(storage)
    settings.setMusicVolume(0.25)
    settings.setSfxVolume(0)

    const restored = new Settings(storage)
    expect(restored.musicVolume).toBe(0.25)
    expect(restored.sfxVolume).toBe(0)
  })

  it("fall back to their defaults when a stored volume is out of range", () => {
    for (const volume of [-0.1, 1.5, "0.5", null, Number.NaN]) {
      const stored = JSON.stringify({ musicVolume: volume, sfxVolume: volume })
      const storage = memoryStorage({ "clowder.settings": stored })

      const settings = new Settings(storage)
      expect(settings.musicVolume).toBe(0.6)
      expect(settings.sfxVolume).toBe(0.8)
    }
  })

  it("keep a chosen volume between silent and full", () => {
    const settings = new Settings(memoryStorage())
    settings.setMusicVolume(1.4)
    settings.setSfxVolume(-1)

    expect(settings.musicVolume).toBe(1)
    expect(settings.sfxVolume).toBe(0)
  })
})

describe("the mute setting", () => {
  it("starts unmuted", () => {
    expect(new Settings(memoryStorage()).muted).toBe(false)
  })

  it("persists without forgetting the volumes underneath", () => {
    const storage = memoryStorage()
    const settings = new Settings(storage)
    settings.setMusicVolume(0.3)
    settings.setMuted(true)

    const restored = new Settings(storage)
    expect(restored.muted).toBe(true)
    expect(restored.musicVolume).toBe(0.3)
  })

  it("falls back to unmuted when the stored value is not a yes or no", () => {
    const storage = memoryStorage({ "clowder.settings": '{"muted":"yes"}' })

    expect(new Settings(storage).muted).toBe(false)
  })
})

describe("the haptics setting", () => {
  const vibrates = { canVibrate: true }

  it("starts on", () => {
    expect(new Settings(memoryStorage(), vibrates).haptics).toBe(true)
  })

  it("persists being turned off", () => {
    const storage = memoryStorage()
    new Settings(storage, vibrates).setHaptics(false)

    expect(new Settings(storage, vibrates).haptics).toBe(false)
  })

  it("falls back to on when the stored value is not a yes or no", () => {
    const storage = memoryStorage({ "clowder.settings": '{"haptics":0}' })

    expect(new Settings(storage, vibrates).haptics).toBe(true)
  })

  it("is unavailable, and off, where the device cannot vibrate", () => {
    for (const device of [{ canVibrate: false }, {}]) {
      const settings = new Settings(memoryStorage(), device)

      expect(settings.hapticsAvailable).toBe(false)
      expect(settings.haptics).toBe(false)
    }
  })

  it("keeps the player's choice for a device that can vibrate", () => {
    const storage = memoryStorage()
    new Settings(storage, { canVibrate: false }).setHaptics(false)

    expect(new Settings(storage, vibrates).haptics).toBe(false)
  })
})

describe("the Reduced motion setting", () => {
  it("starts off where the OS has no preference to read", () => {
    expect(new Settings(memoryStorage()).reducedMotion).toBe(false)
  })

  it("starts from the OS preference", () => {
    const storage = memoryStorage()

    for (const reduce of [true, false]) {
      const settings = new Settings(storage, {
        motionQuery: osMotionPreference(reduce)
      })
      expect(settings.reducedMotion).toBe(reduce)
    }
  })

  it("follows the OS preference as it changes, telling listeners", () => {
    const os = osMotionPreference(false)
    const settings = new Settings(memoryStorage(), { motionQuery: os })
    let heard = 0
    settings.on(() => heard++)

    os.change(true)

    expect(settings.reducedMotion).toBe(true)
    expect(heard).toBe(1)
  })

  it("keeps the player's choice over the OS preference, across visits", () => {
    const storage = memoryStorage()
    const os = osMotionPreference(true)
    new Settings(storage, { motionQuery: os }).setReducedMotion(false)

    const restored = new Settings(storage, { motionQuery: os })
    os.change(true)

    expect(restored.reducedMotion).toBe(false)
  })

  it("follows the OS preference when the stored choice is not a yes or no", () => {
    const storage = memoryStorage({ "clowder.settings": '{"reducedMotion":1}' })
    const settings = new Settings(storage, {
      motionQuery: osMotionPreference(true)
    })

    expect(settings.reducedMotion).toBe(true)
  })
})
