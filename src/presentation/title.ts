/**
 * The presentation model's title screen: the game's name defined beneath its
 * logo, and the choices it offers, for the scene to draw and the shell to
 * read out. Pure data, like staging.
 */

/** A dictionary's definition of the game's name. */
export type Definition = {
  word: string
  pronunciation: string
  partOfSpeech: string
  meaning: string
}

/** Carrying on with the saved Run, or starting a new one in its place. */
export type TitleChoice = "continue" | "newHousehold"

/** A button on the title screen; `confirm` asks first, as a saved Run would be lost. */
export type TitleButton = {
  label: string
  choice: TitleChoice
  confirm: boolean
}

/** The title screen: the definition beneath the logo, and the buttons, top to bottom. */
export type Title = { definition: Definition; buttons: TitleButton[] }

/** "Clowder" as a dictionary defines it. */
export const definition: Definition = {
  word: "clow·der",
  pronunciation: "/ˈklaʊ·dər/",
  partOfSpeech: "noun",
  meaning: "a group of cats"
}

/**
 * The title screen, `resumable` if a Run is saved to continue: Continue then,
 * and always a New Household, which asks first if it would replace the saved Run.
 */
export function title({ resumable }: { resumable: boolean }): Title {
  return {
    definition,
    buttons: [
      ...(resumable
        ? [{ label: "Continue", choice: "continue", confirm: false } as const]
        : []),
      { label: "New Household", choice: "newHousehold", confirm: resumable }
    ]
  }
}
