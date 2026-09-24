import Phaser from "phaser"
import { useEffect, useSyncExternalStore } from "react"
import { createRoot } from "react-dom/client"
import { CouchScene, HEIGHT, RESOLUTION, WIDTH } from "./game/CouchScene"
import { installDebugHook } from "./game/debugHook"
import { chooseSeed, session } from "./game/session"
import "./style.css"

if (import.meta.env.DEV) installDebugHook()

/** Between-Run screen: how the Night ended, and a fresh household. */
function NightOver() {
  const { night } = session.run
  const cleared = night.status === "cleared"
  return (
    <div className="overlay">
      <section className="panel" aria-live="polite">
        <h1>{cleared ? "Night cleared!" : "Night lost"}</h1>
        <p>
          Score {night.score} / Target {night.target}
        </p>
        <button type="button" onClick={() => session.start(chooseSeed(""))}>
          New Household
        </button>
      </section>
    </div>
  )
}

/** The shell: hosts the Phaser canvas and the screens around a Run (ADR-0003). */
function App() {
  useSyncExternalStore(session.on, () => session.revision)
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
      {session.run.night.status !== "playing" && <NightOver />}
    </>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
