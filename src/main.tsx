import Phaser from "phaser"
import { useEffect, useSyncExternalStore } from "react"
import { createRoot } from "react-dom/client"
import { starCat } from "./engine"
import { CouchScene, HEIGHT, RESOLUTION, WIDTH } from "./game/CouchScene"
import { installDebugHook } from "./game/debugHook"
import { presentation } from "./game/presentation"
import { session } from "./game/session"
import { PwaPrompts } from "./shell/PwaPrompts"
import { pwa } from "./shell/pwa"
import { SettingsMenu } from "./shell/SettingsMenu"
import "./style.css"

if (import.meta.env.DEV) installDebugHook()
pwa.register()

/** Between-Run screen: how the household did, and a fresh one. */
function Results() {
  const { run } = session
  const { bestPlay } = run.stats
  const star = starCat(run)
  return (
    <div className="overlay">
      <section className="panel" aria-live="polite">
        <h1>{run.status === "won" ? "Sweet dreams!" : "Lights out"}</h1>
        <p>
          {run.status === "won"
            ? `Your household made it through all ${run.config.nights} Nights.`
            : `Your household fell asleep on Night ${run.night.number}.`}
        </p>
        <dl className="stats">
          <dt>Nights cleared</dt>
          <dd>
            {run.stats.nightsCleared} of {run.config.nights}
          </dd>
          {bestPlay && (
            <>
              <dt>Best Play</dt>
              <dd>
                {bestPlay.score} on Night {bestPlay.night}
              </dd>
              <dd className="layout">
                <ol aria-label="Best Play's Couch">
                  {bestPlay.couch.map((cat, seat) => (
                    <li
                      // biome-ignore lint/suspicious/noArrayIndexKey: Seats never move, so a Seat is its own key
                      key={seat}
                      data-coat={cat?.coat}
                      title={cat ? `${cat.coat} ${cat.personality}` : "Empty"}
                    >
                      {cat?.name ?? "—"}
                    </li>
                  ))}
                </ol>
              </dd>
            </>
          )}
          {star && (
            <>
              <dt>Star Cat</dt>
              <dd>
                {star.cat.name}, {star.purr} Purr
              </dd>
            </>
          )}
        </dl>
        <button type="button" onClick={() => session.newHousehold()}>
          New Household
        </button>
      </section>
    </div>
  )
}

/** The shell: hosts the Phaser canvas and the screens around a Run (ADR-0003). */
function App() {
  useSyncExternalStore(session.on, () => session.revision)
  useSyncExternalStore(presentation.on, () => presentation.revision)
  const over = session.run.status !== "playing"
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: "game",
      backgroundColor: "#2e1f19",
      transparent: true,
      width: WIDTH * RESOLUTION,
      height: HEIGHT * RESOLUTION,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [CouchScene],
      render: { antialias: true }
    })
    return () => game.destroy(true)
  }, [])
  return (
    <>
      <div id="game" />
      <SettingsMenu />
      {/* The results wait until the household has fallen asleep in the scene. */}
      {over && presentation.asleep && <Results />}
      <PwaPrompts />
    </>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
