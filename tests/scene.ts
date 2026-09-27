import { expect, type Page } from "@playwright/test"
import { type Config, defaultConfig } from "../src/engine"
import type {} from "../src/game/debugHook"
import { fanX, TITLE, titleButtonsY } from "../src/game/layout"
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

/** The scenes showing now, such as ["title"] or ["couch"]. */
export const scenes = (page: Page) =>
  page.evaluate(() => window.__clowder!.scenes())

/** Every piece of text the showing scenes draw. */
export const texts = (page: Page) =>
  page.evaluate(() => window.__clowder!.texts())

/** Where the title screen's buttons are, as it shows `count` of them. */
export const title = {
  button: (i: number, count: number): [number, number] => [
    TITLE.buttons.x,
    titleButtonsY(count)[i]
  ],
  /** Continue, when a Run is saved... */
  continue: (): [number, number] => title.button(0, 2),
  /** ...and New Household, the last of however many show. */
  newHousehold: (count: 1 | 2): [number, number] =>
    title.button(count - 1, count)
}

/** Reloads the game, as on a later visit, and waits for the title screen. */
export async function reopen(page: Page) {
  await page.reload()
  await ready(page)
  await expect.poll(() => scenes(page)).toEqual(["title"])
}

/** Reloads the game and continues the saved Run from the title screen. */
export async function resume(page: Page) {
  await reopen(page)
  await tap(page, ...title.continue())
  await expect.poll(() => scenes(page)).not.toEqual(["title"])
}

/**
 * Opens the game on a seeded Run, ready to play; given a config, restarts it
 * from the same seed with that config changed as given.
 */
export async function boot(page: Page, seed: number, config?: Partial<Config>) {
  await page.goto(`/?seed=${seed}`)
  await expect(page.locator("#game canvas")).toBeVisible()
  await ready(page)
  if (config)
    await page.evaluate(
      ({ seed, config }) => window.__clowder!.start(seed, config),
      { seed, config }
    )
}

/**
 * The first Night that specs shopping with exact Treats were written around,
 * whatever the game's balance: a Target of 300, and 3 Treats for clearing it,
 * so 5 when cleared on the first Play.
 */
export const firstShop: Partial<Config> = {
  firstTarget: 300,
  clearReward: { ...defaultConfig.clearReward, early: 3, perUnusedPlay: 1 }
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
  wall: [195, 240] as [number, number],
  /** The `i`th of the three Scrapbook pages, once a Night is cleared. */
  page: (i: number): [number, number] => [74 + i * 121, 590],
  /** The Scrapbook lying on the floor by the rug. */
  scrapbook: [346, 522] as [number, number]
}

/** Where things are in ShopScene's layout, with two Cats and two House Cats on offer. */
export const shop = {
  /** The Adopt or Recruit button of the `i`th offer at the door, Cats first. */
  offer: (i: number): [number, number] => [63.75 + i * 87.5, 498],
  /** A House Cat at the `position`th position on the Shelf. */
  shelf: (position: number): [number, number] => [64 + position * 87.5, 168],
  /** A Kind's pile, at its cell in the household's grid. */
  pile: ({ column, row }: PileSpot): [number, number] => [
    64 + column * 66.5,
    596 + row * 58
  ],
  /** The `i`th of `count` Cats fanned out from the pile at `spot`. */
  fanned: (spot: PileSpot, count: number, i: number): [number, number] => {
    const [x, y] = shop.pile(spot)
    return [
      fanX(count, x, { left: 16, right: 374, step: 62, minWidth: 190 })[i],
      y - 94
    ]
  },
  reroll: [318, 278] as [number, number],
  rehome: [70, 800] as [number, number],
  nightfall: [262, 800] as [number, number],
  /** Open wall beside the window, clear of anything that answers a tap. */
  wall: [300, 110] as [number, number],
  /** The Scrapbook, at the end of the household's heading. */
  scrapbook: [363, 548] as [number, number]
}

/**
 * Plays a seeded Run's first Nights by the debug hook until the Scrapbook
 * opens, skipping the clearing Play's sequence; resolves once the Scrapbook
 * shows.
 */
export async function toScrapbook(
  page: Page,
  seed: number,
  config?: Partial<Config>
) {
  await boot(page, seed, config)
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    while (!run().scrapbookPages) {
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
    .poll(() => page.evaluate(() => window.__clowder!.scoring()))
    .toBe(false)
}

/**
 * Plays a seeded Run's first Nights by the debug hook until the Scrapbook
 * opens, then chooses its first page by the debug hook too; resolves once the
 * Shop shows, as dawn begins to break.
 */
export async function toShop(
  page: Page,
  seed: number,
  config?: Partial<Config>
) {
  await toScrapbook(page, seed, config)
  await page.evaluate(() => {
    const { run, apply } = window.__clowder!
    apply({ type: "choosePage", clowder: run().scrapbookPages![0] })
  })
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
