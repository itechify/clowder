import { expect, test } from "@playwright/test"
import { artManifest } from "../src/art/manifest"
import { boot } from "./scene"

test("shows delivered art for every art key, none on its placeholder", async ({
  page
}) => {
  await boot(page, 7)
  const keys = artManifest.map((entry) => entry.key)
  const sources = await page.evaluate(
    (keys) =>
      Object.fromEntries(keys.map((key) => [key, window.__clowder!.art(key)])),
    keys
  )
  expect(sources).toEqual(
    Object.fromEntries(keys.map((key) => [key, "delivered"]))
  )
})
