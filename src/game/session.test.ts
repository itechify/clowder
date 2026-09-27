import { describe, expect, it } from "vitest"
import { startRun } from "../engine"
import { Session } from "./session"

/** An in-memory stand-in for the browser's localStorage. */
function memoryStorage(initial: Record<string, string> = {}) {
  const items = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value)
    },
    removeItem: (key: string) => {
      items.delete(key)
    }
  }
}

/**
 * Seats the first Hand Cats on a full Couch and Plays them, first choosing a
 * page from any open Scrapbook and leaving any Shop.
 */
function playFive(session: Session) {
  const pages = session.run.scrapbookPages
  if (pages) session.apply({ type: "choosePage", clowder: pages[0] })
  if (session.run.shop) session.apply({ type: "leaveShop" })
  session.run.night.hand.slice(0, 5).forEach((cat, seat) => {
    session.apply({ type: "place", cat, seat })
  })
  return session.apply({ type: "play" })
}

describe("resuming the Run", () => {
  it("starts a new Run when nothing is saved", () => {
    const session = new Session(memoryStorage())

    expect(session.run.night.number).toBe(1)
    expect(session.run.night.playsLeft).toBe(3)
  })

  it("offers nothing to continue when nothing is saved", () => {
    const storage = memoryStorage()

    expect(new Session(storage).resumable).toBe(false)
    // Opening the game without starting a household saves nothing to continue.
    expect(new Session(storage).resumable).toBe(false)
  })

  it("offers to continue a saved Run", () => {
    const storage = memoryStorage()
    playFive(new Session(storage, "?seed=7"))

    expect(new Session(storage).resumable).toBe(true)
  })

  it("offers nothing to continue once the saved Run has finished", () => {
    const storage = memoryStorage()
    const session = new Session(storage, "?seed=7")
    while (session.run.status === "playing") playFive(session)

    expect(new Session(storage).resumable).toBe(false)
  })

  it("knows when the page asks for a seeded Run", () => {
    expect(new Session(memoryStorage(), "?seed=7").seeded).toBe(true)
    expect(new Session(memoryStorage()).seeded).toBe(false)
  })

  it("picks up the saved Run exactly where it was left", () => {
    const storage = memoryStorage()
    const first = new Session(storage)
    playFive(first)
    first.apply({
      type: "place",
      cat: first.run.night.hand[0],
      seat: 3
    })

    expect(new Session(storage).run).toStrictEqual(first.run)
  })

  it("picks up a Run left mid-choice, with the same Scrapbook pages", () => {
    const storage = memoryStorage()
    const first = new Session(storage, "?seed=1")
    while (!first.run.scrapbookPages) playFive(first)

    expect(new Session(storage).run.scrapbookPages).toEqual(
      first.run.scrapbookPages
    )
  })

  it("picks up a Run left in the Shop", () => {
    const storage = memoryStorage()
    const first = new Session(storage, "?seed=1")
    while (!first.run.scrapbookPages) playFive(first)
    const [clowder] = first.run.scrapbookPages
    first.apply({ type: "choosePage", clowder })

    expect(new Session(storage).run.shop).toStrictEqual(first.run.shop)
  })

  it("starts the seeded Run a page asks for instead, and saves that", () => {
    const storage = memoryStorage()
    playFive(new Session(storage))

    const seeded = new Session(storage, "?seed=7")

    expect(seeded.run).toStrictEqual(startRun(7))
    expect(new Session(storage).run).toStrictEqual(startRun(7))
  })

  it("saves the Run a New Household starts", () => {
    const storage = memoryStorage()
    const session = new Session(storage, "?seed=7")

    session.newHousehold()

    expect(new Session(storage).run).toStrictEqual(session.run)
  })

  it("starts a new Run once the saved one has finished", () => {
    const storage = memoryStorage()
    const session = new Session(storage)
    while (session.run.status === "playing") playFive(session)

    const next = new Session(storage)

    expect(next.run.status).toBe("playing")
    expect(next.run.night.number).toBe(1)
    expect(next.run.seed).not.toBe(session.run.seed)
  })

  it("starts a new Run when the save is corrupt", () => {
    const storage = memoryStorage({ "clowder.run": "{not a save" })

    const session = new Session(storage)

    expect(session.run.status).toBe("playing")
    expect(session.run.night.number).toBe(1)
  })

  it("still works where storage is unavailable", () => {
    const denied = () => {
      throw new Error("denied")
    }
    const session = new Session({
      getItem: denied,
      setItem: denied,
      removeItem: denied
    })

    expect(playFive(session).ok).toBe(true)
  })
})
