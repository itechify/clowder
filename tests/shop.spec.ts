import { expect, type Page, test } from "@playwright/test"
import { defaultConfig, disasterById, houseCat } from "../src/engine"
import { settled, shop, tap, toShop } from "./scene"

const transition = (page: Page) =>
  page.evaluate(() => window.__clowder!.transition())
const scenes = (page: Page) => page.evaluate(() => window.__clowder!.scenes())
const texts = (page: Page) => page.evaluate(() => window.__clowder!.texts())

test("opens a House Cat's full ability without Recruiting it", async ({
  page
}) => {
  // This seed's first Shop offers Freya, second of its House Cats.
  await toShop(page, 14)
  await settled(page)
  const ability = houseCat("freya").ability(defaultConfig.houseCats)
  const before = await page.evaluate(() => window.__clowder!.run())
  expect(await texts(page)).not.toContain(ability)

  // Freya's tag, then the full-size panel. Opening it never spends Treats.
  await tap(page, 326, 438)
  expect(await texts(page)).toEqual(
    expect.arrayContaining(["Freya", "Slow to Warm Up", ability, "Close"])
  )
  expect(await page.evaluate(() => window.__clowder!.run())).toEqual(before)

  // A tap outside dismisses the panel without activating Nightfall beneath.
  await tap(page, ...shop.nightfall)
  expect(await texts(page)).not.toContain(ability)
  expect(await scenes(page)).toEqual(["shop"])
  expect(await page.evaluate(() => window.__clowder!.run())).toEqual(before)

  // The visitor itself opens the same panel; its Close button dismisses it.
  await tap(page, 326, 382)
  expect(await texts(page)).toContain(ability)
  await tap(page, 195, 528)
  expect(await texts(page)).not.toContain(ability)
})

/**
 * Leaves the Shop and clears Nights by the debug hook until the next
 * Scrapbook, skipping the clearing Play's sequence, then chooses a page for
 * the next Shop.
 */
async function nextShop(page: Page) {
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    apply({ type: "leaveShop" })
    while (!run().scrapbookPages) {
      run()
        .night.hand.slice(0, 5)
        .forEach((cat, seat) => {
          apply({ type: "place", cat, seat })
        })
      apply({ type: "play" })
    }
  })
  await tap(page, ...shop.wall)
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    apply({ type: "choosePage", gathering: run().scrapbookPages![0] })
  })
  await expect.poll(() => scenes(page), { timeout: 40_000 }).toEqual(["shop"])
}

test("breaks dawn as the Shop opens, skipped by a tap", async ({ page }) => {
  test.setTimeout(60_000)
  await toShop(page, 1)
  expect(await transition(page)).toEqual({ to: "day", crossfade: false })

  await tap(page, ...shop.wall)
  expect(await transition(page)).toBeNull()
  const staged = await page.evaluate(() => window.__clowder!.shop()!)
  expect(staged.piles).toHaveLength(15)
  expect(staged.doorway).toHaveLength(4)
})

test("falls to night on Nightfall, which names the coming Night", async ({
  page
}) => {
  test.setTimeout(60_000)
  await toShop(page, 1)
  await settled(page)
  const all = await texts(page)
  expect(all[all.indexOf("Nightfall") + 1]).toBe("Night 2/9")

  await tap(page, ...shop.nightfall)
  expect(await transition(page)).toEqual({ to: "night", crossfade: false })
  // Skipped, the Night begins at once.
  await tap(page, ...shop.wall)
  await expect.poll(() => scenes(page)).toEqual(["couch"])
  expect(await page.evaluate(() => window.__clowder!.run().night.number)).toBe(
    2
  )
})

test("warns of a coming Disaster with drifting storm clouds and a note", async ({
  page
}) => {
  test.setTimeout(90_000)
  await toShop(page, 1)
  // No Disaster follows the first Night.
  expect(await page.evaluate(() => window.__clowder!.shop()!.disaster)).toBe(
    null
  )
  expect(await page.evaluate(() => window.__clowder!.clouds())).toBeNull()

  await nextShop(page)
  const run = await page.evaluate(() => window.__clowder!.run())
  const { name, rule } = disasterById(run.shop!.nextDisaster!)
  expect(await page.evaluate(() => window.__clowder!.shop()!.disaster)).toEqual(
    { name, rule }
  )
  expect(await texts(page)).toEqual(expect.arrayContaining([name, rule]))
  expect(await page.evaluate(() => window.__clowder!.clouds())).toBe("drifting")
})

test.describe("with Reduced motion", () => {
  test.use({ reducedMotion: "reduce" })

  test("crossfades night and day, and keeps the storm clouds still", async ({
    page
  }) => {
    test.setTimeout(90_000)
    await toShop(page, 1)
    expect(await transition(page)).toEqual({ to: "day", crossfade: true })
    await settled(page)

    await nextShop(page)
    expect(await page.evaluate(() => window.__clowder!.clouds())).toBe("still")
    await settled(page)
    await tap(page, ...shop.nightfall)
    expect(await transition(page)).toEqual({ to: "night", crossfade: true })
    await expect.poll(() => scenes(page)).toEqual(["couch"])
  })
})
