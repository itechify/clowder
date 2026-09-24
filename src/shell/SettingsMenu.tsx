import { useState, useSyncExternalStore } from "react"
import { scoringSpeeds, settings } from "./settings"

/**
 * The settings button, pinned to the top of the scene between its headings,
 * and the panel it opens.
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
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <rect
                key={angle}
                x="10.25"
                y="1.5"
                width="3.5"
                height="5"
                rx="1"
                transform={`rotate(${angle} 12 12)`}
              />
            ))}
            <path
              fillRule="evenodd"
              d="M12 5a7 7 0 1 0 0 14a7 7 0 1 0 0-14zm0 4.2a2.8 2.8 0 1 1 0 5.6a2.8 2.8 0 1 1 0-5.6z"
            />
          </svg>
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
