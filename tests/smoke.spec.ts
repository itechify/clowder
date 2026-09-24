import { expect, type Page, test } from "@playwright/test"
import type {} from "../src/game/debugHook"

async function boot(page: Page, seed: number) {
  await page.goto(`/?seed=${seed}`)
  await expect(page.locator("#game canvas")).toBeVisible()
  await page.waitForFunction(() => "__clowder" in window)
}

test("boots into Night 1 with a seeded Hand of 8", async ({ page }) => {
  await boot(page, 7)

  const run = await page.evaluate(() => window.__clowder!.run())
  expect(run.roster).toHaveLength(30)
  expect(run.night.hand).toHaveLength(8)
  expect(run.night.target).toBe(300)

  await boot(page, 7)
  const again = await page.evaluate(() => window.__clowder!.run())
  expect(again.night.hand).toEqual(run.night.hand)
})

test("plays a seeded Run through to its results", async ({ page }) => {
  await boot(page, 7)

  const outcome = await page.evaluate(() => {
    const { run, apply, preview } = window.__clowder!
    const scores: [number, number][] = []
    const seed = run().seed
    while (run().status === "playing") {
      if (run().shop) apply({ type: "leaveShop" })
      run()
        .night.hand.slice(0, 5)
        .forEach((cat, seat) => {
          apply({ type: "place", cat, seat })
        })
      const previewed = preview().score
      const result = apply({ type: "play" })
      const total = result.ok
        ? result.events.find((event) => event.type === "scoreTotal")
        : undefined
      scores.push([previewed, total?.score ?? Number.NaN])
    }
    return { seed, status: run().status, scores }
  })

  expect(["won", "lost"]).toContain(outcome.status)
  for (const [previewed, played] of outcome.scores)
    expect(played).toBe(previewed)
  // The results wait for the household to fall asleep.
  await expect(
    page.getByRole("heading", { name: /Sweet dreams!|Lights out/ })
  ).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText("Nights cleared")).toBeVisible()
  await expect(page.getByText("Star Cat")).toBeVisible()

  await page.getByRole("button", { name: "New Household" }).click()
  await expect(page.getByRole("heading")).toHaveCount(0)
  const fresh = await page.evaluate(() => window.__clowder!.run())
  expect(fresh.status).toBe("playing")
  expect(fresh.night.number).toBe(1)
  expect(fresh.night.hand).toHaveLength(8)
  expect(fresh.treats).toBe(0)
  expect(fresh.seed).not.toBe(outcome.seed)
})

/** Taps the canvas at a point in the scene's 390×844 portrait layout. */
async function tap(page: Page, x: number, y: number) {
  const box = (await page.locator("#game canvas").boundingBox())!
  await page.mouse.click(
    box.x + (x / 390) * box.width,
    box.y + (y / 844) * box.height
  )
}

test("redraws Cats chosen by tapping in the scene", async ({ page }) => {
  await boot(page, 7)
  const before = await page.evaluate(() => window.__clowder!.run())
  const [first, second] = before.night.hand

  // Redraw, the first two Hand Cats, then Swap (see CouchScene's layout).
  await tap(page, 316, 790)
  await tap(page, 60, 585)
  await tap(page, 150, 585)
  await tap(page, 316, 790)

  const after = await page.evaluate(() => window.__clowder!.run())
  expect(after.night.redrawsLeft).toBe(1)
  expect(after.night.hand).not.toContain(first)
  expect(after.night.hand).not.toContain(second)
  expect(after.night.hand).toHaveLength(8)
  expect(after.night.drawPile).toEqual(before.night.drawPile.slice(2))
})

test("shops between Nights by tapping in the scene", async ({ page }) => {
  await boot(page, 1)
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    while (!run().shop) {
      run()
        .night.hand.slice(0, 5)
        .forEach((cat, seat) => {
          apply({ type: "place", cat, seat })
        })
      apply({ type: "play" })
    }
  })
  // The cleared Night celebrates on the Couch, then the Shop opens; headless
  // frame rates slow the scene's clock, so allow it a while.
  await expect
    .poll(() => page.evaluate(() => window.__clowder!.scenes()), {
      timeout: 15_000
    })
    .toEqual(["shop"])
  const before = await page.evaluate(() => window.__clowder!.run())
  expect(before.treats).toBe(5)
  const [offer] = before.shop!.catOffers

  // Adopt the first offer, pick out and Rehome a Roster Cat, then Reroll
  // (see ShopScene's layout).
  await tap(page, 105, 284)
  await tap(page, 43, 440)
  await tap(page, 105, 790)
  await tap(page, 195, 345)

  const after = await page.evaluate(() => window.__clowder!.run())
  expect(after.treats).toBe(0)
  expect(after.roster.map((cat) => cat.id)).toContain(offer.id)
  expect(after.roster).toHaveLength(30)
  expect(after.shop!.rerollPrice).toBe(2)

  await tap(page, 285, 790)
  await expect
    .poll(() => page.evaluate(() => window.__clowder!.scenes()))
    .toEqual(["couch"])
  const next = await page.evaluate(() => window.__clowder!.run())
  expect(next.shop).toBeNull()
  expect(next.night.number).toBe(2)
  expect([...next.night.hand, ...next.night.drawPile].sort()).toEqual(
    after.roster.map((cat) => cat.id).sort()
  )
})
