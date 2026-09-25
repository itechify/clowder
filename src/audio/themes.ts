import type { ThemeName } from "./cues"
import { tone } from "./synth"

/** A note, as a MIDI note number or null for a rest, and its length in beats. */
type Note = [note: number | null, beats: number]

/** One synth voice's part, looping on its own. */
type Track = { wave: OscillatorType; level: number; notes: Note[] }

/**
 * Music as note data on synth voices (ADR-0004). Each track of a theme lasts
 * the same number of beats, so they loop together.
 */
type Theme = { bpm: number; tracks: Track[] }

/** Placeholders for now: the real themes replace these behind the same names. */
export const themes: Record<ThemeName, Theme> = {
  // Cozy, unhurried, in C major.
  night: {
    bpm: 80,
    tracks: [
      {
        wave: "triangle",
        level: 0.14,
        notes: [
          [64, 1],
          [67, 1],
          [69, 1],
          [67, 1],
          [64, 1],
          [62, 1],
          [60, 2],
          [62, 1],
          [64, 1],
          [67, 1],
          [64, 1],
          [62, 4]
        ]
      },
      {
        wave: "sine",
        level: 0.18,
        notes: [
          [48, 4],
          [45, 4],
          [41, 4],
          [43, 4]
        ]
      }
    ]
  },
  // The Night's tune, minor and a little faster, over a restless bass.
  disaster: {
    bpm: 96,
    tracks: [
      {
        wave: "square",
        level: 0.07,
        notes: [
          [63, 1],
          [67, 1],
          [68, 1],
          [67, 1],
          [63, 1],
          [62, 1],
          [60, 2],
          [62, 1],
          [63, 1],
          [67, 1],
          [63, 1],
          [62, 4]
        ]
      },
      {
        wave: "triangle",
        level: 0.2,
        notes: [
          [48, 2],
          [48, 2],
          [44, 2],
          [44, 2],
          [41, 2],
          [41, 2],
          [43, 2],
          [43, 2]
        ]
      }
    ]
  },
  // Bouncy, over an oom-pah bass.
  shop: {
    bpm: 132,
    tracks: [
      {
        wave: "square",
        level: 0.06,
        notes: [
          [72, 0.5],
          [76, 0.5],
          [79, 0.5],
          [76, 0.5],
          [77, 0.5],
          [81, 0.5],
          [79, 1],
          [76, 0.5],
          [79, 0.5],
          [84, 1],
          [83, 0.5],
          [79, 0.5],
          [81, 1],
          [72, 0.5],
          [76, 0.5],
          [79, 0.5],
          [76, 0.5],
          [77, 0.5],
          [81, 0.5],
          [79, 1],
          [79, 0.5],
          [77, 0.5],
          [76, 0.5],
          [74, 0.5],
          [72, 2]
        ]
      },
      {
        wave: "triangle",
        level: 0.18,
        notes: [
          [48, 1],
          [55, 1],
          [48, 1],
          [55, 1],
          [53, 1],
          [57, 1],
          [53, 1],
          [57, 1],
          [48, 1],
          [55, 1],
          [48, 1],
          [55, 1],
          [55, 1],
          [50, 1],
          [48, 2]
        ]
      }
    ]
  },
  // A lullaby in three.
  results: {
    bpm: 60,
    tracks: [
      {
        wave: "sine",
        level: 0.16,
        notes: [
          [67, 2],
          [64, 1],
          [67, 2],
          [64, 1],
          [65, 1],
          [64, 1],
          [62, 1],
          [60, 3]
        ]
      },
      {
        wave: "sine",
        level: 0.14,
        notes: [
          [48, 3],
          [43, 3],
          [41, 3],
          [48, 3]
        ]
      }
    ]
  }
}

/** How far ahead notes are scheduled, in seconds, and how often, in ms. */
const LOOKAHEAD = 0.3
const SCHEDULE_EVERY = 100

/** Loops a theme into `destination` until the returned stop fades it out. */
export function loopTheme(
  context: BaseAudioContext,
  destination: AudioNode,
  { bpm, tracks }: Theme
): () => void {
  const bus = context.createGain()
  bus.connect(destination)
  const secondsPerBeat = 60 / bpm
  const cursors = tracks.map(() => ({ index: 0, at: context.currentTime }))
  const schedule = () => {
    const horizon = context.currentTime + LOOKAHEAD
    tracks.forEach(({ wave, level, notes }, t) => {
      const cursor = cursors[t]
      // Fallen behind, as in a throttled background tab: pick up from now.
      cursor.at = Math.max(cursor.at, context.currentTime)
      while (cursor.at < horizon) {
        const [note, beats] = notes[cursor.index]
        const duration = beats * secondsPerBeat
        if (note !== null)
          tone(
            { context, destination: bus, at: cursor.at },
            { wave, note, duration: duration * 0.95, level, attack: 0.02 }
          )
        cursor.at += duration
        cursor.index = (cursor.index + 1) % notes.length
      }
    })
  }
  schedule()
  const timer = setInterval(schedule, SCHEDULE_EVERY)
  return () => {
    clearInterval(timer)
    bus.gain.setTargetAtTime(0, context.currentTime, 0.15)
    setTimeout(() => bus.disconnect(), 1500)
  }
}
