import { expect, type Page, test } from "@playwright/test"
import { boot, layout, tap } from "./scene"

const run = (page: Page) => page.evaluate(() => window.__clowder!.run())
const scoring = (page: Page) => page.evaluate(() => window.__clowder!.scoring())
const cues = (page: Page) => page.evaluate(() => window.__clowder!.cues())
const audio = (page: Page) => page.evaluate(() => window.__clowder!.audio())
const theme = async (page: Page) => (await audio(page)).theme

/** Seats the first Hand Cats from Seat 0, returning what their Play would do. */
function seat(page: Page, cats: number) {
  return page.evaluate((cats) => {
    const { run, apply, preview } = window.__clowder!
    run()
      .night.hand.slice(0, cats)
      .forEach((cat, seat) => {
        apply({ type: "place", cat, seat })
      })
    const { gatherings, scoringEvents } = preview()
    return {
      gatherings: gatherings.length,
      scoringEvents: scoringEvents.length
    }
  }, cats)
}

test("starts audio only after the first interaction", async ({ page }) => {
  await boot(page, 7)

  // The Night's theme is chosen, waiting to be heard.
  expect(await audio(page)).toEqual({ unlocked: false, theme: "night" })
  await tap(page, ...layout.wall)

  await expect.poll(async () => (await audio(page)).unlocked).toBe(true)
})

test("fires a Play's cues in order, pitch rising with each Scoring event", async ({
  page
}) => {
  await boot(page, 7)
  const { gatherings, scoringEvents } = await seat(page, 3)
  expect(scoringEvents).toBe(3)
  const before = (await cues(page)).length

  await tap(page, ...layout.play)
  await expect.poll(() => scoring(page), { timeout: 20_000 }).toBe(false)

  const fired = (await cues(page)).slice(before)
  expect(fired).toEqual([
    { name: "uiTap" },
    ...Array.from({ length: gatherings }, () => ({
      name: "gatheringActivated"
    })),
    { name: "catScored", pitch: 0 },
    { name: "catScored", pitch: 1 },
    { name: "catScored", pitch: 2 },
    { name: "scoreLanded" }
  ])
})

test("still lands a skipped Play with its sound", async ({ page }) => {
  await boot(page, 7)
  await seat(page, 3)
  const before = (await cues(page)).length

  await tap(page, ...layout.play)
  await tap(page, ...layout.wall)
  expect(await scoring(page)).toBe(false)

  const fired = (await cues(page)).slice(before)
  expect(fired.at(-1)).toEqual({ name: "scoreLanded" })
  expect(fired.filter((cue) => cue.name === "scoreLanded")).toHaveLength(1)
})

test("sounds a Cat taking its Seat", async ({ page }) => {
  await boot(page, 7)
  const before = (await cues(page)).length

  await tap(page, ...layout.hand(0))
  await tap(page, ...layout.seat(2))

  expect((await cues(page)).slice(before)).toEqual([{ name: "catSeated" }])
})

test("plays each part of a Run's music", async ({ page }) => {
  await boot(page, 7)
  const scenes = () => page.evaluate(() => window.__clowder!.scenes())
  const heard = new Set<string>()

  while ((await run(page)).status === "playing") {
    const { night, shop, scrapbookPages } = await run(page)
    if (scrapbookPages) {
      // The Night's music plays on while a Scrapbook page is chosen.
      await page.evaluate((gathering) => {
        window.__clowder!.apply({ type: "choosePage", gathering })
      }, scrapbookPages[0])
      continue
    }
    if (shop) {
      await expect.poll(() => theme(page)).toBe("shop")
      heard.add("shop")
      await page.evaluate(() => {
        const { run, apply } = window.__clowder!
        for (const houseCat of run().shop!.houseCatOffers)
          apply({ type: "recruit", houseCat })
        apply({ type: "leaveShop" })
      })
      await expect.poll(scenes).toEqual(["couch"])
      continue
    }
    const expected = night.disaster ? "disaster" : "night"
    await expect.poll(() => theme(page)).toBe(expected)
    heard.add(expected)
    await seat(page, 5)
    await page.evaluate(() => window.__clowder!.apply({ type: "play" }))
    await tap(page, ...layout.wall)
  }

  // The results lullaby waits for the household to fall asleep.
  await expect.poll(() => theme(page), { timeout: 10_000 }).toBe("results")
  heard.add("results")
  expect([...heard].sort()).toEqual(["disaster", "night", "results", "shop"])
})
