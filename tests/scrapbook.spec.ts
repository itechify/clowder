import { expect, type Page, test } from "@playwright/test"
import { scrapbookChoice } from "../src/presentation/scrapbook"
import { boot, layout, ready, tap, toScrapbook } from "./scene"

const run = (page: Page) => page.evaluate(() => window.__clowder!.run())
const scenes = (page: Page) => page.evaluate(() => window.__clowder!.scenes())
const texts = (page: Page) => page.evaluate(() => window.__clowder!.texts())
const cues = (page: Page) => page.evaluate(() => window.__clowder!.cues())

/** Every word the open Scrapbook's pages show, page by page. */
const pageTexts = async (page: Page) =>
  scrapbookChoice(await run(page))!.pages.flatMap((shown) => [
    shown.name,
    shown.requirement,
    shown.label.levels,
    shown.label.adds
  ])

test("opens the Scrapbook once a Night is cleared, its pages in the room", async ({
  page
}) => {
  test.setTimeout(60_000)
  await toScrapbook(page, 1)

  const { scrapbookPages, shop } = await run(page)
  expect(scrapbookPages).toHaveLength(3)
  expect(shop).toBeNull()
  expect(await scenes(page)).toEqual(["couch"])
  expect(await texts(page)).toEqual(
    expect.arrayContaining([
      "Choose a Scrapbook page",
      ...(await pageTexts(page))
    ])
  )
})

test("chooses the page tapped, and the Shop opens", async ({ page }) => {
  test.setTimeout(60_000)
  await toScrapbook(page, 1)
  const before = await run(page)
  const chosen = before.scrapbookPages![1]

  await tap(page, ...layout.page(1))

  const after = await run(page)
  expect(after.gatheringLevels[chosen]).toBe(before.gatheringLevels[chosen] + 1)
  expect(after.scrapbookPages).toBeNull()
  // It flies into the Scrapbook with a flourish before the Shop opens.
  expect(await cues(page)).toContainEqual({ name: "pageChosen" })
  await expect.poll(() => scenes(page), { timeout: 40_000 }).toEqual(["shop"])
})

test("shows the same three pages after a reload mid-choice", async ({
  page
}) => {
  test.setTimeout(60_000)
  await toScrapbook(page, 1)
  const pages = (await run(page)).scrapbookPages
  const shown = await pageTexts(page)

  await page.reload()
  await ready(page)

  expect((await run(page)).scrapbookPages).toEqual(pages)
  expect(await scenes(page)).toEqual(["couch"])
  await expect.poll(() => texts(page)).toEqual(expect.arrayContaining(shown))
})

test("opens the Scrapbook from the room, showing Gathering levels, and closes it", async ({
  page
}) => {
  test.setTimeout(90_000)
  await toScrapbook(page, 1)
  const chosen = (await run(page)).scrapbookPages![1]
  await tap(page, ...layout.page(1))
  await expect.poll(() => scenes(page), { timeout: 40_000 }).toEqual(["shop"])
  await page.evaluate(() => window.__clowder!.apply({ type: "leaveShop" }))
  await expect.poll(() => scenes(page), { timeout: 40_000 }).toEqual(["couch"])

  await tap(page, ...layout.scrapbook)

  const shown = await texts(page)
  expect(shown).toContain("Scrapbook")
  const { discoveredGatherings } = await run(page)
  expect(discoveredGatherings).toContain(chosen)
  expect(shown).toContain("Lv 2")
  expect(shown.filter((text) => text === "???")).toHaveLength(
    2 * (5 - discoveredGatherings.length)
  )

  await tap(page, ...layout.scrapbook)

  expect(await texts(page)).not.toContain("Scrapbook")
})

test("keeps the Scrapbook shut while a Play scores", async ({ page }) => {
  await boot(page, 7)
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    apply({ type: "place", cat: run().night.hand[0], seat: 0 })
  })
  await tap(page, ...layout.play)
  await expect
    .poll(() => page.evaluate(() => window.__clowder!.scoring()))
    .toBe(true)

  // The tap skips the sequence rather than opening the Scrapbook.
  await tap(page, ...layout.scrapbook)

  await expect
    .poll(() => page.evaluate(() => window.__clowder!.scoring()))
    .toBe(false)
  expect(await texts(page)).not.toContain("Scrapbook")
})
