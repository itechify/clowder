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
