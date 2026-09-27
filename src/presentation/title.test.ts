import { describe, expect, it } from "vitest"
import { title } from "./title"

describe("the title screen", () => {
  it("defines the game's name beneath it", () => {
    expect(title({ resumable: false }).definition).toEqual({
      word: "clow·der",
      pronunciation: "/ˈklaʊ·dər/",
      partOfSpeech: "noun",
      meaning: "a group of cats"
    })
  })

  it("offers only a New Household when nothing is saved, starting it at once", () => {
    expect(title({ resumable: false }).buttons).toEqual([
      { label: "New Household", choice: "newHousehold", confirm: false }
    ])
  })

  it("offers to Continue a saved Run, and asks before a New Household replaces it", () => {
    expect(title({ resumable: true }).buttons).toEqual([
      { label: "Continue", choice: "continue", confirm: false },
      { label: "New Household", choice: "newHousehold", confirm: true }
    ])
  })
})
