import { describe, expect, it } from "vitest"
import { startRun } from "../engine"
import { themeFor } from "./music"

describe("the music", () => {
  const run = startRun(1)

  it("plays the Night theme on the Couch", () => {
    expect(themeFor({ scene: "couch", run, asleep: false })).toBe("night")
  })

  it("plays the Disaster variation on a Disaster Night", () => {
    const disasterNight = {
      ...run,
      night: { ...run.night, disaster: "vacuum" as const }
    }

    expect(
      themeFor({ scene: "couch", run: disasterNight, asleep: false })
    ).toBe("disaster")
  })

  it("plays the Shop theme in the Shop", () => {
    expect(themeFor({ scene: "shop", run, asleep: false })).toBe("shop")
  })

  it("plays the results lullaby once the household is asleep", () => {
    const over = { ...run, status: "lost" as const }

    expect(themeFor({ scene: "couch", run: over, asleep: true })).toBe(
      "results"
    )
  })

  it("keeps the Night's theme while the last Play's Score lands", () => {
    const over = { ...run, status: "lost" as const }

    expect(themeFor({ scene: "couch", run: over, asleep: false })).toBe("night")
  })

  it("plays nothing before a scene shows", () => {
    expect(themeFor({ scene: null, run, asleep: false })).toBe(null)
  })
})
