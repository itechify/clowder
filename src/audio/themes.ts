import type { ThemeName } from "./cues"
import { type Instrument, playInstrument } from "./instruments"

/** MIDI pitch, chord, or rest, followed by its length in beats. */
type Note = [note: number | number[] | null, beats: number]
type Track = {
  instrument: Instrument
  level: number
  /** Fraction of a beat's duration sounded; shorter for the Shop's bounce. */
  gate?: number
  notes: Note[]
}

/** All parts have the same beat count and return to the downbeat together. */
type Theme = { bpm: number; tracks: Track[] }

// "A Place on the Couch": eight bars, with space between the two phrases.
// The E–G–A opening is also the Night-cleared fanfare's little signature.
const nightMelody: Note[] = [
  [76, 0.75],
  [79, 0.25],
  [81, 1],
  [79, 1],
  [null, 1],
  [76, 1.5],
  [74, 0.5],
  [72, 1],
  [null, 1],
  [72, 0.75],
  [76, 0.25],
  [79, 1],
  [76, 1],
  [74, 1],
  [71, 1.5],
  [74, 0.5],
  [79, 1],
  [null, 1],
  [81, 1],
  [84, 0.5],
  [83, 0.5],
  [81, 1],
  [79, 1],
  [76, 1.5],
  [79, 0.5],
  [74, 1],
  [null, 1],
  [77, 1],
  [76, 0.5],
  [74, 0.5],
  [72, 1],
  [74, 1],
  [76, 1],
  [74, 0.5],
  [71, 0.5],
  [72, 1],
  [null, 1]
]

// Cmaj7 – Am7 – Fmaj7 – G6; a second phrase finds its way home.
const nightHarmony: Note[] = [
  [[60, 64, 71], 4],
  [[60, 64, 69], 4],
  [[60, 65, 69], 4],
  [[59, 62, 67], 4],
  [[60, 64, 69], 4],
  [[59, 64, 67], 4],
  [[60, 65, 69], 4],
  [[59, 62, 67], 2],
  [[60, 64, 67], 2]
]

/** Parallel minor keeps the Night motif recognizable during a Disaster. */
function minor(note: number): number {
  return [4, 9, 11].includes(note % 12) ? note - 1 : note
}

const inMinor = (notes: Note[]): Note[] =>
  notes.map(([note, beats]) => [
    note === null ? null : Array.isArray(note) ? note.map(minor) : minor(note),
    beats
  ])

