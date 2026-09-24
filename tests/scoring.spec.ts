import { expect, type Page, test } from "@playwright/test"
import { boot, drag, layout, onPage, tap } from "./scene"

const run = (page: Page) => page.evaluate(() => window.__clowder!.run())
const scoring = (page: Page) => page.evaluate(() => window.__clowder!.scoring())

/** Seats the first Hand Cat by tapping it, then a Seat, and Plays. */
async function playOneCat(page: Page) {
  await tap(page, ...layout.hand(0))
  await tap(page, ...layout.seat(2))
  await tap(page, ...layout.play)
}

test("plays out a Play's scoring, which a tap skips", async ({ page }) => {
  await boot(page, 7)

  await playOneCat(page)

  expect(await scoring(page)).toBe(true)
  // The Score is committed at once; the sequence only shows it.
  expect((await run(page)).night.playsLeft).toBe(2)
  await tap(page, ...layout.wall)
  expect(await scoring(page)).toBe(false)
})

/**
 * Plays one Cat and waits for its scoring sequence to finish, in ms. Headless,
 * Phaser's clock runs well behind the wall clock, so only compare durations.
 */
async function timeOneCatSequence(page: Page) {
  const start = Date.now()
  await playOneCat(page)
  expect(await scoring(page)).toBe(true)
  await expect.poll(() => scoring(page), { timeout: 20_000 }).toBe(false)
  return Date.now() - start
}

test("finishes a scoring sequence by itself", async ({ page }) => {
  await boot(page, 7)

  await timeOneCatSequence(page)
})

test("scores at the chosen speed, and keeps it", async ({ page }) => {
  await boot(page, 7)
  const settings = page.getByRole("dialog", { name: "Settings" })
  const atOne = await timeOneCatSequence(page)

  await page.getByRole("button", { name: "Settings" }).click()
  await expect(settings.getByRole("radio", { name: "1×" })).toBeChecked()
  await settings.getByText("4×").click()
  await settings.getByRole("button", { name: "Done" }).click()
  await expect(settings).toBeHidden()
  const atFour = await timeOneCatSequence(page)

  expect(atFour).toBeLessThan(atOne / 2)
  await boot(page, 7)
  await page.getByRole("button", { name: "Settings" }).click()
  await expect(settings.getByRole("radio", { name: "4×" })).toBeChecked()
})

test("drags Cats onto Seats, between them, and off the Couch", async ({
  page
}) => {
  await boot(page, 7)
  const [first, second] = (await run(page)).night.hand
  const couch = async () => (await run(page)).night.couch

  await drag(page, layout.hand(0), layout.seat(2))
  expect(await couch()).toEqual([null, null, first, null, null])

  // The Seat's Cat goes back to the Hand, so the second Cat is now first.
  await drag(page, layout.hand(0), layout.seat(2))
  expect(await couch()).toEqual([null, null, second, null, null])

  // Between Seats, the two Cats trade places.
  await drag(page, layout.hand(0), layout.seat(0))
  await drag(page, layout.seat(0), layout.seat(2))
  expect(await couch()).toEqual([second, null, first, null, null])

  await drag(page, layout.seat(2), layout.wall)
  expect(await couch()).toEqual([second, null, null, null, null])
})

test("puts a dragged Cat back when let go off the canvas", async ({ page }) => {
  await boot(page, 7)
  const start = await onPage(page, ...layout.hand(0))
  const gear = (await page
    .getByRole("button", { name: "Settings" })
    .boundingBox())!

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(gear.x + gear.width / 2, gear.y + gear.height / 2, {
    steps: 8
  })
  await page.mouse.up()
  // Moving on over a Seat and tapping it no longer carries the Cat there.
  await tap(page, ...layout.seat(2))

  expect((await run(page)).night.couch).toEqual([null, null, null, null, null])
})

test("still places and unseats Cats by tapping", async ({ page }) => {
  await boot(page, 7)
  const [first] = (await run(page)).night.hand

  await tap(page, ...layout.hand(0))
  await tap(page, ...layout.seat(1))
  expect((await run(page)).night.couch[1]).toBe(first)

  await tap(page, ...layout.seat(1))
  expect((await run(page)).night.couch[1]).toBe(null)
})
