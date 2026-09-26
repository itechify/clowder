import { expect, type Page, test } from "@playwright/test"
import { scrapbookChoice } from "../src/presentation/scrapbook"
import { layout, ready, tap, toScrapbook } from "./scene"

const run = (page: Page) => page.evaluate(() => window.__clowder!.run())
const scenes = (page: Page) => page.evaluate(() => window.__clowder!.scenes())
const texts = (page: Page) => page.evaluate(() => window.__clowder!.texts())

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
