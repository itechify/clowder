import { describe, expect, it } from "vitest"
import { MAX_FILE_BYTES, MAX_TOTAL_BYTES, precacheProblems } from "./precache"

const essentials = [
  { file: "index.html", size: 1_000 },
  { file: "manifest.webmanifest", size: 500 }
]
const everything = (files: { file: string }[]) =>
  new Set(files.map(({ file }) => file))

describe("checking the precache", () => {
  it("passes when every shipped file is precached and within budget", () => {
    const shipped = [
      ...essentials,
      { file: "assets/index.js", size: 1_500_000 },
      { file: "art/atlas.abc.0.webp", size: 1_900_000 },
      { file: "art/atlas.abc.json", size: 4_000 },
      { file: "fonts/LilitaOne.woff2", size: 30_000 }
    ]
    expect(precacheProblems(shipped, everything(shipped))).toEqual([])
  })

  it("fails on a shipped file missing from the precache", () => {
    const shipped = [...essentials, { file: "art/atlas.abc.0.webp", size: 10 }]
    const precached = everything(essentials)
    expect(precacheProblems(shipped, precached)).toEqual([
      "Missing from precache: art/atlas.abc.0.webp"
    ])
  })

  it("fails on a file over 2 MiB", () => {
    const shipped = [
      ...essentials,
      { file: "art/atlas.abc.0.webp", size: MAX_FILE_BYTES + 1 }
    ]
    expect(precacheProblems(shipped, everything(shipped))).toEqual([
      "Too large to precache: art/atlas.abc.0.webp"
    ])
  })

  it("fails when the whole precache is over 15 MB", () => {
    expect(MAX_TOTAL_BYTES).toBe(15_000_000)
    const pages = Array.from({ length: 8 }, (_, i) => ({
      file: `art/atlas.abc.${i}.webp`,
      size: 1_900_000
    }))
    const shipped = [...essentials, ...pages]
    expect(precacheProblems(shipped, everything(shipped))).toEqual([
      "Precache totals 15201500 bytes, over the 15000000-byte budget."
    ])
  })

  it("fails when the page or its web app manifest was not built", () => {
    expect(precacheProblems([], new Set())).toEqual([
      "Not built: index.html",
      "Not built: manifest.webmanifest"
    ])
  })
})
