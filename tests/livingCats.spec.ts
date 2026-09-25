import { expect, type Page, test } from "@playwright/test"
import { boot, layout, ready, tap } from "./scene"

/** The Cats as the living room stages them now. */
const staging = (page: Page) => page.evaluate(() => window.__clowder!.staging())

/** The front-row position on the rug of the first Cat there that `matches`. */
async function onFrontRow(page: Page, matches: "aloof" | "not aloof") {
  const { roster } = await page.evaluate(() => window.__clowder!.run())
  const personality = (id: string) =>
    roster.find((cat) => cat.id === id)!.personality
  const staged = (await staging(page)).cats.find(
    ({ cat, placement: p }) =>
      p.on === "rug" &&
      p.row === "front" &&
      (personality(cat) === "aloof") === (matches === "aloof")
  )!
  if (staged.placement.on !== "rug") throw new Error("Not on the rug")
  return { cat: staged.cat, position: staged.placement.position }
}

const seated = async (page: Page, cat: string) =>
  (await staging(page)).cats.find((staged) => staged.cat === cat)!

test("an Aloof Cat takes offence when another Cat sits beside it", async ({
  page
}) => {
  // Seed 7's Hand has an Aloof Cat on the rug's front row.
  await boot(page, 7)

  const aloof = await onFrontRow(page, "aloof")
  await tap(page, ...layout.hand(aloof.position))
  await tap(page, ...layout.seat(1))
  await expect
    .poll(async () => (await seated(page, aloof.cat)).placement)
    .toEqual({ on: "couch", seat: 1 })
  expect(await seated(page, aloof.cat)).toMatchObject({
    pose: expect.stringMatching(/\/aloof\/content$/),
    facing: "right"
  })

  // Another Cat sits down on its right: it turns away, to the left.
  const other = await onFrontRow(page, "not aloof")
  await tap(page, ...layout.hand(other.position))
  await tap(page, ...layout.seat(2))
  await expect
    .poll(async () => (await seated(page, aloof.cat)).pose)
    .toMatch(/\/aloof\/reacting$/)
  expect((await seated(page, aloof.cat)).facing).toBe("left")

  // Unseated again, the Cat beside it leaves it content.
  await tap(page, ...layout.seat(2))
  await expect
    .poll(async () => (await seated(page, aloof.cat)).pose)
    .toMatch(/\/aloof\/content$/)
})

test("every Cat keeps its eye tint after a reload", async ({ page }) => {
  await boot(page, 7)
  const tints = async () =>
    Object.fromEntries(
      (await staging(page)).cats.map(({ cat, eyeTint }) => [cat, eyeTint])
    )
  const before = await tints()
  expect(new Set(Object.values(before)).size).toBeGreaterThan(1)

  await page.reload()
  await ready(page)
  expect(await tints()).toEqual(before)
})