/** Original looping arrangements, entirely note data and runtime synthesis. */
export const themes: Record<ThemeName, Theme> = {
  night: {
    bpm: 76,
    tracks: [
      { instrument: "felt", level: 0.105, notes: nightMelody },
      { instrument: "pad", level: 0.025, notes: nightHarmony },
      {
        instrument: "bass",
        level: 0.105,
        gate: 0.85,
        notes: [
          [48, 3],
          [55, 1],
          [45, 3],
          [52, 1],
          [41, 3],
          [48, 1],
          [43, 3],
          [50, 1],
          [45, 3],
          [52, 1],
          [40, 3],
          [47, 1],
          [41, 3],
          [48, 1],
          [43, 2],
          [48, 2]
        ]
      },
      {
        instrument: "bell",
        level: 0.038,
        notes: [
          [null, 6],
          [84, 1],
          [79, 1],
          [null, 6],
          [86, 1],
          [83, 1],
          [null, 6],
          [88, 1],
          [86, 1],
          [null, 6],
          [79, 1],
          [84, 1]
        ]
      }
    ]
  },
  disaster: {
    bpm: 94,
    tracks: [
      {
        instrument: "felt",
        level: 0.1,
        gate: 0.72,
        notes: inMinor(nightMelody)
      },
      { instrument: "pad", level: 0.024, notes: inMinor(nightHarmony) },
      // Eighth-note breathing room between insistent root/fifth pairs.
      {
        instrument: "bass",
        level: 0.105,
        gate: 0.65,
        notes: [48, 44, 41, 43, 44, 39, 41, 43].flatMap((root): Note[] => [
          [root, 0.75],
          [null, 0.25],
          [root + 7, 1],
          [root, 0.75],
          [null, 0.25],
          [root + 7, 1]
        ])
      },
      {
        instrument: "bell",
        level: 0.035,
        notes: [
          [null, 3],
          [86, 0.5],
          [87, 0.5],
          [null, 4],
          [null, 3],
          [83, 0.5],
          [84, 0.5],
          [null, 4],
          [null, 3],
          [86, 0.5],
          [87, 0.5],
          [null, 4],
          [null, 3],
          [74, 0.5],
          [75, 0.5],
          [null, 4]
        ]
      }
    ]
  },
  shop: {
    bpm: 116,
    tracks: [
      // "Treat Jar": dotted skips over a plucked oom-pah accompaniment.
      {
        instrument: "felt",
        level: 0.105,
        gate: 0.62,
        notes: [
          [72, 0.75],
          [76, 0.25],
          [79, 0.5],
          [81, 0.5],
          [79, 1],
          [76, 1],
          [74, 0.75],
          [77, 0.25],
          [81, 1],
          [79, 1],
          [null, 1],
          [76, 0.75],
          [79, 0.25],
          [84, 0.5],
          [83, 0.5],
          [81, 1],
          [79, 1],
          [77, 0.5],
          [76, 0.5],
          [74, 1],
          [71, 1],
          [null, 1],
          [72, 0.75],
          [76, 0.25],
          [79, 0.5],
          [81, 0.5],
          [84, 1],
          [83, 1],
          [81, 0.75],
          [79, 0.25],
          [77, 1],
          [74, 1],
          [null, 1],
          [79, 0.75],
          [76, 0.25],
          [77, 0.5],
          [74, 0.5],
          [76, 1],
          [71, 1],
          [72, 1.5],
          [79, 0.5],
          [84, 1],
          [null, 1]
        ]
      },
      {
        instrument: "bass",
        level: 0.12,
        gate: 0.55,
        notes: [48, 50, 45, 43, 48, 41, 43, 48].flatMap((root): Note[] => [
          [root, 1],
          [null, 1],
          [root + 7, 1],
          [null, 1]
        ])
      },
      {
        instrument: "felt",
        level: 0.036,
        gate: 0.45,
        notes: [
          [64, 67],
          [65, 69],
          [64, 69],
          [62, 67],
          [64, 67],
          [65, 69],
          [62, 71],
          [64, 67]
        ].flatMap((chord): Note[] => [
          [null, 1],
          [chord, 1],
          [null, 1],
          [chord, 1]
        ])
      },
      {
        instrument: "bell",
        level: 0.04,
        notes: [
          [null, 7],
          [86, 0.5],
          [84, 0.5],
          [null, 7],
          [83, 0.5],
          [79, 0.5],
          [null, 7],
          [81, 0.5],
          [77, 0.5],
          [null, 7],
          [79, 0.5],
          [84, 0.5]
        ]
      }
    ]
  },
  results: {
    bpm: 58,
    tracks: [
      // "All Asleep": eight bars in three, the Night motif tucked into bed.
      {
        instrument: "bell",
        level: 0.075,
        notes: [
          [79, 1.5],
          [76, 0.5],
          [72, 1],
          [74, 2],
          [null, 1],
          [76, 1.5],
          [79, 0.5],
          [81, 1],
          [79, 2],
          [null, 1],
          [77, 1.5],
          [76, 0.5],
          [74, 1],
          [76, 2],
          [72, 1],
          [74, 1],
          [71, 1],
          [67, 1],
          [72, 2],
          [null, 1]
        ]
      },
      {
        instrument: "pad",
        level: 0.03,
        notes: [
          [[60, 64, 67], 3],
          [[59, 62, 67], 3],
          [[60, 64, 69], 3],
          [[59, 64, 67], 3],
          [[60, 65, 69], 3],
          [[60, 64, 67], 3],
          [[59, 62, 67], 3],
          [[60, 64, 67], 3]
        ]
      },
      {
        instrument: "bass",
        level: 0.085,
        notes: [
          [48, 3],
          [43, 3],
          [45, 3],
          [40, 3],
          [41, 3],
          [48, 3],
          [43, 3],
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
    tracks.forEach(({ instrument, level, notes, gate = 0.9 }, t) => {
      const cursor = cursors[t]
      // Fallen behind, as in a throttled background tab: pick up from now.
      cursor.at = Math.max(cursor.at, context.currentTime)
      while (cursor.at < horizon) {
        const [note, beats] = notes[cursor.index]
        const duration = beats * secondsPerBeat
        if (note !== null)
          for (const pitch of Array.isArray(note) ? note : [note])
            playInstrument(
              { context, destination: bus, at: cursor.at },
              instrument,
              pitch,
              duration * gate,
              level
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
