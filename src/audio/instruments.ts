import { frequency, type Output, tone } from "./synth"

/** Small acoustic-like voices shared by the score and its musical rewards. */
export type Instrument = "felt" | "bell" | "bass" | "pad"

export function playInstrument(
  out: Output,
  instrument: Instrument,
  note: number,
  duration: number,
  level: number
) {
  switch (instrument) {
    case "felt":
      // Muted tine with a short octave transient, like a felt-covered key.
      tone(out, {
        wave: "triangle",
        note,
        duration,
        level,
        cutoff: frequency(note) * 3
      })
      tone(out, {
        wave: "sine",
        note: note + 12,
        duration: Math.min(0.12, duration),
        level: level * 0.18
      })
      break
    case "bell":
      // A soft fundamental and a quickly fading, slightly inharmonic partial.
      tone(out, { wave: "sine", note, duration, level, attack: 0.004 })
      tone(out, {
        wave: "sine",
        note: note + 19.08,
        duration: duration * 0.45,
        level: level * 0.24
      })
      break
    case "bass":
      tone(out, {
        wave: "triangle",
        note,
        duration,
        level,
        attack: 0.015,
        cutoff: 650
      })
      break
    case "pad":
      tone(out, {
        wave: "sine",
        note,
        duration,
        level,
        attack: 0.16,
        vibrato: { rate: 4.3, cents: 5 }
      })
      break
  }
}
