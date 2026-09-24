import { useState, useSyncExternalStore } from "react"
import { scoringSpeeds, settings } from "./settings"

/**
 * The settings button, pinned to the wall of the scene above the Couch, and
 * the panel it opens.
 */
export function SettingsMenu() {
  useSyncExternalStore(settings.on, () => settings.revision)
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="frame">
        <button
          type="button"
          className="settings-button"
          aria-label="Settings"
          onClick={() => setOpen(true)}
        >
          {/* The text presentation keeps the gear in the room's palette. */}
          {"\u2699\uFE0E"}
        </button>
      </div>
      {open && (
        <div className="overlay">
          <section className="panel" role="dialog" aria-labelledby="settings">
            <h1 id="settings">Settings</h1>
            <fieldset className="choices">
              <legend>Scoring speed</legend>
              {scoringSpeeds.map((speed) => (
                <label key={speed}>
                  <input
                    type="radio"
                    name="scoring-speed"
                    checked={settings.scoringSpeed === speed}
                    onChange={() => settings.setScoringSpeed(speed)}
                  />
                  {speed}×
                </label>
              ))}
            </fieldset>
            <button type="button" onClick={() => setOpen(false)}>
              Done
            </button>
          </section>
        </div>
      )}
    </>
  )
}
