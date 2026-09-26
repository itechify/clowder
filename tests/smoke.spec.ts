import { expect, test } from "@playwright/test"
import { houseCat } from "../src/engine"
import { boot, layout, ready, settled, shop, tap, toShop } from "./scene"

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
      const pages = run().scrapbookPages
      if (pages) apply({ type: "choosePage", gathering: pages[0] })
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
  // The Results wait for the household to fall asleep, then are read out.
  const summary = page.locator('[aria-live="polite"]', {
    has: page.getByRole("heading", { name: /Sweet dreams!|Lights out/ })
  })
  await expect(summary).toHaveCount(1, { timeout: 10_000 })
  await expect(summary).toContainText("Nights cleared")
  await expect(summary).toContainText("Star Cat")
  // This seed Recruits a House Cat, so the Results list the household's.
  expect(outcome.shelf.length).toBeGreaterThan(0)
  await expect(summary).toContainText(
    `House Cats: ${outcome.shelf.map((id) => houseCat(id).name).join(", ")}`
  )

  expect(await page.evaluate(() => window.__clowder!.newHousehold())).toBe(true)
  await expect(summary).toHaveCount(0)
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
  await toShop(page, 1)
  await settled(page)
  const before = await page.evaluate(() => window.__clowder!.run())
  expect(before.treats).toBe(5)
  const [offer] = before.shop!.catOffers
  const staged = () => page.evaluate(() => window.__clowder!.shop()!)

  // Adopt the first offer, which leaves its spot in the doorway empty.
  await tap(page, ...shop.offer(0))
  const { doorway, piles } = await staged()
  expect(doorway.map(({ offer }) => offer?.tag.name ?? null)).toEqual([
    null,
    ...doorway.slice(1).map(({ offer }) => offer!.tag.name)
  ])

  // Open the first Kind's pile, pick out its first Cat, and Rehome it.
  const [pile] = piles
  await tap(page, ...shop.pile(pile.spot))
  const { fan } = await staged()
  expect(fan!.cats).toHaveLength(pile.count)
  const [chosen] = fan!.cats
  await tap(page, ...shop.fanned(pile.spot, fan!.cats.length, 0))
  expect(await page.evaluate(() => window.__clowder!.texts())).toContain(
    `Rehome ${chosen.name}?`
  )
  await tap(page, ...shop.rehome)
  await tap(page, ...shop.reroll)

  const after = await page.evaluate(() => window.__clowder!.run())
  expect(after.treats).toBe(0)
  expect(after.roster.map((cat) => cat.id)).toContain(offer.id)
  expect(after.roster.map((cat) => cat.id)).not.toContain(chosen.cat)
  expect(after.roster).toHaveLength(30)
  expect(after.shop!.rerollPrice).toBe(2)
  // The Reroll replaced every offer.
  expect((await staged()).doorway.every(({ offer }) => offer !== null)).toBe(
    true
  )

  await tap(page, ...shop.nightfall)
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
  // This seed's first Shop offers Do Not Touch, for all 5 Treats.
  await toShop(page, 1)
  await settled(page)
  const before = await page.evaluate(() => window.__clowder!.run())
  expect(before.treats).toBe(5)
  const spot = before.shop!.houseCatOffers.indexOf("doNotTouch")
  // Every price is a signed cost, read just after its button's label; the
  // Treats there are to spend are in the treat jar.
  const texts = () => page.evaluate(() => window.__clowder!.texts())
  /** The text drawn right after each of a label's appearances. */
  const after = async (label: string) =>
    (await texts()).filter((_, i, all) => all[i - 1] === label)
  expect(await texts()).toContain("5")
  expect(await after("Adopt")).toContain("−3")
  expect(await after("Recruit")).toContain("−5")
  expect(await after("Reroll")).toEqual(["−1"])
  expect(await after("Rehome")).toEqual(["−1"])
  // Each offer is tagged: a Cat with its Kind, a House Cat with a details link.
  const [cat] = before.shop!.catOffers
  expect(await after(cat.name)).toContain(
    `${cat.coat[0].toUpperCase()}${cat.coat.slice(1)} ${cat.personality[0].toUpperCase()}${cat.personality.slice(1)}`
  )
  expect(await after("Do Not Touch")).toEqual(["View ability"])

  await tap(page, ...shop.offer(before.shop!.catOffers.length + spot))
  const recruited = await page.evaluate(() => window.__clowder!.run())
  expect(recruited.shelf).toEqual(["doNotTouch"])
  expect(recruited.treats).toBe(0)
  expect(await texts()).toContain("0")

  // Rehoming a House Cat refunds Treats: a signed gain.
  await tap(page, ...shop.shelf(0))
  expect(await after("Rehome")).toEqual(["+2"])
  await tap(page, ...shop.rehome)
  const rehomed = await page.evaluate(() => window.__clowder!.run())
  expect(rehomed.shelf).toEqual([])
  expect(rehomed.treats).toBe(2)
})

