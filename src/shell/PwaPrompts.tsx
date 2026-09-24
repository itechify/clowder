import { useSyncExternalStore } from "react"
import { pwa } from "./pwa"

type ToastProps = {
  message: string
  action: string
  onAction: () => void
  dismiss: string
  onDismiss: () => void
}

function Toast({ message, action, onAction, dismiss, onDismiss }: ToastProps) {
  return (
    <aside className="toast" aria-live="polite">
      <p>{message}</p>
      <button type="button" onClick={onAction}>
        {action}
      </button>
      <button type="button" className="quiet" onClick={onDismiss}>
        {dismiss}
      </button>
    </aside>
  )
}

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
