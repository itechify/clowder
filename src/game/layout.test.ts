import { describe, expect, it } from "vitest"
import { layOutRow } from "./layout"

const within = { left: 10, right: 380, gap: 6 }

/** Each label's left and right edges, as laid out. */
const edges = (
  widths: number[],
  { centres, scale }: ReturnType<typeof layOutRow>
) =>
  widths.map((width, i) => [
    centres[i] - (width * scale) / 2,
    centres[i] + (width * scale) / 2
  ])

describe("labels in a row", () => {
  it("leaves a lone label where it wants to be", () => {
    expect(layOutRow([{ wanted: 195, width: 100 }], within)).toEqual({
      centres: [195],
      scale: 1
    })
  })

  it("leaves labels that don't touch where they want to be", () => {
    const row = layOutRow(
      [
        { wanted: 60, width: 80 },
        { wanted: 300, width: 80 }
      ],
      within
    )
    expect(row).toEqual({ centres: [60, 300], scale: 1 })
  })

  it("moves labels wanting the same place apart, in the order given, a gap between", () => {
    const widths = [90, 130]
    const row = layOutRow(
      widths.map((width) => ({ wanted: 195, width })),
      within
    )
    const [[, firstRight], [secondLeft]] = edges(widths, row)
    expect(row.scale).toBe(1)
    expect(row.centres[0]).toBeLessThan(row.centres[1])
    expect(secondLeft - firstRight).toBeCloseTo(within.gap)
    // Shared evenly either side of where both wanted to be.
    expect((row.centres[0] + row.centres[1]) / 2).toBeCloseTo(195, 0)
  })

  it("keeps every label inside the row", () => {
    const widths = [120, 120]
    const row = layOutRow(
      widths.map((width, i) => ({ wanted: 20 + 20 * i, width })),
      within
    )
    const [[firstLeft, firstRight], [secondLeft]] = edges(widths, row)
    expect(firstLeft).toBeCloseTo(within.left)
    expect(secondLeft - firstRight).toBeCloseTo(within.gap)
  })

  it("shrinks labels too wide to fit side by side until they do", () => {
    const widths = [150, 150, 150]
    const row = layOutRow(
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
    const row = layOutRow(
      [
        { wanted: 250, width: 100 },
        { wanted: 150, width: 100 }
      ],
      within
    )
    expect(row.centres[1]).toBeLessThan(row.centres[0])
  })
})
