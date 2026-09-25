import { expect, test } from "@playwright/test"
import { boot, openSettings } from "./scene"

test("keeps sound, haptics, and Reduced motion choices across reloads", async ({
  page
}) => {
  await boot(page, 7)
  const settings = await openSettings(page)
  const music = settings.getByRole("slider", { name: "Music" })
  const effects = settings.getByRole("slider", { name: "Sound effects" })
  await expect(music).toHaveValue("60")
  await expect(effects).toHaveValue("80")
  await expect(
    settings.getByRole("checkbox", { name: "Haptics" })
  ).toBeChecked()

  await music.fill("30")
  await effects.fill("0")
  await settings.getByText("Mute").click()
  await settings.getByText("Haptics").click()
  await settings.getByText("Reduced motion").click()

  await boot(page, 7)
  await openSettings(page)
  await expect(music).toHaveValue("30")
  await expect(effects).toHaveValue("0")
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
    const settings = await openSettings(page)
    const reduced = settings.getByRole("checkbox", { name: "Reduced motion" })
    await expect(reduced).toBeChecked()

    await settings.getByText("Reduced motion").click()
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
  const settings = await openSettings(page)

  const haptics = settings.getByRole("checkbox", { name: /Haptics/ })
  await expect(haptics).toBeDisabled()
  await expect(haptics).not.toBeChecked()
  await expect(settings.getByText("Not available on this device")).toBeVisible()
})
