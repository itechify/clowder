import { expect, type Page, test } from "@playwright/test"
import type { Config } from "../src/engine"
import { boot, layout, tap } from "./scene"

// Each Run plays out to its Results, which take a while to show headless.
test.describe.configure({ timeout: 60_000 })

/**
 * Plays a Run started from `seed` and `config` to its end, seating Cats
 * from the Hand `perPlay` at a time; returns each Play's Couch, in order.
 */
async function playOut(
  page: Page,
  seed: number,
  config: Partial<Config>,
  perPlay: number
) {
  const couches = await page.evaluate(
    ({ seed, config, perPlay }) => {
      const { run, apply, start } = window.__clowder!
      start(seed, config)
      const couches: (string | null)[][] = []
      while (run().status === "playing") {
        const pages = run().scrapbookPages
        if (pages) apply({ type: "choosePage", gathering: pages[0] })
        if (run().shop) apply({ type: "leaveShop" })
        run()
          .night.hand.slice(0, perPlay)
          .forEach((cat, seat) => {
            apply({ type: "place", cat, seat })
          })
        couches.push(run().night.couch)
        apply({ type: "play" })
      }
      return couches
    },
    { seed, config, perPlay }
  )
  // Skips the last Play's scoring sequence.
  await tap(page, ...layout.wall)
  return couches
}

/**
 * The Results, once the household has fallen asleep and they show; headless
 * frame rates slow the scene's clock, so allow it a while.
 */
async function resultsShown(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.__clowder!.results()), {
      timeout: 30_000
    })
    .not.toBeNull()
  return (await page.evaluate(() => window.__clowder!.results()))!
}

const texts = (page: Page) => page.evaluate(() => window.__clowder!.texts())
const summary = (page: Page) =>
  page.locator('[aria-live="polite"]', {
    has: page.getByRole("heading")
  })

test("a won Run's Results show in the sleeping living room", async ({
  page
}) => {
  await boot(page, 3)
  const [played] = await playOut(page, 3, { nights: 1, firstTarget: 10 }, 5)
  // Nothing shows until every Cat is asleep.
  expect(await page.evaluate(() => window.__clowder!.results())).toBeNull()
  await expect(summary(page)).toHaveCount(0)

  const results = await resultsShown(page)
  const run = await page.evaluate(() => window.__clowder!.run())
  expect(run.status).toBe("won")
  expect(results.title).toBe("Sweet dreams!")
  expect(results.nights.label).toBe("Nights cleared 1/1")
  expect(results.photo!.seats.map((seat) => seat?.cat.id ?? null)).toEqual(
    played
  )
  expect(results.photo!.nightLabel).toBe("Night 1")
  const star = results.bed!.cat.id

  // Drawn into the room: the sign, the photo's frame, the cat bed's label,
  // the Nights cleared, and New Household.
  expect(await texts(page)).toEqual(
    expect.arrayContaining([
      "Sweet dreams!",
      results.ending,
      results.nights.label,
      results.photo!.scoreLabel,
      "Night 1",
      results.bed!.label,
      "New Household"
    ])
  )
  // The last Play's Cats stay asleep on their Seats, but for the Star Cat,
  // carried off to its bed.
  const { cats } = await page.evaluate(() => window.__clowder!.staging())
  const seated = cats.flatMap(({ cat, placement }) =>
    placement.on === "couch" ? [[placement.seat, cat]] : []
  )
  expect(seated).toEqual(
    played.flatMap((cat, seat) => (cat && cat !== star ? [[seat, cat]] : []))
  )
  expect(cats.map((staged) => staged.cat)).not.toContain(star)
  for (const { pose } of cats) expect(pose).toMatch(/\/sleepy\/content$/)

  // Read out for screen readers, though not shown.
  await expect(summary(page)).toHaveCount(1)
  await expect(summary(page)).toContainText("Sweet dreams!")
  await expect(summary(page)).toContainText("Nights cleared: 1 of 1")
  await expect(summary(page)).toContainText(
    `Best Play: ${results.photo!.scoreLabel} on Night 1`
  )
  await expect(summary(page)).toContainText("House Cats: none")
  await expect(summary(page)).toContainText(results.bed!.label)
})

test("a lost Run's Results start a new household", async ({ page }) => {
  await boot(page, 7)
  // One Cat a Play falls short of Night 1's Target.
  await playOut(page, 7, {}, 1)

  const results = await resultsShown(page)
  const lost = await page.evaluate(() => window.__clowder!.run())
  expect(lost.status).toBe("lost")
  expect(results.title).toBe("Lights out")
  expect(results.ending).toBe("Your household fell asleep on Night 1.")
  expect(results.nights.label).toBe(`Nights cleared 0/${lost.config.nights}`)
  expect(await texts(page)).toEqual(
    expect.arrayContaining(["Lights out", "Nights cleared 0/9"])
  )
  await expect(summary(page)).toContainText("Lights out")

  // New Household, with a tap's sound.
  const cues = await page.evaluate(() => window.__clowder!.cues().length)
  expect(await page.evaluate(() => window.__clowder!.newHousehold())).toBe(true)
  expect(
    (await page.evaluate(() => window.__clowder!.cues())).slice(cues)
  ).toContainEqual({ name: "uiTap" })
  const fresh = await page.evaluate(() => window.__clowder!.run())
  expect(fresh.status).toBe("playing")
  expect(fresh.night.number).toBe(1)
  expect(fresh.seed).not.toBe(lost.seed)
  expect(await page.evaluate(() => window.__clowder!.results())).toBeNull()
  await expect(summary(page)).toHaveCount(0)
  expect(await texts(page)).not.toContain("New Household")
  // Pressed again, there is no New Household to press.
  expect(await page.evaluate(() => window.__clowder!.newHousehold())).toBe(
    false
  )
})

test("New Household answers a tap in the room", async ({ page }) => {
  await boot(page, 7)
  await playOut(page, 7, {}, 1)
  await resultsShown(page)
  const lost = await page.evaluate(() => window.__clowder!.run())

  await tap(page, ...layout.newHousehold)
  const fresh = await page.evaluate(() => window.__clowder!.run())
  expect(fresh.status).toBe("playing")
  expect(fresh.seed).not.toBe(lost.seed)
})
