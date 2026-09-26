import { expect, type Page, test } from "@playwright/test"
import { disasterById } from "../src/engine"
import { settled, shop, tap, toShop } from "./scene"

const transition = (page: Page) =>
  page.evaluate(() => window.__clowder!.transition())
const scenes = (page: Page) => page.evaluate(() => window.__clowder!.scenes())
const texts = (page: Page) => page.evaluate(() => window.__clowder!.texts())

/** Leaves the Shop and clears Nights by the debug hook until the next Shop. */
async function nextShop(page: Page) {
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    apply({ type: "leaveShop" })
    while (!run().shop) {
      run()
        .night.hand.slice(0, 5)
        .forEach((cat, seat) => {
          apply({ type: "place", cat, seat })
        })
      apply({ type: "play" })
    }
  })
  await tap(page, ...shop.wall)
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
