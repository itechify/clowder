import Phaser from "phaser"
import { useEffect, useSyncExternalStore } from "react"
import { createRoot } from "react-dom/client"
import { sound } from "./audio/sound"
import { BootScene } from "./game/BootScene"
import { CouchScene } from "./game/CouchScene"
import { installDebugHook } from "./game/debugHook"
import { HEIGHT, RESOLUTION, WIDTH } from "./game/layout"
import { themeFor } from "./game/music"
import { presentation } from "./game/presentation"
import { ShopScene } from "./game/ShopScene"
import { session } from "./game/session"
import { PwaPrompts } from "./shell/PwaPrompts"
import { pwa } from "./shell/pwa"
import { ResultsReadout } from "./shell/ResultsReadout"
import { SettingsMenu } from "./shell/SettingsMenu"
// The game's typefaces, bundled for offline play (see src/game/fonts.ts).
import "@fontsource/lilita-one"
import "@fontsource-variable/nunito/wght.css"
import "./style.css"

pwa.register()
sound.attach(window)
// The music follows what is showing.
const followScene = () =>
  sound.playTheme(
    themeFor({
      scene: presentation.scene,
      run: session.run,
      asleep: presentation.asleep
    })
  )
presentation.on(followScene)
session.on(followScene)

/** The shell: hosts the Phaser canvas and the screens around a Run (ADR-0003). */
function App() {
  useSyncExternalStore(session.on, () => session.revision)
  useSyncExternalStore(presentation.on, () => presentation.revision)
  // The Results show once the household has fallen asleep in the scene.
  const results = presentation.results(session.run)
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
      scene: [BootScene, CouchScene, ShopScene],
      // All sound is the game's own, synthesized (src/audio, ADR-0004).
      audio: { noAudio: true },
      render: { antialias: true }
    })
    if (import.meta.env.DEV) installDebugHook(game)
    return () => game.destroy(true)
  }, [])
  return (
    <>
      <div id="game" />
      <SettingsMenu />
      {results && <ResultsReadout results={results} />}
      <PwaPrompts />
    </>
  )
}

createRoot(document.getElementById("root")!).render(<App />)
