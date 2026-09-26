import { expect, type Page, test } from "@playwright/test"
import { disasterById } from "../src/engine"
import { gatheringLabel } from "../src/presentation/scrapbook"
import { boot, layout, tap } from "./scene"

const texts = (page: Page) => page.evaluate(() => window.__clowder!.texts())

test("shows the Night, Treats, and Target progress in the room, exactly", async ({
  page
}) => {
  await boot(page, 7)

  expect(await texts(page)).toEqual(
    expect.arrayContaining(["Night 1/9", "0", "0 / 300", "Draw pile 22"])
  )

  const score = await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    run()
      .night.hand.slice(0, 3)
      .forEach((cat, seat) => {
        apply({ type: "place", cat, seat })
      })
    apply({ type: "play" })
    return run().night.score
  })
  // Skipped, the purr meter lands on the Night's score.
  await tap(page, ...layout.wall)
  expect(await texts(page)).toContain(`${score} / 300`)
})

test("names Gatherings on the Couch as they form", async ({ page }) => {
  await boot(page, 7)
  const gatherings = await page.evaluate(() => {
    const { run, apply, preview } = window.__clowder!
    run()
      .night.hand.slice(0, 4)
      .forEach((cat, seat) => {
        apply({ type: "place", cat, seat })
      })
    return preview().gatherings
  })

  expect(gatherings.length).toBeGreaterThan(0)
  expect(await texts(page)).toEqual(
    expect.arrayContaining(gatherings.map(gatheringLabel))
  )
})

test("hangs tonight's Disaster in the room throughout its Night", async ({
  page
}) => {
  test.setTimeout(60_000)
  await boot(page, 7)
  const disaster = await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    while (
      run().status === "playing" &&
      (!run().night.disaster || run().shop || run().scrapbookPages)
    ) {
      const pages = run().scrapbookPages
      if (pages) {
        apply({ type: "choosePage", gathering: pages[0] })
        continue
      }
      if (run().shop) {
        apply({ type: "leaveShop" })
        continue
      }
      run()
        .night.hand.slice(0, 5)
        .forEach((cat, seat) => {
          apply({ type: "place", cat, seat })
        })
      apply({ type: "play" })
    }
    return run().night.disaster!
  })
  expect(await page.evaluate(() => window.__clowder!.run().status)).toBe(
    "playing"
  )
  const { name, rule } = disasterById(disaster)
  await expect
    .poll(() => page.evaluate(() => window.__clowder!.scenes()))
    .toEqual(["couch"])
  expect(await texts(page)).toEqual(expect.arrayContaining([name, rule]))

  // Still there while a Play scores.
  await tap(page, ...layout.hand(0))
  await tap(page, ...layout.seat(2))
  await tap(page, ...layout.play)
  expect(await page.evaluate(() => window.__clowder!.scoring())).toBe(true)
  expect(await texts(page)).toEqual(expect.arrayContaining([name, rule]))
})

test("draws in the bundled Lilita One and Nunito", async ({ page }) => {
  await boot(page, 7)
  const loaded = await page.evaluate(() =>
    [...document.fonts]
      .filter((face) => face.status === "loaded")
      .map((face) => face.family.replaceAll('"', ""))
  )
  expect(loaded).toEqual(
    expect.arrayContaining(["Lilita One", "Nunito Variable"])
  )
})
