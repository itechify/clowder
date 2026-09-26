import type { CueName } from "./cues"
import { type Instrument, playInstrument } from "./instruments"
import { noise, type Output, tone } from "./synth"

/**
 * Sounds a cue, `pitch` steps up its scale. Cat calls are deliberately
 * stylized: voiced glides, a little breath, and a low rolling purr.
 */
export type Voice = (out: Output, pitch: number) => void

/** The major pentatonic scale, in semitones above its root. */
const PENTATONIC = [0, 2, 4, 7, 9]

/** The note `step` steps up the pentatonic scale from `root`. */
const scaleNote = (root: number, step: number) =>
  root +
  12 * Math.floor(step / PENTATONIC.length) +
  PENTATONIC[step % PENTATONIC.length]

/** Pitch climbs stop here, three octaves up, however long the chain. */
const HIGHEST_STEP = 15

/** Notes one after another, each `spacing` seconds after the last. */
function arpeggio(
  out: Output,
  notes: number[],
  {
    instrument,
    spacing,
    duration,
    level
  }: {
    instrument: Instrument
    spacing: number
    duration: number
    level: number
  }
) {
  notes.forEach((note, i) => {
    playInstrument(
      { ...out, at: out.at + i * spacing },
      instrument,
      note,
      duration,
      level
    )
  })
}

export const voices: Record<CueName, Voice> = {
  // Cushion puff, questioning chirp, then a contented chesty purr.
  catSeated: (out) => {
    noise(out, { duration: 0.075, level: 0.09, cutoff: 700, sweepTo: 180 })
    tone(out, {
      wave: "triangle",
      note: 74,
      glideTo: 81,
      duration: 0.13,
      level: 0.16,
      cutoff: 2300,
      vibrato: { rate: 24, cents: 35 }
    })
    tone(out, {
      wave: "triangle",
      note: 43,
      glideTo: 41,
      delay: 0.08,
      duration: 0.6,
      attack: 0.06,
      level: 0.24,
      cutoff: 550,
      tremolo: { rate: 27, depth: 0.85 }
    })
  },
  // A tiny wooden tine: a stable pitch even during the fastest Repeat chain.
  catScored: (out, pitch) => {
    const note = scaleNote(72, Math.min(pitch, HIGHEST_STEP))
    tone(out, {
      wave: "sine",
      note,
      duration: 0.085,
      level: 0.3
    })
    tone(out, {
      wave: "sine",
      note: note + 12,
      duration: 0.035,
      level: 0.045
    })
  },
  // A fluttering call answered by a warm major-sixth chord.
  gatheringActivated: (out) => {
    for (let i = 0; i < 4; i++)
      tone(out, {
        wave: "triangle",
        note: i % 2 ? 81 : 79,
        glideTo: i % 2 ? 79 : 81,
        duration: 0.075,
        level: 0.16,
        delay: i * 0.055,
        cutoff: 3000,
        vibrato: { rate: 32, cents: 22 }
      })
    for (const note of [60, 64, 69])
      playInstrument({ ...out, at: out.at + 0.08 }, "felt", note, 0.32, 0.07)
  },
  // A rounded knock and a rising fifth; distinct from the higher score tick.
  multAdded: (out) => {
    tone(out, {
      wave: "sine",
      note: 55,
      glideTo: 43,
      duration: 0.12,
      level: 0.24
    })
    noise(out, { duration: 0.045, level: 0.07, cutoff: 1100, sweepTo: 300 })
    arpeggio(out, [67, 74], {
      instrument: "felt",
      spacing: 0.045,
      duration: 0.14,
      level: 0.13
    })
  },
  // A brushed whoosh into a low octave and a bright, expanding arpeggio.
  timesApplied: (out) => {
    noise(out, { duration: 0.24, level: 0.16, cutoff: 4200, sweepTo: 350 })
    tone(out, {
      wave: "triangle",
      note: 48,
      glideTo: 36,
      duration: 0.28,
      level: 0.23,
      cutoff: 800
    })
    arpeggio(out, [60, 67, 76, 84], {
      instrument: "bell",
      spacing: 0.04,
      duration: 0.24,
      level: 0.11
    })
  },
  // Weight underneath a softly rolled C6/9 chord, leaving room for the fanfare.
  scoreLanded: (out) => {
    tone(out, {
      wave: "sine",
      note: 48,
      glideTo: 36,
      duration: 0.32,
      level: 0.28
    })
    noise(out, { duration: 0.09, level: 0.09, cutoff: 900, sweepTo: 150 })
    arpeggio(out, [60, 67, 74, 76, 81], {
      instrument: "felt",
      spacing: 0.018,
      duration: 0.62,
      level: 0.095
    })
    playInstrument({ ...out, at: out.at + 0.09 }, "bell", 84, 0.75, 0.09)
  },
  // The Night motif opens upward and resolves, with a little answering chirrup.
  nightCleared: (out) => {
    arpeggio(out, [76, 79, 81, 84, 88], {
      instrument: "bell",
      spacing: 0.105,
      duration: 0.46,
      level: 0.15
    })
    for (const note of [48, 55, 64])
      playInstrument(out, "felt", note, 0.8, 0.08)
    tone(out, {
      wave: "sine",
      note: 79,
      glideTo: 84,
      delay: 0.62,
      duration: 0.18,
      level: 0.1,
      vibrato: { rate: 26, cents: 45 }
    })
  },
  // A sympathetic sigh and a minor-sixth cadence, never a harsh failure buzzer.
  nightLost: (out) => {
    arpeggio(out, [67, 63, 60, 57], {
      instrument: "felt",
      spacing: 0.18,
      duration: 0.52,
      level: 0.15
    })
    tone(out, {
      wave: "triangle",
      note: 72,
      glideTo: 60,
      duration: 0.48,
      level: 0.1,
      cutoff: 1400,
      vibrato: { rate: 5, cents: 18 }
    })
    playInstrument({ ...out, at: out.at + 0.42 }, "bass", 41, 0.65, 0.13)
  },
  // A placeholder: a papery flick, then a rising bell flourish.
  pageChosen: (out) => {
    noise(out, { duration: 0.12, level: 0.1, cutoff: 3200, sweepTo: 900 })
    arpeggio(out, [72, 76, 79, 84], {
      instrument: "bell",
      spacing: 0.06,
      duration: 0.3,
      level: 0.12
    })
  },
  // Two glassy Treats falling into a wooden dish.
  treatsSpent: (out) => {
    arpeggio(out, [83, 88], {
      instrument: "bell",
      spacing: 0.075,
      duration: 0.3,
      level: 0.18
    })
    noise(out, { duration: 0.045, level: 0.08, cutoff: 1900, sweepTo: 600 })
    playInstrument({ ...out, at: out.at + 0.075 }, "felt", 64, 0.12, 0.09)
  },
  // A felt button: a tiny rounded knock with a little finger noise.
  uiTap: (out) => {
    tone(out, {
      wave: "sine",
      note: 79,
      glideTo: 72,
      duration: 0.035,
      level: 0.18
    })
    noise(out, { duration: 0.025, level: 0.035, cutoff: 1700, sweepTo: 600 })
  }
}
