import { describe, expect, it } from "vitest"
import { inRow } from "./layout"

const within = { left: 10, right: 380, gap: 6 }

/** Each label's left and right edges, as laid out. */
const edges = (widths: number[], { x, scale }: ReturnType<typeof inRow>) =>
  widths.map((width, i) => [
    x[i] - (width * scale) / 2,
    x[i] + (width * scale) / 2
  ])

describe("labels in a row", () => {
  it("leaves a lone label where it wants to be", () => {
    expect(inRow([{ wanted: 195, width: 100 }], within)).toEqual({
      x: [195],
      scale: 1
    })
  })

  it("leaves labels that don't touch where they want to be", () => {
    const row = inRow(
      [
        { wanted: 60, width: 80 },
        { wanted: 300, width: 80 }
      ],
      within
    )
    expect(row).toEqual({ x: [60, 300], scale: 1 })
  })

  it("moves labels wanting the same place apart, in the order given, a gap between", () => {
    const widths = [90, 130]
    const row = inRow(
      widths.map((width) => ({ wanted: 195, width })),
      within
    )
    const [[, firstRight], [secondLeft]] = edges(widths, row)
    expect(row.scale).toBe(1)
    expect(row.x[0]).toBeLessThan(row.x[1])
    expect(secondLeft - firstRight).toBeCloseTo(within.gap)
    // Shared evenly either side of where both wanted to be.
    expect((row.x[0] + row.x[1]) / 2).toBeCloseTo(195, 0)
  })

  it("keeps every label inside the row", () => {
    const widths = [120, 120]
    const row = inRow(
      [
        { wanted: 20, width: 120 },
        { wanted: 40, width: 120 }
      ],
      within
    )
    const [[firstLeft, firstRight], [secondLeft]] = edges(widths, row)
    expect(firstLeft).toBeCloseTo(within.left)
    expect(secondLeft - firstRight).toBeCloseTo(within.gap)
  })

  it("shrinks labels too wide to fit side by side until they do", () => {
    const widths = [150, 150, 150]
    const row = inRow(
      widths.map((width) => ({ wanted: 195, width })),
      within
    )
    expect(row.scale).toBeLessThan(1)
    const laid = edges(widths, row)
    expect(laid[0][0]).toBeCloseTo(within.left)
    expect(laid[2][1]).toBeCloseTo(within.right)
    expect(laid[1][0] - laid[0][1]).toBeCloseTo(within.gap)
    expect(laid[2][0] - laid[1][1]).toBeCloseTo(within.gap)
  })

  it("orders labels by where they want to be, whatever order they come in", () => {
    const row = inRow(
      [
        { wanted: 250, width: 100 },
        { wanted: 150, width: 100 }
      ],
      within
    )
    expect(row.x[1]).toBeLessThan(row.x[0])
  })
})