test("rearranges the Shelf by tapping in the Shop", async ({ page }) => {
  test.setTimeout(60_000)
  await boot(page, 14)
  // Recruits whatever it can afford, one at a time, until the Shelf holds two
  // House Cats.
  const shelf = await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    while (run().status === "playing") {
      const pages = run().scrapbookPages
      if (pages) apply({ type: "choosePage", gathering: pages[0] })
      if (run().shop) {
        for (const houseCat of run().shop!.houseCatOffers)
          if (run().shelf.length < 2) apply({ type: "recruit", houseCat })
        if (run().shelf.length >= 2) break
        apply({ type: "leaveShop" })
      }
      run()
        .night.hand.slice(0, 5)
        .forEach((cat, seat) => {
          apply({ type: "place", cat, seat })
        })
      apply({ type: "play" })
    }
    return run().shelf
  })
  expect(shelf).toHaveLength(2)
  await tap(page, ...layout.wall)
  await expect
    .poll(() => page.evaluate(() => window.__clowder!.scenes()), {
      timeout: 40_000
    })
    .toEqual(["shop"])
  await settled(page)

  // Pick up the first House Cat and put it down in the second position.
  await tap(page, ...shop.shelf(0))
  await tap(page, ...shop.shelf(1))
  const moved = await page.evaluate(() => window.__clowder!.run().shelf)
  expect(moved).toEqual([shelf[1], shelf[0]])
})

test("resumes a Run where it was left after a reload", async ({ page }) => {
  await boot(page, 7)
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    apply({ type: "redraw", cats: run().night.hand.slice(0, 2) })
    run()
      .night.hand.slice(0, 3)
      .forEach((cat, seat) => {
        apply({ type: "place", cat, seat })
      })
    apply({ type: "play" })
  })
  // Seat one more Cat by tapping, and leave it seated.
  await tap(page, ...layout.wall)
  await tap(page, ...layout.hand(0))
  await tap(page, ...layout.seat(4))
  const before = await page.evaluate(() => window.__clowder!.run())
  expect(before.night.couch[4]).not.toBeNull()

  await page.reload()
  await ready(page)

  expect(new URL(page.url()).search).toBe("")
  expect(await page.evaluate(() => window.__clowder!.run())).toEqual(before)
  // The resumed Couch plays on from the scene.
  await tap(page, ...layout.play)
  const after = await page.evaluate(() => window.__clowder!.run())
  expect(after.night.playsLeft).toBe(before.night.playsLeft - 1)
})

test("starts afresh once the saved Run has finished", async ({ page }) => {
  await boot(page, 7)
  const seed = await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    while (run().status === "playing") {
      const pages = run().scrapbookPages
      if (pages) apply({ type: "choosePage", gathering: pages[0] })
      if (run().shop) apply({ type: "leaveShop" })
      run()
        .night.hand.slice(0, 5)
        .forEach((cat, seat) => {
          apply({ type: "place", cat, seat })
        })
      apply({ type: "play" })
    }
    return run().seed
  })

  await page.reload()
  await ready(page)

  const fresh = await page.evaluate(() => window.__clowder!.run())
  expect(fresh.status).toBe("playing")
  expect(fresh.night.number).toBe(1)
  expect(fresh.seed).not.toBe(seed)
})

test("resumes a Run left in the Shop there", async ({ page }) => {
  await boot(page, 1)
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    while (!run().shop) {
      const pages = run().scrapbookPages
      if (pages) {
        apply({ type: "choosePage", gathering: pages[0] })
        continue
      }
      run()
        .night.hand.slice(0, 5)
        .forEach((cat, seat) => {
          apply({ type: "place", cat, seat })
        })
      apply({ type: "play" })
    }
    apply({ type: "reroll" })
  })
  const before = await page.evaluate(() => window.__clowder!.run())

  await page.reload()
  await ready(page)

  expect(await page.evaluate(() => window.__clowder!.run())).toEqual(before)
  await expect
    .poll(() => page.evaluate(() => window.__clowder!.scenes()))
    .toEqual(["shop"])
})
