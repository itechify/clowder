import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { artBrief, BRIEF } from "../src/art/brief"
import { artManifest } from "../src/art/manifest"

describe("the committed art brief", () => {
  it("matches the art manifest and what has been delivered (run `pnpm brief`)", () => {
    expect(existsSync(BRIEF)).toBe(true)
    expect(readFileSync(BRIEF, "utf8")).toBe(artBrief(artManifest, existsSync))
  })
})
