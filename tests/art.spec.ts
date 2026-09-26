import { expect, test } from "@playwright/test"
import { artManifest } from "../src/art/manifest"
import { boot } from "./scene"

/**
 * Keys kept on their code-drawn fallback for good, since Astra couldn't
 * produce them consistently (option D, ADR-0005). None so far.
 */
const codeDrawnForGood = new Set<string>()

/** Keys on their code-drawn fallback until Astra delivers them. */
const awaitingDelivery = new Set([
  "room/titleSign",
  "room/photoFrame",
  "room/catBed",
  "room/rosette"
])

test("shows every art key's delivered image, unless it is code-drawn for now or for good", async ({
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
        codeDrawnForGood.has(key) || awaitingDelivery.has(key)
          ? "fallback"
          : "delivered"
      ])
    )
  )
})
