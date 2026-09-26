import { describe, expect, it } from "vitest"
import { defaultConfig } from "../src/engine"
import { simArgs, simulate } from "./balance"

describe("the balance simulation", () => {
  it("reports the same clear rates for the same seeds and config", () => {
    const report = simulate({ runs: 2, config: defaultConfig })

    expect(simulate({ runs: 2, config: defaultConfig })).toBe(report)
    expect(report).toContain("growing void (2 Runs)")
    expect(report).toMatch(/clear rate per Night reached: +1:\d+%/)
    expect(report).toMatch(/Night \d+ clear rate by Disaster: .*\d+\/\d+/)
    expect(report).toMatch(/win rate: \d+%/)
    expect(report).toMatch(/avg House Cats on Night 6: /)
  }, 120_000)
})

describe("the simulation's arguments", () => {
  it("default to 100 Runs of every strategy at the default config", () => {
    expect(simArgs([], defaultConfig)).toEqual({
      runs: 100,
      config: defaultConfig,
      strategies: undefined
    })
  })

  it("take a Run count, strategies, and config overrides by path", () => {
    const defaults = structuredClone(defaultConfig)
    const args = simArgs(
      [
        "--runs",
        "5",
        "--strategies",
        "no purchases,growing void",
        "--disasterTargetFactor",
        "1",
        "--shop.recruitPrices.theVoid",
        "4"
      ],
      defaultConfig
    )

    expect(args.runs).toBe(5)
    expect(args.strategies).toEqual(["no purchases", "growing void"])
    expect(args.config.disasterTargetFactor).toBe(1)
    expect(args.config.shop.recruitPrices.theVoid).toBe(4)
    expect(defaultConfig).toEqual(defaults)
  })

  it("reject a config setting that does not exist", () => {
    expect(() => simArgs(["--disasterFactor", "1"], defaultConfig)).toThrow(
      /disasterFactor/
    )
  })

  it("reject a config override of the wrong type", () => {
    expect(() => simArgs(["--firstTarget", '"abc"'], defaultConfig)).toThrow(
      /firstTarget/
    )
    expect(() => simArgs(["--disasterNights", "6"], defaultConfig)).toThrow(
      /disasterNights/
    )
  })
})
