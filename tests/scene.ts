import { expect, type Page } from "@playwright/test"
import type {} from "../src/game/debugHook"

/** Opens the game on a seeded Run, with the debug hook ready. */
export async function boot(page: Page, seed: number) {
  await page.goto(`/?seed=${seed}`)
  await expect(page.locator("#game canvas")).toBeVisible()
  await page.waitForFunction(() => "__clowder" in window)
}

/** Where a point in the scene's 390×844 portrait layout is on the page. */
export async function onPage(page: Page, x: number, y: number) {
  const box = (await page.locator("#game canvas").boundingBox())!
  return {
    x: box.x + (x / 390) * box.width,
    y: box.y + (y / 844) * box.height
  }
}

/** Taps the canvas at a point in the scene's layout. */
export async function tap(page: Page, x: number, y: number) {
  const at = await onPage(page, x, y)
  await page.mouse.click(at.x, at.y)
}

/** Presses at one point in the scene's layout and lets go at another. */
export async function drag(
  page: Page,
  from: [number, number],
  to: [number, number]
) {
  const start = await onPage(page, ...from)
  const end = await onPage(page, ...to)
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(end.x, end.y, { steps: 8 })
  await page.mouse.up()
}

/** Where things are in CouchScene's layout. */
export const layout = {
  /** The first four Hand Cats not on the Couch, on the rug's first row. */
  hand: (i: number): [number, number] => [60 + i * 90, 585],
  seat: (seat: number): [number, number] => [55 + seat * 70, 342],
  play: [135, 790] as [number, number],
  redraw: [316, 790] as [number, number],
  /** Open wall below the Shelf, clear of anything that answers a tap. */
  wall: [195, 240] as [number, number]
}

/** Where things are in ShopScene's layout, with two Cats and two House Cats on offer. */
export const shop = {
  /** The button on the `i`th offer card, Cats first, then House Cats. */
  offer: (i: number): [number, number] => [56 + i * 92.5, 280],
  /** A House Cat in the `slot`th slot of the Shelf. */
  shelf: (slot: number): [number, number] => [64 + slot * 87.5, 400],
  reroll: [195, 334] as [number, number],
  rehome: [105, 790] as [number, number],
  leave: [285, 790] as [number, number]
}
