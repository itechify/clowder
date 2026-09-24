import { registerSW } from "virtual:pwa-register"

/** Chromium's deferred install prompt; other browsers never fire it. */
type InstallPrompt = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

/**
 * Clowder as an installed app: the service worker that precaches it for
 * offline play, and the install and update prompts the shell offers.
 */
class Pwa {
  /** A new version is precached and waiting for the player to take it. */
  updateReady = false
  /** Bumped on every change, for React's useSyncExternalStore. */
  revision = 0
  private installPrompt: InstallPrompt | null = null
  private applyUpdate: (() => Promise<void>) | null = null
  private listeners = new Set<() => void>()

  /** Whether the browser will install Clowder if the player asks. */
  get canInstall() {
    return this.installPrompt !== null
  }

  /** Registers the service worker (production builds only) and listens. */
  register() {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault()
      this.installPrompt = event as InstallPrompt
      this.emit()
    })
    window.addEventListener("appinstalled", () => this.dismissInstall())
    const updateSW = registerSW({
      onNeedRefresh: () => {
        this.updateReady = true
        this.emit()
      },
      // update() reloads instead: workbox-window reports the takeover only to
      // pages that were already under a service worker when they loaded.
      onNeedReload: () => {}
    })
    this.applyUpdate = () => updateSW(true)
  }

  async install() {
    const prompt = this.installPrompt
    if (!prompt) return
    // A deferred prompt can be shown only once, whatever the player chooses.
    this.dismissInstall()
    await prompt.prompt()
    await prompt.userChoice
  }

  dismissInstall() {
    this.installPrompt = null
    this.emit()
  }

  /** Activates the waiting version and reloads into it. */
  async update() {
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => location.reload(),
      { once: true }
    )
    await this.applyUpdate?.()
  }

  dismissUpdate() {
    this.updateReady = false
    this.emit()
  }

  on = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit() {
    this.revision++
    for (const listener of this.listeners) listener()
  }
}

export const pwa = new Pwa()
