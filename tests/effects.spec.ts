import { expect, type Page, test } from "@playwright/test"
import { boot, layout, openSettings, tap } from "./scene"

const scoring = (page: Page) => page.evaluate(() => window.__clowder!.scoring())
const effects = (page: Page) => page.evaluate(() => window.__clowder!.effects())
const cues = (page: Page) => page.evaluate(() => window.__clowder!.cues())

/** Seats the first Hand Cats, Plays, and waits for the sequence to end. */
async function play(page: Page, cats: number) {
  await page.evaluate((cats) => {
    const { run, apply } = window.__clowder!
    run()
      .night.hand.slice(0, cats)
      .forEach((cat, seat) => {
        apply({ type: "place", cat, seat })
      })
  }, cats)
  await tap(page, ...layout.play)
  expect(await scoring(page)).toBe(true)
  await expect.poll(() => scoring(page), { timeout: 20_000 }).toBe(false)
}

/**
 * On seed 1, the first five Hand Cats score 400 against the first Night's
 * Target of 300 in a single Play, setting the purr meter on fire.
 */
const FIERY = { seed: 1, cats: 5 }

test("shakes, flashes, and sets the purr meter on fire as a big Score lands", async ({
  page
}) => {
  await boot(page, FIERY.seed)

  await play(page, FIERY.cats)

  const landing = (await effects(page)).filter(
    (effect) => effect.event === "scoreTotal" && effect.particles > 0
  )
  expect(landing).toHaveLength(1)
  expect(landing[0]).toMatchObject({ fire: true })
  expect(landing[0].shake).toBeGreaterThan(0)
  expect(landing[0].flash).toBeGreaterThan(0)
})

test("honours Reduced motion: no shake, flash, or fire, every cue kept", async ({
  page
}) => {
  await boot(page, FIERY.seed)
  const settings = await openSettings(page)
  await settings.getByText("Reduced motion").click()
  await settings.getByRole("button", { name: "Done" }).click()
  const cuesBefore = (await cues(page)).length

  await play(page, FIERY.cats)

  const played = await effects(page)
  expect(played.map((effect) => effect.event)).toContain("scoreTotal")
  for (const effect of played) {
    expect(effect.shake).toBe(0)
    expect(effect.flash).toBe(0)
    expect(effect.fire).toBe(false)
  }
  // Particles are softened, not gone.
  expect(played.some((effect) => effect.particles > 0)).toBe(true)
  const heard = (await cues(page)).slice(cuesBefore).map((cue) => cue.name)
  expect(heard.filter((name) => name === "catScored")).toHaveLength(5)
  expect(heard).toContain("scoreLanded")
  expect(heard.at(-1)).toBe("nightCleared")
})

test("pulses on big moments only while haptics are on", async ({ page }) => {
  await page.addInitScript(() => {
    const pulses: unknown[] = []
    Object.assign(window, { pulses })
    Object.defineProperty(navigator, "vibrate", {
      value: (pattern: unknown) => {
        pulses.push(pattern)
        return true
      },
      // Phaser assigns it at boot.
      writable: true
    })
  })
  const pulses = () =>
    page.evaluate(() => (window as unknown as { pulses: unknown[] }).pulses)
  await boot(page, 7)

  await play(page, 3)
  expect((await pulses()).length).toBeGreaterThan(0)

  const settings = await openSettings(page)
  await settings.getByText("Haptics").click()
  await settings.getByRole("button", { name: "Done" }).click()
  const before = (await pulses()).length
  await play(page, 3)

  expect(await pulses()).toHaveLength(before)
})
