import { expect, type Page } from "@playwright/test"
import type {} from "../src/game/debugHook"
import { fanX } from "../src/game/layout"
import type { PileSpot } from "../src/presentation/shop"

/**
 * Waits for the debug hook, and for the Run to show once the fonts have
 * loaded, as after opening or reloading the game.
 */
export async function ready(page: Page) {
  await page.waitForFunction(() =>
    window.__clowder?.scenes().some((scene) => scene !== "boot")
  )
}

/** Opens the game on a seeded Run, ready to play. */
export async function boot(page: Page, seed: number) {
  await page.goto(`/?seed=${seed}`)
  await expect(page.locator("#game canvas")).toBeVisible()
  await ready(page)
}

/** Opens the Settings menu, returning it. */
export async function openSettings(page: Page) {
  await page.getByRole("button", { name: "Settings" }).click()
  return page.getByRole("dialog", { name: "Settings" })
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
  /** The first four Hand Cats not on the Couch, on the rug's front row. */
  hand: (i: number): [number, number] => [48 + i * 84, 680],
  seat: (seat: number): [number, number] => [55 + seat * 70, 342],
  play: [135, 790] as [number, number],
  redraw: [316, 790] as [number, number],
  /** Once the Results show, over Play and Redraw, which no longer answer. */
  newHousehold: [268, 790] as [number, number],
  /** Open wall below the Shelf, clear of anything that answers a tap. */
  wall: [195, 240] as [number, number]
}

/** Where things are in ShopScene's layout, with two Cats and two House Cats on offer. */
export const shop = {
  /** The Adopt or Recruit button of the `i`th doorway offer, Cats first. */
  offer: (i: number): [number, number] => [63.75 + i * 87.5, 566],
  /** A House Cat at the `position`th position on the Shelf. */
  shelf: (position: number): [number, number] => [64 + position * 87.5, 168],
  /** A Kind's pile, at its spot in the Shop's staging. */
  pile: (spot: PileSpot): [number, number] =>
    spot.on === "couch"
      ? [55 + spot.seat * 70, 340]
      : spot.on === "rug"
        ? spot.row === "back"
          ? [90 + spot.position * 84, 624]
          : [48 + spot.position * 84, 702]
        : [[58, 104][spot.position], 126],
  /** The `i`th of `count` Cats fanned out from the pile at `spot`. */
  fanned: (spot: PileSpot, count: number, i: number): [number, number] => {
    const [x, y] = shop.pile(spot)
    const xs = fanX(count, x, { left: 16, right: 374, step: 62 })
    return spot.on === "sill" ? [xs[i], y + 126] : [xs[i], y - 94]
  },
  reroll: [50, 800] as [number, number],
  rehome: [142, 800] as [number, number],
  nightfall: [291, 800] as [number, number],
  /** Open wall beside the window, clear of anything that answers a tap. */
  wall: [300, 110] as [number, number]
}

/**
 * Plays a seeded Run's first Nights by the debug hook until the Shop opens,
 * skipping the clearing Play's sequence; resolves once the Shop shows, as
 * dawn begins to break.
 */
export async function toShop(page: Page, seed: number) {
  await boot(page, seed)
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
}

/** Waits for the Shop's dawn, or any transition, to finish playing out. */
export async function settled(page: Page) {
  await expect
    .poll(() => page.evaluate(() => window.__clowder!.transition()))
    .toBeNull()
}
