import { expect, type Page, test } from "@playwright/test"
import {
  boot,
  firstShop,
  ready,
  reopen,
  scenes,
  tap,
  texts,
  title
} from "./scene"

const run = (page: Page) => page.evaluate(() => window.__clowder!.run())

/** Opens the game afresh, with nothing saved on this device. */
async function open(page: Page) {
  await page.goto("/")
  await expect(page.locator("#game canvas")).toBeVisible()
  await ready(page)
}

/** Opens a seeded Run and seats a Cat, so there is a Run saved to continue. */
async function saveARun(page: Page) {
  await boot(page, 7)
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    apply({ type: "place", cat: run().night.hand[0], seat: 2 })
  })
  return run(page)
}

test("opens on the title screen, the game's name defined beneath its logo", async ({
  page
}) => {
  await open(page)

  expect(await scenes(page)).toEqual(["title"])
  expect(await texts(page)).toEqual(
    expect.arrayContaining([
      "clow·der",
      "/ˈklaʊ·dər/",
      "noun",
      "— a group of cats",
      "New Household"
    ])
  )
  expect(await texts(page)).not.toContain("Continue")
  await expect(page.getByRole("heading", { name: "Clowder" })).toBeAttached()
  // The Night's theme, waiting for the first tap to be heard.
  expect(await page.evaluate(() => window.__clowder!.audio().theme)).toBe(
    "night"
  )
})

test("starts a New Household at once when nothing is saved", async ({
  page
}) => {
  await open(page)

  await tap(page, ...title.newHousehold(1))

  await expect.poll(() => scenes(page)).toEqual(["couch"])
  expect((await run(page)).night.number).toBe(1)
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
})

test("continues a saved Run where it was left", async ({ page }) => {
  const before = await saveARun(page)

  await reopen(page)
  expect(await texts(page)).toEqual(
    expect.arrayContaining(["Continue", "New Household"])
  )
  await tap(page, ...title.continue())

  await expect.poll(() => scenes(page)).toEqual(["couch"])
  expect(await run(page)).toEqual(before)
})

test("continues a Run saved in the Shop, in the Shop", async ({ page }) => {
  await boot(page, 7, { ...firstShop, firstTarget: 1 })
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    apply({ type: "place", cat: run().night.hand[0], seat: 0 })
    apply({ type: "play" })
    apply({ type: "choosePage", clowder: run().scrapbookPages![0] })
  })
  const before = await run(page)
  expect(before.shop).not.toBeNull()

  await reopen(page)
  await tap(page, ...title.continue())

  await expect.poll(() => scenes(page)).toEqual(["shop"])
  expect(await run(page)).toEqual(before)
})

test("asks before a New Household replaces the saved Run", async ({ page }) => {
  const before = await saveARun(page)
  await reopen(page)

  await tap(page, ...title.newHousehold(2))
  const dialog = page.getByRole("alertdialog", { name: "New Household" })
  await expect(dialog).toContainText(
    "Start a new household? Your current one will be lost."
  )
  // Cancel keeps the saved Run, and the title screen.
  await dialog.getByRole("button", { name: "Cancel" }).click()
  await expect(dialog).toHaveCount(0)
  expect(await scenes(page)).toEqual(["title"])
  expect(await run(page)).toEqual(before)

  await tap(page, ...title.newHousehold(2))
  await dialog.getByRole("button", { name: "Start" }).click()

  await expect.poll(() => scenes(page)).toEqual(["couch"])
  const fresh = await run(page)
  expect(fresh.seed).not.toBe(before.seed)
  expect(fresh.night.number).toBe(1)
  // The New Household is the Run saved now.
  await reopen(page)
  await tap(page, ...title.continue())
  await expect.poll(() => scenes(page)).toEqual(["couch"])
  expect(await run(page)).toEqual(fresh)
})

test("answers the keyboard while it asks", async ({ page }) => {
  const before = await saveARun(page)
  await reopen(page)
  await tap(page, ...title.newHousehold(2))
  const dialog = page.getByRole("alertdialog")

  // The safe choice has focus, and Escape, like it, keeps the saved Run.
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toHaveCount(0)
  expect(await run(page)).toEqual(before)

  await tap(page, ...title.newHousehold(2))
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Enter")
  await expect.poll(() => scenes(page)).toEqual(["couch"])
  expect((await run(page)).seed).not.toBe(before.seed)
})

test("skips the title screen for a seeded Run", async ({ page }) => {
  await boot(page, 7)

  expect(await scenes(page)).toEqual(["couch"])
  expect((await run(page)).seed).toBe(7)
})
