import { type Settings, settings } from "../shell/settings"
import type { Cue, ThemeName } from "./cues"
import { loopTheme, themes } from "./themes"
import { voices } from "./voices"

/** The interactions a browser lets start audio; a touch counts only once lifted. */
const UNLOCKING_EVENTS = ["pointerdown", "pointerup", "touchend", "keydown"]

/** How quickly a volume change settles, in seconds; quick, but without a click. */
const LEVEL_SMOOTHING = 0.03

/**
 * The game's sound (ADR-0004): named cues and themes, synthesized with Web
 * Audio. Silent until the player's first interaction, as browsers require;
 * the Music and SFX volumes and mute apply as soon as they change.
 */
export class Sound {
  /** Every cue the game has asked for, in order, heard or not. */
  readonly log: Cue[] = []
  /** The theme for what is showing, which plays whenever audio can. */
  theme: ThemeName | null = null
  private context: AudioContext | null = null
  private music: GainNode | null = null
  private sfx: GainNode | null = null
  private stopTheme: (() => void) | null = null

  constructor(
    private settings: Settings,
    private createContext = () => new AudioContext()
  ) {
    settings.on(() => this.setLevels())
  }

  /** Whether audio has started, after the player's first interaction. */
  get unlocked() {
    return this.context?.state === "running"
  }

  /** Starts audio at the page's first interaction, and rests it while hidden. */
  attach(page: Window) {
    const unlock = () => {
      this.unlock().then(() => {
        if (this.unlocked)
          for (const type of UNLOCKING_EVENTS)
            page.removeEventListener(type, unlock, true)
      })
    }
    for (const type of UNLOCKING_EVENTS)
      page.addEventListener(type, unlock, true)
    page.document.addEventListener("visibilitychange", () => {
      if (!this.context) return
      if (page.document.hidden) this.context.suspend()
      else this.context.resume()
    })
  }

  /** Sounds a cue; before audio has started, it is only logged. */
  cue(cue: Cue) {
    this.log.push(cue)
    if (!this.context || !this.sfx || !this.unlocked) return
    voices[cue.name](
      {
        context: this.context,
        destination: this.sfx,
        at: this.context.currentTime
      },
      cue.pitch ?? 0
    )
  }

  /** Changes the music to a theme, or silences it for none. */
  playTheme(theme: ThemeName | null) {
    if (theme === this.theme) return
    this.theme = theme
    this.stopTheme?.()
    this.stopTheme = null
    this.startTheme()
  }

  private async unlock() {
    if (!this.context) {
      try {
        this.context = this.createContext()
      } catch {
        // No Web Audio here: the game plays on in silence.
        return
      }
      this.music = this.context.createGain()
      this.sfx = this.context.createGain()
      this.music.connect(this.context.destination)
      this.sfx.connect(this.context.destination)
      this.setLevels()
    }
    await this.context.resume().catch(() => {})
    this.startTheme()
  }

  private startTheme() {
    const { context, music, theme } = this
    if (!context || !music || !theme || this.stopTheme || !this.unlocked) return
    this.stopTheme = loopTheme(context, music, themes[theme])
  }

  private setLevels() {
    const { context, music, sfx } = this
    if (!context || !music || !sfx) return
    const { muted, musicVolume, sfxVolume } = this.settings
    // Squared, so a slider's halfway sounds about half as loud.
    const level = (volume: number) => (muted ? 0 : volume ** 2)
    const now = context.currentTime
    music.gain.setTargetAtTime(level(musicVolume), now, LEVEL_SMOOTHING)
    sfx.gain.setTargetAtTime(level(sfxVolume), now, LEVEL_SMOOTHING)
  }
}

export const sound = new Sound(settings)
