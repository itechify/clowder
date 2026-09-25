import type { CueName } from "./cues"
import { noise, type Output, tone } from "./synth"

/**
 * Sounds a cue, `pitch` steps up its scale. Placeholders for now: the real
 * voices replace these behind the same names without touching the game.
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
    wave,
    spacing,
    duration,
    level
  }: { wave: OscillatorType; spacing: number; duration: number; level: number }
) {
  notes.forEach((note, i) => {
    tone(out, { wave, note, duration, level, delay: i * spacing })
  })
}

export const voices: Record<CueName, Voice> = {
  // A soft pop onto a Seat.
  catSeated: (out) =>
    tone(out, {
      wave: "sine",
      note: 76,
      glideTo: 67,
      duration: 0.09,
      level: 0.35
    }),
  // A chirp that climbs the scale as the Play's Scoring events go on.
  catScored: (out, pitch) => {
    const note = scaleNote(72, Math.min(pitch, HIGHEST_STEP))
    tone(out, {
      wave: "triangle",
      note: note - 2,
      glideTo: note,
      duration: 0.12,
      level: 0.4
    })
  },
  // A trill: two notes quickly back and forth.
  gatheringActivated: (out) => {
    for (let i = 0; i < 6; i++)
      tone(out, {
        wave: "triangle",
        note: i % 2 ? 84 : 81,
        duration: 0.06,
        level: 0.3,
        delay: i * 0.045
      })
  },
  // A weighty thump.
  multAdded: (out) => {
    tone(out, {
      wave: "square",
      note: 52,
      glideTo: 40,
      duration: 0.16,
      level: 0.25
    })
    noise(out, { duration: 0.08, level: 0.2, cutoff: 1200 })
  },
  // A bigger slam, with a crash sweeping down.
  timesApplied: (out) => {
    tone(out, {
      wave: "sawtooth",
      note: 45,
      glideTo: 33,
      duration: 0.3,
      level: 0.3
    })
    noise(out, { duration: 0.35, level: 0.35, cutoff: 6000, sweepTo: 300 })
  },
  // The Score lands: a thump under a bright chord.
  scoreLanded: (out) => {
    tone(out, { wave: "sine", note: 43, duration: 0.25, level: 0.5 })
    for (const note of [72, 76, 79])
      tone(out, { wave: "triangle", note, duration: 0.5, level: 0.18 })
  },
  // Rising arpeggio.
  nightCleared: (out) =>
    arpeggio(out, [72, 76, 79, 84], {
      wave: "triangle",
      spacing: 0.1,
      duration: 0.3,
      level: 0.3
    }),
  // A slow, falling sigh.
  nightLost: (out) =>
    arpeggio(out, [67, 63, 60], {
      wave: "sine",
      spacing: 0.25,
      duration: 0.5,
      level: 0.3
    }),
  // Two bright notes, like a till.
  treatsSpent: (out) => {
    tone(out, { wave: "square", note: 83, duration: 0.08, level: 0.15 })
    tone(out, {
      wave: "square",
      note: 88,
      duration: 0.2,
      level: 0.15,
      delay: 0.07
    })
  },
  // A tiny click.
  uiTap: (out) =>
    tone(out, { wave: "sine", note: 81, duration: 0.04, level: 0.25 })
}
