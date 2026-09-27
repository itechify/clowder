import { useSyncExternalStore } from "react"
import { pwa } from "./pwa"
import { Toast } from "./Toast"

/** One prompt at a time along the top: a waiting update, else installing. */
export function PwaPrompts() {
  useSyncExternalStore(pwa.on, () => pwa.revision)
  if (pwa.updateReady)
    return (
      // Until Runs are saved, reloading into the new version ends this one.
      <Toast
        message="A new version of Clowder is ready. Updating starts a new household."
        action="Update"
        onAction={() => void pwa.update()}
        dismiss="Later"
        onDismiss={() => pwa.dismissUpdate()}
      />
    )
  if (pwa.canInstall)
    return (
      <Toast
        message="Install Clowder to play offline from your home screen."
        action="Install"
        onAction={() => void pwa.install()}
        dismiss="Not now"
        onDismiss={() => pwa.dismissInstall()}
      />
    )
  return null
}
