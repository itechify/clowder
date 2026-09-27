type ToastProps = {
  message: string
  action: string
  onAction: () => void
  dismiss: string
  onDismiss: () => void
  /**
   * Named, it asks before something that can't be undone: it has the safe
   * choice, dismissing, focused, and Escape dismisses it too.
   */
  asking?: string
}

/** A prompt along the top of the screen, with an action and a way to dismiss it. */
export function Toast({
  message,
  action,
  onAction,
  dismiss,
  onDismiss,
  asking
}: ToastProps) {
  return (
    <aside
      className="toast"
      {...(asking
        ? {
            role: "alertdialog",
            "aria-label": asking,
            "aria-describedby": "toast-message",
            onKeyDown: (event) => {
              if (event.key === "Escape") onDismiss()
            }
          }
        : { "aria-live": "polite" })}
    >
      <p id="toast-message">{message}</p>
      <button type="button" onClick={onAction}>
        {action}
      </button>
      <button
        type="button"
        className="quiet"
        // biome-ignore lint/a11y/noAutofocus: asking, the safe choice has focus as it opens
        autoFocus={!!asking}
        onClick={onDismiss}
      >
        {dismiss}
      </button>
    </aside>
  )
}
