import { expect, test } from "@playwright/test"
import { artManifest } from "../src/art/manifest"
import { boot } from "./scene"

test("shows every art key, delivered or code-drawn", async ({ page }) => {
  await boot(page, 7)
  const keys = artManifest.map((entry) => entry.key)
  const sources = await page.evaluate(
    (keys) => keys.map((key) => window.__clowder!.art(key)),
    keys
  )
  for (const source of sources)
    expect(["delivered", "fallback"]).toContain(source)
})
