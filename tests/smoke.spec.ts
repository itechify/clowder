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

test("plays a seeded Night through to its end", async ({ page }) => {
  await boot(page, 7)

  const outcome = await page.evaluate(() => {
    const { run, apply, preview } = window.__clowder!
    const scores: [number, number][] = []
    while (run().night.status === "playing") {
      run()
        .night.hand.slice(0, 5)
        .forEach((cat, seat) => {
          apply({ type: "place", cat, seat })
        })
      const previewed = preview().score
      const before = run().night.score
      apply({ type: "play" })
      scores.push([previewed, run().night.score - before])
    }
    return { status: run().night.status, scores }
  })

  expect(["cleared", "lost"]).toContain(outcome.status)
  for (const [previewed, played] of outcome.scores)
    expect(played).toBe(previewed)
  await expect(
    page.getByRole("heading", { name: /Night (cleared!|lost)/ })
  ).toBeVisible()

  await page.getByRole("button", { name: "New Household" }).click()
  await expect(page.getByRole("heading")).toHaveCount(0)
  const fresh = await page.evaluate(() => window.__clowder!.run())
  expect(fresh.night.status).toBe("playing")
  expect(fresh.night.hand).toHaveLength(8)
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
