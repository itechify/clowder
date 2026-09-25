import { expect, test } from "@playwright/test"
import { boot, layout, shop, tap } from "./scene"

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
      const { shop } = run()
      if (shop) {
        for (const houseCat of shop.houseCatOffers)
          apply({ type: "recruit", houseCat })
        apply({ type: "leaveShop" })
      }
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
    return { seed, status: run().status, scores, shelf: run().shelf }
  })

  expect(["won", "lost"]).toContain(outcome.status)
  for (const [previewed, played] of outcome.scores)
    expect(played).toBe(previewed)
  // Skips the last Play's scoring sequence.
  await tap(page, ...layout.wall)
  expect(await page.evaluate(() => window.__clowder!.scoring())).toBe(false)
  // The results wait for the household to fall asleep.
  await expect(
    page.getByRole("heading", { name: /Sweet dreams!|Lights out/ })
  ).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText("Nights cleared")).toBeVisible()
  await expect(page.getByText("Star Cat")).toBeVisible()
  // This seed Recruits a House Cat, so the results list the household's.
  expect(outcome.shelf.length).toBeGreaterThan(0)
  await expect(page.getByText("House Cats")).toBeVisible()
  await expect(
    page.getByText(
      outcome.shelf
        .map(
          (id) => ({ boxGoblin: "Box Goblin", doNotTouch: "Do Not Touch" })[id]
        )
        .join(", ")
    )
  ).toBeVisible()

  await page.getByRole("button", { name: "New Household" }).click()
  await expect(page.getByRole("heading")).toHaveCount(0)
  const fresh = await page.evaluate(() => window.__clowder!.run())
  expect(fresh.status).toBe("playing")
  expect(fresh.night.number).toBe(1)
  expect(fresh.night.hand).toHaveLength(8)
  expect(fresh.treats).toBe(0)
  expect(fresh.seed).not.toBe(outcome.seed)
})

test("redraws Cats chosen by tapping in the scene", async ({ page }) => {
  await boot(page, 7)
  const before = await page.evaluate(() => window.__clowder!.run())
  const [first, second] = before.night.hand

  // Redraw, the first two Hand Cats, then Swap.
  await tap(page, ...layout.redraw)
  await tap(page, ...layout.hand(0))
  await tap(page, ...layout.hand(1))
  await tap(page, ...layout.redraw)

  const after = await page.evaluate(() => window.__clowder!.run())
  expect(after.night.redrawsLeft).toBe(1)
  expect(after.night.hand).not.toContain(first)
  expect(after.night.hand).not.toContain(second)
  expect(after.night.hand).toHaveLength(8)
  expect(after.night.drawPile).toEqual(before.night.drawPile.slice(2))
})

test("shops between Nights by tapping in the scene", async ({ page }) => {
  test.setTimeout(60_000)
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
      timeout: 40_000
    })
    .toEqual(["shop"])
  const before = await page.evaluate(() => window.__clowder!.run())
  expect(before.treats).toBe(5)
  const [offer] = before.shop!.catOffers

  // Adopt the first offer, pick out and Rehome a Roster Cat, then Reroll
  // (see ShopScene's layout).
  await tap(page, ...shop.offer(0))
  await tap(page, 43, 540)
  await tap(page, ...shop.rehome)
  await tap(page, ...shop.reroll)

  const after = await page.evaluate(() => window.__clowder!.run())
  expect(after.treats).toBe(0)
  expect(after.roster.map((cat) => cat.id)).toContain(offer.id)
  expect(after.roster).toHaveLength(30)
  expect(after.shop!.rerollPrice).toBe(2)

  await tap(page, ...shop.leave)
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

test("recruits and Rehomes a House Cat by tapping in the Shop", async ({
  page
}) => {
  test.setTimeout(60_000)
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
  await tap(page, ...layout.wall)
  await expect
    .poll(() => page.evaluate(() => window.__clowder!.scenes()), {
      timeout: 40_000
    })
    .toEqual(["shop"])
  const before = await page.evaluate(() => window.__clowder!.run())
  expect(before.treats).toBe(5)
  const card = before.shop!.houseCatOffers.indexOf("doNotTouch")

  await tap(page, ...shop.offer(before.shop!.catOffers.length + card))
  const recruited = await page.evaluate(() => window.__clowder!.run())
  expect(recruited.shelf).toEqual(["doNotTouch"])
  expect(recruited.treats).toBe(0)

  await tap(page, ...shop.shelf(0))
  await tap(page, ...shop.rehome)
  const rehomed = await page.evaluate(() => window.__clowder!.run())
  expect(rehomed.shelf).toEqual([])
  expect(rehomed.treats).toBe(2)
})
