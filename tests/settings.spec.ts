import { expect, type Page, test } from "@playwright/test"
import { boot } from "./scene"

function openSettings(page: Page) {
  return page.getByRole("button", { name: "Settings" }).click()
}

const menu = (page: Page) => page.getByRole("dialog", { name: "Settings" })

test("keeps sound, haptics, and Reduced motion choices across reloads", async ({
  page
}) => {
  await boot(page, 7)
  await openSettings(page)
  const settings = menu(page)
  await expect(settings.getByRole("slider", { name: "Music" })).toHaveValue(
    "60"
  )
  await expect(
    settings.getByRole("slider", { name: "Sound effects" })
  ).toHaveValue("80")
  await expect(
    settings.getByRole("checkbox", { name: "Haptics" })
  ).toBeChecked()

  await settings.getByRole("slider", { name: "Music" }).fill("30")
  await settings.getByRole("slider", { name: "Sound effects" }).fill("0")
  await settings.getByText("Mute").click()
  await settings.getByText("Haptics").click()
  await settings.getByText("Reduced motion").click()

  await boot(page, 7)
  await openSettings(page)
  await expect(settings.getByRole("slider", { name: "Music" })).toHaveValue(
    "30"
  )
  await expect(
    settings.getByRole("slider", { name: "Sound effects" })
  ).toHaveValue("0")
  await expect(settings.getByRole("checkbox", { name: "Mute" })).toBeChecked()
  await expect(
    settings.getByRole("checkbox", { name: "Haptics" })
  ).not.toBeChecked()
  await expect(
    settings.getByRole("checkbox", { name: "Reduced motion" })
  ).toBeChecked()
})

test.describe("where the OS asks for reduced motion", () => {
  test.use({ reducedMotion: "reduce" })

  test("starts with Reduced motion on until the player turns it off", async ({
    page
  }) => {
    await boot(page, 7)
    await openSettings(page)
    const reduced = menu(page).getByRole("checkbox", {
      name: "Reduced motion"
    })
    await expect(reduced).toBeChecked()

    await menu(page).getByText("Reduced motion").click()
    await boot(page, 7)
    await openSettings(page)

    await expect(reduced).not.toBeChecked()
  })
})

test("shows haptics as unavailable where the device cannot vibrate", async ({
  page
}) => {
  await page.addInitScript(() => {
    // As in iOS Safari, which has no Vibration API.
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      writable: true
    })
  })
  await boot(page, 7)
  await openSettings(page)

  const haptics = menu(page).getByRole("checkbox", { name: /Haptics/ })
  await expect(haptics).toBeDisabled()
  await expect(
    menu(page).getByText("Not available on this device")
  ).toBeVisible()
})
