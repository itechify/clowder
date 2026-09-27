import { sound } from "../audio/sound"
import { presentation } from "../game/presentation"
import { session } from "../game/session"
import { Toast } from "./Toast"

/**
 * Asks, along the top like the other prompts, before a New Household from
 * the title screen replaces the saved Run. Starting one leaves the title
 * screen for it; Cancel, or Escape, keeps the saved Run.
 */
export function NewHouseholdConfirm() {
  const answer = (start: boolean) => {
    sound.cue({ name: "uiTap" })
    presentation.update({ confirmingNewHousehold: false })
    if (start) session.newHousehold()
  }
  return (
    <Toast
      asking="New Household"
      message="Start a new household? Your current one will be lost."
      action="Start"
      onAction={() => answer(true)}
      dismiss="Cancel"
      onDismiss={() => answer(false)}
    />
  )
}
