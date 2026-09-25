import { expect, type Page, test } from "@playwright/test"
import { boot, layout, openSettings, tap } from "./scene"

const scoring = (page: Page) => page.evaluate(() => window.__clowder!.scoring())
const effects = (page: Page) => page.evaluate(() => window.__clowder!.effects())
const cues = (page: Page) => page.evaluate(() => window.__clowder!.cues())

/** Seats the first three Hand Cats, Plays, and waits for the sequence to end. */
async function playThreeCats(page: Page) {
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    run()
      .night.hand.slice(0, 3)
      .forEach((cat, seat) => {
        apply({ type: "place", cat, seat })
      })
  })
  await tap(page, ...layout.play)
  expect(await scoring(page)).toBe(true)
  await expect.poll(() => scoring(page), { timeout: 20_000 }).toBe(false)
}

test("shakes the room as a Score lands", async ({ page }) => {
  await boot(page, 7)

  await playThreeCats(page)

  const landing = (await effects(page)).filter(
    (effect) => effect.event === "scoreTotal" && effect.particles > 0
  )
  expect(landing).toHaveLength(1)
  expect(landing[0].shake).toBeGreaterThan(0)
})

test("honours Reduced motion: no shake, flash, or fire, every cue kept", async ({
  page
}) => {
  await boot(page, 7)
  const settings = await openSettings(page)
  await settings.getByText("Reduced motion").click()
  await settings.getByRole("button", { name: "Done" }).click()
  const cuesBefore = (await cues(page)).length

  await playThreeCats(page)

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
  expect(heard.filter((name) => name === "catScored")).toHaveLength(3)
  expect(heard.at(-1)).toBe("scoreLanded")
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

  await playThreeCats(page)
  expect((await pulses()).length).toBeGreaterThan(0)

  const settings = await openSettings(page)
  await settings.getByText("Haptics").click()
  await settings.getByRole("button", { name: "Done" }).click()
  const before = (await pulses()).length
  await playThreeCats(page)

  expect(await pulses()).toHaveLength(before)
})
