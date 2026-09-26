import { expect, test } from "@playwright/test"
import { artManifest } from "../src/art/manifest"
import { boot } from "./scene"

/**
 * Keys kept on their code-drawn fallback for good, since Astra couldn't
 * produce them consistently (option D, ADR-0005). None so far.
 */
const codeDrawnForGood = new Set<string>()

/**
 * Keys still on their code-drawn fallback until Astra's batch for them is
 * delivered: the Shop by day (#56). Each comes off the list as it lands.
 */
const awaitingArt = new Set([
  "room/dayWindow",
  "room/sun",
  "room/sunbeam",
  "room/stormClouds",
  "room/frontDoor",
  "room/disasterNote",
  "room/offerTag",
  "room/countBadge"
])

test("shows every art key's delivered image, unless it is code-drawn for good or awaiting art", async ({
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
    Object.fromEntries(
      keys.map((key) => [
        key,
        codeDrawnForGood.has(key) || awaitingArt.has(key)
          ? "fallback"
          : "delivered"
      ])
    )
  )
})
